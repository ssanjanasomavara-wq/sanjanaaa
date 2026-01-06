import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

const DEFAULT_SETTINGS = {
  displayName: '',
  photoURL: '',
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
  profilePublic: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const authRef = useRef(null);
  const authModRef = useRef(null);
  const firestoreRef = useRef(null);
  const firestoreModRef = useRef(null);
  const unsubRef = useRef(null);

  // Avatar state (using localStorage instead of Firebase Storage)
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false); // only used for UX (no remote upload)

  // Theme listener (for 'system' mode)
  const themeMediaQueryRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let initTimeout = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Missing firebase config');
        const cfg = await resp.json();

        const { auth, authMod, firestore, firestoreMod } = await initFirebaseWithConfig(cfg);

        authRef.current = auth;
        authModRef.current = authMod;
        firestoreRef.current = firestore;
        firestoreModRef.current = firestoreMod;

        // wait for auth to be ready and get current user (mirror dashboard behavior)
        const INIT_TIMEOUT_MS = 7000;
        initTimeout = setTimeout(() => {
          if (!mounted) return;
          router.replace('/');
        }, INIT_TIMEOUT_MS);

        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          const unsub = authMod.onAuthStateChanged(auth, (user) => {
            if (!mounted) return;
            if (initTimeout) { clearTimeout(initTimeout); initTimeout = null; }
            if (!user) {
              router.replace('/');
              return;
            }
            subscribeToSettings(user.uid);
          });
          unsubRef.current = unsub;
        } else {
          // fallback (shouldn't normally be hit)
          setTimeout(() => {
            const user = auth && auth.currentUser;
            if (!user) {
              router.replace('/');
              return;
            }
            subscribeToSettings(user.uid);
          }, 300);
        }
      } catch (err) {
        console.error('Settings init error', err);
        router.replace('/');
      }
    })();

    function subscribeToSettings(uid) {
      try {
        const firestore = firestoreRef.current;
        const firestoreMod = firestoreModRef.current;
        if (!firestore || !firestoreMod) {
          setError('Firestore not available');
          setLoading(false);
          return;
        }

        const docRef = firestoreMod.doc(firestore, 'users', uid);
        const unsubSnap = firestoreMod.onSnapshot(
          docRef,
          (snap) => {
            if (!mounted) return;
            if (snap && typeof snap.exists === 'function' && snap.exists()) {
              const data = snap.data() || {};
              const remote = data.settings || {};
              const merged = { ...DEFAULT_SETTINGS, ...remote };
              setSettings(merged);

              // Choose avatar: prefer a locally stored avatar for this user (localStorage) otherwise remote URL
              const local = loadAvatarFromLocal(uid);
              if (local) {
                setAvatarPreview(local);
              } else if (merged.photoURL) {
                setAvatarPreview(merged.photoURL);
              } else {
                setAvatarPreview('');
              }

              applyThemeClass(merged.theme);
            } else {
              setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev }));
              applyThemeClass(DEFAULT_SETTINGS.theme);
              setAvatarPreview('');
            }
            setLoading(false);
          },
          (err) => {
            console.error('settings onSnapshot error:', err);
            if (!mounted) return;
            setError('Failed to load settings: ' + err.message);
            setLoading(false);
          }
        );

        // keep reference for cleanup
        unsubRef.current = unsubSnap;
      } catch (err) {
        console.error('subscribeToSettings error', err);
        setError('Failed to subscribe to settings: ' + err.message);
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (unsubRef.current && typeof unsubRef.current === 'function') unsubRef.current();
      if (initTimeout) clearTimeout(initTimeout);
      removeThemeListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Apply theme class to <body>
  function applyThemeClass(theme) {
    if (typeof window === 'undefined') return;
    const body = document.body;
    removeThemeListener();
    body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'light') {
      body.classList.add('theme-light');
    } else if (theme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      // system: follow prefers-color-scheme and listen to changes
      const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      themeMediaQueryRef.current = mql;
      const applyFromSystem = (ev) => {
        const matches = ev.matches !== undefined ? ev.matches : ev;
        body.classList.toggle('theme-dark', matches);
        body.classList.toggle('theme-light', !matches);
      };
      if (mql) {
        applyFromSystem(mql);
        if (typeof mql.addEventListener === 'function') {
          mql.addEventListener('change', applyFromSystem);
        } else if (typeof mql.addListener === 'function') {
          mql.addListener(applyFromSystem);
        }
      }
    }
  }

  function removeThemeListener() {
    const mql = themeMediaQueryRef.current;
    if (!mql) return;
    try {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', () => {});
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(() => {});
      }
    } catch (err) {
      // ignore
    }
    themeMediaQueryRef.current = null;
  }

  // UI change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = { ...settings, [name]: type === 'checkbox' ? checked : value };
    setSettings(next);

    // If user changes theme in the form, apply immediately
    if (name === 'theme') {
      applyThemeClass(value);
    }

    // If user edits photoURL text input, validate and update preview
    if (name === 'photoURL') {
      if (value && isValidUrl(value)) {
        setAvatarPreview(value);
      } else if (!value) {
        // If user cleared the input, prefer localStorage avatar if any
        const auth = authRef.current;
        const uid = auth && auth.currentUser && auth.currentUser.uid;
        const local = uid ? loadAvatarFromLocal(uid) : null;
        if (local) setAvatarPreview(local);
        else setAvatarPreview('');
      }
    }
  };

  // Validate timezone by trying to construct Intl.DateTimeFormat
  function isValidTimezone(tz) {
    if (!tz || typeof tz !== 'string') return false;
    try {
      // try to create a formatter for the timezone
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch (err) {
      return false;
    }
  }

  function isValidUrl(candidate) {
    try {
      const u = new URL(candidate);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (err) {
      return false;
    }
  }

  // LocalStorage helpers for avatar data (data URL)
  function avatarStorageKey(uid) {
    return `semi-colonic-avatar:${uid}`;
  }

  function saveAvatarToLocal(uid, dataUrl) {
    try {
      localStorage.setItem(avatarStorageKey(uid), dataUrl);
    } catch (err) {
      console.warn('Failed to save avatar to localStorage', err);
    }
  }

  function loadAvatarFromLocal(uid) {
    try {
      return localStorage.getItem(avatarStorageKey(uid));
    } catch (err) {
      return null;
    }
  }

  // Avatar file selection (store in localStorage instead of uploading to firebase)
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Accept images only, limit size (e.g., 2.5MB)
    const MAX_BYTES = 2_500_000;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file for avatar.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Avatar too large. Please use an image under ~2.5MB.');
      return;
    }
    setError('');
    setUploading(true);
    setAvatarFile(file);

    // create data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarPreview(dataUrl);

      // Persist to localStorage for the current user
      const auth = authRef.current;
      const uid = auth && auth.currentUser && auth.currentUser.uid;
      if (uid) {
        try {
          saveAvatarToLocal(uid, dataUrl);
        } catch (err) {
          console.warn('Failed saving avatar to localStorage', err);
        }
      } else {
        // if no uid, still keep preview, but warn user that this will not persist across devices
        setError('Avatar stored locally in your browser. Sign in to persist per-user.');
      }

      setUploading(false);
    };
    reader.onerror = (err) => {
      console.error('FileReader error', err);
      setError('Failed to read image file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    const auth = authRef.current;
    const firestore = firestoreRef.current;
    const firestoreMod = firestoreModRef.current;
    if (!auth || !auth.currentUser) {
      setError('You must be signed in to save settings.');
      return;
    }
    if (!firestore || !firestoreMod) {
      setError('Firestore not available.');
      return;
    }

    // Validate timezone
    if (settings.timezone && !isValidTimezone(settings.timezone)) {
      setError('Invalid timezone. Please use an IANA timezone string (e.g. America/Los_Angeles).');
      return;
    }

    // Validate photoURL if provided and looks like a remote URL (we won't push local data URLs to Firestore)
    if (settings.photoURL && settings.photoURL.trim() && !isValidUrl(settings.photoURL)) {
      setError('Avatar URL is not valid. Use a full https:// or http:// URL or upload an image.');
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      const docRef = firestoreMod.doc(firestore, 'users', uid);

      // If the avatar preview is a local data URL, do NOT write a huge data URI into Firestore.
      // Instead keep it in localStorage only; we will write settings.photoURL only if it is a remote URL.
      const toSave = { ...settings };
      if (avatarPreview && avatarPreview.startsWith('data:')) {
        // remove photoURL for Firestore to avoid storing base64 data
        toSave.photoURL = settings.photoURL && isValidUrl(settings.photoURL) ? settings.photoURL : '';
      }

      await firestoreMod.setDoc(docRef, { settings: toSave }, { merge: true });
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setAvatarPreview('');
    applyThemeClass(DEFAULT_SETTINGS.theme);
  };

  const handleDeleteAccountData = () => {
    // destructive action placeholder — implement re-auth and server-side deletion in production
    alert(
      'Account deletion is destructive. Implement re-authentication and server-side removal before enabling in production.'
    );
  };

  // cleanup not-needed object URLs (we're using data URLs here, so nothing to revoke)
  useEffect(() => {
    return () => {
      removeThemeListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Settings — Semi-colonic</title>
      </Head>

      <div className="site" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 18px' }}>
        <header className="topbar" style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" legacyBehavior><a className="brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="brand-avatar" style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden' }}>
                <img src="/semi-colonic-logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="brand-text" style={{ fontWeight: 700 }}>Semi-colonic</span>
            </a></Link>
          </div>

          <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
            <Link href="/dashboard" legacyBehavior><a className="btn">Dashboard</a></Link>
          </div>
        </header>

        <main className="main-content" style={{ padding: '20px' }}>
          <section className="card" style={{ padding: 16, borderRadius: 12, background: '#fff', boxShadow: '0 6px 18px rgba(20,40,60,0.04)' }}>
            <header style={{ marginBottom: 12 }}>
              <h1 style={{ margin: 0 }}>Settings</h1>
              <p style={{ margin: '6px 0 0', color: '#617489' }}>Manage your account preferences</p>
            </header>

            {loading ? (
              <div style={{ padding: 18, textAlign: 'center' }}>Loading settings…</div>
            ) : (
              <form onSubmit={handleSave}>
                {error && <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>}

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <label className="form-label">
                    Display name
                    <input className="form-input" name="displayName" value={settings.displayName} onChange={handleChange} placeholder="What should we call you?" type="text" />
                  </label>

                  <label className="form-label">
                    Avatar URL
                    <input className="form-input" name="photoURL" value={settings.photoURL} onChange={handleChange} placeholder="https://..." type="text" />
                    <small style={{ display: 'block', color: '#7b8899' }}>Or upload an image below (stored locally in your browser)</small>
                  </label>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 84, height: 84, borderRadius: 10, background: '#fff', overflow: 'hidden', boxShadow: '0 6px 14px rgba(20,40,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ color: '#9aa9bb', fontSize: 12 }}>No avatar</div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'inline-block', marginBottom: 8 }}>
                          <input type="file" accept="image/*" onChange={handleAvatarFileChange} />
                        </label>
                        <div style={{ marginTop: 8 }}>
                          {uploading ? (
                            <div style={{ fontSize: 13, color: '#617489' }}>Processing avatar…</div>
                          ) : null}
                          <div style={{ fontSize: 12, color: '#7b8899', marginTop: 6 }}>
                            Note: uploaded avatar is stored in your browser (localStorage) for now.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="form-label">
                    Theme
                    <select className="form-input" name="theme" value={settings.theme} onChange={handleChange}>
                      <option value="system">System (follow OS)</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>

                  <label className="form-label">
                    Language
                    <select className="form-input" name="language" value={settings.language} onChange={handleChange}>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                    </select>
                  </label>

                  <label className="form-label">
                    Timezone
                    <input className="form-input" name="timezone" value={settings.timezone} onChange={handleChange} placeholder="Europe/London" type="text" />
                    <small style={{ display: 'block', color: '#7b8899' }}>Use IANA timezone name (e.g. America/Los_Angeles).</small>
                  </label>

                  <fieldset style={{ border: 'none', padding: 0, marginTop: 6 }}>
                    <legend style={{ fontWeight: 700, marginBottom: 8 }}>Notifications</legend>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <input type="checkbox" name="emailNotifications" checked={!!settings.emailNotifications} onChange={handleChange} /> Email notifications
                    </label>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <input type="checkbox" name="pushNotifications" checked={!!settings.pushNotifications} onChange={handleChange} /> Push notifications
                    </label>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <input type="checkbox" name="marketingEmails" checked={!!settings.marketingEmails} onChange={handleChange} /> Marketing emails
                    </label>
                  </fieldset>

                  <fieldset style={{ border: 'none', padding: 0, marginTop: 6 }}>
                    <legend style={{ fontWeight: 700, marginBottom: 8 }}>Privacy</legend>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <input type="checkbox" name="profilePublic" checked={!!settings.profilePublic} onChange={handleChange} /> Make profile public
                    </label>
                  </fieldset>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                  <button className="btn btn-primary" type="submit" disabled={saving} style={{ padding: '8px 14px', borderRadius: 10 }}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="btn" type="button" onClick={handleReset} disabled={saving} style={{ padding: '8px 14px', borderRadius: 10 }}>
                    Reset
                  </button>

                  <div style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-ghost btn-danger" type="button" onClick={handleDeleteAccountData} title="Delete account data (not implemented)" style={{ padding: '8px 12px', borderRadius: 10 }}>
                      Delete account data
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        </main>

        <footer className="site-footer" style={{ marginTop: 18, padding: 18, fontSize: 13, color: '#7b8899', textAlign: 'center' }}>
          © {new Date().getFullYear()} Semi‑Colonic.
        </footer>
      </div>

      <style jsx>{`
        /* small set of styles to match dashboard look & responsiveness */
        .brand-text { color: var(--text-primary, #183547); }
        .btn { background: transparent; border: 1px solid rgba(6,20,40,0.06); padding: 8px 12px; border-radius: 10px; cursor: pointer; }
        .btn-primary { background: var(--cta-strong, #1f9fff); color: #fff; border-color: transparent; }
        .btn-ghost { background: transparent; border: 1px solid rgba(6,20,40,0.04); }
        .btn-danger { color: #b00020; border-color: rgba(176,0,32,0.08); }
        .card { background: transparent; }
        @media (max-width: 600px) {
          .main-content { padding: 14px 6px; }
        }
        input.form-input, select.form-input {
          display: block;
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #e6eef6;
          margin-top: 6px;
        }
        label.form-label { display: block; font-weight: 700; color: #183547; }
        /* theme classes applied to body by settings page */
        body.theme-dark { background: #071022; color: #d7eaf6; }
        body.theme-dark .card { background: #071a2a; }
        body.theme-dark .btn { border-color: rgba(255,255,255,0.06); color: #e6f7ff; }
        body.theme-dark .btn-primary { background: #0b66b2; }
      `}</style>
    </div>
  );
}
