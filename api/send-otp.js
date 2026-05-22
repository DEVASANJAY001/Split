import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers — echo origin so CapacitorHttp and WebView both work
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, otp, type } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: 'Email service not configured (missing GMAIL_USER or GMAIL_PASS)' });
  }

  try {

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const isReset = type === 'reset';
    const finalName = name || 'User';
    const subject = isReset
      ? `Reset your Split password: ${otp}`
      : `${otp} is your Split verification code`;

    await transporter.sendMail({
      from: `"Split App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
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
                : 'Thank you for choosing Split App! Please verify your email address to secure your account.'}
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
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
