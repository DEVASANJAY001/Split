const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, name, type } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'src/assets/davnslogo-b.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = logoBuffer.toString('base64');
  } catch (err) {
    console.error("Could not load logo file", err);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const isReset = type === 'reset';
  const subject = isReset ? `${otp} is your Split password reset code` : `${otp} is your Split verification code`;
  
  const mailOptions = {
    from: `"Split App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    attachments: logoBase64 ? [{
      filename: 'logo.png',
      content: logoBase64,
      encoding: 'base64',
      cid: 'companylogo'
    }] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 0 10px 0;">
                    <h1 style="margin: 0; font-style: italic; font-weight: 900; font-size: 32px; color: #000000; letter-spacing: -1px;">split</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 60px 40px 60px; text-align: left;">
                    <h2 style="color: #111111; font-size: 24px; font-weight: 700; margin-bottom: 20px; text-align: center;">
                      ${isReset ? 'Reset Your Password' : 'Verify Your Identity'}
                    </h2>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                      Hi ${name || 'User'},
                    </p>
                    
                    <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                      ${isReset 
                        ? 'We received a request to reset the password for your Split App account. To ensure your security, please use the 6-digit verification code provided below to proceed with setting a new password.' 
                        : 'Thank you for choosing Split App, the smarter way to manage shared expenses and track your financial balance with friends and family. To get started and secure your account, please verify your email address by entering the code below.'}
                    </p>
                    
                    <div style="background-color: #f8f9fa; border: 1px solid #eeeeee; border-radius: 16px; padding: 35px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 15px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #999999; font-weight: 700;">Verification Code</p>
                      <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #000000;">${otp}</div>
                    </div>
                    
                    <p style="color: #777777; font-size: 14px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                      This code will expire in <strong>10 minutes</strong>. For your protection, never share this code with anyone. Split App staff will never ask for your verification code.
                    </p>
                    
                    <div style="border-top: 1px solid #eeeeee; padding-top: 25px;">
                      <p style="color: #333333; font-size: 14px; margin: 0;">Regards,</p>
                      <p style="color: #000000; font-size: 15px; font-weight: 700; margin: 5px 0 0 0;">Split App Team</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 40px 60px; background-color: #000000; text-align: center;">
                    ${logoBase64 ? '<img src="cid:companylogo" alt="Davns Industries" style="height: 35px; margin-bottom: 20px; filter: brightness(0) invert(1);">' : '<p style="color: #ffffff; font-weight: 700; margin-bottom: 15px;">Davns Industries</p>'}
                    <p style="color: #888888; font-size: 12px; line-height: 1.5; margin: 0;">
                      &copy; 2026 Split App. Developed and Managed by <br>
                      <strong style="color: #bbbbbb;">Davns Industries</strong>. <br><br>
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
