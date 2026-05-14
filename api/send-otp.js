export default async function handler(req, res) {
  // Set CORS headers early
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("API Timeout: Execution exceeded 8.5 seconds")), 8500)
    );

    const logicPromise = (async () => {
      const adminModule = await import('firebase-admin');
      const admin = adminModule.default || adminModule;
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;

      try {
        if (!admin.apps.length) {
          if (!process.env.FIREBASE_PRIVATE_KEY) {
            throw new Error("Missing FIREBASE_PRIVATE_KEY environment variable");
          }
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.VITE_FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
          });
        }
      } catch (initError) {
        throw new Error(`Init Error: ${initError.message}`);
      }

      if (req.method === 'OPTIONS') {
        return { status: 200 };
      }

      if (req.method !== 'POST') {
        return { status: 405, error: 'Method not allowed' };
      }

      const { email, name, type } = req.body;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const isReset = type === 'reset';

      if (!email) {
        return { status: 400, error: 'Email is required' };
      }

      let finalName = name || "User";

      if (isReset) {
        console.log("Starting Firestore lookup...");
        try {
          const usersRef = admin.firestore().collection("users");
          let userQuery = await usersRef.where("email", "==", email).get();
          if (userQuery.empty && email !== email.toLowerCase()) {
            userQuery = await usersRef.where("email", "==", email.toLowerCase()).get();
          }
          if (!userQuery.empty) {
            const userData = userQuery.docs[0].data();
            finalName = userData.displayName || userData.username || "User";
          } else {
            return { status: 404, error: "Email is wrong" };
          }
        } catch (fsError) {
          console.warn("Firestore name lookup failed:", fsError.message);
        }
        console.log("Finished Firestore lookup.");
      }

      console.log("Starting RTDB storage...");
      try {
        const emailKey = email.replace(/\./g, "_");
        await admin.database().ref(`otp_codes/${emailKey}`).set({
          code: otp,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
      } catch (rtdbError) {
        throw new Error(`RTDB Error: ${rtdbError.message}`);
      }
      console.log("Finished RTDB storage.");

      console.log("Starting Nodemailer...");
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const subject = isReset ? `Reset your Split password: ${otp}` : `${otp} is your Split verification code`;
      const mailOptions = {
        from: `"Split App" <${process.env.GMAIL_USER}>`,
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
              <p style="margin: 0; font-weight: bold; font-size: 16px;">DAVNS Industries</p>
              <p style="margin: 10px 0 0 0; color: #888888; font-size: 11px;">&copy; 2026 Split App. Developed by DAVNS Industries.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Finished Nodemailer.");
      
      return { status: 200, data: { success: true } };
    })();

    const result = await Promise.race([logicPromise, timeoutPromise]);
    
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    
    if (result.data) {
      return res.status(result.status).json(result.data);
    }
    
    return res.status(result.status).end();

  } catch (masterError) {
    console.error("Master Try-Catch Error:", masterError);
    return res.status(500).json({ error: masterError.message || "Failed to initialize serverless function" });
  }
};


