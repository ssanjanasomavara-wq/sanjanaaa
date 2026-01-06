import Head from 'next/head';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import { useEffect, useState, useMemo } from 'react';

export default function MoodCheckIn() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = JSON.parse(localStorage.getItem('moodCheckIns') || '[]');
    // keep newest first in UI
    setEntries(stored.slice().reverse());
  }, []);

  function saveMood(mood, note) {
    if (!mood) return;
    const checkIns = JSON.parse(localStorage.getItem('moodCheckIns') || '[]');
    checkIns.push({
      mood,
      note: note?.trim() || '',
      time: new Date().toLocaleString(),
    });
    localStorage.setItem('moodCheckIns', JSON.stringify(checkIns));
    setEntries(checkIns.slice().reverse());
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Mood Check-In — Semi‑Colonic</title>
      </Head>

      {/* Topbar - aligned with games.jsx conventions and includes mobile drawer */}
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
        center // harmless if Topbar ignores unknown props; keeps parity with games.jsx usage
      />

      <div className="site">
        <main className="main" role="main" aria-live="polite">
          <div className="card-wrap">
            <div className="card" role="region" aria-label="Mood check in">
              <div className="icon">🌱</div>
              <h2 className="title">Hey, check in with yourself</h2>
              <div className="lede">There’s no right or wrong feeling.</div>

              <MoodForm onSave={saveMood} />

              <div className="entries">
                {entries.length === 0 && <div className="empty">No check‑ins yet — take your time.</div>}
                {entries.map((item, idx) => (
                  <div key={idx} className="entry">
                    <div className="entry-top">
                      <div className="entry-mood">{emojiForMood(item.mood)} <span className="mood-label">{prettyMood(item.mood)}</span></div>
                      <div className="entry-time">{item.time}</div>
                    </div>
                    {item.note && <div className="entry-text">{item.note}</div>}
                  </div>
                ))}
              </div>

              {/* Graph output area - responsive placeholder and simple SVG chart */}
              <div className="graph-area" aria-hidden={entries.length === 0 ? 'true' : 'false'}>
                <div className="graph-card" role="img" aria-label="Mood summary graph">
                  <MoodGraph entries={entries} />
                </div>
              </div>

              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <Link href="/features" className="back-link">← Back to Features</Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --text-primary: #183547; --muted: #7b8899; --card-bg: #fff; --accent: #6c7cff; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
          height: 100%;
        }

        .site-root { min-height: 100vh; background: linear-gradient(135deg, #f6f7fb 0%, #eef2ff 100%); display: flex; flex-direction: column; }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; }

        /* Main is vertically & horizontally centered so the "game" (card) is centered on iPhone, iPad and PC */
        .main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 28px 18px; min-height: calc(100vh - 120px); }
        .card-wrap { width: 100%; display:flex; justify-content:center; align-items:center; }
        .card { width: 100%; max-width: 520px; background: var(--card-bg); padding: 28px; border-radius: 16px; box-shadow: 0 10px 25px rgba(11,22,77,0.06); box-sizing: border-box; text-align: center; }

        .icon { font-size: 36px; margin-bottom: 6px; }
        .title { margin: 0 0 6px 0; color: #0f1724; font-weight: 700; font-size: 20px; text-align: center; }
        .lede { font-size: 13px; color: #6b7280; margin-bottom: 16px; text-align: center; }

        .moods { display:flex; justify-content:space-between; gap:8px; margin-bottom:10px; }
        .mood { font-size: 26px; cursor: pointer; padding:8px; border-radius:10px; transition: transform .12s, background .12s; user-select: none; }
        .mood:hover { transform: translateY(-2px); }
        .mood.selected { background:#eef1ff; }

        textarea {
          width: 100%;
          height: 84px;
          border-radius: 10px;
          border: 1px solid #dbeafe;
          padding: 10px;
          font-size: 14px;
          resize: none;
          margin-top: 8px;
          box-sizing: border-box;
        }

        .submit {
          margin-top: 12px;
          width: 100%;
          padding: 11px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg,#6faab6,#8fbfa8);
          color: #fff;
          font-size: 14px;
          cursor: pointer;
        }

        .entries { margin-top: 18px; text-align: left; }
        .empty { color: var(--muted); font-size: 13px; text-align:center; }

        .entry { background: #fff; padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #eef2ff; }
        .entry-top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
        .entry-mood { font-weight:700; color:#0f1724; display:flex; align-items:center; gap:8px; }
        .mood-label { font-size:13px; color:#475569; font-weight:600; }
        .entry-time { font-size:12px; color:#94a3b8; font-weight:600; }
        .entry-text { margin-top:8px; color:#334155; font-size:14px; }

        .back-link { display:inline-block; padding: 8px 14px; background: #eef2ff; color: #374151; text-decoration: none; border-radius: 12px; font-weight:600; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--muted); text-align: center; }

        /* Graph area styling - reserved space at bottom of card for chart */
        .graph-area {
          margin-top: 14px;
        }
        .graph-card {
          width: 100%;
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, rgba(246,247,251,0.7), rgba(238,242,255,0.6));
          border-radius: 12px;
          padding: 12px;
          box-sizing: border-box;
          border: 1px dashed rgba(6,20,40,0.04);
        }
        .graph-empty {
          color: var(--muted);
          font-size: 13px;
        }

        .message-small {
          margin-top: 10px;
          color: #374151;
          font-size: 14px;
        }

        /* iPhone 13 Pro ~390px */
        @media (max-width: 430px) {
          .card { max-width: 360px; padding: 18px; border-radius: 14px; }
          .moods { gap:6px; }
          .main { padding: 18px 12px; min-height: calc(100vh - 100px); }
          .graph-card { min-height: 120px; padding: 10px; }
        }

        /* iPad portrait/landscape ~768px and small laptops */
        @media (max-width: 820px) {
          .card { max-width: 520px; padding: 22px; }
          .main { padding: 22px 16px; }
        }

        /* ensure a comfortable max width on very large displays */
        @media (min-width: 1200px) {
          .card { max-width: 640px; }
        }
      `}</style>
    </div>
  );
}

/* MoodForm - unchanged behavior, kept formatting */
function MoodForm({ onSave }) {
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selected) setMessage('Take your time — choose what feels closest 💛');
    else setMessage('');
  }, [selected]);

  function submit() {
    if (!selected) {
      setMessage('Take your time — choose what feels closest 💛');
      return;
    }
    onSave(selected, note);
    setNote('');
    setSelected('');
    setMessage(thankYouMessage(selected));
  }

  return (
    <div>
      <div className="moods" role="list">
        {moodList().map((m) => (
          <div
            key={m.key}
            role="button"
            aria-pressed={selected === m.key}
            className={`mood ${selected === m.key ? 'selected' : ''}`}
            onClick={() => setSelected(m.key)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSelected(m.key); }}
            tabIndex={0}
            title={m.label}
          >
            {m.emoji}
          </div>
        ))}
      </div>

      <textarea
        placeholder="Want to say a little more? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button className="submit" onClick={submit}>Check In</button>

      {message && <div className="message-small">{message}</div>}
    </div>
  );
}

/* MoodGraph - in-file simple SVG bar chart rendered from local entries */
function MoodGraph({ entries = [] }) {
  const moods = useMemo(() => moodList(), []);
  const counts = useMemo(() => {
    const c = moods.reduce((acc, m) => { acc[m.key] = 0; return acc; }, {});
    // entries are reverse-ordered for the UI; use them all for counts
    entries.forEach((e) => {
      if (e && e.mood && c[e.mood] !== undefined) c[e.mood] += 1;
    });
    return c;
  }, [entries, moods]);

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const maxCount = Math.max(...Object.values(counts), 1); // avoid div-by-zero

  if (total === 0) {
    return <div className="graph-empty">No data yet — your check‑ins will appear here.</div>;
  }

  // Render an accessible simple bar chart using inline SVG
  const width = 500;
  const height = 120;
  const padding = 20;
  const availableWidth = width - padding * 2;
  const barGap = 12;
  const barCount = moods.length;
  const barWidth = (availableWidth - barGap * (barCount - 1)) / barCount;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Mood summary chart"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      {/* y-axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padding + (height - padding * 2) * (1 - t);
        return <line key={i} x1={padding - 6} x2={width - padding} y1={y} y2={y} stroke="rgba(6,20,40,0.06)" strokeWidth="1" strokeDasharray="2 3" />;
      })}
      {/* bars */}
      {moods.map((m, i) => {
        const count = counts[m.key] || 0;
        const h = ((height - padding * 2) * count) / maxCount;
        const x = padding + i * (barWidth + barGap);
        const y = height - padding - h;
        const barColor = '#6faab6';
        return (
          <g key={m.key}>
            <rect x={x} y={y} width={barWidth} height={h} rx="6" ry="6" fill={barColor} />
            <text x={x + barWidth / 2} y={y - 6} fontSize="11" textAnchor="middle" fill="#0f1724" fontWeight="700">{count}</text>
            <text x={x + barWidth / 2} y={height - padding + 14} fontSize="12" textAnchor="middle" fill="#475569">{m.emoji}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* helpers */
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