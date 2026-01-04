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
            <img src="/semi-colonic-logo.png" alt="Semi-colonic" /></a>Semi-Colonic
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
                <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false"><path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.4-4-50.9H272v9[...]
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
            <input value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)} id="signup-password-confirm" type="password" placeholder="Confirm password" autoComplete="ne[...]
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
        /* refined theme tokens */
        :root {
          --night-bg: #071025;
          --night-card: rgba(11,20,40,0.7);
          --muted-light: #9aa6d9;
          --text-light: #eef1ff;
          --primary-cta: #7aa2ff;
          --secondary-cta: #6f89a8;
          --card-radius: 20px;
          --card-padding: 20px;
          --soft-shadow: 0 10px 30px rgba(6,20,40,0.45);
          --elev-shadow: 0 6px 18px rgba(6,20,40,0.18);
        }

        /* base */
        .page-root { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:28px; font-family:"Helvetica Neue", Helvetica, Arial, sans-serif; }
        .container { width:100%; max-width:420px; margin:0 auto; text-align:center; }

        /* Card (layered gradient + soft elevation) */
        .card {
          border-radius: var(--card-radius);
          padding: var(--card-padding);
          color: var(--text-light);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),
            linear-gradient(180deg, rgba(30,45,70,0.06), rgba(10,18,34,0.04));
          box-shadow:
            0 24px 60px rgba(6,20,40,0.45),
            0 8px 18px rgba(6,20,40,0.12),
            inset 0 1px 0 rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(6px);
        }

        /* Login-specific look: richer deep blue card */
        body.login .card, #login-card {
          background:
            linear-gradient(180deg, rgba(18,34,64,0.96), rgba(8,15,30,0.95));
          box-shadow:
            0 28px 80px rgba(4,12,28,0.65),
            0 6px 16px rgba(4,12,28,0.28);
          border: 1px solid rgba(255,255,255,0.04);
          color: var(--text-light);
        }

        /* Logo + subtitle */
        .logo { font-size:1.95rem; font-weight:700; margin-bottom:12px; color:var(--text-light); display:flex; align-items:center; justify-content:center; gap:10px; }
        .subtitle { font-size:0.95rem; color: var(--muted-light); text-align:center; margin-bottom:8px; }

        /* Inputs - constrained and centered */
        input {
          width:100%;
          max-width:200px;          /* enforce your requirement */
          display:block;
          margin:10px auto;
          padding:12px 14px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: #ffffff;
          font-size:1rem;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }
        input::placeholder { color: rgba(255,255,255,0.65); }

        /* Buttons - consistent, centered */
        button {
          font-family: inherit;
          font-weight:700;
          border-radius:14px;
          padding:10px 14px;
          cursor:pointer;
          border: none;
          display:inline-flex;
          align-items:center;
          justify-content:center;
        }

        #sign-in-btn, #create-account-btn, #reset-password-btn {
          width: 100%;
          max-width: 220px;
          margin: 12px auto 6px;
          background: linear-gradient(90deg, var(--primary-cta), #a3c3ff);
          color: #07233e;
          box-shadow: 0 10px 30px rgba(106,141,191,0.18);
        }

        .muted {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
          padding:10px;
          width:48%;
          box-sizing:border-box;
        }

        /* Action row layout for inline buttons */
        .row.action-row {
          display:flex;
          gap:12px;
          justify-content:center;
          align-items:center;
          margin-top:8px;
        }

        .centered-row { display:flex; justify-content:center; margin-top:8px; }

        /* Google sign-in center + subtle white background pill */
        .google-btn {
          margin: 12px auto 0;
          background: rgba(255,255,255,0.98);
          color: #0b1b2b;
          border-radius: 999px;
          padding:10px 14px;
          max-width:280px;
          width:100%;
          box-shadow: 0 8px 22px rgba(8,20,40,0.14);
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:10px;
        }
        .google-btn svg { flex:0 0 auto; }

        /* Home / profile card refinements (glass + layered gradient) */
        .profile-card {
          border-radius: 22px;
          overflow:hidden;
          box-shadow: 0 20px 60px rgba(6,20,40,0.08);
        }
        .cover { height:140px; background: linear-gradient(90deg, #274a66, #3e6f93); background-size: cover; }
        .profile-body {
          background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92));
          border-top-left-radius: var(--card-radius);
          border-top-right-radius: var(--card-radius);
          transform: translateY(-28px);
          padding: 12px 18px 22px 18px;
          box-shadow: 0 6px 24px rgba(10,20,40,0.06);
          color: #183547;
        }

        .avatar { width:72px; height:72px; border-radius:14px; background:#fff; display:flex; align-items:center; justify-content:center; color:#1f3f57; box-shadow: 0 8px 20px rgba(6,20,40,0.08); overflow:hidden; }

        /* content card (light) */
        .content-card {
          margin-top:14px;
          padding:14px;
          border-radius:12px;
          background: linear-gradient(180deg, #ffffff, #fbfdff);
          color:#222;
          box-shadow: 0 8px 20px rgba(6,20,40,0.04);
        }

        /* small helpers */
        .muted-label { color:#7b8899; font-weight:700; margin-bottom:4px; }
        .footer { margin-top:18px; font-size:0.85rem; color: #9aa6d9; text-align:center; }

        /* responsive tweaks */
        @media (max-width: 420px) {
          .cover { height:120px; }
          .avatar { width:64px; height:64px; transform: translateY(-32px); margin-bottom:-22px; }
          .profile-body { padding: 0 14px 18px 14px; }
          input { max-width: 200px; }
        }

        @media (min-width: 768px) {
          .container { max-width:720px; }
          .cover { height:200px; }
          .avatar { width:88px; height:88px; border-radius:18px; transform: translateY(-44px); margin-bottom:-34px; }
          .profile-body { padding: 0 28px 28px 28px; transform: translateY(-40px); }
        }
      `}</style>
    </div>
  );
}
