// Wireframe: https://github.com/ssanjanasomavara-wq/sanjanaaa/blob/main/mockups/screens/presentation-full%402x.png
// Dashboard page for Semi‑Colonic with navigation to features

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, try to read from sessionStorage
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Validate with server session
        const response = await fetch('/api/session', {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.ok && data.user) {
          // Sync sessionStorage with server session
          sessionStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          setLoading(false);
        } else {
          // No session on client or server, redirect to login
          sessionStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        console.error('Session check failed:', error);
        sessionStorage.removeItem('user');
        router.push('/login');
      }
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
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Dashboard — Semi‑Colonic</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="/styles.css" />
        </Head>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%)'
        }}>
          <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading...</div>
        </div>
      </>
    );
  }

  const features = [
    { name: 'Begin', path: '/features/begin', icon: '🌅', desc: 'Start your journey' },
    { name: 'Check In', path: '/features/checkin', icon: '✓', desc: 'Daily wellness check' },
    { name: 'Breathe', path: '/features/breathe', icon: '🌬️', desc: 'Breathing exercises' },
    { name: 'Mood', path: '/features/mood', icon: '😊', desc: 'Track your mood' },
    { name: 'Tasks', path: '/features/tasks', icon: '📋', desc: 'Manage your day' },
    { name: 'Progress', path: '/features/progress', icon: '📈', desc: 'See your growth' },
    { name: 'Safe Space', path: '/features/safe-space', icon: '🏠', desc: 'Your personal space' },
  ];

  return (
    <>
      <Head>
        <title>Dashboard — Semi‑Colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%)',
        padding: '24px'
      }}>
        {/* Header */}
        <header style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '48px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              semi<span style={{ color: '#5a5adb' }}>;</span>colonic
            </div>
            
            {/* Animated semicolon SVG */}
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 32 32" 
              style={{ 
                animation: 'pulse 2s ease-in-out infinite',
                opacity: 0.6
              }}
            >
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; transform: scale(1); }
                  50% { opacity: 0.8; transform: scale(1.1); }
                }
              `}</style>
              <circle cx="16" cy="12" r="3" fill="#5a5adb" />
              <path d="M 16 18 Q 13 22 11 26" stroke="#5a5adb" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5a5adb, #7aa2ff)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {getInitials(user?.name)}
              </div>
              <span style={{ 
                fontSize: '0.95rem',
                fontWeight: '500',
                color: '#111827'
              }}>
                {user?.name || 'User'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'white',
                color: '#6b7280',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          <div style={{
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#6b7280'
            }}>
              Take a moment to pause and check in with yourself.
            </p>
          </div>

          {/* Feature cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '32px'
          }}>
            {features.map((feature) => (
              <Link
                key={feature.path}
                href={feature.path}
                style={{
                  textDecoration: 'none',
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  display: 'block'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(90,90,219,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '12px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '6px'
                }}>
                  {feature.name}
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#6b7280'
                }}>
                  {feature.desc}
                </p>
              </Link>
            ))}
          </div>

          {/* Footer message */}
          <div style={{
            marginTop: '48px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#9aa6d9'
          }}>
            You're safe to pause here.
          </div>
        </main>
      </div>
    </>
  );
}
