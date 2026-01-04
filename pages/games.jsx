import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Games() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  return (
    <div className="site-root">
      <div className="site">
        {/* Top navigation (mirrors dashboard structure) */}
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
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flex: '0 0 40px',
                  }}
                >
                  <img
                    src="/semi-colonic-logo.png"
                    alt="Semi‑Colonic"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <span style={{ fontWeight: 700, color: '#183547' }}>Semi-colonic</span>
              </a>
            </Link>

            <nav className="desktop-nav" aria-label="Primary">
              <Link href="/posts" legacyBehavior><a style={{ marginRight: 12 }}>Posts</a></Link>
              <Link href="/chat" legacyBehavior><a style={{ marginRight: 12 }}>Chat</a></Link>
              <Link href="/features" legacyBehavior><a style={{ marginRight: 12 }}>Features</a></Link>
              <Link href="/games" legacyBehavior><a>Games</a></Link>
            </nav>
          </div>

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#556', fontSize: 14 }}>guest</div>
              <button onClick={handleSignOut} className="btn btn-outline" aria-label="Sign out">Sign out</button>
            </div>
          </div>
        </header>

        <main style={{ padding: 18 }}>
          <h1 style={{ marginTop: 0 }}>Games</h1>
          <p style={{ color: '#617489' }}>
            Relaxing mini-games and playful prototypes. Click any tile to open a game.
          </p>

          <div
            className="games-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginTop: 18,
            }}
            role="list"
          >
            <Link href="/games/mindful-puzzle" legacyBehavior>
              <a
                className="game-tile"
                role="listitem"
                style={{
                  display: 'block',
                  padding: 16,
                  background: '#fff',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#222',
                  boxShadow: '0 6px 18px rgba(20,40,60,0.06)',
                }}
              >
                <div
                  style={{
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 34,
                    marginBottom: 8,
                  }}
                >
                  🧩
                </div>
                <div style={{ fontWeight: 700 }}>Mindful Puzzle</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>
                  Quick mindful puzzles
                </div>
              </a>
            </Link>

            {/* Add more game tiles below following the same structure */}
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}
