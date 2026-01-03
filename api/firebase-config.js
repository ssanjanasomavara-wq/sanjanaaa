// Vercel serverless endpoint: returns Firebase client config read from environment variables.
// Add these environment variables in Vercel (Project → Settings → Environment Variables):
//
// FIREBASE_API_KEY
// FIREBASE_AUTH_DOMAIN
// FIREBASE_PROJECT_ID
// FIREBASE_STORAGE_BUCKET (optional)
// FIREBASE_MESSAGING_SENDER_ID (optional)
// FIREBASE_APP_ID (optional)
// FIREBASE_MEASUREMENT_ID (optional)

export default function handler(req, res) {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
  };

  if (!config.apiKey || !config.projectId) {
    return res.status(500).json({ error: 'Firebase config not set on server. Check Vercel environment variables.' });
  }

  // Do not cache during development; you can change caching for production.
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(config);
}
