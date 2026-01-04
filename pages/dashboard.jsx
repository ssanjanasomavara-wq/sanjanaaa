// Wireframe: <img>
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      try {
        // First check sessionStorage
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Validate with server session
        const response = await fetch('/api/session', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (data.ok && data.user) {
          setUser(data.user);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // No valid session, redirect to login
          sessionStorage.removeItem('user');
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Session check failed:', error);
        router.push('/');
        return;
      }
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      sessionStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
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

  // Get user initials
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = user ? getInitials(user.name, user.email) : 'U';
  const displayName = user?.name || user?.email || 'User';

  return (
    <>
      <Head>
        <title>Dashboard — Semi;colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <style jsx>{`
        .dashboard-wrapper {
          min-height: 100vh;
          background: linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%);
          padding: 24px;
        }
        .dashboard-header {
          max-width: 1100px;
          margin: 0 auto 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .semicolon-icon {
          width: 48px;
          height: 48px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .app-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .app-title span {
          color: #5a5adb;
        }
        .user-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 8px 16px;
          border-radius: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5a5adb, #7aa2ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .user-info {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: #111827;
        }
        .logout-btn {
          background: transparent;
          border: none;
          color: #6b7280;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
        .logout-btn:hover {
          color: #111827;
        }
        .dashboard-content {
          max-width: 1100px;
          margin: 0 auto;
        }
        .welcome-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(11, 22, 77, 0.04);
          margin-bottom: 32px;
          text-align: center;
        }
        .welcome-title {
          font-size: 1.4rem;
          margin-bottom: 8px;
          color: #111827;
        }
        .welcome-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }
        .feature-card {
          background: white;
          padding: 24px;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(9, 10, 27, 0.04);
          border: 1px solid rgba(10, 10, 10, 0.03);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(90, 90, 219, 0.12);
        }
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }
        .feature-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #111827;
        }
        .feature-description {
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <div className="logo-section">
            <svg 
              className="semicolon-icon" 
              viewBox="0 0 64 64" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="20" r="6" fill="#5a5adb" />
              <path 
                d="M 32 32 Q 28 38, 26 44 Q 24 50, 22 54" 
                stroke="#5a5adb" 
                strokeWidth="6" 
                strokeLinecap="round" 
                fill="none"
              />
            </svg>
            <h1 className="app-title">
              semi<span>;</span>colonic
            </h1>
          </div>
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="welcome-card">
            <h2 className="welcome-title">Welcome back, {displayName}</h2>
            <p className="welcome-subtitle">
              A semicolon is used when a sentence could end — but doesn't.
              <br />
              Choose your journey below.
            </p>
          </div>

          <div className="features-grid">
            <Link href="/features/begin" className="feature-card">
              <div className="feature-icon">🌅</div>
              <h3 className="feature-title">Begin</h3>
              <p className="feature-description">
                Start your day with intention and clarity
              </p>
            </Link>

            <Link href="/features/checkin" className="feature-card">
              <div className="feature-icon">✓</div>
              <h3 className="feature-title">Check In</h3>
              <p className="feature-description">
                Pause and reflect on how you're feeling right now
              </p>
            </Link>

            <Link href="/features/breathe" className="feature-card">
              <div className="feature-icon">🫁</div>
              <h3 className="feature-title">Breathe</h3>
              <p className="feature-description">
                Guided breathing exercises for calm and focus
              </p>
            </Link>

            <Link href="/features/mood" className="feature-card">
              <div className="feature-icon">😊</div>
              <h3 className="feature-title">Mood Diary</h3>
              <p className="feature-description">
                Track your emotions and discover patterns
              </p>
            </Link>

            <Link href="/features/tasks" className="feature-card">
              <div className="feature-icon">📝</div>
              <h3 className="feature-title">Tasks</h3>
              <p className="feature-description">
                Gentle reminders and manageable goals
              </p>
            </Link>

            <Link href="/features/progress" className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Progress</h3>
              <p className="feature-description">
                Celebrate your journey and small victories
              </p>
            </Link>

            <Link href="/features/safe-space" className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Safe Space</h3>
              <p className="feature-description">
                A private place to express yourself freely
              </p>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
