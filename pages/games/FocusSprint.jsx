import Head from 'next/head';
import React, { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import Topbar from '../../components/Topbar';

/**
 * Focus Sprint Challenge
 * - Replaced local header with shared <Topbar /> so sign-out UI and mobile drawer are consistent with other pages
 * - Keeps responsive layout for iPhone 13 Pro, iPad and PC
 * - Centers the game area and makes the play area responsive
 */
export default function FocusSprint() {
  const gameAreaRef = useRef(null);
  const spawnRef = useRef(null);
  const timerRef = useRef(null);
  const scoreRef = useRef(0);

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
    return Math.floor(Math.random() * Math.max(0, max));
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
      scoreRef.current += 1;
      setScore(scoreRef.current);
      target.removeEventListener("click", onClick);
      if (gameArea.contains(target)) gameArea.removeChild(target);
    };

    target.addEventListener("click", onClick);
    gameArea.appendChild(target);

    // auto-remove after 2s
    setTimeout(() => {
      if (gameArea.contains(target)) {
        target.removeEventListener("click", onClick);
        gameArea.removeChild(target);
      }
    }, 2000);
  }

  function startGame() {
    scoreRef.current = 0;
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
          // simple result alert; can be replaced by custom UI
          window.alert("Time's up! Your score: " + scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(spawnTarget, 800);
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Focus Sprint — Semi‑Colonic</title>
      </Head>

      {/* Shared Topbar provides sign-in/sign-out and mobile drawer */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },

      ]} />

      <div className="site">
        <main className="games-main" role="main">
          <div className="games-center">
            <div className="games-card">
              <h1 style={{ margin: 0, textAlign: 'center' }}>Focus Sprint Challenge</h1>
              <p style={{ marginTop: 8, color: '#617489', textAlign: 'center' }}>Click targets quickly to build your score.</p>

              <div className="meta-row" aria-hidden>
                <div className="meta-item">Time: {timeLeft}</div>
                <div className="meta-item">Score: {score}</div>
              </div>

              <div ref={gameAreaRef} className="gameArea" role="region" aria-label="Focus sprint play area" />

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={startGame} disabled={running} className="start-btn">
                  {running ? "Running..." : "Start Challenge"}
                </button>
              </div>

              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Link href="/games" legacyBehavior><a className="btn-link">← Back to games</a></Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
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

        .site-root { min-height: 100vh; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        /* Centering: ensure the outer and inner containers horizontally center the card and its children */
        .games-main { padding: 20px 18px; display: flex; justify-content: center; align-items: flex-start; }
        .games-center { width: 100%; display: flex; justify-content: center; align-items: center; }
        .games-card { width: 100%; max-width: 760px; display: flex; flex-direction: column; align-items: center; padding: 8px; box-sizing: border-box; }

        .meta-row { display:flex; gap:12px; justify-content:center; margin-top:12px; }
        .meta-item { font-weight:700; color:var(--text-primary); }

        /* responsive play area: use CSS to scale down on small screens */
        .gameArea {
          margin: 18px 0 0;
          width: min(400px, 92vw);
          height: min(400px, 72vw);
          max-height: 460px;
          border: 2px solid #e6eef0;
          border-radius: 12px;
          background: #fff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(20,40,60,0.06);
        }

        .target {
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .start-btn {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 10px;
          background: var(--cta-strong);
          color: white;
          border: none;
        }

        .btn-link { color: var(--text-primary); text-decoration: none; font-weight: 600; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        @media (max-width: 820px) {
          .gameArea { height: min(360px, 72vw); }
          .games-card { padding: 0 8px; }
        }

        @media (max-width: 420px) {
          .games-main { padding: 14px 12px; }
          .gameArea { height: min(320px, 72vw); }
          .start-btn { padding: 8px 14px; font-size: 15px; }
        }
      `}</style>
    </div>
  );
}