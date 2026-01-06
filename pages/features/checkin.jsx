import Head from 'next/head';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CheckIn() {
  const router = useRouter();

  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = JSON.parse(localStorage.getItem('checkIns') || '[]');
    setEntries(stored.slice().reverse());
  }, []);

  function saveCheckIn(text) {
    if (!text || !text.trim()) return;
    const checkIns = JSON.parse(localStorage.getItem('checkIns') || '[]');
    checkIns.push({ text: text.trim(), time: new Date().toLocaleString() });
    localStorage.setItem('checkIns', JSON.stringify(checkIns));
    setEntries(checkIns.slice().reverse());
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Quick Check-In — Semi‑Colonic</title>
      </Head>

      {/* Shared Topbar (includes mobile drawer and sign-in / sign-out UI) */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },

      ]} />

      <div className="site">
        <main className="main" role="main">
          <div className="card-wrap">
            <div className="card">
              <h2 className="title">Quick Check-In</h2>
              <div className="lede">Take a moment. You’re allowed to feel.</div>

              <MindfulForm onSave={saveCheckIn} />

              <div className="entries">
                {entries.map((item, idx) => (
                  <div key={idx} className="entry">
                    <div className="entry-time">{item.time}</div>
                    <div className="entry-text">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --text-primary: #183547; --muted: #7b8899; --card-bg: #fdfefe; --accent: #8fbfa8; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; box-sizing: border-box; }

        .main { padding: 20px 18px; display: flex; justify-content: center; }
        .card-wrap { width: 100%; display:flex; justify-content:center; }
        .card { width: 100%; max-width: 420px; background: var(--card-bg); padding: 24px; border-radius: 18px; box-shadow: 0 10px 25px rgba(70,110,120,0.06); box-sizing: border-box; }

        .title { margin: 0 0 6px 0; text-align: center; color: #3b6f7d; font-weight: 600; font-size: 20px; }
        .lede { text-align: center; font-size: 13px; color: #7a9a8f; margin-bottom: 14px; }

        .entries { margin-top: 16px; }
        .entry { background: #eef5f2; padding: 10px; border-radius: 10px; margin-bottom: 8px; color: #3e5f60; border-left: 4px solid var(--accent); }
        .entry-time { font-size: 11px; color: #6a8f8d; font-weight: 700; }
        .entry-text { margin-top: 6px; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--muted); text-align: center; }

        @media (max-width: 820px) {
          .card { max-width: 380px; padding: 20px; }
        }

        @media (max-width: 420px) {
          .card { max-width: 340px; padding: 16px; }
          .main { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}

function MindfulForm({ onSave }) {
  const [text, setText] = useState('');
  function submit() {
    if (!text.trim()) return;
    onSave(text);
    setText('');
  }
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="How are you feeling right now?"
        style={{
          width: '100%',
          height: 90,
          borderRadius: 12,
          border: '1.5px solid #b7d3cf',
          padding: 12,
          resize: 'none',
          fontSize: 14,
          background: '#f6fbfa',
          color: '#355b5e',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button
        onClick={submit}
        style={{
          marginTop: 12,
          width: '100%',
          padding: 11,
          border: 'none',
          borderRadius: 14,
          background: 'linear-gradient(135deg,#6faab6,#8fbfa8)',
          color: '#fff',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Save check‑in
      </button>
    </div>
  );
}