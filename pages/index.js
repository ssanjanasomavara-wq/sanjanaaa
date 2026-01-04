import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

export default function IndexPage() {
  const router = useRouter();

  // UI state (login | signup | forgot | reset | home)
  const [view, setView] = useState('login');

  // messages
  const [authMessage, setAuthMessage] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [userInfo, setUserInfo] = useState('');

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
  const showLogin = () => { setView('login'); clearMessages(); document.body.className = 'login'; };
  const showSignUp = () => { setView('signup'); clearMessages(); document.body.className = 'login'; };
  const showForgot = () => { setView('forgot'); clearMessages(); document.body.className = 'login'; };
  const showReset = () => { setView('reset'); clearMessages(); document.body.className = 'login'; };
  const showHome = () => { setView('home'); clearMessages(); document.body.className = 'home'; };

  function clearMessages() {
    setAuthMessage('');
    setSignupMessage('');
    setForgotMessage('');
    setResetMessage('');
    setUserInfo('');
  }

  // Friendly error mapping (similar to original)
  function friendlyAuthError(err) {
    if (!err) return 'Authentication failed. Please try again.';
    const code = err && (err.code || '');
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
        const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
                sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } = authMod;
        const { ref, set, get, serverTimestamp } = dbMod;

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
            // If no auth session but URL contains reset info, we'll preserve the reset view.
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
      // We set currentOobCodeRef earlier during init (if firebase initialized).
      // But if firebase isn't ready yet, handle it after init via initial effect.
      currentOobCodeRef.current = oobCode;
      // show reset view; verify will happen in init effect once SDK is initialized.
      showReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI render — I preserved the original layout and styling via styled-jsx.
  return (
    <div>
      <div className="page-root">
        {/* LOGIN */}
        {view === 'login' && (
          <div className="container" id="login">
            <div className="subtitle">Not the end—just a moment to rest.</div>
            <div className="logo">semi<span>;</span>colonic</div>

            <div className="card" id="login-card">
              <input value={email} onChange={(e) => setEmail(e.target.value)} id="email" type="email" placeholder="Email" autoComplete="username" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} id="password" type="password" placeholder="Password" autoComplete="current-password" />
              <button id="sign-in-btn" onClick={handleSignIn}>Log in</button>

              <div className="row" style={{ marginTop: 8 }}>
                <button id="show-signup-btn" onClick={showSignUp} className="muted">Sign up</button>
                <button onClick={() => { showHome(); setUserInfo('Guest — limited access.'); }} className="muted">Guest</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <button onClick={showForgot} className="muted small-btn">Forgot Password?</button>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <button onClick={handleGoogleSignIn} className="google-btn">Continue with Google</button>
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
              <div className="row" style={{ marginTop: 8 }}>
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
              <div className="row" style={{ marginTop: 8 }}>
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
              <p className="small" id="reset-desc">Choose a new password for your account.</p>
              <input value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} id="reset-password" type="password" placeholder="New password (min 6 chars)" />
              <input value={resetPasswordConfirm} onChange={(e) => setResetPasswordConfirm(e.target.value)} id="reset-password-confirm" type="password" placeholder="Confirm new password" />
              <button id="reset-password-btn" onClick={handleResetPassword}>Reset password</button>
              <div className="row" style={{ marginTop: 8 }}>
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
              <div className="row">
                <button id="enter-app" onClick={() => alert('Entering the app — wire this up to your SPA / routing.')}>Enter app</button>
                <button id="sign-out-btn" style={{ background: '#eee', color: '#222' }} onClick={handleSignOut}>Sign out</button>
              </div>
              <div className="message small" id="user-info">{userInfo}</div>
            </div>
            <div className="footer">The tide goes out. The tide comes back.</div>
          </div>
        )}
      </div>

      <style jsx>{`
        :root {
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
        }
        .page-root { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .container { width:100%; max-width:420px; padding:26px; text-align:center; animation:fadeIn 1.2s ease; }
        .logo { font-size:2.6rem; font-weight:600; margin-bottom:10px; }
        .logo span { color: currentColor; }
        button { width:100%; padding:14px; border-radius:16px; border:none; font-size:0.95rem; font-weight:600; cursor:pointer; margin-top:10px; }
        .link { margin-top:14px; font-size:0.85rem; cursor:pointer; text-decoration:underline; }
        .message { margin-top:10px; font-size:0.9rem; }
        input { width:100%; padding:12px; margin-bottom:10px; border-radius:12px; border:none; background:rgba(255,255,255,0.05); }
        body.login .subtitle {}
        .subtitle { font-size:0.85rem; letter-spacing:0.6px; color:var(--muted-light); margin-bottom:6px; }
        .card { background: linear-gradient(180deg,#16204a,var(--night-card)); border-radius:22px; padding:26px 22px; box-shadow:0 18px 45px rgba(0,0,0,0.45); color: var(--text-light); }
        .muted { background:transparent;border:1px solid rgba(255,255,255,0.06);color:inherit;padding:10px;border-radius:12px; width:48%; }
        .row { display:flex; gap:8px; }
        .row button { flex:1; }
        .small { font-size:0.85rem; }
        .footer { margin-top:16px; font-size:0.75rem; opacity:0.8; }
        .hidden { display:none !important; }
        .google-btn { background: #fff; color: #222; border-radius:12px; padding:10px; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        /* Simple theme switching */
        :global(body.home) { background: radial-gradient(800px 500px at 50% -10%, var(--foam), transparent), linear-gradient(180deg,var(--sea),#4e8fae); color:var(--earth-text); }
        :global(body.login) { background: radial-gradient(900px 500px at 50% -20%, #1b2550, transparent), var(--night-bg); color: var(--text-light); }
      `}</style>
    </div>
  );
}
