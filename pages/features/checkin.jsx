import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CheckIn() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

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
              <Link href="/games" legacyBehavior><a style={{ marginRight: 12 }}>Games</a></Link>
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

        <main style={{ padding: 18, display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 340, width: '100%' }}>
            <div style={{ background: '#fdfefe', padding: 24, borderRadius: 18, boxShadow: '0 10px 25px rgba(70,110,120,0.2)' }}>
              <h2 style={{ marginBottom: 6, textAlign: 'center', color: '#3b6f7d', fontWeight: 600 }}>Quick Check-In</h2>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#7a9a8f', marginBottom: 14 }}>Take a moment. You’re allowed to feel.</div>

              <MindfulForm onSave={saveCheckIn} />

              <div style={{ marginTop: 16, fontSize: 13 }}>
                {entries.map((item, idx) => (
                  <div key={idx} style={{ background: '#eef5f2', padding: 10, borderRadius: 10, marginBottom: 8, color: '#3e5f60', borderLeft: '4px solid #8fbfa8' }}>
                    <div style={{ fontSize: 11, color: '#6a8f8d', fontWeight: 700 }}>{item.time}</div>
                    <div style={{ marginTop: 6 }}>{item.text}</div>
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
        style={{ width: '100%', height: 90, borderRadius: 12, border: '1.5px solid #b7d3cf', padding: 12, resize: 'none', fontSize: 14, background: '#f6fbfa', color: '#355b5e', outline: 'none' }}
      />
      <button onClick={submit} style={{ marginTop: 12, width: '100%', padding: 11, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#6faab6,#8fbfa8)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Save check-in</button>
    </div>
  );
}
