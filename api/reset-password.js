export default async function handler(req, res) {
  // Set CORS headers early
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
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
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default || adminModule;
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
    console.error("Firebase Admin Init Error:", initError);
    return res.status(500).json({ error: `Init Error: ${initError.message}` });
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // 1. Get user by email to get their UID
    try {
      const user = await admin.auth().getUserByEmail(email);
      
      // 2. Update the user's password
      await admin.auth().updateUser(user.uid, { password: newPassword });
      
      return res.status(200).json({ success: true });
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'No user found with this email address.' });
      }
      throw authError;
    }
  } catch (error) {
    console.error("Reset Password API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to reset password" });
  }

  } catch (masterError) {
    console.error("Master Try-Catch Error:", masterError);
    return res.status(500).json({ error: masterError.message || "Failed to initialize serverless function" });
  }
};
