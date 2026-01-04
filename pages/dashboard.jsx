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
              <a className="brand" aria-label="Semi-colonic home">
                <div className="brand-avatar" aria-hidden>
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

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#556', fontSize: 14 }}>{userEmail}</div>
              <button onClick={handleSignOut} className="btn btn-outline" aria-label="Sign out">Sign out</button>
            </div>
          </div>
        </header>

        <main style={{ padding: 18 }}>
          <section className="profile-card" aria-labelledby="profile-title">
            <div className="cover" />
            <div className="profile-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="avatar" aria-hidden>
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

                <div className="quick-grid" role="list">
                  <Link href="/posts" legacyBehavior>
                    <a className="quick-tile" role="listitem">Posts<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Browse community posts</div></a>
                  </Link>

                  <Link href="/chat" legacyBehavior>
                    <a className="quick-tile" role="listitem">Chat<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Join community conversations</div></a>
                  </Link>

                  <Link href="/features" legacyBehavior>
                    <a className="quick-tile" role="listitem">Features<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Explore app features</div></a>
                  </Link>

                  <Link href="/games" legacyBehavior>
                    <a className="quick-tile" role="listitem">Games<div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Relaxing mini-games</div></a>
                  </Link>
                </div>

                <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div className="get-in-touch" style={{ alignItems: 'center' }}>
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

                <div className="social-row" role="navigation" aria-label="Social links" style={{ marginTop: 14 }}>
                  {/* Instagram */}
                  <a className="social-btn" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.2A3.8 3.8 0 1 0 15.8 12 3.8 3.8 0 0 0 12 8.2zm6.4-2.6a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a className="social-btn" href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.2v-2.9h2.2V9.3c0-2.2 1.3-3.5 3.3-3.5.95 0 1.95.17 1.95.17v2.1h-1.07c-1.06 0-1.39.66-1.39 1.33v1.6h2.36l-.38 2.9h-1.98v7A10 10 0 0 0 22 12z"/>
                    </svg>
                  </a>

                  {/* X (Twitter) */}
                  <a className="social-btn" href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M21.3 7.2c.01.17.01.35.01.52 0 5.3-4 11.5-11.5 11.5A11.2 11.2 0 0 1 3 18.7a8.2 8.2 0 0 0 .96.05c2.2 0 4.23-.75 5.84-2.02a4 4 0 0 1-3.73-2.78c.64.1 1.3.06 1.9-.11a3.99 3.99 0 0 1-3.2-3.92v-.05c.54.3 1.16.48 1.82.5a3.98 3.98 0 0 1-1.24-5.3 11.34 11.34 0 0 0 8.24 4.18 4.5 4.5 0 0 1 7.62-4.1 8.05 8.05 0 0 0 2.52-.96 4.05 4.05 0 0 1-1.76 2.22 8.04 8.04 0 0 0 2.3-.63 7.96 7.96 0 0 1-2 2.07z"/>
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a className="social-btn" href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M23 7a3 3 0 0 0-2.12-2.12C18.5 4 12 4 12 4s-6.5 0-8.88.88A3 3 0 0 0 .99 7 31 31 0 0 0 0 12a31 31 0 0 0 .99 5c.35.9 1.22 1.66 2.13 1.88C5.5 20 12 20 12 20s6.5 0 8.88-.88A3 3 0 0 0 23 17a31 31 0 0 0 1-5 31 31 0 0 0-1-5zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a className="social-btn" href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M16 3h2.5v4a4.5 4.5 0 1 1-4.5-4.5V6a1 1 0 0 0-1 1 6.5 6.5 0 1 0 6.5 6.5V7H16V3z"/>
                    </svg>
                  </a>
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
