import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QuoteBanner from '../components/QuoteBanner';
import Heart from '../components/icons/Heart';
import Leaf from '../components/icons/Leaf';
import Lightbulb from '../components/icons/Lightbulb';
import { QUOTES } from '../lib/themeConstants';

export default function Features() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="site">
        {/* Top navigation (matches dashboard layout & sizing) */}
        <header className="topbar" role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Link href="/" legacyBehavior>
              <a className="brand" aria-label="Semi-colonic home" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  <img src="/semi-colonic-logo.png" alt="Semi‑Colonic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

        <main className="main-content">
          <h1 style={{ marginTop: 0 }}>Features</h1>
          <p style={{ color: '#617489' }}>
            Small tools, prototyping pages and helpful interactions. Click any tile to open a feature.
          </p>

          <QuoteBanner 
            quote={QUOTES.features.quote}
            author={QUOTES.features.author}
          />

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '24px 0', color: 'var(--seaside-ocean)' }}>
            <Heart size={32} />
            <Leaf size={32} />
            <Lightbulb size={32} />
          </div>

          <div
            className="features-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginTop: 18,
            }}
            role="list"
          >
            <Link href="/features/checkin" legacyBehavior>
              <a
                className="feature-tile"
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>📝</div>
                <div style={{ fontWeight: 700 }}>Quick Check-In</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Log a quick mindful check-in</div>
              </a>
            </Link>

            <Link href="/features/diary" legacyBehavior>
              <a
                className="feature-tile"
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>📔</div>
                <div style={{ fontWeight: 700 }}>Diary</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Daily journal (local or saved to your account)</div>
              </a>
            </Link>

            <Link href="/features/find-the-calm" legacyBehavior>
              <a
                className="feature-tile"
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>🧘‍♀️</div>
                <div style={{ fontWeight: 700 }}>Find the Calm</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Ambient layers, breathing exercises & affirmations</div>
              </a>
            </Link>

            <Link href="/features/safe-space" legacyBehavior>
              <a
                className="feature-tile"
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>🛟</div>
                <div style={{ fontWeight: 700 }}>Safe Space</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Help & support helplines and resources</div>
              </a>
            </Link>

            {/* Add more tiles for other pages under pages/features/ */}
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --cta-strong: #1f9fff; --brand: #1f9fff; --text-primary: #183547; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; padding: 0; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        /* topbar */
        .topbar { display: flex; gap: 12px; align-items: center; padding: 12px 0; position: relative; }
        .brand-avatar { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; flex: 0 0 44px; }
        .desktop-nav { margin-left: 8px; display: flex; gap: 8px; align-items: center; }
        .topbar-actions { margin-left: auto; display: flex; gap: 10px; align-items: center; }

        /* buttons — visible in light theme */
        .btn { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: var(--brand); font-weight: 600; }
        .btn:focus { outline: 2px solid rgba(31,159,255,0.18); }
        .btn-outline { border: 1px solid rgba(6,20,40,0.08); background: #fff; padding: 6px 8px; border-radius: 8px; color: var(--brand); font-weight: 600; }
        .btn-strong { background: var(--cta-strong); color: #fff; padding: 8px 12px; border-radius: 8px; font-weight: 700; border: none; }
        .btn-delete { background: #c0392b; color: #fff; padding: 6px 8px; border-radius: 8px; }

        .main-content { padding: var(--space-md, 20px); }

        .features-grid { margin-bottom: 8px; }

        .site-footer { margin-top: 12px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        @media (max-width: 980px) {
          .site { padding: 0 14px; }
        }

        @media (max-width: 820px) {
          .desktop-nav { display: none; }
          .site { padding: 0 12px; }
          .main-content { padding: 14px 6px; }
        }

        @media (max-width: 420px) {
          .brand-avatar { width: 36px; height: 36px; }
        }
      `}</style>
    </div>
  );
}
