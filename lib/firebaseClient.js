// Minimal client-side Firebase initializer to keep a single app instance.
// We still fetch config from /api/firebase-config in the page, but this helper
// provides a single place to initialize and return auth/db modules.
let _app = null;
let _auth = null;
let _db = null;

export async function initFirebaseWithConfig(firebaseConfig) {
  if (typeof window === 'undefined') throw new Error('initFirebaseWithConfig must run on the client');

  if (_app && _auth && _db) return { app: _app, auth: _auth, db: _db };

  // dynamic import to keep bundle small until needed
  const [{ initializeApp }, authMod, dbMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js')
  ]);

  _app = initializeApp(firebaseConfig);
  _auth = authMod.getAuth(_app);
  _db = dbMod.getDatabase(_app);

  // expose commonly-used helper exports on return
  return {
    app: _app,
    auth: _auth,
    db: _db,
    authMod,
    dbMod
  };
}
