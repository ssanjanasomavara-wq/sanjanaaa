// pages/admin/claims.jsx
// Tiny admin management UI to set custom claims for a user.
// NOTE: This UI calls the server-side API /api/admin/set-claims which requires
// an ADMIN_API_SECRET. For security the page asks the operator to paste the secret
// into the form (do not store it in the browser in production).
//
// Installation notes:
// - Install firebase-admin on the server: `npm install firebase-admin`
// - Set ADMIN_API_SECRET and FIREBASE_ADMIN_SERVICE_ACCOUNT (or GOOGLE_APPLICATION_CREDENTIALS).
// - Only use this UI in a trusted environment (or add server-side auth checks).

import { useState } from 'react';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../../../lib/firebaseClient';


export default function ClaimsAdmin() {
  const [uid, setUid] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [makeAuthor, setMakeAuthor] = useState(false);
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);

    if (!uid.trim()) {
      setStatus({ type: 'error', message: 'UID is required' });
      return;
    }
    if (!secret.trim()) {
      setStatus({ type: 'error', message: 'Admin secret is required' });
      return;
    }

    const claims = {};
    if (makeAdmin) claims.admin = true;
    if (makeAuthor) claims.role = 'author';
    if (!makeAdmin) claims.admin = false;
    // If role not author, you may want to remove it by setting null — here we omit to leave unchanged.

    setLoading(true);
    try {
      const resp = await fetch('/api/admin/set-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ uid: uid.trim(), claims }),
      });
      const body = await resp.json();
      if (!resp.ok) {
        setStatus({ type: 'error', message: body.error || 'Failed to set claims' });
      } else {
        setStatus({ type: 'success', message: `Claims updated for ${uid}` });
      }
    } catch (err) {
      console.error('submit error', err);
      setStatus({ type: 'error', message: err.message || 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-root" style={{ minHeight: '100vh' }}>
      <div className="site" style={{ maxWidth: 880, margin: '18px auto', padding: 18 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" legacyBehavior><a className="brand" aria-label="Semi-colonic home" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="brand-avatar" aria-hidden style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}>
                <img src="/semi-colonic-logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontWeight: 700, color: '#183547' }}>Semi-colonic</span>
            </a></Link>
          </div>
          <nav>
            <Link href="/dashboard" legacyBehavior><a className="btn btn-outline" style={{ marginRight: 8 }}>Dashboard</a></Link>
            <Link href="/posts" legacyBehavior><a className="btn btn-outline">Posts</a></Link>
          </nav>
        </header>

        <main>
          <h1 style={{ marginTop: 0 }}>Admin: Set Custom Claims</h1>
          <p style={{ color: '#617489' }}>
            Use this page to set custom claims for a user (admin / author). This calls a server-side API that uses the Firebase Admin SDK.
            For security, the API requires ADMIN_API_SECRET. Do not paste the secret on an untrusted machine.
          </p>

          <form onSubmit={submit} style={{ background: '#fff', padding: 16, borderRadius: 10, boxShadow: '0 6px 18px rgba(20,40,60,0.04)' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label>
                User UID
                <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Firebase UID" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e6eef0' }} />
              </label>

              <label>
                Admin secret (server-side)
                <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="ADMIN_API_SECRET" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e6eef0' }} />
              </label>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={makeAdmin} onChange={(e) => setMakeAdmin(e.target.checked)} /> Make Admin
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={makeAuthor} onChange={(e) => setMakeAuthor(e.target.checked)} /> Make Author
                </label>
                <div style={{ flex: 1 }} />
                <button type="submit" className="btn btn-strong" disabled={loading} style={{ padding: '8px 12px' }}>
                  {loading ? 'Saving…' : 'Set Claims'}
                </button>
              </div>

              {status && (
                <div style={{ padding: 8, borderRadius: 8, background: status.type === 'error' ? '#fdecea' : '#ecf8f1', color: status.type === 'error' ? '#bb2d3b' : '#146b3a' }}>
                  {status.message}
                </div>
              )}
            </div>
          </form>
        </main>

        <footer style={{ marginTop: 18, color: '#7b8899' }}>
          © {new Date().getFullYear()} Semi‑Colonic — Admin tools
        </footer>
      </div>

      <style jsx>{`
        .brand-avatar img { display: block; }
      `}</style>
    </div>
  );
}
