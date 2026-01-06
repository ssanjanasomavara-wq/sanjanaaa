import React, { useEffect, useRef } from "react";
import Link from 'next/link';
import Topbar from '../../components/Topbar'; // use shared Topbar for sign-out and mobile drawer

/**
 * Calm-Down / Emotional Regulation Games
 * Converted from index (10).html
 *
 * - Replaced local header + sign-out button with shared <Topbar />
 * - Keeps responsive layout for iPhone 13 Pro, iPad and PC
 * - Centers the game area and makes canvases responsive (resizes on window resize)
 */
export default function CalmDownGames() {
  const bubbleCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const flowCanvasRef = useRef(null);

  const bubblesRef = useRef([]);
  const flowAngleRef = useRef(0);
  const drawCtxRef = useRef(null);
  const drawingRef = useRef(false);
  const bubbleRAF = useRef(null);
  const flowRAF = useRef(null);
  const drawSoundRef = useRef(null);

  useEffect(() => {
    // helper to size canvases responsively
    function resizeCanvases() {
      const vw = Math.max(0, window.innerWidth || 360);
      // pick canvas size:
      // - desktop: ~300
      // - tablet: ~300
      // - mobile: 220..280
      const size = Math.min(360, Math.max(220, Math.floor(Math.min(vw - 48, 320))));
      const setSize = (c) => {
        if (!c) return;
        // set drawing buffer size for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        c.width = size * dpr;
        c.height = size * dpr;
        c.style.width = `${size}px`;
        c.style.height = `${size}px`;
        const ctx = c.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      setSize(bubbleCanvasRef.current);
      setSize(drawCanvasRef.current);
      setSize(flowCanvasRef.current);

      // recreate bubbles so they fit new size
      createBubbles();
    }

    // setup bubbles
    const bubbleCanvas = bubbleCanvasRef.current;
    const bubbleCtx = bubbleCanvas.getContext("2d");
    const bubbles = bubblesRef.current;

    function createBubbles() {
      const c = bubbleCanvasRef.current;
      if (!c) return;
      const w = c.width;
      const h = c.height;
      bubbles.length = 0;
      // use device pixels, but coordinates will be in CSS pixels due to setTransform
      const cssW = Math.floor(c.style.width ? parseInt(c.style.width, 10) : (w / (window.devicePixelRatio || 1)));
      const cssH = Math.floor(c.style.height ? parseInt(c.style.height, 10) : (h / (window.devicePixelRatio || 1)));
      for (let i = 0; i < 15; i++) {
        bubbles.push({
          x: Math.random() * cssW,
          y: Math.random() * cssH,
          r: Math.random() * 25 + 8,
          dx: (Math.random() - 0.5) * 1.5,
          dy: (Math.random() - 0.5) * 1.5,
        });
      }
    }

    function drawBubbles() {
      const c = bubbleCanvasRef.current;
      const ctx = bubbleCtx;
      if (!c || !ctx) return;
      const cssW = parseInt(c.style.width, 10);
      const cssH = parseInt(c.style.height, 10);
      ctx.clearRect(0, 0, cssW, cssH);
      bubbles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "#4dd0e1";
        ctx.fill();
        ctx.strokeStyle = "#00796b";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    function updateBubbles() {
      const c = bubbleCanvasRef.current;
      if (!c) return;
      const cssW = parseInt(c.style.width, 10);
      const cssH = parseInt(c.style.height, 10);
      bubbles.forEach((b) => {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x + b.r > cssW || b.x - b.r < 0) b.dx *= -1;
        if (b.y + b.r > cssH || b.y - b.r < 0) b.dy *= -1;
      });
    }

    function animateBubbles() {
      drawBubbles();
      updateBubbles();
      bubbleRAF.current = requestAnimationFrame(animateBubbles);
    }

    // draw shapes canvas
    const drawCanvas = drawCanvasRef.current;
    const drawCtx = drawCanvas.getContext("2d");
    drawCtxRef.current = drawCtx;

    // create audio once and reuse (optional)
    try {
      drawSoundRef.current = new Audio("https://freesound.org/data/previews/66/66717_931655-lq.mp3");
      drawSoundRef.current.volume = 0.18;
    } catch (err) {
      drawSoundRef.current = null;
    }

    const startDraw = () => (drawingRef.current = true);
    const stopDraw = () => (drawingRef.current = false);

    function drawMove(e) {
      if (!drawingRef.current) return;
      const rect = drawCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawCtx.fillStyle = "#ffab91";
      drawCtx.beginPath();
      drawCtx.arc(x, y, 10, 0, Math.PI * 2);
      drawCtx.fill();

      if (drawSoundRef.current) {
        try {
          drawSoundRef.current.currentTime = 0;
          drawSoundRef.current.play().catch(() => {});
        } catch (err) {}
      }
    }

    drawCanvas.addEventListener("pointerdown", startDraw);
    document.addEventListener("pointerup", stopDraw);
    drawCanvas.addEventListener("pointerout", stopDraw);
    drawCanvas.addEventListener("pointermove", drawMove);

    // flow canvas
    const flowCanvas = flowCanvasRef.current;
    const flowCtx = flowCanvas.getContext("2d");

    function animateFlow() {
      const c = flowCanvasRef.current;
      if (!c || !flowCtx) return;
      const cssW = parseInt(c.style.width, 10);
      const cssH = parseInt(c.style.height, 10);
      flowCtx.fillStyle = "rgba(224, 247, 250, 0.12)";
      flowCtx.fillRect(0, 0, cssW, cssH);

      flowCtx.beginPath();
      for (let i = 0; i < cssW; i += 6) {
        const y = cssH / 2 + Math.sin((i + flowAngleRef.current) * 0.05) * (cssH * 0.12);
        if (i === 0) flowCtx.moveTo(i, y);
        else flowCtx.lineTo(i, y);
      }
      flowCtx.strokeStyle = "#00796b";
      flowCtx.lineWidth = 2;
      flowCtx.stroke();

      flowAngleRef.current += 2;
      flowRAF.current = requestAnimationFrame(animateFlow);
    }

    // initial sizing & start animations
    function start() {
      resizeCanvases();
      animateBubbles();
      animateFlow();
    }

    start();

    // responsive: resize canvases on window resize
    let resizeTimer = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvases();
      }, 120);
    }
    window.addEventListener("resize", onResize);

    // cleanup
    return () => {
      cancelAnimationFrame(bubbleRAF.current);
      cancelAnimationFrame(flowRAF.current);
      drawCanvas.removeEventListener("pointerdown", startDraw);
      document.removeEventListener("pointerup", stopDraw);
      drawCanvas.removeEventListener("pointerout", stopDraw);
      drawCanvas.removeEventListener("pointermove", drawMove);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetBubbles() {
    const bubbleCanvas = bubbleCanvasRef.current;
    if (!bubbleCanvas) return;
    const bubbles = bubblesRef.current;
    bubbles.length = 0;
    const cssW = parseInt(bubbleCanvas.style.width, 10) || 300;
    const cssH = parseInt(bubbleCanvas.style.height, 10) || 300;
    for (let i = 0; i < 15; i++) {
      bubbles.push({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        r: Math.random() * 25 + 8,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5,
      });
    }
  }

  function clearDrawing() {
    const drawCtx = drawCtxRef.current;
    if (drawCtx) {
      const c = drawCanvasRef.current;
      drawCtx.clearRect(0, 0, parseInt(c.style.width, 10) || 300, parseInt(c.style.height, 10) || 300);
    }
  }

  return (
    <div className="site-root">
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
              <h1 style={{ margin: 0, textAlign: 'center' }}>Calm-Down / Emotional Regulation Games</h1>
              <p style={{ marginTop: 8, color: '#617489', textAlign: 'center' }}>
                Bubbles, drawing and flowing lines to help you breathe and focus.
              </p>

              <div className="gameContainer" role="region" aria-label="Calm down games">
                <div className="canvasWrap">
                  <canvas ref={bubbleCanvasRef} className="game-canvas" />
                  <div style={{ textAlign: "center" }}>
                    <button onClick={resetBubbles} className="action-btn">Reset Bubbles</button>
                  </div>
                </div>

                <div className="canvasWrap">
                  <canvas ref={drawCanvasRef} className="game-canvas" />
                  <div style={{ textAlign: "center" }}>
                    <button onClick={clearDrawing} className="action-btn">Clear Drawing</button>
                  </div>
                </div>

                <div className="canvasWrap">
                  <canvas ref={flowCanvasRef} className="game-canvas" />
                </div>
              </div>

              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Link href="/games" legacyBehavior><a className="btn-link">← Back to games</a></Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
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

        .site-root { min-height: 100vh; padding: 0; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        .games-main { padding: 20px 18px; display: flex; justify-content: center; }
        .games-center { width: 100%; display: flex; justify-content: center; }
        .games-card { max-width: 980px; width: 100%; }

        .gameContainer {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 18px;
        }

        .canvasWrap { display: flex; flex-direction: column; gap: 8px; align-items: center; }

        /* canvas is sized in JS for crisp drawing, but constrain layout here */
        .game-canvas { display: block; width: 100%; max-width: 320px; height: auto; border-radius: 12px; background: rgba(255,255,255,0.9); box-shadow: 0 6px 18px rgba(20,40,60,0.12); }

        .action-btn {
          margin-top: 6px;
          padding: 8px 14px;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          background: #00796b;
          color: white;
          border: none;
        }

        .btn-link { color: var(--text-primary); text-decoration: none; font-weight: 600; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        /* responsive tweaks */
        @media (max-width: 820px) {
          .gameContainer { gap: 16px; }
          .game-canvas { max-width: 300px; }
        }

        @media (max-width: 420px) {
          .games-main { padding: 14px 12px; }
          .game-canvas { max-width: 260px; }
          .action-btn { padding: 8px 12px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}