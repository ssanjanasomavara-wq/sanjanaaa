// Login page for Semi‑Colonic
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (data.ok) {
        // Save user to sessionStorage
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setMessage('Login failed. Please try again.');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleDemoLogin = async () => {
    setMessage('Logging in as demo user...');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}), // Use demo values
      });

      const data = await response.json();

      if (data.ok) {
        // Save user to sessionStorage
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setMessage('Login failed. Please try again.');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Login — Semi‑Colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(900px 500px at 50% -20%, #1b2550, transparent), #0b1324',
        color: '#eef1ff',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ 
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ 
              fontSize: '0.85rem',
              letterSpacing: '0.6px',
              color: '#9aa6d9',
              marginBottom: '8px'
            }}>
              Not the end—just a moment to rest.
            </div>
            <div style={{ 
              fontSize: '2.2rem',
              fontWeight: '600'
            }}>
              semi<span style={{ color: '#7aa2ff' }}>;</span>colonic
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(180deg, #16204a, #121b34)',
            borderRadius: '22px',
            padding: '26px 22px',
            boxShadow: '0 18px 45px rgba(0,0,0,0.45)'
          }}>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f1733',
                  color: '#eef1ff',
                  fontSize: '0.95rem'
                }}
              />
              
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f1733',
                  color: '#eef1ff',
                  fontSize: '0.95rem'
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(90deg, #7aa2ff, #a9c0ff)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                Log in
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Demo Login
              </button>

              {message && (
                <div style={{ 
                  marginTop: '14px', 
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {message}
                </div>
              )}
            </form>
          </div>

          <div style={{ 
            marginTop: '16px',
            fontSize: '0.75rem',
            textAlign: 'center',
            opacity: 0.8
          }}>
            You're safe to pause here.
          </div>
        </div>
      </div>
    </>
  );
}
