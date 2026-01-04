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
