import Head from 'next/head';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import { useRouter } from 'next/router';

export default function SafeSpace() {
  const router = useRouter();
  function handleSignOut() {
    router.replace('/');
  }

  return (
    <div className="site-root">
      <Head>
        <title>Safe Space — Semi‑Colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Shared Topbar provides sign-in / sign-out and mobile drawer */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },

      ]} />

      <div className="site">
        <main className="main" role="main">
          <div className="card-wrap">
            <div className="card">
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
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --text-primary: #183547; --muted: #7b8899; --card-bg: #fff; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; box-sizing: border-box; }

        /* Centering layout */
        .main { padding: 20px 18px; display:flex; justify-content:center; }
        .card-wrap { width:100%; display:flex; justify-content:center; }
        .card { width:100%; max-width:720px; background: var(--card-bg); padding: 24px; border-radius: 12px; box-shadow: 0 6px 18px rgba(20,40,60,0.06); box-sizing: border-box; }

        .btn { background: transparent; border: 1px solid rgba(6,20,40,0.06); padding: 8px 12px; border-radius: 10px; cursor: pointer; color: var(--text-primary); }

        @media (max-width: 820px) {
          .card { max-width: 640px; padding: 18px; }
        }

        @media (max-width: 420px) {
          .card { max-width: 340px; padding: 14px; }
          .main { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}