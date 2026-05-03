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
          server.middlewares.use(async (req, res, next) => {
            const { pathname } = parse(req.url || "");
            if (pathname === "/api/send-otp" && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk.toString();
              });
              req.on("end", async () => {
                try {
                  const { email, otp, name } = JSON.parse(body);
                  
                  const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: env.GMAIL_USER,
                      pass: env.GMAIL_PASS,
                    },
                  });

                const isReset = req.url.includes('reset'); // Simple check
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
                        <p style="color: #333333; font-size: 15px; line-height: 1.6;">Hi ${name || 'User'},</p>
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
              } catch (error) {
                console.error("Dev API Error:", error);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Failed to send email" }));
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
                  
                  // For local dev, we'll try to use firebase-admin if keys are available
                  // Otherwise, we'll return a helpful error
                  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env. Password reset via OTP requires these for the Admin SDK." }));
                    return;
                  }

                  const adminModule = await import("firebase-admin");
                  const admin = adminModule.default || adminModule;
                  
                  if (!admin.apps.length) {
                    admin.initializeApp({
                      credential: admin.credential.cert({
                        projectId: env.VITE_FIREBASE_PROJECT_ID,
                        clientEmail: env.FIREBASE_CLIENT_EMAIL,
                        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                      }),
                    });
                  }

                  const user = await admin.auth().getUserByEmail(email);
                  await admin.auth().updateUser(user.uid, { password: newPassword });

                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  console.error("Reset API Error:", error);
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
