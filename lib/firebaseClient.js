// Minimal client-side Firebase initializer to keep a single app instance.
// This version ensures imports only run in the browser and instructs webpack
// to ignore the remote module URLs so the Next.js build won't try to resolve them.

let _app = null;
let _auth = null;
let _db = null;

/**
 * Initialize Firebase client-side using a remote SDK URL.
 * Must be called in the browser (window must be defined).
 *
 * @param {Object} firebaseConfig The Firebase client config object.
 */
export async function initFirebaseWithConfig(firebaseConfig) {
  if (typeof window === 'undefined') {
    throw new Error('initFirebaseWithConfig must run on the client');
  }

  if (_app && _auth && _db) {
    return { app: _app, auth: _auth, db: _db, authMod: null, dbMod: null };
  }

  // Use webpackIgnore so webpack does not attempt to resolve the remote import at build time.
  // These imports are dynamic and executed only at runtime in the browser.
  const firebaseAppUrl = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
  const firebaseAuthUrl = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
  const firebaseDbUrl = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

  // eslint-disable-next-line no-undef
  const [{ initializeApp }, authMod, dbMod] = await Promise.all([
    // webpackIgnore prevents bundling / resolution at build-time
    import(/* webpackIgnore: true */ firebaseAppUrl),
    import(/* webpackIgnore: true */ firebaseAuthUrl),
    import(/* webpackIgnore: true */ firebaseDbUrl)
  ]);

  _app = initializeApp(firebaseConfig);
  _auth = authMod.getAuth(_app);
  _db = dbMod.getDatabase(_app);

  return {
    app: _app,
    auth: _auth,
    db: _db,
    authMod,
    dbMod
  };
}
