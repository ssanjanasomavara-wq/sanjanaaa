import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import InviteWidget from '../components/InviteWidget';
import ChatPopup from '../components/ChatPopup';
import QuoteBanner from '../components/QuoteBanner';
import ImageGrid from '../components/ImageGrid';
import { SEASIDE_IMAGES, QUOTES } from '../lib/themeConstants';

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
  const drawerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

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

  // Focus-trap & accessibility for mobile drawer
  useEffect(() => {
    const drawer = drawerRef.current;
    if (showMenu) {
      previousActiveElementRef.current = document.activeElement;
      // set aria-hidden on main site area to help screen readers
      const site = document.querySelector('.site');
      if (site) site.setAttribute('aria-hidden', 'true');

      // focus first focusable element in drawer
      const focusables = drawer ? drawer.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])') : [];
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowMenu(false);
          return;
        }

        if (e.key === 'Tab') {
          // implement simple focus trap
          const nodes = Array.from(focusables);
          if (nodes.length === 0) return;
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => {
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
      };
    } else {
      // restore
      const site = document.querySelector('.site');
      if (site) site.removeAttribute('aria-hidden');
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      } else if (mobileMenuButtonRef.current) {
        mobileMenuButtonRef.current.focus();
      }
    }
  }, [showMenu]);

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

  const closeMenu = () => setShowMenu(false);

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
              <Link href="/resources" legacyBehavior><a className="nav-link">Resources</a></Link>
            </nav>
          </div>

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>
              <div className="user-email" title={userEmail}>{userEmail}</div>
              <button onClick={handleSignOut} className="btn btn-outline" aria-label="Sign out">Sign out</button>

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

          {/* Drawer & Backdrop */}
          <div
            className={`drawer-backdrop ${showMenu ? 'visible' : ''}`}
            onClick={closeMenu}
            aria-hidden={!showMenu}
          />

          <aside
            id="mobile-drawer"
            ref={drawerRef}
            className={`mobile-drawer ${showMenu ? 'open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!showMenu}
          >
            <div className="drawer-header">
              <div className="drawer-brand">
                <div className="brand-avatar" aria-hidden="true">
                  <img src="/semi-colonic-logo.png" alt="" />
                </div>
                <div className="drawer-title">Semi-colonic</div>
              </div>
              <button
                className="btn btn-plain drawer-close"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                ✕
              </button>
            </div>

            <nav className="drawer-nav" aria-label="Mobile primary navigation">
              <Link href="/posts" legacyBehavior><a onClick={closeMenu}>Posts</a></Link>
              <Link href="/chat" legacyBehavior><a onClick={closeMenu}>Chat</a></Link>
              <Link href="/features" legacyBehavior><a onClick={closeMenu}>Features</a></Link>
              <Link href="/resources" legacyBehavior><a onClick={closeMenu}>Resources</a></Link>
              <Link href="/settings" legacyBehavior><a onClick={closeMenu}>Settings</a></Link>
            </nav>

            <div className="drawer-actions">
              <button className="btn btn-outline" onClick={() => { setShowInvite(true); closeMenu(); }}>Invite</button>
              <button className="btn btn-strong" onClick={() => { setShowChat(true); closeMenu(); }}>Chat</button>
            </div>
          </aside>
        </header>

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

                <QuoteBanner 
                  quote={QUOTES.dashboard.quote}
                  author={QUOTES.dashboard.author}
                />

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

                <ImageGrid images={SEASIDE_IMAGES} />

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
                  <a
                    className="social-btn"
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.2A3.8 3.8 0 1 0 15.8 12 3.8 3.8 0 0 0 12 8.2zM18 7.5a1 1 0 1 0 0-2 1 1 0 [...]" />
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    className="social-btn"
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.9v-7H8.3v-2.9h2.2V9.3c0-2.2 1.3-3.5 3.3-3.5.95 0 1.95.17 1.95.17v2.1h-1.07c-1.06 0-1.39.66-1.39 1.33v1.6h2.36l-.38 2.9h-1.9[...]" />
                    </svg>
                  </a>

                  {/* X (Twitter) */}
                  <a
                    className="social-btn"
                    href="https://x.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M21 6.5c-.6.3-1.2.5-1.8.6.7-.4 1.2-1 1.4-1.7-.7.4-1.5.7-2.3.9C17 5 16 5 15.2 4.5c-1-.6-2.2-1-3.5-1 0 .1 0 .2 0 .3C9.6 4 8 5 7.3 6.3c-.6 1.2-.3 2.6.7 [...]" />
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a
                    className="social-btn"
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M23 7s-.2-1.6-.8-2.3C21 3 19.7 3 19 3H5C4.3 3 3 3 1.8 4.7 1.2 5.4 1 7 1 7S1 8.9 1 10.8v2.4C1 16.1 1.2 17.6 1.8 18.3 3 20 4.3 20 5 20h14c.7 0 2 0 3.2-[...]" />
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    className="social-btn"
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M16 3h2.5v4a4.5 4.5 0 1 1-4.5-4.5V6a1 1 0 0 0-1 1 6.5 6.5 0 1 0 6.5 6.5V7H16V3z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <QuoteBanner 
            text="Not the end—just a moment to rest. The tide goes out. The tide comes back."
            author="Semi-colonic"
            className="dashboard-quote"
          />

          <ImageGrid 
            images={[
              { src: '/images/placeholder-1.svg', alt: 'Peaceful seaside moment 1' },
              { src: '/images/placeholder-2.svg', alt: 'Peaceful seaside moment 2' },
              { src: '/images/placeholder-3.svg', alt: 'Peaceful seaside moment 3' },
              { src: '/images/placeholder-4.svg', alt: 'Peaceful seaside moment 4' },
            ]}
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
        /* Basic iOS & typography tweaks */
        :root {
          --max-width: 980px;
        }
        html, body {
          -webkit-text-size-adjust: 100%; /* iOS Safari: avoid automatic font-size adjustments */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Minimal dashboard-specific styles - most styling from theme.css */
        .site-root {
          min-height: 100vh;
          padding: 0;
          background: var(--bg, #fff);
        }
        
        .site {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 18px;
        }

        .brand-text {
          font-weight: 700;
          color: var(--text-primary);
        }

        .desktop-nav { 
          margin-left: 8px; 
          display: flex; 
          gap: 8px; 
          align-items: center; 
        }
        
        .nav-link { 
          margin-right: 12px; 
          color: var(--text-primary); 
          text-decoration: none; 
          font-weight: 600; 
        }
        
        .topbar-actions { 
          margin-left: auto; 
          display: flex; 
          gap: 10px; 
          align-items: center; 
        }

        .user-email { 
          color: var(--text-secondary); 
          font-size: 14px; 
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .main-content { 
          padding: var(--space-md, 20px); 
        }

        .cover { 
          height: 140px; 
          background: linear-gradient(90deg, var(--color-sky-soft, #dff2ff), var(--color-aqua-mist, #e9fbff)); 
          border-radius: 12px 12px 0 0;
        }
        
        .profile-body {
          background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92));
          padding: 16px;
          border-radius: 0 0 12px 12px;
        }

        .avatar { 
          width: 72px; 
          height: 72px; 
          border-radius: 14px; 
          background: #fff; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden; 
          box-shadow: 0 8px 20px rgba(6,20,40,0.08);
        }
        
        .avatar img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          display: block; 
        }

        .cta-row { 
          display: flex; 
          gap: 10px; 
          margin-top: 8px; 
          flex-wrap: wrap;
        }
        
        .tabs { 
          display: flex; 
          gap: 8px; 
          margin-top: 12px; 
          flex-wrap: wrap; 
        }
        
        .tab { 
          padding: 8px 12px; 
          border-radius: 10px; 
          background: transparent; 
          border: 1px solid rgba(6,20,40,0.04); 
          text-decoration: none; 
          color: var(--text-primary); 
        }

        .quick-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
          gap: 10px; 
          margin-top: 12px; 
        }
        
        .quick-tile { 
          display: block; 
          padding: 12px; 
          background: #fff; 
          border-radius: 12px; 
          text-decoration: none; 
          color: var(--text-primary); 
          box-shadow: 0 6px 18px rgba(20,40,60,0.04); 
        }
        
        .quick-sub { 
          font-size: 12px; 
          color: var(--text-secondary); 
          margin-top: 6px; 
        }

        .divider { 
          margin: 16px 0; 
          border: none; 
          border-top: 1px solid #eee; 
        }

        .get-in-touch { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          gap: 12px; 
        }
        
        .muted-label { 
          color: var(--text-muted); 
          font-weight: 700; 
          margin-bottom: 4px; 
        }

        .social-row { 
          display: flex; 
          gap: 8px; 
          flex-wrap: wrap; 
          margin-top: 12px; 
        }
        
        .social-btn { 
          display: inline-flex; 
          align-items: center; 
          justify-content: center; 
          width: 38px; 
          height: 38px; 
          border-radius: 10px; 
          background: transparent; 
          border: 1px solid rgba(6,20,40,0.04); 
          color: var(--text-secondary); 
          text-decoration: none;
        }

        .footer-actions { 
          display: flex; 
          gap: 12px; 
          justify-content: center; 
          flex-wrap: wrap;
        }
        
        .pill-link { 
          background: #f1f1f1; 
          padding: 12px 18px; 
          border-radius: 14px; 
          text-decoration: none; 
          color: var(--text-primary); 
        }
        
        .pill-link.primary { 
          background: var(--cta-strong, #1f9fff); 
          color: #fff; 
        }

        .site-footer { 
          margin-top: var(--space-md); 
          padding: var(--space-md); 
          font-size: 13px; 
          color: var(--text-muted); 
          text-align: center; 
        }
        
        .dashboard-quote {
          margin-top: var(--space-lg);
        }

        /* Mobile / small-screen improvements */
        .topbar {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          position: relative;
        }

        .brand-avatar {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          flex: 0 0 44px;
        }

        .mobile-menu-button {
          display: none;
          background: transparent;
          border: none;
          font-size: 20px;
          padding: 6px 8px;
          margin-left: 6px;
        }

        /* Drawer styles */
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(6,20,40,0.36);
          opacity: 0;
          pointer-events: none;
          transition: opacity 220ms ease;
          z-index: 30;
        }
        .drawer-backdrop.visible {
          opacity: 1;
          pointer-events: auto;
        }

        .mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(84vw, 360px);
          max-width: 420px;
          background: #fff;
          box-shadow: -16px 0 40px rgba(6,20,40,0.12);
          transform: translateX(100%);
          z-index: 40;
          display: flex;
          flex-direction: column;
          padding: 12px;
          gap: 12px;
          border-left: 1px solid rgba(6,20,40,0.04);
          /* default transition - respects prefers-reduced-motion below */
          transition: transform 300ms cubic-bezier(.2,.9,.2,1);
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drawer-title {
          font-weight: 700;
          color: var(--text-primary);
        }
        .drawer-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .drawer-nav a {
          padding: 10px 8px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-primary);
        }
        .drawer-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          justify-content: space-between;
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .drawer-backdrop {
            transition: none;
          }
          .mobile-drawer {
            transition: none;
            transform: none !important;
            right: 0;
            width: 100%;
          }
        }

        /* Hide desktop nav and adjust layout on small screens */
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
          .mobile-drawer { width: min(92vw, 360px); }
        }

        /* Very narrow devices (e.g. older phones) */
        @media (max-width: 420px) {
          .cover { height: 110px; }
          .avatar { width: 56px; height: 56px; }
          .brand-avatar { width: 40px; height: 40px; }
          .brand-text { display: none; } /* keep header compact */
          .mobile-drawer { width: 100vw; }
        }
      `}</style>
    </div>
  );
}
