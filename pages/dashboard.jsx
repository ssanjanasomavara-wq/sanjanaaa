import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import InviteWidget from '../components/InviteWidget';
import ChatPopup from '../components/ChatPopup';
import QuoteBanner from '../components/QuoteBanner';
import ImageGrid from '../components/ImageGrid';
import MobileDrawer from '../components/MobileDrawer';
import { THINGS_ITEMS, THINGS_IMAGES, QUOTES } from '../lib/themeConstants';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const authRef = useRef(null);
  const authModRef = useRef(null);

  const [showInvite, setShowInvite] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const mobileMenuButtonRef = useRef(null);

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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

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
                  aria-hidden="true"
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
              <Link href="/games" legacyBehavior><a className="nav-link">Games</a></Link>
              <Link href="/resources" legacyBehavior><a className="nav-link">Resources</a></Link>
            </nav>
          </div>

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>
              <div className="user-email" title={userEmail}>{userEmail}</div>
              <button onClick={handleSignOut} className="btn btn-strong" aria-label="Sign out">Sign out</button>

            <button
              ref={mobileMenuButtonRef}
              className="mobile-menu-button"
              aria-label="Open menu"
              aria-expanded={showMenu}
              aria-controls="mobile-drawer"
              onClick={() => setShowMenu((s) => !s)}
              title="Menu"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Reusable Mobile Drawer */}
        <MobileDrawer
          open={showMenu}
          onClose={() => setShowMenu(false)}
          mobileMenuButtonRef={mobileMenuButtonRef}
          onInvite={() => setShowInvite(true)}
          onChat={() => setShowChat(true)}
          links={[
            { href: '/posts', label: 'Posts' },
            { href: '/chat', label: 'Chat' },
            { href: '/features', label: 'Features' },
            { href: '/games', label: 'Games' },
            { href: '/resources', label: 'Resources' },
            { href: '/settings', label: 'Settings' },
          ]}
        />

        <main className="main-content" id="main-content">
          <section className="profile-card" aria-labelledby="profile-title">
            <div className="cover" />
            <div className="profile-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="avatar" aria-hidden="true">
                  <img src="/semi-colonic-logo.png" alt="avatar" />
                </div>
                <div style={{ flex: 1 }}>
                  <h1 id="profile-title" style={{ margin: 0, fontSize: 'clamp(18px, 3.4vw, 22px)', color: '#183547' }}>Semi-colonic</h1>
                  <p style={{ margin: '6px 0 0', color: '#617489' }}>Not the end—just a moment to rest.</p>
                </div>
              </div>

              <div className="cta-row" style={{ marginTop: 12 }}>
                <button className="btn btn-strong" onClick={() => setShowInvite(true)}>Invite</button>
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

                <QuoteBanner 
                  text={QUOTES.dashboard.quote}
                  author={QUOTES.dashboard.author}
                />

                {/* Use THINGS_ITEMS which contains image and text tiles (with hrefs) */}
                <ImageGrid items={THINGS_ITEMS} />
                <hr className="divider" />

      
              </div>
            </div>
          </section>

          <QuoteBanner 
            text="The tide goes out. The tide comes back."
            author="Semi-colonic"
            className="dashboard-quote"
          />

          <div className="footer-actions" style={{ marginTop: 18 }}>
            <Link href="/settings" legacyBehavior><a className="pill-link">Settings</a></Link>
            <Link href="/profile" legacyBehavior><a className="pill-link primary">Profile</a></Link>
          </div>

          <div style={{ marginTop: 18, color: '#7b8899', textAlign: 'center' }}>
            Signed in as <strong>{userEmail}</strong>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>

      {/* Invite & Chat popups */}
      <InviteWidget
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        inviteCode="SEMICOLON"
        inviteLink={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=SEMICOLON`}
      />

      <ChatPopup visible={showChat} onClose={() => setShowChat(false)} />

      <style jsx>{`
        :root { --max-width: 980px; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .site-root { min-height: 100vh; padding: 0; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        .brand-text { font-weight: 700; color: var(--text-primary); }
        .desktop-nav { margin-left: 8px; display: flex; gap: 8px; align-items: center; }
        .nav-link { margin-right: 12px; color: var(--text-primary); text-decoration: none; font-weight: 600; }

        .topbar-actions { margin-left: auto; display: flex; gap: 10px; align-items: center; }
        .user-email { color: var(--text-secondary); font-size: 14px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .main-content { padding: var(--space-md, 20px); }
        .cover { height: 140px; background: linear-gradient(90deg, var(--color-sky-soft, #dff2ff), var(--color-aqua-mist, #e9fbff)); border-radius: 12px 12px 0 0; }
        .profile-body { background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92)); padding: 16px; border-radius: 0 0 12px 12px; }

        .avatar { width: 72px; height: 72px; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 8px 20px rgba(6,20,40,0.08); }
        .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .cta-row { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .tabs { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .tab { padding: 8px 12px; border-radius: 10px; background: transparent; border: 1px solid rgba(6,20,40,0.04); text-decoration: none; color: var(--text-primary); }

        .quick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 12px; }
        .quick-tile { display: block; padding: 12px; background: #fff; border-radius: 12px; text-decoration: none; color: var(--text-primary); box-shadow: 0 6px 18px rgba(20,40,60,0.04); }
        .quick-sub { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }

        .divider { margin: 16px 0; border: none; border-top: 1px solid #eee; }
        .get-in-touch { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .muted-label { color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }

        .social-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .social-btn { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; background: transparent; border: 1px solid rgba(6,20,40,0.04); }

        .footer-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .pill-link { background: #f1f1f1; padding: 12px 18px; border-radius: 14px; text-decoration: none; color: var(--text-primary); }
        .pill-link.primary { background: var(--cta-strong, #1f9fff); color: #fff; }

        .site-footer { margin-top: var(--space-md); padding: var(--space-md); font-size: 13px; color: var(--text-muted); text-align: center; }
        .dashboard-quote { margin-top: var(--space-lg); }

        /* topbar & mobile improvements */
        .topbar { display: flex; gap: 12px; align-items: center; padding: 12px 0; position: relative; }
        .brand-avatar { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; flex: 0 0 44px; }
        .mobile-menu-button { display: none; background: transparent; border: none; font-size: 20px; padding: 6px 8px; margin-left: 6px; }

        @media (max-width: 600px) {
          .desktop-nav { display: none; }
          .mobile-menu-button { display: inline-flex; }
          .brand-text { font-size: 14px; }
          .site { padding: 0 12px; }
          .main-content { padding: 14px 6px; }
          .cover { height: 120px; }
          .avatar { width: 64px; height: 64px; }
          .profile-body { padding: 12px; }
          .topbar-actions { gap: 8px; align-items: center; }
          .user-email { max-width: 110px; font-size: 13px; }
        }

        @media (max-width: 420px) {
          .cover { height: 110px; }
          .avatar { width: 56px; height: 56px; }
          .brand-avatar { width: 40px; height: 40px; }
          .brand-text { display: none; }
        }
      `}</style>
    </div>
  );
}