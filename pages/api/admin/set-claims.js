// pages/api/admin/set-claims.js
// Secure server-side API to set custom claims on a Firebase user using the Admin SDK.
// IMPORTANT:
// - This route requires the Firebase Admin SDK to be available (install `firebase-admin`).
// - You must set a server secret ADMIN_API_SECRET to restrict who can call this endpoint.
// - You must also provide credentials for the Admin SDK. The route supports two options:
//    1) Set GOOGLE_APPLICATION_CREDENTIALS on the server to a path to a service account JSON (standard).
//    2) Or set FIREBASE_ADMIN_SERVICE_ACCOUNT to a JSON string (base64-encoded or raw JSON).
//
// Example environment vars (Vercel / .env.local):
// ADMIN_API_SECRET=some-hard-to-guess-secret
// FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type":"service_account",...}'
// (or set GOOGLE_APPLICATION_CREDENTIALS pointing to a file on the server)

import { buffer } from 'micro';

let admin = null;
function initAdmin() {
  if (admin) return admin;
  try {
    // lazy require so deployments that don't call this route don't need the module
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const firebaseAdmin = require('firebase-admin');

    if (!firebaseAdmin.apps.length) {
      // Try to load service account JSON from env var if provided
      const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '';
      let cred = null;
      if (raw) {
        try {
          // support base64-encoded JSON as well as raw JSON
          const maybeJson = raw.trim();
          let parsed = null;
          try {
            parsed = JSON.parse(maybeJson);
          } catch (e) {
            // try base64 decode
            try {
              parsed = JSON.parse(Buffer.from(maybeJson, 'base64').toString('utf8'));
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
    console.error('firebase-admin init error', err);
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

  try {
    const { uid, claims } = req.body || {};

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing uid' });
    }
    if (!claims || typeof claims !== 'object') {
      return res.status(400).json({ error: 'Missing claims object' });
    }

    const firebaseAdmin = initAdmin();
    await firebaseAdmin.auth().setCustomUserClaims(uid, claims);

    return res.status(200).json({ success: true, uid, claims });
  } catch (err) {
    console.error('set-claims failed', err);
    return res.status(500).json({ error: (err && err.message) || 'unknown error' });
  }
}
