import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import InviteWidget from '../components/InviteWidget';
import ChatPopup from '../components/ChatPopup';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const authRef = useRef(null);
  const authModRef = useRef(null);

  const [showInvite, setShowInvite] = useState(false);
  const [showChat, setShowChat] = useState(false);

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
              <a
                className="brand"
                aria-label="Semi-colonic home"
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div
                  className="brand-avatar"
                  aria-hidden
                >
                  <img
                    src="/semi-colonic-logo.png"
                    alt="Semi‑Colonic"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <span className="brand-text">Semi-colonic</span>
              </a>
            </Link>

            <nav className="desktop-nav" aria-label="Primary">
              <Link href="/posts" legacyBehavior><a className="nav-link">Posts</a></Link>
              <Link href="/chat" legacyBehavior><a className="nav-link">Chat</a></Link>
              <Link href="/features" legacyBehavior><a className="nav-link">Features</a></Link>
            </nav>
          </div>

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="user-email">{userEmail}</div>
              <button onClick={handleSignOut} className="btn btn-outline" aria-label="Sign out">Sign out</button>
            </div>
          </div>
        </header>

        <main className="main-content">
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
                <button className="btn btn-outline" onClick={() => setShowInvite(true)}>Invite</button>
                <button className="btn btn-strong" onClick={() => setShowChat(true)}>Chat with Us</button>
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
                    <a className="quick-tile" role="listitem">Posts<div className="quick-sub">Browse community posts</div></a>
                  </Link>

                  <Link href="/chat" legacyBehavior>
                    <a className="quick-tile" role="listitem">Chat<div className="quick-sub">Join community conversations</div></a>
                  </Link>

                  <Link href="/features" legacyBehavior>
                    <a className="quick-tile" role="listitem">Features<div className="quick-sub">Explore app features</div></a>
                  </Link>

                  <Link href="/games" legacyBehavior>
                    <a className="quick-tile" role="listitem">Games<div className="quick-sub">Relaxing mini-games</div></a>
                  </Link>
                </div>

                <hr className="divider" />

                <div className="get-in-touch" style={{ alignItems: 'center' }}>
                  <div>
                    <div className="muted-label">Get in Touch</div>
                    <div style={{ color: '#222' }}>Semi-colonic</div>
                  </div>
                  <Link href="/message" legacyBehavior><a className="btn btn-outline small">Message</a></Link>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="muted-label">Invite Code</div>
                  <div style={{ color: '#222' }}>TTASOK</div>
                </div>

                <div className="social-row" role="navigation" aria-label="Social links" style={{ marginTop: 14 }}>
                  {/* Instagram */}
                  <a className="social-btn" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.2A3.8 3.8 0 1 0 15.8 12 3.8 3.8 0 0 0 12 8.2zm6.4-2.6a1.1 1.1 0 1 0 1.1 1[...]
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a className="social-btn" href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.2v-2.9h2.2V9.3c0-2.2 1.3-3.5 3.3-3.5.95 0 1.95.17 1.95.17v2.1h-1.07c-1.06 0-1.39.66-1.39 1.33v1.6h2.36l-.38 2.9h-1.[...]
                    </svg>
                  </a>

                  {/* X (Twitter) */}
                  <a className="social-btn" href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M21.3 7.2c.01.17.01.35.01.52 0 5.3-4 11.5-11.5 11.5A11.2 11.2 0 0 1 3 18.7a8.2 8.2 0 0 0 .96.05c2.2 0 4.23-.75 5.84-2.02a4 4 0 0 1-3.73-2.78c.64.1 1.[...]
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a className="social-btn" href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                      <path fill="currentColor" d="M23 7a3 3 0 0 0-2.12-2.12C18.5 4 12 4 12 4s-6.5 0-8.88.88A3 3 0 0 0 .99 7 31 31 0 0 0 0 12a31 31 0 0 0 .99 5c.35.9 1.22 1.66 2.13 1.88C5.5 20 12 20 1[...]
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
            <Link href="/settings" legacyBehavior><a className="pill-link">Settings</a></Link>
            <Link href="/profile" legacyBehavior><a className="pill-link primary">Profile</a></Link>
          </div>

          <div style={{ marginTop: 18, color: '#7b8899', textAlign: 'center' }}>
            Signed in as <strong>{userEmail}</strong>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>

      {/* Invite & Chat popups */}
      <InviteWidget
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        inviteCode="TTASOK"
        inviteLink={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=TTASOK`}
      />

      <ChatPopup visible={showChat} onClose={() => setShowChat(false)} />

      <style jsx>{`
        /* Shared, index-like theme for dashboard to match index/features/games */
        :root {
          --card-radius-local: 20px;
          --card-padding-local: 18px;
        }

        .topbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          background: linear-gradient(90deg, rgba(255,255,255,0.98), rgba(255,255,255,0.96));
          border-bottom: 1px solid rgba(6,20,40,0.04);
        }

        .brand-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
          flex: 0 0 40px;
          background: #fff;
          box-shadow: 0 6px 18px rgba(6,20,40,0.06);
        }
        .brand-text {
          font-weight: 700;
          color: #183547;
        }

        .desktop-nav { margin-left: 8px; display:flex; gap:8px; align-items:center; }
        .nav-link { margin-right: 12px; color: #183547; text-decoration:none; font-weight:600; }
        .topbar-actions { margin-left: auto; display:flex; gap:10px; align-items:center; }
        .btn { background: transparent; border: none; font-weight:700; padding:8px 10px; border-radius:10px; cursor:pointer; }
        .btn-outline { border: 1px solid rgba(20,40,60,0.06); padding: 8px 12px; background: transparent; }
        .btn-strong { background: linear-gradient(90deg,#d8b37b,#c87a3c); color: #fff; padding: 8px 12px; border-radius: 12px; }

        .user-email { color: #556; font-size: 14px; }

        .main-content { padding: 18px; }

        .profile-card { border-radius: 22px; overflow: hidden; box-shadow: 0 20px 60px rgba(6,20,40,0.06); background: transparent; }
        .cover { height: 140px; background: linear-gradient(90deg, #274a66, #3e6f93); background-size: cover; }
        .profile-body {
          background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92));
          padding: 16px;
        }

        .avatar { width:72px; height:72px; border-radius:14px; background:#fff; display:flex; align-items:center; justify-content:center; color:#1f3f57; box-shadow: 0 8px 20px rgba(6,20,40,0.08); overflow:hidden; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; display:block; }

        .cta-row { display:flex; gap:10px; align-items:center; margin-top:8px; }
        .tabs { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
        .tab { padding:8px 12px; border-radius:10px; background: transparent; border: 1px solid rgba(6,20,40,0.04); text-decoration:none; color:#183547; }

        .content-card { margin-top:14px; padding:14px; border-radius:12px; background: linear-gradient(180deg, #ffffff, #fbfdff); color:#222; box-shadow: 0 8px 20px rgba(6,20,40,0.04); }

        .quick-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-top:12px; }
        .quick-tile { display:block; padding:12px; background:#fff; border-radius:12px; text-decoration:none; color:#222; box-shadow: 0 6px 18px rgba(20,40,60,0.04); }
        .quick-sub { font-size:12px; color:#617489; margin-top:6px; }

        .divider { margin: 16px 0; border: none; border-top: 1px solid #eee; }

        .get-in-touch { display:flex; justify-content:space-between; width:100%; align-items:center; gap:12px; }
        .muted-label { color:#7b8899; font-weight:700; margin-bottom:4px; }

        .social-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
        .social-btn { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:10px; background:transparent; border: 1px solid rgba(6,20,40,0.04); color:inherit; text-decoration:none; }

        .footer-actions { display:flex; gap:12px; justify-content:center; }
        .pill-link { background: #f1f1f1; padding: 12px 18px; border-radius: 14px; text-decoration: none; color: #222; }
        .pill-link.primary { background: linear-gradient(90deg,#d8b37b,#c87a3c); color: #fff; }

        .site-footer { margin-top: 18px; padding: 18px; font-size: 13px; color: #7b8899; text-align:center; }

        @media (max-width: 420px) {
          .cover { height:120px; }
          .avatar { width:64px; height:64px; }
          .profile-body { padding: 12px; }
        }
      `}</style>
    </div>
  );
}
