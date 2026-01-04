import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const authRef = useRef(null);
  const authModRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;
    const INIT_TIMEOUT_MS = 7000;
    let initTimeout = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Missing firebase config');
        const cfg = await resp.json();

        const { auth, authMod } = await initFirebaseWithConfig(cfg);

        authRef.current = auth;
        authModRef.current = authMod;

        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          initTimeout = setTimeout(() => {
            if (!mounted) return;
            router.replace('/');
          }, INIT_TIMEOUT_MS);

          unsubscribe = authMod.onAuthStateChanged(auth, (user) => {
            if (!mounted) return;
            if (initTimeout) { clearTimeout(initTimeout); initTimeout = null; }

            if (!user) {
              router.replace('/');
              return;
            }
            setUserEmail(user.email || 'Unknown');
            setLoading(false);
          });
        } else {
          initTimeout = setTimeout(() => {
            if (!mounted) return;
            const user = auth && auth.currentUser;
            if (!user) {
              router.replace('/');
              return;
            }
            setUserEmail(user.email || 'Unknown');
            setLoading(false);
          }, 300);
        }
      } catch (err) {
        console.error('Dashboard init error', err);
        router.replace('/');
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, []);

  async function handleSignOut() {
    try {
      const auth = authRef.current;
      const authMod = authModRef.current;
      if (auth && authMod && typeof authMod.signOut === 'function') {
        await authMod.signOut(auth);
      } else if (auth && auth.signOut) {
        await auth.signOut();
      }
    } catch (err) {
      console.error('Sign out failed', err);
    } finally {
      router.replace('/');
    }
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading dashboard…</div>;

  return (
    <div className="site-root">
      <div className="site">
        {/* Top navigation */}
        <header className="topbar" role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Link href="/" legacyBehavior>
              <a className="brand">
                <div className="brand-avatar">
                  <img src="/semi-colonic-logo.png" alt="Semi‑Colonic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontWeight: 700 }}>Semi-colonic</span>
              </a>
            </Link>

            <nav className="desktop-nav" aria-label="Primary">
              <Link href="/posts" legacyBehavior><a style={{ marginRight: 12 }}>Posts</a></Link>
              <Link href="/chat" legacyBehavior><a style={{ marginRight: 12 }}>Chat</a></Link>
              <Link href="/features" legacyBehavior><a>Features</a></Link>
            </nav>
          </div>

          <div className="topbar-actions">
            <button aria-label="Notifications" className="btn">🔔</button>
            <button aria-label="Messages" className="btn">💬</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#556', fontSize: 14 }}>{userEmail}</div>
              <button onClick={handleSignOut} className="btn btn-outline">Sign out</button>
            </div>
          </div>
        </header>

        <main style={{ padding: 18 }}>
          <section className="profile-card" aria-labelledby="profile-title">
            <div className="cover" />
            <div className="profile-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="avatar">
                  <img src="/semi-colonic-logo.png" alt="avatar" />
                </div>
                <div style={{ flex: 1 }}>
                  <h1 id="profile-title" style={{ margin: 0, fontSize: 20, color: '#183547' }}>Semi-colonic</h1>
                  <p style={{ margin: '6px 0 0', color: '#617489' }}>Not the end—just a moment to rest.</p>
                </div>
              </div>

              <div className="cta-row" style={{ marginTop: 12 }}>
                <Link href="/invite" legacyBehavior>
                  <a className="btn btn-outline" style={{ display: 'inline-flex', justifyContent: 'center' }}>Invite</a>
                </Link>
                <button className="btn btn-strong" onClick={() => alert('Chat placeholder')}>Chat with Us</button>
              </div>

              <nav className="tabs" role="navigation" aria-label="Profile tabs" style={{ marginTop: 16 }}>
                <Link href="/dashboard" legacyBehavior><a className="tab">Home</a></Link>
                <Link href="/features" legacyBehavior><a className="tab">Features</a></Link>
                <Link href="/games" legacyBehavior><a className="tab">Games</a></Link>
                <Link href="/resources" legacyBehavior><a className="tab">Resources</a></Link>
                <Link href="/profile" legacyBehavior><a className="tab">Profile</a></Link>
              </nav>

              <div className="content-card">
                <p style={{ marginTop: 0 }}>Semi-colonic is where you can share posts, stay updated and chat with others in my community.</p>

                <div className="quick-grid">
                  <Link href="/posts" legacyBehavior>
                    <a className="quick-tile">Posts<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Browse community posts</div></a>
                  </Link>

                  <Link href="/chat" legacyBehavior>
                    <a className="quick-tile">Chat<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Join community conversations</div></a>
                  </Link>

                  <Link href="/features" legacyBehavior>
                    <a className="quick-tile">Features<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Explore app features</div></a>
                  </Link>

                  <Link href="/games" legacyBehavior>
                    <a className="quick-tile">Games<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Relaxing mini-games</div></a>
                  </Link>
                </div>

                <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div className="get-in-touch">
                  <div>
                    <div style={{ fontSize: 14, color: '#7b8899', fontWeight: 700 }}>Get in Touch</div>
                    <div style={{ color: '#222' }}>Semi-colonic</div>
                  </div>
                  <Link href="/message" legacyBehavior><a className="btn btn-outline" style={{ padding: '8px 12px' }}>Message</a></Link>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: '#7b8899', fontWeight: 700 }}>Invite Code</div>
                  <div style={{ color: '#222' }}>TTASOK</div>
                </div>

                <div className="social-row">
                  <Link href="https://instagram.com" legacyBehavior><a className="social-btn">IG</a></Link>
                  <Link href="https://facebook.com" legacyBehavior><a className="social-btn">FB</a></Link>
                  <Link href="https://x.com" legacyBehavior><a className="social-btn">X</a></Link>
                  <Link href="https://youtube.com" legacyBehavior><a className="social-btn">YT</a></Link>
                  <Link href="https://tiktok.com" legacyBehavior><a className="social-btn">TT</a></Link>
                </div>
              </div>
            </div>
          </section>

          <div className="footer-actions" style={{ marginTop: 18 }}>
            <Link href="/settings" legacyBehavior><a style={{ background: '#f1f1f1', padding: 12, borderRadius: 14, textDecoration: 'none', color: '#222', textAlign: 'center' }}>Settings</a></Link>
            <Link href="/profile" legacyBehavior><a style={{ background: 'linear-gradient(90deg,#d8b37b,#c87a3c)', padding: 12, borderRadius: 14, color: '#fff', textAlign: 'center', textDecoration: 'none' }}>Profile</a></Link>
          </div>

          <div style={{ marginTop: 18, color: '#7b8899', textAlign: 'center' }}>
            Signed in as <strong>{userEmail}</strong>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}
