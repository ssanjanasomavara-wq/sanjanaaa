import React, { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Focus Sprint Challenge
 * Converted from index (8).html
 */
export default function FocusSprint() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  const gameAreaRef = useRef(null);
  const spawnRef = useRef(null);
  const timerRef = useRef(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    return () => {
      clearInterval(spawnRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  function randomPosition(max) {
    return Math.floor(Math.random() * max);
  }

  function spawnTarget() {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const target = document.createElement("div");
    target.className = "target";
    target.style.position = "absolute";
    target.style.width = "50px";
    target.style.height = "50px";
    target.style.borderRadius = "50%";
    target.style.background = "#ff6347";
    target.style.cursor = "pointer";

    const top = randomPosition(gameArea.clientHeight - 50);
    const left = randomPosition(gameArea.clientWidth - 50);
    target.style.top = top + "px";
    target.style.left = left + "px";

    const onClick = () => {
      setScore((s) => s + 1);
      target.removeEventListener("click", onClick);
      if (gameArea.contains(target)) gameArea.removeChild(target);
    };

    target.addEventListener("click", onClick);
    gameArea.appendChild(target);

    // auto-remove
    setTimeout(() => {
      if (gameArea.contains(target)) {
        target.removeEventListener("click", onClick);
        gameArea.removeChild(target);
      }
    }, 2000);
  }

  function startGame() {
    setScore(0);
    setTimeLeft(30);
    setRunning(true);
    const gameArea = gameAreaRef.current;
    if (gameArea) gameArea.innerHTML = "";

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearInterval(spawnRef.current);
          setRunning(false);
          // using window.alert for parity with original; calling code can replace with custom UI
          window.alert("Time's up! Your score: " + (score));
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(spawnTarget, 800);
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
            <h1>Focus Sprint Challenge</h1>
            <div style={styles.row}>
              <div id="timer">Time: {timeLeft}</div>
              <div id="score">Score: {score}</div>
            </div>

            <div ref={gameAreaRef} style={styles.gameArea} />

            <button onClick={startGame} disabled={running} style={styles.button}>
              {running ? "Running..." : "Start Challenge"}
            </button>

            {/* simple inline styles for the target class */}
            <style>{`
        .target { box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
      `}</style>
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
  container: {
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  gameArea: {
    width: 400,
    height: 400,
    border: "2px solid #333",
    position: "relative",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: { display: "flex", gap: 12 },
  button: {
    padding: "10px 20px",
    fontSize: 16,
    cursor: "pointer",
  },
};
