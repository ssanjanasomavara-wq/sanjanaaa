import Head from 'next/head';
import Link from 'next/link';
import Topbar from '../components/Topbar';
import QuoteBanner from '../components/QuoteBanner';
import Heart from '../components/icons/Heart';
import Leaf from '../components/icons/Leaf';
import Lightbulb from '../components/icons/Lightbulb';
import MoodIcon from '../components/icons/Mood';
import MindscapeIcon from '../components/icons/Mindscape';
import { QUOTES } from '../lib/themeConstants';
import ImageGrid from '../components/ImageGrid';

import { useEffect, useRef, useState } from 'react';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import MobileDrawer from '../components/MobileDrawer';

export default function Features() {
  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Shared top navigation / theme component */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },

      ]} />

      <div className="site">
        <main className="main-content">
          <h1 style={{ marginTop: 0 }}>Features</h1>
          <p style={{ color: '#617489' }}>
            Small tools, prototyping pages and helpful interactions. Click any tile to open a feature.
          </p>

          <QuoteBanner 
            text={QUOTES.features.quote}
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
            <Link href="/features/mood" legacyBehavior>
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>
                  <MoodIcon size={48} />
                </div>
                <div style={{ fontWeight: 700 }}>Mood Checkin</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Daily Mood check-in</div>
              </a>
            </Link>

            <Link href="/features/mindscape" legacyBehavior>
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
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 8 }}>
                  <MindscapeIcon size={48} />
                </div>
                <div style={{ fontWeight: 700 }}>Mindscape</div>
                <div style={{ fontSize: 12, color: '#617489', marginTop: 6 }}>Reflect and Respond</div>
              </a>
            </Link>

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

        .main-content { padding: var(--space-md, 20px); }

        /* buttons — keep styling consistent with Topbar and posts */
        .btn { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: var(--brand); font-weight: 600; }
        .btn:focus { outline: 2px solid rgba(31,159,255,0.18); }
        .btn-outline { border: 1px solid rgba(6,20,40,0.08); background: #fff; padding: 6px 8px; border-radius: 8px; color: var(--brand); font-weight: 600; }
        .btn-strong { background: var(--cta-strong); color: #fff; padding: 8px 12px; border-radius: 8px; font-weight: 700; border: none; }
        .btn-delete { background: #c0392b; color: #fff; padding: 6px 8px; border-radius: 8px; }

        .features-grid { margin-bottom: 8px; }

        .site-footer { margin-top: 12px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        @media (max-width: 980px) {
          .site { padding: 0 14px; }
        }

        @media (max-width: 820px) {
          .site { padding: 0 12px; }
          .main-content { padding: 14px 6px; }
        }

        @media (max-width: 420px) {
          /* keep brand avatar smaller on tiny screens if Topbar shows it */
        }
      `}</style>
    </div>
  );
}