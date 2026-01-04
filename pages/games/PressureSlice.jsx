import React, { useEffect, useRef } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Pressure Slice
 * Converted from index (11).html
 */
export default function PressureSlice() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  const canvasRef = useRef(null);
  const dotRef = useRef(null);
  const lastRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dot = dotRef.current;

    // initial surface
    ctx.fillStyle = "#f2c58f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      const depth = pressure * 14;
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
            <div ref={dotRef} id="dot" style={styles.dot} />
            <canvas ref={canvasRef} width={720} height={480} style={styles.canvas} />
            <button onClick={restart} style={styles.button}>Restart</button>
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
  container: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 16 },
  canvas: { borderRadius: 18, boxShadow: "0 20px 40px rgba(0,0,0,0.25)", touchAction: "none", cursor: "none" },
  dot: { position: "absolute", width: 14, height: 14, border: "2px solid #6b0f1a", borderRadius: "50%", pointerEvents: "none", transform: "translate(-50%, -50%)" },
  button: { marginTop: 12, padding: "10px 20px", borderRadius: 20, border: "none", background: "#7c1626", color: "white", cursor: "pointer" },
};
