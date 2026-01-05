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

// Safe client-only Firebase initializer for Next.js
// - Ensures initialization only runs in the browser (throws on server).
// - Uses runtime imports of the hosted Firebase modular SDK with webpackIgnore
//   so Next.js build won't attempt to bundle remote URLs.
// - Returns the initialized app, auth, db objects plus the SDK modules (authMod/dbMod)
//   so callers can use modular helpers (createUserWithEmailAndPassword, ref, set, etc.).
//
// Usage:
//   const { app, auth, db, authMod, dbMod } = await initFirebaseWithConfig(firebaseConfig);

let _app = null;
let _auth = null;
let _db = null;
let _authMod = null;
let _dbMod = null;

const FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
const FIREBASE_AUTH_URL = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
const FIREBASE_DB_URL   = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

/**
 * Initialize Firebase client-side.
 * Must be called in the browser (window must be defined).
 *
 * @param {Object} firebaseConfig - Firebase client config (apiKey, authDomain, projectId, ...)
 * @returns {Promise<{app: any, auth: any, db: any, authMod: any, dbMod: any}>}
 */
export async function initFirebaseWithConfig(firebaseConfig) {
  if (typeof window === 'undefined') {
    throw new Error('initFirebaseWithConfig must run on the client (window is undefined).');
  }

  // Return cached instances if already initialized
  if (_app && _auth && _db && _authMod && _dbMod) {
    return { app: _app, auth: _auth, db: _db, authMod: _authMod, dbMod: _dbMod };
  }

  // Use webpackIgnore so webpack won't attempt to resolve these remote URLs at build time.
  // The imports execute at runtime in the browser only.
  // eslint-disable-next-line no-undef
  const [{ initializeApp }, authMod, dbMod] = await Promise.all([
    import(/* webpackIgnore: true */ FIREBASE_APP_URL),
    import(/* webpackIgnore: true */ FIREBASE_AUTH_URL),
    import(/* webpackIgnore: true */ FIREBASE_DB_URL)
  ]);

  _app = initializeApp(firebaseConfig);
  _authMod = authMod;
  _dbMod = dbMod;

  // Create instances using modular SDK functions
  _auth = _authMod.getAuth(_app);
  _db = _dbMod.getDatabase(_app);

  return { app: _app, auth: _auth, db: _db, authMod: _authMod, dbMod: _dbMod };
}

/**
 * Optional helper to check if initialization has already occurred.
 * Returns true if Firebase client was initialized in this page context.
 */
export function isFirebaseInitialized() {
  return !!(_app && _auth && _db);
}
