// pages/api/firebase-config.js
// Returns the Firebase client config for the browser to initialize the SDK.
// Reads from environment variables. If required values are missing, returns 404
// so the client can fall back to local-only behavior.
//
// Set these in your environment (Vercel / .env.local):
// FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET,
// FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID (optional),
// FIREBASE_DATABASE_URL (optional)
//
// The route intentionally only exposes client-side config (the same values you'd
// paste into the browser SDK). Do NOT put service account JSON here.

export default function handler(req, res) {
  // Prefer NEXT_PUBLIC_* if you already used those env var names; otherwise fall back to FIREBASE_*
  const config = {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      null,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      process.env.FIREBASE_AUTH_DOMAIN ||
      null,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      null,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      null,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      null,
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      process.env.FIREBASE_APP_ID ||
      null,
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      process.env.FIREBASE_MEASUREMENT_ID ||
      null,
    databaseURL:
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
      process.env.FIREBASE_DATABASE_URL ||
      null,
  };

  // Minimal required fields for the client to initialize are apiKey, projectId and appId.
  if (!config.apiKey || !config.projectId || !config.appId) {
    return res.status(404).json({ error: 'Firebase not configured' });
  }

  // Set caching headers (short) — clients may still fetch no-store when they want fresh config.
  res.setHeader('Cache-Control', 'public, max-age=60');

  return res.status(200).json(config);
}
