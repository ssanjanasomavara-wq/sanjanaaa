import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SafeSpace() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  return (
    <div className="site-root">
      <div className="site">
        {/* Top navigation (matches other feature pages) */}
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
              <Link href="/games" legacyBehavior><a>Games</a></Link>
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
          <div style={{ maxWidth: 720, width: '100%' }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.06)' }}>
              <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Need to Talk to a Human?</h2>
              <p style={{ color: '#555' }}>
                You are not alone. If you need immediate emotional support, please reach out to one of these helplines.
              </p>

              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                <div style={{ background: '#eef3f7', padding: 16, borderRadius: 10 }}>
                  <h3 style={{ margin: 0, color: '#1a5276' }}>KIRAN (24/7 Government Mental Health Helpline)</h3>
                  <p style={{ margin: '8px 0 0' }}>📞 <a href="tel:18005990019" style={{ color: '#0b5345', fontWeight: 700 }}>1800-599-0019</a></p>
                </div>

                <div style={{ background: '#eef3f7', padding: 16, borderRadius: 10 }}>
                  <h3 style={{ margin: 0, color: '#1a5276' }}>AASRA Suicide Prevention Helpline</h3>
                  <p style={{ margin: '8px 0 0' }}>📞 <a href="tel:+919820466726" style={{ color: '#0b5345', fontWeight: 700 }}>+91 9820466726</a></p>
                  <p style={{ margin: '6px 0 0', color: '#555' }}>Available 24/7</p>
                </div>

                <div style={{ background: '#eef3f7', padding: 16, borderRadius: 10 }}>
                  <h3 style={{ margin: 0, color: '#1a5276' }}>iCALL (TISS)</h3>
                  <p style={{ margin: '8px 0 0' }}>📞 <a href="tel:+919152987821" style={{ color: '#0b5345', fontWeight: 700 }}>+91 9152987821</a></p>
                  <p style={{ margin: '6px 0 0', color: '#555' }}>Monday – Saturday, 10am–8pm</p>
                </div>

                <div style={{ background: '#eef3f7', padding: 16, borderRadius: 10 }}>
                  <h3 style={{ margin: 0, color: '#1a5276' }}>Sneha Foundation</h3>
                  <p style={{ margin: '8px 0 0' }}>📞 <a href="tel:04424640050" style={{ color: '#0b5345', fontWeight: 700 }}>044-2464-0050</a></p>
                  <p style={{ margin: '6px 0 0', color: '#555' }}>24/7 Support</p>
                </div>
              </div>

              <div style={{ marginTop: 20, textAlign: 'center', color: '#c0392b', fontWeight: 700 }}>
                If you are in immediate danger, please call your local emergency number or go to the nearest hospital.
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                <Link href="/features" legacyBehavior>
                  <a className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: 12, textDecoration: 'none' }}>← Back to Features</a>
                </Link>
                <div style={{ flex: 1 }} />
                <button onClick={handleSignOut} className="btn" style={{ padding: '8px 12px', borderRadius: 12 }}>Sign out</button>
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer" style={{ marginTop: 12 }}>
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}
