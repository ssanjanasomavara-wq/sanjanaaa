// pages/api/admin/set-claims.js
// Runtime-safe admin route: defers requiring `firebase-admin` so Next.js build doesn't fail
// when the package is not present. At runtime, this will try to require firebase-admin.
// If the module is missing, the route returns 501 with a clear message.
//
// Reminder: This is a build-time workaround to avoid module resolution errors.
// For production you should install firebase-admin: `npm install firebase-admin`
// and provide credentials (FIREBASE_ADMIN_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS).
//
// Security: This endpoint requires the ADMIN_API_SECRET (sent in header `x-admin-secret`).
// Do NOT ship the secret to untrusted clients.

let admin = null;

function initAdmin() {
  if (admin) return admin;
  try {
    // Use eval("require") to avoid static resolution by bundlers during build.
    // This prevents "Module not found: Can't resolve 'firebase-admin'" at build time.
    const firebaseAdmin = eval('require')('firebase-admin');

    if (!firebaseAdmin.apps.length) {
      const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '';
      let cred = null;
      if (raw) {
        try {
          // Support raw JSON or base64-encoded JSON in env var
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            // maybe base64
            try {
              parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
            } catch (e2) {
              parsed = null;
            }
          }
          if (parsed) {
            cred = firebaseAdmin.credential.cert(parsed);
          }
        } catch (e) {
          console.error('Failed parsing FIREBASE_ADMIN_SERVICE_ACCOUNT', e);
        }
      }

      if (cred) {
        firebaseAdmin.initializeApp({ credential: cred });
      } else {
        // Fall back to application default credentials (GOOGLE_APPLICATION_CREDENTIALS)
        firebaseAdmin.initializeApp();
      }
    }

    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    // Bubble up error so caller can respond with a helpful message.
    err._isMissingFirebaseAdmin = true;
    throw err;
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Basic protection: require a shared secret header
  const secret = req.headers['x-admin-secret'] || req.headers['x-admin_secret'] || '';
  const expected = process.env.ADMIN_API_SECRET || '';

  if (!expected || secret !== expected) {
    return res.status(401).json({ error: 'Unauthorized (missing or invalid admin secret)' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // parse body (Next bodyParser enabled)
  const { uid, claims } = req.body || {};

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'Missing uid' });
  }
  if (!claims || typeof claims !== 'object') {
    return res.status(400).json({ error: 'Missing claims object' });
  }

  try {
    const firebaseAdmin = initAdmin();
    await firebaseAdmin.auth().setCustomUserClaims(uid, claims);

    return res.status(200).json({ success: true, uid, claims });
  } catch (err) {
    // If firebase-admin is not installed or failed to init, return 501 with guidance.
    if (err && err._isMissingFirebaseAdmin) {
      console.error('firebase-admin missing or failed to init:', err.message || err);
      return res.status(501).json({
        error: 'Server not configured with firebase-admin. Install firebase-admin and configure service account credentials.',
        help: 'Run `npm install firebase-admin` and set FIREBASE_ADMIN_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS in your environment.',
      });
    }

    console.error('set-claims failed', err);
    return res.status(500).json({ error: (err && err.message) || 'unknown error' });
  }
}
