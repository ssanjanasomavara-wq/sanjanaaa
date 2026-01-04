import { useEffect, useRef, useState } from 'react';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

export default function IndexPage() {
  // UI state (login | signup | forgot | reset | home)
  const [view, setView] = useState('login');

  // messages
  const [authMessage, setAuthMessage] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [userInfo, setUserInfo] = useState('');
  const [resetDescText, setResetDescText] = useState('Choose a new password for your account.');

  // inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');

  // firebase runtime
  const firebaseRef = useRef(null); // { app, auth, db, authMod, dbMod }
  const currentOobCodeRef = useRef(null);
  const resetEmailRef = useRef(null);

  // UI helpers to switch views
  const showLogin = () => { setView('login'); clearMessages(); setBodyClass('login'); };
  const showSignUp = () => { setView('signup'); clearMessages(); setBodyClass('login'); };
  const showForgot = () => { setView('forgot'); clearMessages(); setBodyClass('login'); };
  const showReset = () => { setView('reset'); clearMessages(); setBodyClass('login'); };
  const showHome = () => { setView('home'); clearMessages(); setBodyClass('home'); };

  function clearMessages() {
    setAuthMessage('');
    setSignupMessage('');
    setForgotMessage('');
    setResetMessage('');
    setUserInfo('');
  }

  function setBodyClass(cls) {
    if (typeof document !== 'undefined') {
      document.body.className = cls;
    }
  }

  // Friendly error mapping
  function friendlyAuthError(err) {
    if (!err) return 'Authentication failed. Please try again.';
    const code = err && (err.code || (err.message && (err.message.match(/\(auth\/[^\)]+\)/) || [])[0]) || '');
    const normalized = (code || '').toString().replace(/^.*(auth\/)/, 'auth/').replace(/[()]/g, '').trim();

    switch (normalized) {
      case 'auth/wrong-password':
      case 'auth/invalid-login-credentials':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/email-already-in-use':
        return 'An account with that email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error — check your connection and try again.';
      case 'auth/expired-action-code':
      case 'auth/invalid-action-code':
        return 'The password reset link is invalid or has expired. Request a new link.';
      default:
        if (err && err.message) {
          const match = err.message.match(/Firebase:\s*Error\s*\((auth\/[^\)]+)\)\.?\s*(.*)/);
          if (match) return (match[2] && match[2].trim()) ? match[2].trim() : ('Authentication error: ' + match[1]);
          return err.message;
        }
        return 'Authentication failed. Please try again.';
    }
  }

  // Initialize Firebase on client (fetch config then dynamic imports)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Failed to fetch firebase config: ' + resp.status);
        const firebaseConfig = await resp.json();

        // initialize firebase using helper (which does dynamic imports)
        const result = await initFirebaseWithConfig(firebaseConfig);
        if (!mounted) return;
        firebaseRef.current = result;

        const { auth, db, authMod, dbMod } = result;
        const { onAuthStateChanged, verifyPasswordResetCode } = authMod;
        const { ref, get } = dbMod;

        // keep auth state in sync
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            showHome();
            try {
              const snapshot = await get(ref(db, `users/${user.uid}`));
              if (snapshot && snapshot.exists()) {
                const data = snapshot.val();
                const created = data.createdAt ? (typeof data.createdAt === 'number' ? new Date(data.createdAt).toLocaleString() : '[server timestamp]') : '';
                setUserInfo(`Signed in as ${data.email}${created ? ' — created ' + created : ''}`);
              } else {
                setUserInfo(`Signed in as ${user.email} — profile not found.`);
              }
            } catch (err) {
              console.error('Failed to load profile:', err);
              setUserInfo('Signed in — failed to load profile.');
            }
          } else {
            // If no auth session but URL contains reset info, preserve reset view.
            if (view !== 'reset') {
              showLogin();
            }
          }
        });

        // Handle incoming URL for in-app reset flow: ?mode=resetPassword&oobCode=...
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const oobCode = params.get('oobCode');

        if (mode === 'resetPassword' && oobCode) {
          currentOobCodeRef.current = oobCode;
          try {
            const email = await verifyPasswordResetCode(auth, oobCode);
            resetEmailRef.current = email || null;
            setResetDescText(email ? `Resetting password for ${email}. Choose a new password.` : 'Choose a new password for your account.');
            setResetMessage('');
            showReset();
          } catch (err) {
            setResetMessage(friendlyAuthError(err));
            showReset();
          }
        }

      } catch (err) {
        console.error(err);
        setAuthMessage('Unable to initialize authentication. Check site configuration.');
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth action implementations
  async function handleSignUp() {
    setSignupMessage('');
    if (!signupEmail || !signupPassword) { setSignupMessage('Enter email and password.'); return; }
    if (signupPassword.length < 6) { setSignupMessage('Password must be at least 6 characters.'); return; }
    if (signupPassword !== signupPasswordConfirm) { setSignupMessage('Passwords do not match.'); return; }
    try {
      const { authMod, auth, db, dbMod } = firebaseRef.current;
      const { createUserWithEmailAndPassword } = authMod;
      const { ref, set, serverTimestamp } = dbMod;
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const user = userCredential.user;
      // write minimal profile
      const createdAt = typeof serverTimestamp === 'function' ? serverTimestamp() : Date.now();
      await set(ref(db, `users/${user.uid}`), { email: user.email, createdAt });
      setSignupMessage('Account created — signing in...');
      // onAuthStateChanged will update UI
    } catch (err) {
      setSignupMessage(friendlyAuthError(err));
    }
  }

  async function handleSignIn() {
    setAuthMessage('');
    if (!email || !password) { setAuthMessage('Enter email and password.'); return; }
    try {
      const { authMod, auth } = firebaseRef.current;
      const { signInWithEmailAndPassword } = authMod;
      await signInWithEmailAndPassword(auth, email, password);
      setAuthMessage('Signed in — redirecting...');
      // onAuthStateChanged will update UI
    } catch (err) {
      setAuthMessage(friendlyAuthError(err));
    }
  }

  async function handleSignOut() {
    try {
      const { authMod, auth } = firebaseRef.current;
      const { signOut } = authMod;
      await signOut(auth);
      showLogin();
    } catch (err) {
      alert('Sign out error: ' + (err.message || err));
    }
  }

  async function handleSendResetEmail() {
    setForgotMessage('');
    if (!forgotEmail) { setForgotMessage('Enter your email.'); return; }
    try {
      const { authMod, auth } = firebaseRef.current;
      const { sendPasswordResetEmail } = authMod;
      // actionCodeSettings to bring user back to the site with mode=resetPassword
      const actionCodeSettings = {
        url: `${window.location.origin}${window.location.pathname}?mode=resetPassword`,
      };
      await sendPasswordResetEmail(auth, forgotEmail, actionCodeSettings);
      setForgotMessage('Reset email sent. Check your inbox.');
    } catch (err) {
      setForgotMessage(friendlyAuthError(err));
    }
  }

  async function handleResetPassword() {
    setResetMessage('');
    const oobCode = currentOobCodeRef.current;
    if (!oobCode) { setResetMessage('Reset code missing or invalid.'); return; }
    if (!resetPasswordInput) { setResetMessage('Enter a new password.'); return; }
    if (resetPasswordInput.length < 6) { setResetMessage('Password must be at least 6 characters.'); return; }
    if (resetPasswordInput !== resetPasswordConfirm) { setResetMessage('Passwords do not match.'); return; }

    try {
      const { authMod, auth } = firebaseRef.current;
      const { confirmPasswordReset, signInWithEmailAndPassword } = authMod;
      await confirmPasswordReset(auth, oobCode, resetPasswordInput);
      setResetMessage('Password updated. Signing you in...');
      const emailToSignIn = resetEmailRef.current;
      if (emailToSignIn) {
        try {
          await signInWithEmailAndPassword(auth, emailToSignIn, resetPasswordInput);
          setResetMessage('Password updated and signed in.');
        } catch (err) {
          setResetMessage('Password updated. Please sign in.');
        }
      } else {
        setResetMessage('Password updated. Please sign in.');
      }
      setTimeout(() => { showLogin(); }, 1600);
    } catch (err) {
      setResetMessage(friendlyAuthError(err));
    }
  }

  async function handleGoogleSignIn() {
    setAuthMessage('');
    try {
      const { authMod, auth, db, dbMod } = firebaseRef.current;
      const { GoogleAuthProvider, signInWithPopup } = authMod;
      const { ref, set, get, serverTimestamp } = dbMod;

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure minimal profile exists
      const profileRef = ref(db, `users/${user.uid}`);
      try {
        const snapshot = await get(profileRef);
        if (!snapshot.exists()) {
          const createdAt = typeof serverTimestamp === 'function' ? serverTimestamp() : Date.now();
          await set(profileRef, { email: user.email, createdAt });
        }
      } catch (err) {
        console.warn('Failed to write profile after Google sign-in:', err);
      }

      setAuthMessage('Signed in with Google.');
    } catch (err) {
      setAuthMessage(friendlyAuthError(err));
    }
  }

  // Parse URL params for reset link when the component mounts (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      currentOobCodeRef.current = oobCode;
      showReset(); // verification happens after firebase init if available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-root" role="main">
      {/* LOGIN */}
      {view === 'login' && (
        <div className="container" id="login" aria-labelledby="login-title">
          <div className="subtitle">Not the end—just a moment to rest.</div>
          <div className="logo" id="login-title">semi<span>;</span>colonic</div>

          <div className="card" id="login-card" role="region" aria-labelledby="login-title">
            <input value={email} onChange={(e) => setEmail(e.target.value)} id="email" type="email" placeholder="Email" autoComplete="username" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} id="password" type="password" placeholder="Password" autoComplete="current-password" />
            <button id="sign-in-btn" onClick={handleSignIn}>Log in</button>

            <div className="row action-row">
              <button id="show-signup-btn" onClick={showSignUp} className="muted">Sign up</button>
              <button onClick={() => { showHome(); setUserInfo('Guest — limited access.'); }} className="muted">Guest</button>
            </div>

            <div className="centered-row">
              <button onClick={showForgot} className="muted small-btn">Forgot Password?</button>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button onClick={handleGoogleSignIn} className="google-btn" aria-label="Continue with Google">
                <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false"><path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.4-4-50.9H272v96.4h147.4c-6.3 34-25.4 62.9-54 82.1v68h87.3c51-47 80.8-116.4 80.8-195.6z"/><path fill="#34a853" d="M272 544.3c73.6 0 135.4-24.4 180.5-66.3l-87.3-68c-24.3 16.3-55.6 25.9-93.2 25.9-71.6 0-132.4-48.2-154.1-113.1H28.7v70.9C73 488 164.8 544.3 272 544.3z"/><path fill="#fbbc05" d="M117.9 324.9c-10.6-31.4-10.6-65.3 0-96.7V157.3H28.7C-7.1 215.4-7.1 328.9 28.7 386.9l89.2-62z"/><path fill="#ea4335" d="M272 106.1c39.9-.6 78.1 14.2 107.3 40.6l80.4-80.4C405.6 24.8 344 0 272 0 164.8 0 73 56.3 28.7 143.8l89.2 62C139.6 154.3 200.4 106.7 272 106.1z"/></svg>
                <span style={{ marginLeft: 8 }}>Continue with Google</span>
              </button>
            </div>

            <div className="message" aria-live="polite">{authMessage}</div>
          </div>
          <div className="footer">You’re safe to pause here.</div>
        </div>
      )}

      {/* SIGNUP */}
      {view === 'signup' && (
        <div className="container" id="signup">
          <div className="logo">semi<span>;</span>colonic</div>
          <div className="card">
            <input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} id="signup-email" type="email" placeholder="Email" autoComplete="email" />
            <input value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} id="signup-password" type="password" placeholder="Password (min 6 chars)" autoComplete="new-password" />
            <input value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)} id="signup-password-confirm" type="password" placeholder="Confirm password" autoComplete="new-password" />
            <button id="create-account-btn" onClick={handleSignUp}>Create account</button>
            <div className="row action-row">
              <button onClick={showLogin} className="muted">Back</button>
            </div>
            <div className="message" aria-live="polite">{signupMessage}</div>
          </div>
          <div className="footer">You can come back anytime.</div>
        </div>
      )}

      {/* FORGOT */}
      {view === 'forgot' && (
        <div className="container" id="forgot">
          <div className="logo">semi<span>;</span>colonic</div>
          <div className="card">
            <p className="small">Enter your account email and we'll send a link to reset your password.</p>
            <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} id="forgot-email" type="email" placeholder="Email" autoComplete="email" />
            <button onClick={handleSendResetEmail}>Send reset email</button>
            <div className="row action-row">
              <button onClick={showLogin} className="muted">Back</button>
            </div>
            <div className="message" aria-live="polite">{forgotMessage}</div>
          </div>
          <div className="footer">Check your inbox — and your spam folder just in case.</div>
        </div>
      )}

      {/* RESET */}
      {view === 'reset' && (
        <div className="container" id="reset">
          <div className="logo">semi<span>;</span>colonic</div>
          <div className="card">
            <p className="small" id="reset-desc">{resetDescText}</p>
            <input value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} id="reset-password" type="password" placeholder="New password (min 6 chars)" />
            <input value={resetPasswordConfirm} onChange={(e) => setResetPasswordConfirm(e.target.value)} id="reset-password-confirm" type="password" placeholder="Confirm new password" />
            <button id="reset-password-btn" onClick={handleResetPassword}>Reset password</button>
            <div className="row action-row">
              <button onClick={showLogin} className="muted">Back</button>
            </div>
            <div className="message" aria-live="polite">{resetMessage}</div>
          </div>
          <div className="footer">If the link is expired, request a new reset email from the login view.</div>
        </div>
      )}

      {/* HOME */}
      {view === 'home' && (
        <div className="container" id="home">
          <div className="logo">semi<span>;</span>colonic</div>
          <div className="card">
            <p>
              <strong>What does a semicolon mean?</strong><br /><br />
              A semicolon is used when a sentence could end — but doesn’t.
              It represents choosing to continue, even when stopping feels easier.
              <br /><br />
              <strong>What is semi‑colonic?</strong><br /><br />
              Semi‑colonic lives in the pause before that choice.
              This app is not about fixing yourself or being productive.
              It’s a place to rest, reflect, and continue gently.
            </p>
            <div className="row action-row">
              <button id="enter-app" onClick={() => alert('Entering the app — wire this up to your SPA / routing.')}>Enter app</button>
              <button id="sign-out-btn" onClick={handleSignOut}>Sign out</button>
            </div>
            <div className="message small" id="user-info">{userInfo}</div>
          </div>
          <div className="footer">The tide goes out. The tide comes back.</div>
        </div>
      )}

      <style jsx>{`
        :root{
          --night-bg: #0b1324;
          --night-card: #121b34;
          --blue: #7aa2ff;
          --blue-soft: #a9c0ff;
          --text-light: #eef1ff;
          --muted-light: #9aa6d9;
          --sea: #6fa9c9;
          --foam: #d6ecf6;
          --sand: #e2b07a;
          --clay: #c87a3c;
          --earth-text: #2a2a2a;
          --max-width: 420px;
          --card-padding: 26px;
        }

        /* Page root layout and centering */
        .page-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.45;
        }

        .container {
          width: 100%;
          max-width: var(--max-width);
          padding: 0 18px;
          text-align: center;
          animation: fadeIn 1.2s ease;
          margin: 12px auto;
        }

        .subtitle {
          font-size: 0.86rem;
          letter-spacing: 0.6px;
          color: var(--muted-light);
          margin-bottom: 6px;
        }

        .logo {
          font-size: 2.6rem;
          font-weight: 700;
          margin-bottom: 10px;
          line-height: 1;
        }
        .logo span { color: currentColor; }

        .card {
          border-radius: 22px;
          padding: var(--card-padding);
          box-shadow: 0 18px 45px rgba(0,0,0,0.45);
          display: block;
          width: 100%;
        }

        /* Common form elements */
        input {
          width: 100%;
          padding: 12px 14px;
          margin-bottom: 10px;
          border-radius: 12px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: inherit;
          font-size: 0.95rem;
          outline: none;
        }
        input::placeholder { color: rgba(255,255,255,0.66); }

        button {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: transform .05s ease, box-shadow .08s ease;
        }
        button:active { transform: translateY(1px); }

        .row { display: flex; gap: 10px; margin-top: 8px; }
        .action-row { justify-content: space-between; }
        .row button { flex: 1; min-width: 0; }

        .muted {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          color: inherit;
          padding: 10px;
          border-radius: 12px;
          width: 48%;
        }

        .centered-row { display:flex; align-items:center; justify-content:center; margin-top:8px; }

        .small { font-size: 0.85rem; }

        .footer {
          margin-top: 16px;
          font-size: 0.75rem;
          opacity: 0.88;
        }

        .message { margin-top: 12px; font-size: 0.92rem; min-height: 1.2em; }

        .google-btn {
          background: #fff;
          color: #222;
          border-radius: 12px;
          padding: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .google-btn svg { display:block; }

        /* Theme: login (night) */
        :global(body.login) {
          background: radial-gradient(900px 500px at 50% -20%, #1b2550, transparent), var(--night-bg);
          color: var(--text-light);
        }
        :global(body.login) .card {
          background: linear-gradient(180deg,#16204a,var(--night-card));
          color: var(--text-light);
        }
        :global(body.login) input {
          background: #0f1733;
          color: var(--text-light);
        }
        :global(body.login) .muted { border-color: rgba(255,255,255,0.06); }

        /* Theme: home (light / sea) */
        :global(body.home) {
          background: radial-gradient(800px 500px at 50% -10%, var(--foam), transparent), linear-gradient(180deg,var(--sea),#4e8fae);
          color: var(--earth-text);
        }
        :global(body.home) .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85));
          backdrop-filter: blur(6px);
          box-shadow: 0 18px 45px rgba(15, 45, 70, 0.12);
          color: var(--earth-text);
        }
        :global(body.home) .logo { color: #1f3f57; font-size: 2.2rem; }
        :global(body.home) strong { color: var(--clay); }
        :global(body.home) #enter-app { background: linear-gradient(90deg,var(--sand),var(--clay)); color: #fff; }
        :global(body.home) #sign-out-btn { background: #eee; color: #222; }

        /* Responsive behavior */
        @media (max-width: 520px) {
          :root { --max-width: 460px; --card-padding: 20px; }
          .logo { font-size: 2.2rem; }
          .container { padding: 0 12px; }
          .row { flex-direction: column; }
          .muted { width: 100%; }
          .google-btn { padding: 10px 12px; font-size: 0.95rem; }
        }

        @media (max-width: 360px) {
          .logo { font-size: 1.9rem; }
          .subtitle { font-size: 0.78rem; }
          input { padding: 10px 12px; }
          button { padding: 10px 12px; font-size: 0.92rem; }
        }

        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
