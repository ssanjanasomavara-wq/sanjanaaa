import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

/**
 * Join / Landing page
 *
 * - Accessible at /join
 * - Accepts an invite code (also accepts ?code=... in the URL)
 * - Tracks join attempts:
 *    - If Firestore is configured, calls the server API /api/joins which writes the record via Admin SDK.
 *    - Otherwise falls back to localStorage "joins" array for tracking
 * - After successful join the user sees a gentle landing page with information
 *   styled to match existing pages.
 *
 * Notes:
 * - This page expects an API endpoint at /api/joins (server-side) to be present.
 */

export default function Join() {
  const router = useRouter();
  const qCode = typeof router.query.code === 'string' ? router.query.code : '';

  const [loading, setLoading] = useState(true);
  const [cfgAvailable, setCfgAvailable] = useState(false);

  const authRef = useRef(null);
  const authModRef = useRef(null);
  const firestoreRef = useRef(null);
  const firestoreModRef = useRef(null);

  const [user, setUser] = useState(null);

  const [code, setCode] = useState(qCode || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) {
          setCfgAvailable(false);
          setLoading(false);
          return;
        }
        const cfg = await resp.json();
        const res = await initFirebaseWithConfig(cfg);
        authRef.current = res.auth || null;
        authModRef.current = res.authMod || null;
        firestoreRef.current = res.firestore || null;
        firestoreModRef.current = res.firestoreMod || null;

        // subscribe auth if available
        if (authModRef.current && typeof authModRef.current.onAuthStateChanged === 'function') {
          authModRef.current.onAuthStateChanged(authRef.current, (u) => {
            if (!mounted) return;
            setUser(u || null);
            if (u) {
              setName(u.displayName || u.email || '');
              setEmail(u.email || '');
            }
          });
        }

        setCfgAvailable(true);
      } catch (err) {
        console.warn('Join page: firebase unavailable', err);
        setCfgAvailable(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // If query contains code, prefill
    if (qCode) setCode(qCode);
  }, [qCode]);

  function saveLocalJoin(payload) {
    try {
      const key = 'joins';
      const raw = localStorage.getItem(key) || '[]';
      const arr = JSON.parse(raw);
      arr.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, ...payload, createdAt: new Date().toString() });
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (err) {
      console.error('Failed to save local join', err);
    }
  }

  // Replace the existing submitJoin implementation with this:
  async function submitJoin(e) {
    e && e.preventDefault();
    setStatusMsg('');
    const trimmedCode = (code || '').trim();
    if (!trimmedCode) {
      setStatusMsg('Please enter the invite code.');
      return;
    }

    const payload = {
      code: trimmedCode,
      name: (name || '').trim() || null,
      email: (email || '').trim() || null,
    };

    // If user is signed in, get idToken and pass it to the server for uid attachment
    let idToken = null;
    try {
      if (authRef.current && authModRef.current && authRef.current.currentUser) {
        idToken = await authRef.current.currentUser.getIdToken();
      }
    } catch (err) {
      console.warn('Could not get idToken', err);
    }

    try {
      const resp = await fetch('/api/joins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, idToken }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatusMsg(data.error || 'Failed to register join.');
        // fallback to local record so user doesn't lose form data
        saveLocalJoin(payload);
        setJoined(true);
        return;
      }
      // success
      saveLocalJoin(payload);
      setJoined(true);
      setStatusMsg('Welcome — your join has been recorded.');
    } catch (err) {
      console.error('Join API error', err);
      // fallback local save
      saveLocalJoin(payload);
      setJoined(true);
      setStatusMsg('Join recorded locally (server error).');
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading…</div>;
  }

  // Landing / after-join view
  function Landing() {
    return (
      <div style={{ maxWidth: 920, margin: '18px auto', padding: 18 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 18 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
            background: '#f3f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(6,20,40,0.06)'
          }}>
            <img src="/semi-colonic-logo.png" alt="logo" style={{ width: '88%', height: '88%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#7b8899' }}>Welcome</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 26, color: '#183547' }}>{name ? `welcome ${name}` : 'welcome friend'}</h1>
          </div>
        </div>

        <div style={{ background: '#f3f3f4', padding: 14, borderRadius: 8, marginBottom: 18 }}>
          <blockquote style={{ margin: 0, fontStyle: 'italic', color: '#6b7380', textAlign: 'center' }}>
            "You are allowed to pause. Semi‑colonic is a gentle place to rest."
          </blockquote>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <img src="/images/sample1.jpg" alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#7b8899' }}>info : answer</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <img src="/images/sample2.jpg" alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#7b8899' }}>info : answer</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <img src="/images/sample3.jpg" alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#7b8899' }}>info : answer</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <img src="/images/sample4.jpg" alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#7b8899' }}>info : answer</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
              <div style={{ background: '#efefef', padding: 8, borderRadius: 6, marginBottom: 12, fontWeight: 700, color: '#556' }}>
                long question here
              </div>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                Semi‑colonic is a gentle place to rest and reflect. You can explore features like diary, calming games, and community posts.
                This landing page introduces the space and offers a few starter resources. Be kind to yourself — there's no rush.
              </p>
            </div>
          </div>

          <div style={{ width: 320 }}>
            <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
              <img src="/images/side-sample.jpg" alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 6 }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <Link href="/dashboard" legacyBehavior>
            <a className="btn btn-outline" style={{ padding: '10px 12px', borderRadius: 12, textDecoration: 'none' }}>Back to Dashboard</a>
          </Link>
          <Link href="/posts" legacyBehavior>
            <a className="btn btn-strong" style={{ padding: '10px 12px', borderRadius: 12, textDecoration: 'none' }}>Explore Posts</a>
          </Link>
        </div>

        <div style={{ marginTop: 18, color: '#7b8899', fontSize: 13 }}>
          {statusMsg}
        </div>
      </div>
    );
  }

  // Input / join form view (before joining)
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ padding: 18, borderBottom: '1px solid rgba(6,20,40,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" legacyBehavior>
            <a style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#183547' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                <img src="/semi-colonic-logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <strong>Semi-colonic</strong>
            </a>
          </Link>
        </div>

        <nav style={{ display: 'flex', gap: 12 }}>
          <Link href="/posts" legacyBehavior><a style={{ color: '#183547' }}>Posts</a></Link>
          <Link href="/chat" legacyBehavior><a style={{ color: '#183547' }}>Chat</a></Link>
          <Link href="/dashboard" legacyBehavior><a className="btn btn-outline" style={{ padding: '8px 10px', borderRadius: 10 }}>Dashboard</a></Link>
        </nav>
      </header>

      <main style={{ maxWidth: 920, margin: '18px auto', padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
          <div style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.06)' }}>
            <h2 style={{ marginTop: 0, color: '#183547' }}>Join Semi‑Colonic</h2>
            <p style={{ color: '#617489' }}>Enter the invite code provided to you. We'll keep a simple record of joins so the community owner can manage access.</p>

            <form onSubmit={submitJoin} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <label style={{ display: 'block' }}>
                Invite code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter invite code"
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e6eef0', marginTop: 6 }}
                />
              </label>

              <label>
                Display name (optional)
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we call you?"
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e6eef0', marginTop: 6 }}
                />
              </label>

              <label>
                Email (optional)
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (we won't spam)"
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e6eef0', marginTop: 6 }}
                />
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-strong" style={{ flex: 1, padding: '10px 12px', borderRadius: 10 }}>Join</button>
                <button type="button" onClick={() => { setCode(''); setName(''); setEmail(''); }} className="btn btn-outline" style={{ padding: '10px 12px', borderRadius: 10 }}>Reset</button>
              </div>

              {statusMsg && <div style={{ color: '#7b8899', fontSize: 13 }}>{statusMsg}</div>}
            </form>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.06)' }}>
              <h4 style={{ margin: 0 }}>Why join?</h4>
              <p style={{ color: '#617489', marginTop: 8 }}>
                Joining gives you access to community features like posts and chat. It helps the community owner keep the space welcoming.
              </p>
            </div>

            <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.06)' }}>
              <h4 style={{ margin: 0 }}>Privacy</h4>
              <p style={{ color: '#617489', marginTop: 8 }}>
                We only store the code and basic info you provide. No public sharing by default. The owner can manage joins in the admin console.
              </p>
            </div>

            <div style={{ background: '#fff', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#7b8899' }}>Already joined?</div>
              <Link href="/dashboard" legacyBehavior>
                <a className="btn btn-outline" style={{ marginTop: 8, display: 'inline-block', padding: '8px 12px', borderRadius: 10 }}>Go to Dashboard</a>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer style={{ padding: 18, textAlign: 'center', color: '#7b8899' }}>
        © {new Date().getFullYear()} Semi‑Colonic — A gentle place to rest.
      </footer>

      <style jsx>{`
        .btn { border: none; cursor: pointer; font-weight: 700; }
        .btn-strong { background: linear-gradient(90deg,#d8b37b,#c87a3c); color: #fff; }
        .btn-outline { background: transparent; border: 1px solid rgba(6,20,40,0.06); padding: 8px 10px; color: #183547; }
      `}</style>
    </div>
  );
}
