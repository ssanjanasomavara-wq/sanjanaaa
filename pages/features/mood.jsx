import Head from 'next/head';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'moodDiary';

export default function Mood() {
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setEntries(stored.slice().reverse());
    } catch (e) {
      setEntries([]);
    }
  }, []);

  function saveEntry(moodKey) {
    if (!moodKey) {
      setMessage('Please pick a feeling first.');
      return;
    }
    const entry = {
      mood: moodKey,
      note: note?.trim() || '',
      time: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    setEntries(existing.slice().reverse());
    setSelected('');
    setNote('');
    setMessage(thankYouMessage(moodKey));
    // clear message after a short delay
    setTimeout(() => setMessage(''), 3000);
  }

  function countsByMood() {
    const counts = {};
    moodList().forEach(m => (counts[m.key] = 0));
    entries.forEach(e => {
      if (counts.hasOwnProperty(e.mood)) counts[e.mood] += 1;
    });
    return counts;
  }

  const counts = countsByMood();

  return (
    <>
      <Head>
        <title>Mood Diary — Semi;colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <Topbar
        links={[
          { href: '/posts', label: 'Posts' },
          { href: '/chat', label: 'Chat' },
          { href: '/features', label: 'Features' },
          { href: '/games', label: 'Games' },
          { href: '/resources', label: 'Resources' },
        ]}
        mobileDrawer={true}
        navActive="/features"
      />

      <div className="page-wrapper">
        <main className="container" role="main" aria-labelledby="mood-title">
          <div className="card" role="region" aria-label="Mood diary">
            <div className="icon" aria-hidden>😊</div>
            <h1 id="mood-title">Mood Diary</h1>
            <p className="subtitle">Track your emotions and discover patterns. Click a face to select how you feel, add an optional note, then tap "Check in".</p>

            <div className="moods-row" role="list" aria-label="Mood options">
              {moodList().map(m => (
                <div
                  key={m.key}
                  role="button"
                  aria-pressed={selected === m.key}
                  tabIndex={0}
                  onClick={() => setSelected(m.key)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(m.key); }}
                  className={`mood-item ${selected === m.key ? 'selected' : ''}`}
                  title={m.label}
                >
                  <div className="mood-emoji">{m.emoji}</div>
                  <div className="mood-caption">{m.label}</div>
                </div>
              ))}
            </div>

            <textarea
              aria-label="Optional note"
              placeholder="Write a little more (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="note"
            />

            <div className="controls">
              <button className="checkin" onClick={() => saveEntry(selected)}>Check in</button>
              <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
            </div>

            {message && <div className="message" role="status">{message}</div>}

            <h2 className="chart-title">Recent moods</h2>
            <div className="chart" role="img" aria-label="Mood distribution chart">
              <MoodChart counts={counts} />
            </div>

            <div className="recent-list" aria-live="polite">
              {entries.length === 0 && <div className="empty">No check‑ins yet — take your time.</div>}
              {entries.slice(0, 6).map((it, i) => (
                <div key={i} className="recent-item">
                  <div className="recent-left">
                    <div className="recent-emoji">{emojiForMood(it.mood)}</div>
                    <div className="recent-meta">
                      <div className="recent-label">{prettyMood(it.mood)}</div>
                      <div className="recent-time">{new Date(it.time).toLocaleString()}</div>
                    </div>
                  </div>
                  {it.note && <div className="recent-note">{it.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        :root { --max-width: 900px; --bg-start: #f6f7fb; --bg-end: #eef2ff; --card-bg: #fff; --muted: #6b7280; --accent: #6c7cff; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: Inter, 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #0f1724;
        }

        .page-wrapper {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%);
          padding: 20px;
          display:flex;
          justify-content:center;
        }

        .container {
          width: 100%;
          max-width: var(--max-width);
          display:flex;
          justify-content:center;
        }

        .card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 8px 28px rgba(11,22,77,0.06);
          width: 100%;
          box-sizing: border-box;
        }

        .icon {
          font-size: 48px;
          margin-bottom: 8px;
          text-align:center;
        }

        h1 {
          font-size: 20px;
          margin: 0 0 6px 0;
          text-align:center;
        }

        .subtitle {
          text-align:center;
          color: var(--muted);
          margin-bottom: 18px;
          font-size: 14px;
        }

        /* Mood row - single horizontal line, responsive */
        .moods-row {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .mood-item {
          display:flex;
          flex-direction:column;
          gap:8px;
          align-items:center;
          min-width: 72px;
          padding: 8px;
          border-radius: 12px;
          cursor: pointer;
          transition: transform .12s, box-shadow .12s, background .12s;
          background: transparent;
          border: none;
          user-select:none;
        }

        .mood-item:focus {
          outline: 3px solid rgba(99,102,241,0.12);
        }

        .mood-item.selected {
          background: rgba(99,102,241,0.06);
          transform: translateY(-4px);
          box-shadow: 0 6px 18px rgba(15,23,36,0.06);
        }

        .mood-emoji {
          font-size: 42px;
          line-height: 1;
          display:flex;
          align-items:center;
          justify-content:center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(180deg,#ffffff,#f8fafc);
        }

        .mood-caption {
          font-size: 13px;
          color: #374151;
          font-weight: 600;
        }

        .note {
          width: 100%;
          min-height: 90px;
          border-radius: 12px;
          border: 1px solid #e6eefc;
          padding: 12px;
          font-size: 14px;
          margin-top: 12px;
          resize: vertical;
          box-sizing: border-box;
          background: #fff;
        }

        .controls {
          margin-top: 12px;
          display:flex;
          gap:12px;
          align-items:center;
          justify-content: space-between;
        }

        .checkin {
          background: linear-gradient(135deg,#6faab6,#8fbfa8);
          color: white;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
        }

        .back-link {
          color: #374151;
          text-decoration: none;
          background: #eef2ff;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 600;
        }

        .message {
          margin-top: 10px;
          color: #0f1724;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .chart-title {
          margin-top: 20px;
          margin-bottom: 8px;
          font-size: 15px;
          color: #0f1724;
        }

        .chart {
          padding: 12px;
          border-radius: 12px;
          background: linear-gradient(180deg,#ffffff,#fbfdff);
          border: 1px solid #eef2ff;
        }

        .recent-list {
          margin-top: 14px;
        }

        .recent-item {
          border-top: 1px dashed #eef2ff;
          padding: 12px 0;
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .recent-left {
          display:flex;
          gap:12px;
          align-items:center;
        }

        .recent-emoji { font-size: 28px; width:42px; text-align:center; }
        .recent-meta { font-size: 13px; color:#374151; }
        .recent-label { font-weight:700; }
        .recent-time { color: var(--muted); font-size: 12px; margin-top: 2px; }
        .recent-note { color:#334155; font-size: 14px; }

        .empty { color: var(--muted); text-align:center; padding: 12px 0; }

        /* Responsive tweaks */
        @media (max-width: 640px) {
          .mood-emoji { width:56px; height:56px; font-size:36px; }
          .mood-item { min-width: 64px; gap:6px; }
          .note { min-height: 76px; }
          .controls { flex-direction: column; align-items: stretch; gap: 8px; }
          .back-link { display:inline-block; text-align:center; }
        }

        @media (min-width: 1200px) {
          .card { padding: 36px; }
        }
      `}</style>
    </>
  );
}

/* Helper components & functions */

function moodList() {
  return [
    { key: 'happy', emoji: '😊', label: 'Happy' },
    { key: 'okay', emoji: '😐', label: 'Okay' },
    { key: 'sad', emoji: '😔', label: 'Sad' },
    { key: 'stressed', emoji: '😣', label: 'Stressed' },
    { key: 'tired', emoji: '😴', label: 'Tired' },
  ];
}

function emojiForMood(key) {
  const found = moodList().find(m => m.key === key);
  return found ? found.emoji : '•';
}

function prettyMood(key) {
  const found = moodList().find(m => m.key === key);
  return found ? found.label : key;
}

function thankYouMessage(key) {
  switch (key) {
    case 'happy': return "That’s lovely to hear. Hold onto that feeling ✨";
    case 'okay': return "Just okay is still okay. You’re doing enough 🤍";
    case 'sad': return "I’m glad you checked in. You’re not alone 💙";
    case 'stressed': return "That sounds heavy. Breathe — one step at a time 🌊";
    case 'tired': return "Rest isn’t lazy. You deserve it 🌙";
    default: return "Thanks for checking in.";
  }
}

/* Simple lightweight svg bar chart to visualize counts */
function MoodChart({ counts }) {
  const items = moodList();
  const values = items.map(i => counts[i.key] || 0);
  const max = Math.max(...values, 1);
  const barWidth = 48;
  const gap = 18;
  const chartHeight = 120;
  const totalWidth = items.length * barWidth + (items.length - 1) * gap;

  return (
    <svg width="100%" height={chartHeight + 48} viewBox={`0 0 ${totalWidth} ${chartHeight + 48}`} preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="false">
      <g transform={`translate(0,0)`}>
        {items.map((it, idx) => {
          const v = counts[it.key] || 0;
          const h = Math.round((v / max) * chartHeight);
          const x = idx * (barWidth + gap);
          const barY = chartHeight - h;
          return (
            <g key={it.key} transform={`translate(${x},0)`}>
              <rect x="0" y={barY} width={barWidth} height={h} rx="8" ry="8" fill="#6c7cff" opacity={v === 0 ? 0.18 : 1} />
              <text x={barWidth / 2} y={barY - 6} textAnchor="middle" fontSize="11" fill="#0f1724">{v}</text>
              <text x={barWidth / 2} y={chartHeight + 18} textAnchor="middle" fontSize="12" fill="#374151">{it.emoji}</text>
              <text x={barWidth / 2} y={chartHeight + 34} textAnchor="middle" fontSize="11" fill="#6b7280">{it.label}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}