import Head from 'next/head';
import Topbar from '../components/Topbar';
import Link from 'next/link';
import QuoteBanner from '../components/QuoteBanner';
import { QUOTES } from '../lib/themeConstants';
import Heart from '../components/icons/Heart';
import Leaf from '../components/icons/Leaf';
import Lightbulb from '../components/icons/Lightbulb';

/**
 * Games page
 *
 * - Uses shared <Topbar /> so sign-in / sign-out UI and mobile drawer match features.jsx
 * - Restores QuoteBanner for the banner section (retained from previous version)
 * - Preserves responsive layout for iPhone 13 Pro, iPad and desktop
 */

export default function Games() {
  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Shared top navigation / theme component (includes mobile drawer) */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
      ]} />

      <div className="site">
        <main className="main-content">
          <h1 style={{ marginTop: 0 }}>Games</h1>
          <p style={{ color: '#617489' }}>
            Small accessible games and playful interactions. Tap or click a tile to open a game.
          </p>

          <QuoteBanner
            text={(QUOTES && QUOTES.games && QUOTES.games.quote) || (QUOTES && QUOTES.features && QUOTES.features.quote) || ''}
            author={(QUOTES && QUOTES.games && QUOTES.games.author) || (QUOTES && QUOTES.features && QUOTES.features.author) || ''}
          />

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
            <Link href="/games/breathing" legacyBehavior>
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>🌬️</div>
                <div style={{ fontWeight: 700 }}>Breathing Game</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Guided breathing with visual cues</div>
              </a>
            </Link>

            <Link href="/games/color-match" legacyBehavior>
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>🎨</div>
                <div style={{ fontWeight: 700 }}>Color Match</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Match colors to calm your mind</div>
              </a>
            </Link>

            <Link href="/games/puzzle" legacyBehavior>
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>🧩</div>
                <div style={{ fontWeight: 700 }}>Puzzle</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>A relaxing tile puzzle</div>
              </a>
            </Link>

            {/* add additional game tiles here */}
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
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

        .main-content { padding: var(--space-md, 20px); }

        .games-grid { margin-bottom: 8px; }

        .site-footer { margin-top: 12px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        /* buttons — keep styling consistent with Topbar and other pages */
        .btn { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: var(--brand); font-weight: 600; }
        .btn:focus { outline: 2px solid rgba(31,159,255,0.18); }
        .btn-outline { border: 1px solid rgba(6,20,40,0.08); background: #fff; padding: 6px 8px; border-radius: 8px; color: var(--brand); font-weight: 600; }
        .btn-strong { background: var(--cta-strong); color: #fff; padding: 8px 12px; border-radius: 8px; font-weight: 700; border: none; }

        @media (max-width: 980px) {
          .site { padding: 0 14px; }
        }

        @media (max-width: 820px) {
          .site { padding: 0 12px; }
          .main-content { padding: 14px 6px; }
        }

        @media (max-width: 420px) {
          .site { padding: 0 10px; }
        }
      `}</style>
    </div>
  );
}
