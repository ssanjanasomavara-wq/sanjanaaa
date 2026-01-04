import React, { useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Pattern & Sequence Game
 * Converted from index (9).html
 */
export default function PatternSequence() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  const colors = ["red", "blue", "green", "yellow"];
  const [gameSequence, setGameSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [level, setLevel] = useState(0);
  const [acceptingInput, setAcceptingInput] = useState(false);

  function nextLevel() {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newSequence = [...gameSequence, randomColor];
    setGameSequence(newSequence);
    setPlayerSequence([]);
    setLevel((l) => l + 1);
    playSequence(newSequence);
  }

  function playSequence(seq) {
    setAcceptingInput(false);
    let i = 0;
    const interval = setInterval(() => {
      flashButton(seq[i]);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setAcceptingInput(true);
      }
    }, 800);
  }

  function flashButton(color) {
    const el = document.getElementById("btn-" + color);
    if (!el) return;
    el.style.opacity = "0.5";
    setTimeout(() => (el.style.opacity = "1"), 300);
  }

  function handleClick(e) {
    if (!acceptingInput) return;
    const color = e.target.id.replace("btn-", "");
    const next = [...playerSequence, color];
    setPlayerSequence(next);
    flashButton(color);

    const currentIndex = next.length - 1;
    if (next[currentIndex] !== gameSequence[currentIndex]) {
      window.alert("Wrong sequence! Game over.");
      resetGame();
      return;
    }
    if (next.length === gameSequence.length) {
      setAcceptingInput(false);
      setTimeout(nextLevel, 1000);
    }
  }

  function resetGame() {
    setGameSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setAcceptingInput(false);
  }

  return (
    <div className="site-root">
      <div className="site">
        {/* Top navigation */}
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
          <div style={styles.container}>
            <h1>Pattern & Sequence Game</h1>
            <div id="level" style={styles.level}>Level: {level}</div>
            <div id="game-container" style={styles.grid}>
              <div id="btn-red" className="color-button" onClick={handleClick} style={{ ...styles.colorButton, backgroundColor: "red" }} />
              <div id="btn-blue" className="color-button" onClick={handleClick} style={{ ...styles.colorButton, backgroundColor: "blue" }} />
              <div id="btn-green" className="color-button" onClick={handleClick} style={{ ...styles.colorButton, backgroundColor: "green" }} />
              <div id="btn-yellow" className="color-button" onClick={handleClick} style={{ ...styles.colorButton, backgroundColor: "yellow" }} />
            </div>
            <button id="start-btn" onClick={nextLevel} style={styles.startBtn}>Start Game</button>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}

const styles = {
  container: { fontFamily: "Arial, sans-serif", textAlign: "center", padding: 16 },
  level: { marginTop: 8, fontSize: 18 },
  grid: { margin: "30px auto", display: "grid", gridTemplateColumns: "repeat(2,150px)", gridGap: 20, justifyContent: "center" },
  colorButton: { width: 150, height: 150, borderRadius: 20, cursor: "pointer", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" },
  startBtn: { marginTop: 20, padding: "10px 20px", fontSize: 16, cursor: "pointer" },
};
