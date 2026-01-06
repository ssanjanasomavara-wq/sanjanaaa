import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Topbar from '../../components/Topbar';

export default function MindfulPuzzle() {
  const router = useRouter();

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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Mindful Puzzle — Semi‑Colonic</title>
      </Head>

      {/* Shared Topbar provides sign-in / sign-out and mobile drawer */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },

      ]} />

      <div className="site">
        <main className="games-main">
          <div className="games-center">
            <div className="games-card">
              <h2 className="title">Mindful Puzzle</h2>
              <p className="lede">
                Take a moment. You’re allowed to feel. Click the tiles in ascending order and follow the coping activity at each step.
              </p>

              <div className="puzzle-wrap">
                <div
                  id="puzzle-container"
                  className="puzzle-grid"
                  role="grid"
                  aria-label="Mindful puzzle tiles"
                >
                  {numbers.map((n) => {
                    const isCleared = cleared.has(n);
                    return (
                      <button
                        key={n}
                        onClick={() => handleTileClick(n)}
                        aria-label={`Tile ${n}`}
                        className={`tile ${isCleared ? 'cleared' : ''}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                <div id="message" className="message">{message}</div>

                <div className="controls">
                  <button onClick={startGame} className="primary">Restart Puzzle</button>
                </div>
              </div>

              <div className="back-link">
                <Link href="/games" legacyBehavior><a>← Back to games</a></Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --cta-strong: #1f9fff; --text-primary: #183547; --muted: #7b8899; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        /* Centering layout */
        .games-main { padding: 20px 18px; display:flex; justify-content:center; align-items:flex-start; }
        .games-center { width:100%; display:flex; justify-content:center; align-items:center; }
        .games-card { width:100%; max-width:640px; display:flex; flex-direction:column; align-items:center; padding:12px; box-sizing:border-box; }

        .title { margin-bottom: 6px; text-align:center; color:#3b6f7d; font-weight:600; }
        .lede { text-align:center; font-size:13px; color: #7a9a8f; margin-bottom: 16px; max-width:620px; }

        .puzzle-wrap { width:100%; display:flex; flex-direction:column; align-items:center; gap:12px; }

        .puzzle-grid {
          display:grid;
          grid-template-columns: repeat(3, 90px);
          grid-gap: 10px;
          justify-content:center;
        }

        .tile {
          width: 90px;
          height: 90px;
          background: #e76f51;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 22px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          user-select:none;
        }

        .tile.cleared {
          background: #264653;
        }

        .message { margin-top:6px; font-size:14px; color:#264653; text-align:center; max-width:420px; }

        .controls .primary {
          margin-top: 8px;
          padding: 10px 18px;
          font-size: 14px;
          border: none;
          border-radius: 8px;
          background: #2a9d8f;
          color: white;
          cursor: pointer;
        }

        .back-link { margin-top: 12px; text-align:center; }
        .back-link a { color: var(--text-primary); text-decoration: none; font-weight:600; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--muted); text-align: center; }

        /* Responsive tweaks for iPad / iPhone 13 Pro and small screens */
        @media (max-width: 820px) {
          .puzzle-grid { grid-template-columns: repeat(3, minmax(64px, 1fr)); gap: 8px; }
          .tile { width: 72px; height: 72px; font-size: 18px; }
          .games-card { padding: 10px; }
        }

        @media (max-width: 420px) {
          .puzzle-grid { grid-template-columns: repeat(3, minmax(56px, 1fr)); gap: 6px; }
          .tile { width: 60px; height: 60px; font-size: 16px; border-radius: 8px; }
          .lede { font-size: 12px; }
          .message { font-size: 13px; max-width: 300px; }
          .games-main { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}