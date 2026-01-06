import Head from 'next/head';
import React, { useState } from "react";
import Link from 'next/link';
import Topbar from '../../components/Topbar';

/**
 * Pattern & Sequence Game
 * - Replaced local header with shared <Topbar /> so sign-out UI and mobile drawer are consistent with other pages
 * - Keeps responsive layout for iPhone 13 Pro, iPad and PC
 * - Center-aligns the game area
 */
export default function PatternSequence() {
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
    const color = e.currentTarget.id.replace("btn-", "");
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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Pattern & Sequence — Semi‑Colonic</title>
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
              <h1 style={{ margin: 0, textAlign: 'center' }}>Pattern & Sequence Game</h1>
              <p style={{ marginTop: 8, color: '#617489', textAlign: 'center' }}>Repeat the pattern. Build your sequence as it grows.</p>

              <div id="level" className="level">Level: {level}</div>

              <div id="game-container" className="grid" role="region" aria-label="Pattern buttons">
                <button id="btn-red" className="color-button" onClick={handleClick} style={{ backgroundColor: "red" }} />
                <button id="btn-blue" className="color-button" onClick={handleClick} style={{ backgroundColor: "blue" }} />
                <button id="btn-green" className="color-button" onClick={handleClick} style={{ backgroundColor: "green" }} />
                <button id="btn-yellow" className="color-button" onClick={handleClick} style={{ backgroundColor: "yellow" }} />
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button id="start-btn" onClick={nextLevel} className="start-btn">Start Game</button>
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
        .games-card { width:100%; max-width:720px; display:flex; flex-direction:column; align-items:center; padding:12px; box-sizing:border-box; }

        .level { margin-top: 10px; font-weight: 700; color: var(--text-primary); }

        .grid {
          margin: 30px auto;
          display: grid;
          grid-template-columns: repeat(2, 150px);
          grid-gap: 20px;
          justify-content: center;
        }

        .color-button {
          width: 150px;
          height: 150px;
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(0,0,0,0.25);
          border: none;
        }

        .start-btn {
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 10px;
          background: var(--cta-strong);
          color: #fff;
          border: none;
        }

        .btn-link { color: var(--text-primary); text-decoration: none; font-weight: 600; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--muted); text-align: center; }

        @media (max-width: 820px) {
          .grid { grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 14px; }
          .color-button { width: 120px; height: 120px; border-radius: 16px; }
          .games-card { padding: 8px; }
        }

        @media (max-width: 420px) {
          .grid { grid-template-columns: repeat(2, minmax(90px, 1fr)); gap: 10px; }
          .color-button { width: 92px; height: 92px; border-radius: 12px; }
          .start-btn { padding: 8px 14px; font-size: 15px; }
          .games-main { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}