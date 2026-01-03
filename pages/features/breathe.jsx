import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Breathe() {
  useEffect(() => {
    // Load the prototype JS client-side only
    if (typeof document !== 'undefined') {
      // Avoid double-inserting
      if (!document.querySelector('script[data-ftc="find-the-calm"]')) {
        const s = document.createElement('script');
        s.src = '/prototype/find-the-calm.js';
        s.defer = true;
        s.setAttribute('data-ftc', 'find-the-calm');
        document.body.appendChild(s);
      }
    }

    // Cleanup not strictly necessary for static script, but kept for safety
    return () => {
      // (no-op)
    };
  }, []);

  return (
    <>
      <Head>
        <title>Breathe — Semi;colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prototype CSS (copy prototype/find-the-calm.css into public/ or keep in /prototype/) */}
        <link rel="stylesheet" href="/prototype/find-the-calm.css" />
      </Head>

      <main className="page">
        <header className="hero">
          <div className="hero-inner">
            <h1 className="title">Find the Calm</h1>
            <p className="subtitle">Tap a card to isolate a sound. Gentle haptic feedback on interaction.</p>
            <div className="controls">
              <button id="start" className="btn">Start audio</button>
              <button id="debug-toggle" className="btn btn-ghost" aria-pressed="false" title="Toggle debug panel (Ctrl/Cmd+D)">Debug</button>
              <label className="toggle">
                <input type="checkbox" id="disable-haptics" />
                <span>Disable Haptics</span>
              </label>
            </div>
          </div>
        </header>

        <section className="grid" aria-label="Sound layers">
          <div className="card" data-track="rain" role="group" aria-label="Rain sound" tabIndex="0">
            <svg className="icon" viewBox="0 0 64 64" aria-hidden>
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                <path d="M21 32a9 9 0 0118 0" />
                <path d="M24 28c-6 0-7-7-1-10A10 10 0 0138 18c6 0 9 6 6 11"/>
                <path d="M22 44l3 6M30 44l3 6M38 44l3 6" strokeWidth="1.8"/>
              </g>
            </svg>
            <div className="label">Rain</div>
            <div className="meta">Calm, steady • ambient</div>
            <div className="card-controls">
              <label className="volume-control">
                <span className="sr-only">Adjust rain volume level</span>
                <input type="range" min="0" max="1" step="0.01" defaultValue="0.7" className="volume-slider" data-track="rain" />
              </label>
              <div className="btn-group">
                <button className="mute-btn btn-small" data-track="rain" aria-pressed="false" aria-label="Mute rain">M</button>
                <button className="solo-btn btn-small" data-track="rain" aria-pressed="false" aria-label="Solo rain">S</button>
              </div>
            </div>
          </div>

          <div className="card" data-track="wind" role="group" aria-label="Wind sound" tabIndex="0">
            <svg className="icon" viewBox="0 0 64 64" aria-hidden>
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                <path d="M8 28c6-3 14-3 20 0s14 3 20 0" />
                <path d="M10 38c6-3 18-3 24 0s14 3 18 0" opacity="0.7"/>
                <path d="M12 18c6-3 10-3 16 0s10 3 16 0" opacity="0.4"/>
              </g>
            </svg>
            <div className="label">Wind</div>
            <div className="meta">Gentle whoosh • airy</div>
            <div className="card-controls">
              <label className="volume-control">
                <span className="sr-only">Adjust wind volume level</span>
                <input type="range" min="0" max="1" step="0.01" defaultValue="0.7" className="volume-slider" data-track="wind" />
              </label>
              <div className="btn-group">
                <button className="mute-btn btn-small" data-track="wind" aria-pressed="false" aria-label="Mute wind">M</button>
                <button className="solo-btn btn-small" data-track="wind" aria-pressed="false" aria-label="Solo wind">S</button>
              </div>
            </div>
          </div>

          <div className="card" data-track="piano" role="group" aria-label="Piano sound" tabIndex="0">
            <svg className="icon" viewBox="0 0 64 64" aria-hidden>
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                <rect x="6" y="16" width="52" height="20" rx="2"/>
                <path d="M14 20v12M22 20v12M30 20v12M38 20v12" strokeWidth="1.6"/>
                <path d="M12 40h40" strokeWidth="1" opacity="0.6"/>
              </g>
            </svg>
            <div className="label">Piano</div>
            <div className="meta">Soft keys • sparse notes</div>
            <div className="card-controls">
              <label className="volume-control">
                <span className="sr-only">Adjust piano volume level</span>
                <input type="range" min="0" max="1" step="0.01" defaultValue="0.7" className="volume-slider" data-track="piano" />
              </label>
              <div className="btn-group">
                <button className="mute-btn btn-small" data-track="piano" aria-pressed="false" aria-label="Mute piano">M</button>
                <button className="solo-btn btn-small" data-track="piano" aria-pressed="false" aria-label="Solo piano">S</button>
              </div>
            </div>
          </div>
        </section>

        <section className="master-controls">
          <h2>Master Mix</h2>
          <div className="master-grid">
            <div className="master-volume-control">
              <label htmlFor="master-volume">Master Volume</label>
              <input type="range" min="0" max="1" step="0.01" defaultValue="1" id="master-volume" aria-label="Master volume slider" />
            </div>
            <div className="preset-controls">
              <button id="save-preset" className="btn btn-ghost">Save Preset</button>
              <button id="load-preset" className="btn btn-ghost">Load Preset</button>
            </div>
          </div>
        </section>

        <section className="breathing-section">
          <h2>Breathing Exercises</h2>
          <div className="breathing-grid">
            <div className="breathing-card">
              <h3>Box Breathing</h3>
              <p className="breathing-desc">Equal breathing pattern • 4 counts each</p>
              <button className="breathing-btn" data-exercise="box">Start Exercise</button>
              <div className="breathing-visual box-breathing" style={{display:'none'}}>
                <div className="breath-circle"></div>
                <div className="breath-label">Inhale</div>
              </div>
            </div>

            <div className="breathing-card">
              <h3>4-7-8 Breathing</h3>
              <p className="breathing-desc">Calming pattern • for deep relaxation</p>
              <button className="breathing-btn" data-exercise="478">Start Exercise</button>
              <div className="breathing-visual breathing-478" style={{display:'none'}}>
                <div className="breath-circle"></div>
                <div className="breath-label">Inhale</div>
              </div>
            </div>

            <div className="breathing-card">
              <h3>Diaphragmatic Breathing</h3>
              <p className="breathing-desc">Deep belly breathing • ground yourself</p>
              <button className="breathing-btn" data-exercise="diaphragm">Start Exercise</button>
              <div className="breathing-visual breathing-diaphragm" style={{display:'none'}}>
                <div className="breath-circle"></div>
                <div className="breath-label">Breathe In</div>
              </div>
            </div>
          </div>
        </section>

        <section className="affirmations-section">
          <h2>Motivational Affirmations</h2>
          <div className="affirmations-controls">
            <button id="speak-affirmation" className="btn">🔊 Speak Affirmation</button>
            <button id="next-affirmation" className="btn btn-ghost">Next Message</button>
            <label className="toggle">
              <input type="checkbox" id="auto-speak" />
              <span>Auto-speak during breathing</span>
            </label>
          </div>
          <div className="affirmation-display">
            <p id="current-affirmation" className="affirmation-text"></p>
          </div>
        </section>

        <footer className="foot">
          <p className="status">Audio is not started.</p>
        </footer>

      </main>

      <style jsx>{`
        /* keep page-level spacing to match prototype container behavior */
        .page { max-width: 980px; margin: 32px auto; padding: 20px; }
      `}</style>

      {/* Back to app dashboard */}
      <div style={{ position: 'fixed', right: 20, bottom: 20 }}>
        <Link href="/dashboard">
          <a className="back-link" style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 10, background: '#5a5adb', color: '#fff', textDecoration:'none' }}>
            ← Back to Dashboard
          </a>
        </Link>
      </div>
    </>
  );
}
