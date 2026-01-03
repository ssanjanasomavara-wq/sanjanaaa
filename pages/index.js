import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/session', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (data.ok && data.user) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session, show options
          setChecking(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Semi;colonic — Home</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <style jsx>{`
        .home-wrapper {
          min-height: 100vh;
          background: radial-gradient(800px 500px at 50% -10%, #d6ecf6, transparent),
                      linear-gradient(180deg, #6fa9c9, #4e8fae);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .home-container {
          width: 100%;
          max-width: 420px;
          text-align: center;
        }
        .logo {
          font-size: 2.6rem;
          font-weight: 600;
          margin-bottom: 10px;
          color: #1f3f57;
        }
        .logo span {
          color: #c87a3c;
        }
        .card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.75));
          backdrop-filter: blur(6px);
          border-radius: 22px;
          padding: 26px 22px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);
          margin-bottom: 16px;
        }
        .tagline {
          font-size: 1rem;
          color: #2a2a2a;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .tagline strong {
          color: #c87a3c;
        }
        .button-group {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }
        .btn {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: opacity 0.2s;
        }
        .btn-primary {
          background: linear-gradient(90deg, #e2b07a, #c87a3c);
          color: #fff;
        }
        .btn-secondary {
          background: transparent;
          border: 2px solid rgba(0, 0, 0, 0.1);
          color: #2a2a2a;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .footer {
          font-size: 0.75rem;
          opacity: 0.8;
          color: #1f3f57;
        }
      `}</style>

      <div className="home-wrapper">
        <div className="home-container">
          <div className="logo">
            semi<span>;</span>colonic
          </div>

          <div className="card">
            <p className="tagline">
              <strong>A semicolon is used when a sentence could end — but doesn't.</strong>
              <br /><br />
              This is a place to rest, reflect, and continue gently.
            </p>

            <div className="button-group">
              <Link href="/login" className="btn btn-primary">
                Get Started
              </Link>
              <Link href="/dashboard" className="btn btn-secondary">
                Go to Dashboard
              </Link>
            </div>
          </div>

          <div className="footer">
            The tide goes out. The tide comes back.
          </div>
        </div>
      </div>
    </>
  );
}
