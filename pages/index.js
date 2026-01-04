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
  const currentUserRef = useRef(null); // track current user for Enter app behavior

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

  // Friendly error mapping (same as previous)
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
          // track current user
          currentUserRef.current = user || null;

          if (user) {
            // Load profile then redirect to dashboard
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

            // Show home briefly then navigate to dashboard (replace history)
            showHome();
            try {
              router.replace('/dashboard');
            } catch (e) {
              console.warn('Router replace failed', e);
            }
          } else {
            if (view !== 'reset') {
              showLogin();
            }
          }
        });

        // Handle incoming URL for in-app reset flow: ?mode=resetPassword&oobCode=...
        const params = new URLSearchParams(location.search);
        const mode = params.get('mode');
        const oobCode = params.get('oobCode');

        if (mode === 'resetPassword' && oobCode) {
          // Store the code so resetPassword() can use it
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
      // onAuthStateChanged will update UI and redirect
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
      // onAuthStateChanged will redirect to /dashboard
    } catch (err) {
      setAuthMessage(friendlyAuthError(err));
    }
  }

  async function handleSignOut() {
    try {
      const { authMod, auth } = firebaseRef.current;
      const { signOut } = authMod;
      await signOut(auth);
      currentUserRef.current = null;
      showLogin();
      router.push('/');
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
        url: `${location.origin}${location.pathname}?mode=resetPassword`,
      };
      await sendPasswordResetEmail(auth, forgotEmail, actionCodeSettings);
      setForgotMessage('Reset email sent. Check your inbox.');
    } catch (err) {
      setForgotMessage(friendlyAuthError(err));
    }
  }

  async function handleResetPassword() {
    setResetMessage('');
    const newPass = resetPasswordInput;
    const confirm = resetPasswordConfirm;
    const oobCode = currentOobCodeRef.current;
    if (!oobCode) { setResetMessage('Reset code missing or invalid.'); return; }
    if (!newPass) { setResetMessage('Enter a new password.'); return; }
    if (newPass.length < 6) { setResetMessage('Password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setResetMessage('Passwords do not match.'); return; }

    try {
      const { authMod, auth } = firebaseRef.current;
      const { confirmPasswordReset, signInWithEmailAndPassword } = authMod;
      await confirmPasswordReset(auth, oobCode, newPass);
      setResetMessage('Password updated. Signing you in...');
      // If we have the email from verifyPasswordResetCode, attempt to sign in automatically.
      const emailToSignIn = resetEmailRef.current;
      if (emailToSignIn) {
        try {
          await signInWithEmailAndPassword(auth, emailToSignIn, newPass);
          setResetMessage('Password updated and signed in.');
          // onAuthStateChanged will redirect
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
      // onAuthStateChanged will redirect to /dashboard
    } catch (err) {
      setAuthMessage(friendlyAuthError(err));
    }
  }

  // Enter app -> navigate to dashboard. Ensure user is signed in (otherwise go to login).
  function handleEnterApp() {
    if (currentUserRef.current) {
      router.push('/dashboard');
    } else {
      setAuthMessage('Please sign in to enter the app.');
      showLogin();
    }
  }

  // handle reset link if present before Firebase init
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      currentOobCodeRef.current = oobCode;
      showReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-root" role="main">
      {/* LOGIN view */}
      {view === 'login' && (
        <div className="container" id="login">
          <div className="subtitle">Not the end—just a moment to rest.</div>
          <div className="logo"><a href="/" className="brand-logo" aria-label="Semi-colonic home">
            <img src="/semi-colonic-logo.png" alt="Semi-colonic" /></a>colonic
          </div>

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
                {/* Google icon */}
                <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false"><path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.4-4-50.9H272v96.4h147.4c-6.3 34-25.4 62.9-54 82.1v68h87.3c51-47 80.8-116.4 80.8-195.6z"/><path fill="#34a853" d="M272 544.3c73.6 0 135.4-24.4 180.5-66.3l-87.3-68c-24.3 16.3-55.6 25.9-93.2 25.9-71.6 0-132.4-48.2-154.1-113.1H28.7v70.9C73 488 164.8 544.3 272 544.3z"/><path fill="#fbbc05" d="M117.9 324.9c-10.6-31.4-10.6-65.3 0-96.7V157.3H28.7C-7.1 215.4-7.1 328.9 28.7 386.9l89.2-62z"/><path fill="#ea4335" d="M272 106.1c39.9-.6 78.1 14.2 107.3 40.6l80.4-80.4C405.6 24.8 344 0 272 0 164.8 0 73 56.3 28.7 143.8l89.2 62C139.6 154.3 200.4 106.7 272 106.1z"/></svg>
                <span style={{ marginLeft: 8 }}>Continue with Google</span>
              </button>
            </div>

            <div className="message" aria-live="polite">{authMessage}</div>
          </div>
          <div className="footer">You’re safe to pause here.</div>
        </div>
      )}

      {/* HOME view (profile-like mobile card) */}
      {view === 'home' && (
        <div className="container" id="home">
          <div className="profile-card">
            <div className="cover" aria-hidden />
            <div className="profile-body">
              <div className="avatar"><img src="/semi-colonic-logo.png" alt="Semi-colonic avatar" /></div>
              <div className="profile-header">
                <div className="logo"><a href="/" className="brand-logo" aria-label="Semi-colonic home">
  <img src="/semi-colonic-logo.png" alt="Semi-colonic" />
</a></div>
                <div className="subtitle small">Not the end—just a moment to rest.</div>
              </div>

              <div className="cta-row">
                <button className="outline-btn">Invite</button>
                <button className="primary-btn" onClick={() => alert('Chat placeholder')}>Chat with Us</button>
              </div>

              <nav className="tabs">
                <button className="tab active">Home</button>
                <button className="tab">Features</button>
                <button className="tab">Games</button>
                <button className="tab">Login</button>
              </nav>

              <div className="card content-card">
                <p>Semi-colonic is where you can share posts, stay updated and chat with others in my community.</p>
                <hr/>
                <div className="get-in-touch">
                  <div>
                    <div className="muted-label">Get in Touch</div>
                    <div>Semi-colonic</div>
                  </div>
                  <button className="outline-btn small">Message</button>
                </div>
                <div className="invite-code">
                  <div className="muted-label">TTASOK</div>
                  <div>Invite Code</div>
                </div>
                <div className="social-row">
                  <button className="social">IG</button>
                  <button className="social">FB</button>
                  <button className="social">X</button>
                  <button className="social">YT</button>
                  <button className="social">TT</button>
                </div>
              </div>

              <div className="enter-row">
                <button id="enter-app" className="enter-btn" onClick={handleEnterApp}>Enter app</button>
                <button id="sign-out-btn" className="signout-btn" onClick={handleSignOut}>Sign out</button>
              </div>

              <div className="message small" id="user-info">{userInfo}</div>
            </div>
          </div>

          <div className="footer">The tide goes out. The tide comes back.</div>
        </div>
      )}

      {/* SIGNUP / FORGOT / RESET views (kept) */}
      {view === 'signup' && (
        <div className="container" id="signup">
          <div className="logo"><a href="/" className="brand-logo" aria-label="Semi-colonic home">
  <img src="/semi-colonic-logo.png" alt="Semi-colonic" />
</a></div>
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

      {view === 'forgot' && (
        <div className="container" id="forgot">
          <div className="logo"><a href="/" className="brand-logo" aria-label="Semi-colonic home">
  <img src="/semi-colonic-logo.png" alt="Semi-colonic" />
</a></div>
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

      {view === 'reset' && (
        <div className="container" id="reset">
          <div className="logo"><a href="/" className="brand-logo" aria-label="Semi-colonic home">
  <img src="/semi-colonic-logo.png" alt="Semi-colonic" />
</a></div>
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

      <style jsx>{`
        /* keep the same CSS you had previously (mobile-first, iPad-friendly) */
        :root {
          --night-bg: #0b1324;
          --night-card: #121b34;
          --muted-light: #8f9dc6;
          --primary-cta: #6f89a8;
          --primary-cta-strong: #5b7895;
          --card-radius: 18px;
        }

        .page-root { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:18px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .container { width:100%; max-width:420px; margin:0 auto; }

        /* profile card */
        .profile-card { border-radius: 20px; overflow:hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .cover { height:140px; background: linear-gradient(90deg, #274a66, #3e6f93); background-size: cover; }
        .profile-body { background:white; border-top-left-radius: var(--card-radius); border-top-right-radius: var(--card-radius); transform: translateY(-28px); padding: 0 18px 20px 18px; box-shadow: 0 6px 20px rgba(15,30,50,0.06); }

        .avatar { width:72px; height:72px; border-radius:14px; background:#fff; display:flex; align-items:center; justify-content:center; color:#1f3f57; box-shadow: 0 6px 12px rgba(0,0,0,0.12); transform: translateY(-36px); margin-bottom:-26px; border:3px solid #fff; position:relative; }
        .profile-header { text-align:left; padding-left:2px; margin-top:6px; }
        .profile-header .logo { font-size:1.6rem; font-weight:700; color:#183547; }
        .profile-header .subtitle { margin-top:6px; color:#617489; }

        .cta-row { display:flex; gap:12px; margin-top:12px; }
        .outline-btn { flex:1; background:transparent; border:1px solid rgba(88,109,139,0.14); padding:12px 16px; border-radius:28px; color:#274a66; font-weight:600; }
        .primary-btn { flex:1; background: linear-gradient(90deg, var(--primary-cta), var(--primary-cta-strong)); color:#fff; padding:12px 16px; border-radius:28px; border:none; font-weight:700; }

        .tabs { display:flex; gap:12px; margin-top:16px; overflow:auto; }
        .tab { background:transparent; border:none; padding:8px 6px; color:#2e4a62; font-weight:600; }
        .tab.active { border-bottom:3px solid var(--primary-cta); color: var(--primary-cta-strong); }

        .content-card { margin-top:14px; padding:14px; border-radius:12px; background:#fafafa; color:#222; }
        .get-in-touch { display:flex; justify-content:space-between; align-items:center; margin-top:12px; }
        .muted-label { color:#7b8899; font-weight:700; margin-bottom:4px; }

        .social-row { display:flex; gap:8px; margin-top:14px; }
        .social { flex:1; border-radius:999px; background:#fff; border:1px solid rgba(0,0,0,0.05); padding:10px; }

        .enter-row { display:flex; gap:10px; margin-top:16px; }
        .enter-btn { flex:1; background: linear-gradient(90deg,var(--sand, #d8b37b),var(--clay, #c87a3c)); color:#fff; padding:12px; border-radius:14px; border:none; font-weight:700; }
        .signout-btn { flex:1; background:#f1f1f1; color:#222; padding:12px; border-radius:14px; border:none; }

        /* Login card styles */
        .card { border-radius:16px; padding:18px; background: linear-gradient(180deg,#16204a,var(--night-card)); color: var(--text-light); box-shadow: 0 18px 45px rgba(0,0,0,0.3); }
        .logo { font-size:2.4rem; font-weight:700; margin-bottom:8px; color:#fff; text-align:center; }
        .subtitle { font-size:0.9rem; color: var(--muted-light); text-align:center; margin-bottom:6px; }

        input { width:100%; padding:12px; margin-bottom:10px; border-radius:12px; border:none; background:#0f1733; color:var(--text-light); }
        .muted { background:transparent;border:1px solid rgba(255,255,255,0.06);color:inherit;padding:10px;border-radius:12px; width:48%; }

        .footer { margin-top:18px; font-size:0.8rem; color:#7b8899; text-align:center; }

        @media (max-width: 420px) {
          .cover { height:120px; }
          .avatar { width:64px; height:64px; transform: translateY(-32px); margin-bottom:-22px; }
          .profile-body { padding: 0 14px 18px 14px; }
        }

        @media (min-width: 768px) {
          .container { max-width:720px; }
          .cover { height:200px; }
          .avatar { width:88px; height:88px; border-radius:18px; transform: translateY(-44px); margin-bottom:-34px; }
          .profile-body { padding: 0 28px 28px 28px; transform: translateY(-40px); }
          .profile-header .logo { font-size:2rem; }
          .cta-row { gap:18px; }
          .enter-row { gap:16px; }
        }
      `}</style>
    </div>
  );
}
