import React, { useEffect, useRef } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Calm-Down / Emotional Regulation Games
 * Converted from index (10).html
 */
export default function CalmDownGames() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

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
    // setup bubbles
    const bubbleCanvas = bubbleCanvasRef.current;
    const bubbleCtx = bubbleCanvas.getContext("2d");
    const bubbles = bubblesRef.current;

    function createBubbles() {
      bubbles.length = 0;
      for (let i = 0; i < 15; i++) {
        bubbles.push({
          x: Math.random() * bubbleCanvas.width,
          y: Math.random() * bubbleCanvas.height,
          r: Math.random() * 25 + 10,
          dx: (Math.random() - 0.5) * 1.5,
          dy: (Math.random() - 0.5) * 1.5,
        });
      }
    }

    function drawBubbles() {
      bubbleCtx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
      bubbles.forEach((b) => {
        bubbleCtx.beginPath();
        bubbleCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        bubbleCtx.fillStyle = "#4dd0e1";
        bubbleCtx.fill();
        bubbleCtx.strokeStyle = "#00796b";
        bubbleCtx.stroke();
      });
    }

    function updateBubbles() {
      bubbles.forEach((b) => {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x + b.r > bubbleCanvas.width || b.x - b.r < 0) b.dx *= -1;
        if (b.y + b.r > bubbleCanvas.height || b.y - b.r < 0) b.dy *= -1;
      });
    }

    function animateBubbles() {
      drawBubbles();
      updateBubbles();
      bubbleRAF.current = requestAnimationFrame(animateBubbles);
    }

    createBubbles();
    animateBubbles();

    // draw shapes canvas
    const drawCanvas = drawCanvasRef.current;
    const drawCtx = drawCanvas.getContext("2d");
    drawCtxRef.current = drawCtx;

    // create audio once and reuse
    drawSoundRef.current = new Audio("https://freesound.org/data/previews/66/66717_931655-lq.mp3");
    drawSoundRef.current.volume = 0.2;

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

      // optional sound (reuse audio object)
      if (drawSoundRef.current) {
        drawSoundRef.current.currentTime = 0;
        drawSoundRef.current.play().catch(() => {});
      }
    }

    drawCanvas.addEventListener("mousedown", startDraw);
    drawCanvas.addEventListener("mouseup", stopDraw);
    drawCanvas.addEventListener("mouseout", stopDraw);
    drawCanvas.addEventListener("mousemove", drawMove);

    // flow canvas
    const flowCanvas = flowCanvasRef.current;
    const flowCtx = flowCanvas.getContext("2d");

    function animateFlow() {
      flowCtx.fillStyle = "rgba(224, 247, 250, 0.1)";
      flowCtx.fillRect(0, 0, flowCanvas.width, flowCanvas.height);

      flowCtx.beginPath();
      for (let i = 0; i < flowCanvas.width; i += 5) {
        const y = flowCanvas.height / 2 + Math.sin((i + flowAngleRef.current) * 0.05) * 40;
        if (i === 0) flowCtx.moveTo(i, y);
        else flowCtx.lineTo(i, y);
      }
      flowCtx.strokeStyle = "#00796b";
      flowCtx.lineWidth = 2;
      flowCtx.stroke();

      flowAngleRef.current += 2;
      flowRAF.current = requestAnimationFrame(animateFlow);
    }
    animateFlow();

    // cleanup
    return () => {
      cancelAnimationFrame(bubbleRAF.current);
      cancelAnimationFrame(flowRAF.current);
      drawCanvas.removeEventListener("mousedown", startDraw);
      drawCanvas.removeEventListener("mouseup", stopDraw);
      drawCanvas.removeEventListener("mouseout", stopDraw);
      drawCanvas.removeEventListener("mousemove", drawMove);
    };
  }, []);

  function resetBubbles() {
    const bubbleCanvas = bubbleCanvasRef.current;
    if (!bubbleCanvas) return;
    const bubbles = bubblesRef.current;
    bubbles.length = 0;
    for (let i = 0; i < 15; i++) {
      bubbles.push({
        x: Math.random() * bubbleCanvas.width,
        y: Math.random() * bubbleCanvas.height,
        r: Math.random() * 25 + 10,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5,
      });
    }
  }

  function clearDrawing() {
    const drawCtx = drawCtxRef.current;
    if (drawCtx) {
      const c = drawCanvasRef.current;
      drawCtx.clearRect(0, 0, c.width, c.height);
    }
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
            <h1>Calm-Down / Emotional Regulation Games</h1>
            <div style={styles.gameContainer}>
              <div>
                <canvas id="bubbleCanvas" ref={bubbleCanvasRef} width={300} height={300} style={styles.canvas} />
                <div style={{ textAlign: "center" }}>
                  <button onClick={resetBubbles} style={styles.button}>Reset Bubbles</button>
                </div>
              </div>

              <div>
                <canvas id="drawCanvas" ref={drawCanvasRef} width={300} height={300} style={styles.canvas} />
                <div style={{ textAlign: "center" }}>
                  <button onClick={clearDrawing} style={styles.button}>Clear Drawing</button>
                </div>
              </div>

              <div>
                <canvas id="flowCanvas" ref={flowCanvasRef} width={300} height={300} style={styles.canvas} />
              </div>
            </div>
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
  container: { fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 16 },
  gameContainer: { display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center", marginTop: 20 },
  canvas: { borderRadius: 12, background: "#ffffffaa", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" },
  button: { marginTop: 8, padding: "8px 15px", fontSize: 14, borderRadius: 8, cursor: "pointer", backgroundColor: "#00796b", color: "white", border: "none" },
};
