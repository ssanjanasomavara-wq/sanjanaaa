import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!email) {
      setMessage('Please enter your email');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (data.ok) {
        // Store user in sessionStorage for client-side access
        sessionStorage.setItem('user', JSON.stringify(data.user));
        setMessage('Login successful! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        setMessage(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      setMessage('Login error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login — Semi;colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <style jsx>{`
        body {
          background: radial-gradient(900px 500px at 50% -20%, #1b2550, transparent), #0b1324;
          color: #eef1ff;
        }
        .login-container {
          width: 100%;
          max-width: 420px;
          padding: 26px;
          text-align: center;
          margin: 0 auto;
          animation: fadeIn 1.2s ease;
        }
        .logo {
          font-size: 2.6rem;
          font-weight: 600;
          margin-bottom: 10px;
          color: #eef1ff;
        }
        .logo span {
          color: #7aa2ff;
        }
        .subtitle {
          font-size: 0.85rem;
          letter-spacing: 0.6px;
          color: #9aa6d9;
          margin-bottom: 20px;
        }
        .card {
          background: linear-gradient(180deg, #16204a, #121b34);
          border-radius: 22px;
          padding: 26px 22px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
        }
        input {
          width: 100%;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 12px;
          border: none;
          background: #0f1733;
          color: #eef1ff;
          font-size: 0.95rem;
        }
        input::placeholder {
          color: #9aa6d9;
        }
        button {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          background: linear-gradient(90deg, #7aa2ff, #a9c0ff);
          color: #ffffff;
        }
        button:hover:not(:disabled) {
          opacity: 0.9;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .message {
          margin-top: 10px;
          font-size: 0.9rem;
          color: #a9c0ff;
        }
        .footer {
          margin-top: 16px;
          font-size: 0.75rem;
          opacity: 0.8;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="login-container">
        <div className="subtitle">Not the end—just a moment to rest.</div>
        <div className="logo">
          semi<span>;</span>colonic
        </div>

        <div className="card">
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Display Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in (Demo)'}
            </button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
        <div className="footer">You're safe to pause here.</div>
      </div>
    </>
  );
}
