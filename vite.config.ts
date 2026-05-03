import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import nodemailer from "nodemailer";
import { parse } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {}, // Placeholder
    },
    plugins: [
      react(),
      {
        name: "handle-api-send-otp",
        configureServer(server) {
          // Fix for gRPC cert.pem error on Windows
          process.env.GRPC_DEFAULT_SSL_ROOTS_CERTS_PATH = ""; 
          
          server.middlewares.use(async (req, res, next) => {
            const { pathname } = parse(req.url || "");
            
            // Helper to initialize admin
            const getAdmin = async () => {
              const adminModule = await import("firebase-admin");
              const admin = adminModule.default || adminModule;
              if (!admin.apps.length) {
                admin.initializeApp({
                  credential: admin.credential.cert({
                    projectId: env.VITE_FIREBASE_PROJECT_ID,
                    clientEmail: env.FIREBASE_CLIENT_EMAIL,
                    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                  }),
                  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
                });
              }
              return admin;
            };

            if (pathname === "/api/send-otp" && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk.toString();
              });
              req.on("end", async () => {
                try {
                  const { email, otp, name, type } = JSON.parse(body);
                  const isReset = type === 'reset';
                  
                  // Optimistically initialize admin but keep it silent if it fails
                  let finalName = name || "User";
                  try {
                    const admin = await getAdmin();
                    
                    // Independent Firestore block
                    if (isReset) {
                      try {
                        const usersRef = admin.firestore().collection("users");
                        let userQuery = await usersRef.where("email", "==", email).get();
                        if (userQuery.empty && email !== email.toLowerCase()) {
                          userQuery = await usersRef.where("email", "==", email.toLowerCase()).get();
                        }
                        
                        if (!userQuery.empty) {
                          const userData = userQuery.docs[0].data();
                          finalName = userData.displayName || userData.username || "User";
                        }
                      } catch (fsError) {
                        console.error("Firestore lookup failed:", fsError);
                      }
                    }

                    // Independent RTDB block (the most critical one)
                    try {
                      const emailKey = email.replace(/\./g, "_");
                      await admin.database().ref(`otp_codes/${emailKey}`).set({
                        code: otp,
                        expiresAt: Date.now() + 10 * 60 * 1000,
                      });
                    } catch (rtdbError) {
                      console.error("RTDB OTP storage failed:", rtdbError);
                      throw rtdbError; // Re-throw critical error
                    }
                  } catch (adminError: any) {
                    console.error("Admin SDK error:", adminError);
                    // If we couldn't even save the OTP, we must fail the request
                    if (!isReset || adminError.message?.includes("RTDB")) {
                      throw adminError;
                    }
                  }

                  const transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                      user: env.GMAIL_USER,
                      pass: env.GMAIL_PASS,
                    },
                    tls: {
                      rejectUnauthorized: false
                    }
                  });

                  const subject = isReset ? `Reset your Split password: ${otp}` : `${otp} is your Split verification code`;

                  const mailOptions = {
                    from: `"Split App" <${env.GMAIL_USER}>`,
                    to: email,
                    subject: subject,
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                        <div style="padding: 40px 0 10px 0; text-align: center;">
                          <h1 style="margin: 0; font-style: italic; font-weight: 900; font-size: 32px; color: #000000;">split</h1>
                        </div>
                        <div style="padding: 0 50px 40px 50px;">
                          <h2 style="color: #111111; font-size: 22px; text-align: center;">${isReset ? 'Reset Your Password' : 'Verify Your Identity'}</h2>
                          <p style="color: #333333; font-size: 15px; line-height: 1.6;">Hi ${finalName},</p>
                          <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                            ${isReset 
                              ? 'We received a request to reset your password. Use the secure 6-digit code below to set a new password for your account.' 
                              : 'Thank you for choosing Split App! We are excited to have you on board. Please verify your email address to secure your account.'}
                          </p>
                          <div style="background-color: #f8f9fa; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #999999; font-weight: bold; text-transform: uppercase;">Verification Code</p>
                            <div style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #000000;">${otp}</div>
                          </div>
                          <p style="color: #999999; font-size: 12px; text-align: center;">This code will expire in 10 minutes.</p>
                        </div>
                        <div style="padding: 30px; background-color: #000000; text-align: center; color: white;">
                          <p style="margin: 0; font-weight: bold; font-size: 16px;">Davns Industries</p>
                          <p style="margin: 10px 0 0 0; color: #888888; font-size: 11px;">&copy; 2026 Split App. Developed by Davns Industries.</p>
                        </div>
                      </div>
                    `,
                  };

                  await transporter.sendMail(mailOptions);
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error("Dev API Error:", error);
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: error.message || "Failed to send email" }));
                }
              });
              return;
            }

          if (pathname === "/api/reset-password" && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk.toString();
              });
              req.on("end", async () => {
                try {
                  const { email, newPassword } = JSON.parse(body);
                  
                  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Missing Admin SDK credentials in .env" }));
                    return;
                  }

                  const admin = await getAdmin();
                  
                  try {
                    const user = await admin.auth().getUserByEmail(email);
                    await admin.auth().updateUser(user.uid, { password: newPassword });
                  } catch (authError: any) {
                    // Try lowercase if initial match fails (Auth is usually case-insensitive but let's be safe)
                    if (authError.code === 'auth/user-not-found' && email !== email.toLowerCase()) {
                      const user = await admin.auth().getUserByEmail(email.toLowerCase());
                      await admin.auth().updateUser(user.uid, { password: newPassword });
                    } else {
                      throw authError;
                    }
                  }

                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error("Reset API Error:", error);
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: error.message || "Failed to reset password" }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
    define: {
      __BUNDLED_DEV__: "true",
    },
    resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
