// pages/api/joins.js
// Accepts POST { code, name?, email?, idToken? } and writes a join record to Firestore via Admin SDK.
// Requirements:
// - npm install firebase-admin
// - set FIREBASE_ADMIN_SERVICE_ACCOUNT (JSON string or base64 JSON) OR set GOOGLE_APPLICATION_CREDENTIALS
// - this route will run server-side and has admin privileges to write to 'joins' collection.

let admin = null;

function initAdmin() {
  if (admin) return admin;
  try {
    // lazy require
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const firebaseAdmin = require('firebase-admin');

    if (!firebaseAdmin.apps.length) {
      const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '';
      let cred = null;
      if (raw) {
        // try parse raw JSON or base64-encoded JSON
        try {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
          }
          if (parsed) {
            cred = firebaseAdmin.credential.cert(parsed);
          }
        } catch (e) {
          console.error('Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT', e);
          cred = null;
        }
      }

      if (cred) {
        firebaseAdmin.initializeApp({ credential: cred });
      } else {
        // fall back to ADC (GOOGLE_APPLICATION_CREDENTIALS)
        firebaseAdmin.initializeApp();
      }
    }

    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    console.error('initAdmin error', err);
    throw err;
  }
}

// Next.js default body parser is fine.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, name, email, idToken } = req.body || {};

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  if (typeof name === 'string' && name.length > 200) return res.status(400).json({ error: 'Name too long' });
  if (typeof email === 'string' && email.length > 200) return res.status(400).json({ error: 'Email too long' });

  try {
    const firebaseAdmin = initAdmin();
    const db = firebaseAdmin.firestore();

    let uid = null;
    let by = null;

    if (idToken && typeof idToken === 'string') {
      try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
        uid = decoded.uid;
        // optionally pull name/email from user record
        const userRecord = await firebaseAdmin.auth().getUser(uid).catch(() => null);
        by = userRecord ? (userRecord.displayName || userRecord.email || uid) : uid;
      } catch (e) {
        // invalid token — ignore and continue writing as guest
        console.warn('Invalid idToken on /api/joins (continuing as guest)', e.message || e);
      }
    }

    const docRef = await db.collection('joins').add({
      code: code.trim(),
      name: (typeof name === 'string' && name.trim() ? name.trim() : null),
      email: (typeof email === 'string' && email.trim() ? email.trim() : null),
      uid: uid || null,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      userAgent: req.headers['user-agent'] || null,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      createdBy: by || null
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('Failed to write join record', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
