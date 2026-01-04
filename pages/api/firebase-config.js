// API route that returns the Firebase client config. Read values from env vars.
// Add your project values to .env.local as shown in the README snippet below.
export default function handler(req, res) {
  // The client Firebase config is not secret — it's required by the client.
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  // Basic validation — return 500 if not configured.
  if (!config.apiKey || !config.projectId) {
    res.status(500).json({ error: 'Firebase client config not set in environment variables.' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(config);
}
