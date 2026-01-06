import Head from 'next/head';
import React, { useEffect, useRef } from "react";
import Link from 'next/link';
import Topbar from '../../components/Topbar';

/**
 * Pressure Slice
 * - Replaced local header with shared <Topbar /> so sign-out UI and mobile drawer are consistent with other pages
 * - Keeps responsive layout for iPhone 13 Pro, iPad and PC
 * - Center-aligns the game area
 */
export default function PressureSlice() {
  const canvasRef = useRef(null);
  const dotRef = useRef(null);
  const lastRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dot = dotRef.current;

    // initial surface
    function fillSurface() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f2c58f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    fillSurface();

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // move dot (position relative to viewport)
      dot.style.left = e.clientX + "px";
      dot.style.top = e.clientY + "px";

      const pressure = e.pressure || 0;
      const isPressedDeep = pressure > 0.35;

      if (isPressedDeep && lastRef.current.x !== null) {
        slice(ctx, lastRef.current.x, lastRef.current.y, x, y, pressure);
      }
      lastRef.current.x = x;
      lastRef.current.y = y;
    }

    function slice(ctx, x1, y1, x2, y2, pressure) {
      const depth = (pressure || 0.5) * 14;
      ctx.lineWidth = depth;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#7c1626";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(x1 + 1, y1 + 1);
      ctx.lineTo(x2 + 1, y2 + 1);
      ctx.stroke();
    }

    window.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  function restart() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f2c58f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lastRef.current = { x: null, y: null };
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Pressure Slice — Semi‑Colonic</title>
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
              <h1 style={{ margin: 0, textAlign: 'center' }}>Pressure Slice</h1>
              <p style={{ marginTop: 8, color: '#617489', textAlign: 'center' }}>Press, drag and release to slice the surface.</p>

              <div className="canvas-wrap" style={{ position: 'relative', marginTop: 16 }}>
                <div ref={dotRef} id="dot" className="dot" />
                {/* Keep reasonable drawing buffer but make the canvas visually responsive */}
                <canvas ref={canvasRef} width={900} height={560} className="responsive-canvas" />
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={restart} className="restart-btn">Restart</button>
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
        :root { --max-width: 980px; --text-primary: #183547; --muted: #7b8899; --cta-strong: #1f9fff; }

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
        .games-card { width:100%; max-width:980px; display:flex; flex-direction:column; align-items:center; padding:12px; box-sizing:border-box; }

        .canvas-wrap { width: 100%; display:flex; justify-content:center; align-items:center; }

        /* Make the canvas responsive visually while keeping a fixed drawing buffer */
        .responsive-canvas {
          width: 100%;
          max-width: 900px;
          height: auto;
          border-radius: 18px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
          touch-action: none;
          cursor: none;
        }

        .dot {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 2px solid #6b0f1a;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 10;
        }

        .restart-btn {
          margin-top: 12px;
          padding: 10px 20px;
          border-radius: 20px;
          border: none;
          background: #7c1626;
          color: white;
          cursor: pointer;
        }

        .btn-link { color: var(--text-primary); text-decoration: none; font-weight:600; }

        .site-footer { margin-top: 18px; padding: 12px 0; font-size: 13px; color: var(--muted); text-align: center; }

        @media (max-width: 820px) {
          .responsive-canvas { max-width: 720px; }
          .games-card { padding: 10px; }
        }

        @media (max-width: 420px) {
          .responsive-canvas { max-width: 340px; }
          .games-main { padding: 14px 12px; }
          .restart-btn { padding: 8px 14px; }
        }
      `}</style>
    </div>
  );
}