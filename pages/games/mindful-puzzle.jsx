import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';

export default function MindfulPuzzle() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  // Check-in entries (same pattern as pages/features/checkin.jsx)
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

  // Puzzle state
  const [numbers, setNumbers] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [message, setMessage] = useState('Start from 1 and follow the instructions as you click.');
  const [cleared, setCleared] = useState(new Set());
  const initializedRef = useRef(false);

  const activities = [
    'Take a deep breath and notice how your body feels.',
    'Close your eyes for 3 seconds and release tension in your shoulders.',
    'Count slowly from 1 to 5 while inhaling and exhaling.',
    'Visualize a calm place for 5 seconds.',
    'Smile gently to yourself and feel your mood lift.',
    'Shake your hands and release any tension.',
    'Notice any sounds around you and focus on one.',
    'Place a hand on your heart and breathe deeply.',
    'Take a slow, mindful breath and feel accomplished.',
  ];

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startGame() {
    const startNums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    setNumbers(startNums);
    setNextNumber(1);
    setMessage('Start from 1 and follow the instructions as you click.');
    setCleared(new Set());
  }

  // initialize once on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initializedRef.current) {
      startGame();
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTileClick(number) {
    if (number === nextNumber) {
      // mark cleared
      setCleared(prev => {
        const copy = new Set(prev);
        copy.add(number);
        return copy;
      });

      setMessage(activities[nextNumber - 1] || '');
      const newNext = nextNumber + 1;
      if (newNext > 9) {
        setMessage('🎉 Puzzle complete! Take a deep breath and relax.');
        setNextNumber(1);
      } else {
        setNextNumber(newNext);
      }
    } else {
      setMessage(`Oops! Try again from ${nextNumber}. Take a slow breath and reset.`);
    }
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
          <div style={{ maxWidth: 640, width: '100%' }}>
            <div style={{ background: '#fdfefe', padding: 24, borderRadius: 18, boxShadow: '0 10px 25px rgba(70,110,120,0.2)' }}>
              <h2 style={{ marginBottom: 6, textAlign: 'center', color: '#3b6f7d', fontWeight: 600 }}>Mindful Puzzle</h2>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#7a9a8f', marginBottom: 14 }}>
                Take a moment. You’re allowed to feel. Click the tiles in ascending order and follow the coping activity at each step.
              </div>

              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexDirection: 'column' }}>
                {/* Puzzle area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    id="puzzle-container"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 90px)',
                      gridGap: 10,
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    {numbers.map((n) => {
                      const isCleared = cleared.has(n);
                      return (
                        <button
                          key={n}
                          onClick={() => handleTileClick(n)}
                          aria-label={`Tile ${n}`}
                          style={{
                            width: 90,
                            height: 90,
                            background: isCleared ? '#264653' : '#e76f51',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>

                  <div id="message" style={{ marginTop: 6, fontSize: 14, color: '#264653', textAlign: 'center', maxWidth: 420 }}>
                    {message}
                  </div>

                  <button
                    onClick={startGame}
                    style={{
                      marginTop: 12,
                      padding: '10px 18px',
                      fontSize: 14,
                      border: 'none',
                      borderRadius: 8,
                      background: '#2a9d8f',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Restart Puzzle
                  </button>
                </div>

                {/* Check-in form and saved entries (same pattern as checkin page) */}
                <div style={{ width: '100%', marginTop: 6 }}>
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
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>
    </div>
}

}
