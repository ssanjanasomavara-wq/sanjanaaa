import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import QuoteBanner from '../components/QuoteBanner';
import ImageGrid from '../components/ImageGrid';
import { SEASIDE_IMAGES, QUOTES } from '../lib/themeConstants';

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
          <div className="logo">
            <a href="/" className="brand-logo" aria-label="Semi-colonic home">
              <img src="/semi-colonic-logo.png" alt="Semi-colonic" />
            </a>
          </div>

          <div className="card" id="login-card" role="region" aria-labelledby="login-title">
            <input value={email} onChange={(e) => setEmail(e.target.value)} id="email" type="email" placeholder="Email" autoComplete="username" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} id="password" type="password" placeholder="Password" autoComplete="current-password" />
            <button id="sign-in-btn" onClick={handleSignIn} className="btn-cta">Log in</button>

            <div className="row action-row">
{/* <button onClick={() => { showHome(); setUserInfo('Guest — limited access.'); }} className="muted">Guest</button> */}
              <button id="show-signup-btn" onClick={showSignUp} className="muted">Sign up</button>
              <button onClick={showForgot} className="muted small">Forgot Password?</button>
            </div>

            <center><div className="google-row">
              <button onClick={handleGoogleSignIn} className="google-btn" aria-label="Continue with Google">
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false" role="img">
                  <path fill="#fbbc05" d="M43.6 20.1H42V20H24v8h11.2c-1.1 4-4 7.4-8.2 9.2l0 .1 6.2 4.8c3.6-3.3 6-8.2 6-13.9 0-1.1-.1-2.1-.6-3.2z"/>
                  <path fill="#ea4335" d="M6.3 14.7l6.8 5c1.8-3.8 5.6-6.4 10-6.4 2.6 0 4.9.9 6.7 2.4l5-5.1C30.6 6.1 27 5 23 5 15.3 5 9 9.6 6.3 14.7z"/>
                  <path fill="#34a853" d="M24 43c6 0 10.9-2 14.6-5.4l-7-5.4c-2.2 1.5-5 2.4-7.6 2.4-5 0-9.2-3.2-10.8-7.7L6.5 34.7C9.3 39.6 15 43 24 43z"/>
                  <path fill="#4285f4" d="M43.6 20.1c0-1.2-.1-2.4-.4-3.5H24v6.8h11.2c-.5 2.5-1.9 4.6-3.9 6.1l.1.1 6.2 4.8c3.6-3.3 6-8.2 6-13.9z"/>
                </svg>
                <span style={{ marginLeft: 6 }}>Continue with Google</span>
              </button>
            </div></center>

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
                <button className="btn btn-primary">Invite</button>
                <button className="btn btn-primary" onClick={() => alert('Sign-in to chat with us')}>Chat with Us</button>
              </div>

              <nav className="tabs">
                <button className="tab active">Home</button>
                <button className="tab">Features</button>
                <button className="tab">Games</button>
                <button className="tab">Login</button>
              </nav>

              <div className="card content-card">
                <p>Semi-colonic is where you can share posts, stay updated and chat with others in my community.</p>
                
                <QuoteBanner 
                  quote={QUOTES.home.quote}
                  author={QUOTES.home.author}
                />
                
                <ImageGrid images={SEASIDE_IMAGES} />
                
                <hr/>
                
              </div>

              <div className="enter-row">
                <button id="enter-app" className="btn btn-primary" onClick={handleEnterApp}>Enter app</button>
                <button id="sign-out-btn" className="btn" onClick={handleSignOut}>Sign out</button>
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
            <button id="create-account-btn" onClick={handleSignUp} className="btn-cta">Create account</button>
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
            <button onClick={handleSendResetEmail} className="btn-cta">Send reset email</button>
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
            <button id="reset-password-btn" onClick={handleResetPassword} className="btn-cta">Reset password</button>
            <div className="row action-row">
              <button onClick={showLogin} className="muted">Back</button>
            </div>
            <div className="message" aria-live="polite">{resetMessage}</div>
          </div>
          <div className="footer">If the link is expired, request a new reset email from the login view.</div>
        </div>
      )}

      <style jsx>{`
        /* Minimal page-specific styles - most styling comes from theme.css */
        .page-root { 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 28px; 
        }
        
        .container { 
          width: 100%; 
          max-width: 420px; 
          margin: 0 auto; 
          text-align: center; 
        }

        /* Set body background for login/signup/forgot/reset screens */
        body.login {
          background-color: #B0E0E6;
        }

        /* Login-specific dark card override */
        body.login .card, #login-card {
          background: linear-gradient(180deg, #06b6d4, rgba(8, 15, 30, .95));
          color: var(--text-light);
        }

        body.login input {
          background: rgba(255,255,255,0.03);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.06);
        }
        
        body.login input::placeholder {
          color: rgba(255,255,255,0.65);
        }

        .logo { 
          font-size: 1.95rem; 
          font-weight: 700; 
          margin-bottom: 12px; 
          color: var(--text-primary); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 10px; 
        }

        /* ensure logo images are centered and constrained to brand-friendly size */
        .logo img {
          display: block;
          margin: 0 auto;
          max-width: 300px;
          max-height: 300px;
          width: auto;
          height: auto;
        }
        
        .subtitle { 
          font-size: 0.95rem; 
          color: var(--text-muted); 
          text-align: center; 
          margin-bottom: 8px; 
        }
        
        body.login .subtitle {
          color: var(--muted-light, #9aa6d9);
        }

        /* Input constraints */
        input {
          max-width: 200px;
          width: 100%;
          display: block;
          margin: 10px auto;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 1rem;
        }

        /* Button overrides for login page */
        .btn-cta {
          width: 100%;
          max-width: 220px;
          margin: 12px auto 6px;
          background: var(--cta-gradient);
          color: var(--cta-text);
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        /* Muted buttons now size to content and center as a group */
        .muted { 
          background:var(--cta-gradient); 
          border: 1px solid rgba(255,255,255,0.06); 
          color: rgba(66, 77, 77, 0.85); 
          padding: 10px 14px; 
          display: inline-block;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .muted.small {
          padding: 8px 10px;
          font-size: 0.92rem;
        }

        /* Center action row items similarly to .card */
        .row.action-row { 
          display: flex; 
          gap: 12px; 
          justify-content: center; 
          align-items: center; /* vertically center items */
          margin-top: 8px;
          flex-wrap: wrap;
          text-align: center; /* make child inline content centered */
        }

        .centered-row { 
          display: flex; 
          justify-content: center; 
          margin-top: 8px; 
        }

        /* ensure google row centers its contents both horizontally and vertically */
        .google-row {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 12px;
          width: 100%;
          text-align: center;
          flex-wrap: wrap;
        }

        .google-btn {
          margin: 0;
          background: rgba(255,255,255,0.98);
          color: #0b1b2b;
          border-radius: 999px;
          padding: 10px 14px;
          max-width: 300px;
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        /* Home view specific */
        .cover { 
          height: 140px; 
          background: linear-gradient(90deg, var(--color-sky-soft), var(--color-aqua-mist)); 
        }
        
        .profile-body { 
          background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92)); 
          transform: translateY(-28px); 
          padding: 12px 18px 22px 18px; 
          color: var(--text-primary); 
        }

        .avatar { 
          width: 72px; 
          height: 72px; 
          border-radius: 14px; 
          background: #fff; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden; 
        }
        
        .avatar img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }

        .cta-row { 
          display: flex; 
          gap: 10px; 
          margin-top: 12px; 
        }
        
        .tabs { 
          display: flex; 
          gap: 8px; 
          margin-top: 12px; 
          flex-wrap: wrap; 
        }
        
        .tab { 
          padding: 8px 12px; 
          border-radius: 10px; 
          background: transparent; 
          border: 1px solid rgba(6,20,40,0.04); 
          cursor: pointer; 
        }

        .get-in-touch { 
          display: flex; 
          justify-content: space-between; 
          margin-top: 12px; 
        }
        
        .invite-code { 
          margin-top: 12px; 
        }
        
        .social-row { 
          display: flex; 
          gap: 8px; 
          margin-top: 12px; 
          flex-wrap: wrap; 
        }
        
        .social-btn { 
          flex: 1; 
          min-width: 50px; 
          padding: 10px; 
          border-radius: 10px; 
          background: #fff; 
          border: 1px solid rgba(0,0,0,0.05); 
          cursor: pointer; 
        }

        .enter-row { 
          display: flex; 
          gap: 10px; 
          margin-top: 18px; 
          justify-content: center; 
        }

        .footer { 
          margin-top: 18px; 
          font-size: 0.85rem; 
          color: var(--text-muted); 
          text-align: center; 
        }

        .message { 
          margin-top: 12px; 
          color: var(--text-muted); 
        }

        @media (max-width: 420px) {
          .cover { height: 120px; }
          .avatar { width: 64px; height: 64px; }
          .profile-body { padding: 12px 14px 18px; }
        }
      `}</style>
    </div>
  );
}
