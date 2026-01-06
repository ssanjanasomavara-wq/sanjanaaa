import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import MobileDrawer from './MobileDrawer';

export default function Topbar({ links = [
  { href: '/posts', label: 'Posts' },
  { href: '/chat', label: 'Chat' },
  { href: '/features', label: 'Features' },
  { href: '/games', label: 'Games' },
  { href: '/resources', label: 'Resources' },
] }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const mobileMenuButtonRef = useRef(null);

  const authRef = useRef(null);
  const authModRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let unsub = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) {
          // no firebase configured
          if (mounted) setUserEmail(null);
          return;
        }
        const cfg = await resp.json();
        const { auth, authMod } = await initFirebaseWithConfig(cfg);
        authRef.current = auth || null;
        authModRef.current = authMod || null;

        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          unsub = authMod.onAuthStateChanged(auth, (u) => {
            if (!mounted) return;
            setUserEmail(u ? (u.email || u.displayName || u.uid) : null);
          });
        } else {
          const cur = auth && auth.currentUser;
          if (cur) setUserEmail(cur.email || cur.displayName || cur.uid);
          else setUserEmail(null);
        }
      } catch (err) {
        console.warn('Topbar init error', err);
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsub === 'function') unsub();
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

  return (
    <>
      <Head>
        {/* If you already load Poppins globally, remove this from Topbar */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="topbar" role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <Link href="/" legacyBehavior>
            <a className="brand" aria-label="Semi-colonic home" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="brand-avatar" aria-hidden="true">
                <img src="/semi-colonic-logo.png" alt="Semi‑Colonic" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <span className="brand-text">Semi-colonic</span>
            </a>
          </Link>

          <nav className="desktop-nav" aria-label="Primary">
            {links.map((l) => (
              <Link key={l.href} href={l.href} legacyBehavior><a className="nav-link">{l.label}</a></Link>
            ))}
          </nav>
        </div>

        <div className="topbar-actions" role="navigation" aria-label="Top actions">
          <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
          <button aria-label="Messages" className="btn" title="Messages">💬</button>

          <div className="user-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="user-email" title={userEmail || ''}>{userEmail || 'guest'}</div>
            {userEmail ? (
              <button onClick={handleSignOut} className="btn btn-strong" aria-label="Sign out">Sign out</button>
            ) : (
              <Link href="/" legacyBehavior><a className="btn btn-outline">Sign in</a></Link>
            )}
          </div>

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

      <MobileDrawer
        open={showMenu}
        onClose={() => setShowMenu(false)}
        mobileMenuButtonRef={mobileMenuButtonRef}
        links={links}
        onInvite={() => {}}
        onChat={() => {}}
      />

      <style jsx>{`
        :root { --max-width: 980px; --cta-strong: #1f9fff; --brand: #1f9fff; --text-primary: #183547; --text-secondary: #617489; }

        .topbar {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          position: relative;
          max-width: var(--max-width);
          margin: 0 auto;
          padding-left: 18px;
          padding-right: 18px;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }

        .brand-avatar { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; flex: 0 0 44px; }
        .brand-text { font-weight: 700; color: var(--text-primary); }
        .desktop-nav { margin-left: 8px; display: flex; gap: 8px; align-items: center; }
        .nav-link { color: var(--text-primary); text-decoration: none; font-weight: 600; padding: 6px 8px; border-radius: 8px; }
        .nav-link:hover { background: rgba(6,20,40,0.02); }

        .topbar-actions { margin-left: auto; display: flex; gap: 10px; align-items: center; }
        .user-email { color: var(--text-secondary); font-size: 14px; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .btn { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: var(--brand); font-weight: 600; }
        .btn-outline { border: 1px solid rgba(6,20,40,0.08); background: #fff; padding: 6px 8px; border-radius: 8px; color: var(--brand); text-decoration: none; }
        .btn-strong { background: var(--cta-strong); color: #fff; padding: 8px 12px; border-radius: 8px; font-weight: 700; border: none; }
        .btn:focus { outline: 2px solid rgba(31,159,255,0.18); }

        .mobile-menu-button { display: none; background: transparent; border: none; font-size: 20px; padding: 6px 8px; margin-left: 6px; cursor: pointer; }

        @media (max-width: 820px) {
          .desktop-nav { display: none; }
          .mobile-menu-button { display: inline-flex; }
        }

        @media (max-width: 420px) {
          .brand-text { display: none; }
          .brand-avatar { width: 36px; height: 36px; }
        }
      `}</style>
    </>
  );
}
