const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  });
}

module.exports = async (req, res) => {
  // Set CORS headers
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp, name, type } = req.body;
    const isReset = type === 'reset';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    let finalName = name || "User";

    // 1. Verify user exists if it's a password reset
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
        } else {
          return res.status(404).json({ error: "Email is wrong" });
        }
      } catch (fsError) {
        console.warn("Firestore name lookup failed (possibly gRPC cert issue). Continuing with default name.", fsError.message);
      }
    }

    // 2. Store OTP in Realtime Database for verification
    try {
      const emailKey = email.replace(/\./g, "_");
      await admin.database().ref(`otp_codes/${emailKey}`).set({
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
    } catch (rtdbError) {
      console.error("RTDB OTP storage failed:", rtdbError);
      return res.status(500).json({ error: "Internal server error (OTP storage)" });
    }

    // 3. Send Email
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
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process request" });
  }
};
