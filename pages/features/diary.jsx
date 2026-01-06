import Head from 'next/head';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../../lib/firebaseClient';

function formatDateKey(d = new Date()) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export default function Diary() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(null);
  const authRef = useRef(null);
  const authModRef = useRef(null);
  const userRef = useRef(null);
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]); // { key: dateKey, text, time }
  const [text, setText] = useState('');
  const [dateKey, setDateKey] = useState(formatDateKey());
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsub = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) {
          // No firebase configured — guests only
          setFirebaseAvailable(false);
          loadLocalEntries();
          setLoading(false);
          return;
        }

        const cfgJson = await resp.json();
        setCfg(cfgJson);

        // try to init firebase client (the same helper your dashboard uses)
        const res = await initFirebaseWithConfig(cfgJson);
        // initFirebaseWithConfig may return { auth, authMod, ... }
        const { auth, authMod } = res || {};
        authRef.current = auth || null;
        authModRef.current = authMod || null;

        // if auth module is available, subscribe to auth state
        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          setFirebaseAvailable(true);

          unsub = authMod.onAuthStateChanged(auth, async (u) => {
            if (!mounted) return;
            userRef.current = u;
            setUser(u || null);
            if (u) {
              await loadRemoteEntries(u, cfgJson, auth);
              // preload today's entry into textarea
              const todayKey = formatDateKey();
              const todays = entries.find((e) => e.key === todayKey);
              setText(todays ? todays.text : '');
            } else {
              // signed out -> load local entries
              loadLocalEntries();
            }
            setLoading(false);
          });
        } else {
          // No auth available -> guests only
          setFirebaseAvailable(false);
          loadLocalEntries();
          setLoading(false);
        }
      } catch (err) {
        console.error('Diary init error', err);
        // fallback to local-only mode
        setFirebaseAvailable(false);
        loadLocalEntries();
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load entries from localStorage
  function loadLocalEntries() {
    try {
      const map = JSON.parse(localStorage.getItem('diaryEntries') || '{}');
      const arr = Object.keys(map)
        .map((k) => ({ key: k, text: map[k].text, time: map[k].time }))
        .sort((a, b) => (a.key < b.key ? 1 : -1));
      setEntries(arr);
      const today = formatDateKey();
      setDateKey(today);
      setText(map[today] ? map[today].text : '');
    } catch (err) {
      console.error('Failed to load local diary entries', err);
      setEntries([]);
    }
  }

  // Load entries from Firebase Realtime Database using databaseURL + REST API
  async function loadRemoteEntries(u, cfgJson, authInstance) {
    try {
      if (!u || !cfgJson || !cfgJson.databaseURL) {
        setEntries([]);
        return;
      }
      const uid = u.uid;
      // get ID token for authenticated REST requests
      const token = authInstance && authInstance.currentUser && typeof authInstance.currentUser.getIdToken === 'function'
        ? await authInstance.currentUser.getIdToken()
        : null;

      const base = cfgJson.databaseURL.replace(/\/$/, '');
      // Get all entries for this user
      const url = `${base}/diaries/${encodeURIComponent(uid)}.json${token ? `?auth=${token}` : ''}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn('Could not fetch remote diary entries', resp.status);
        setEntries([]);
        return;
      }
      const body = await resp.json();
      if (!body) { setEntries([]); return; }
      const arr = Object.keys(body)
        .map((k) => ({ key: k, text: body[k].text, time: body[k].time }))
        .sort((a, b) => (a.key < b.key ? 1 : -1));
      setEntries(arr);
      const today = formatDateKey();
      setDateKey(today);
      setText(body[today] ? body[today].text : '');
    } catch (err) {
      console.error('loadRemoteEntries failed', err);
      setEntries([]);
    }
  }

  // Helper: perform a Realtime DB REST request with idToken, retrying once on 401 by forcing token refresh
  async function fetchWithAuth(path, options = {}) {
    if (!cfg || !cfg.databaseURL) throw new Error('No databaseURL configured');
    const authInstance = authRef.current;
    const base = cfg.databaseURL.replace(/\/$/, '');
    let token = null;

    // safe token retrieval (may throw if currentUser is null)
    try {
      token = authInstance && authInstance.currentUser && typeof authInstance.currentUser.getIdToken === 'function'
        ? await authInstance.currentUser.getIdToken()
        : null;
    } catch (tErr) {
      console.error('Error getting ID token', tErr);
      token = null;
    }

    const makeUrl = (tok) => `${base}${path}${tok ? `?auth=${tok}` : ''}`;

    let resp = await fetch(makeUrl(token), options);

    if (resp.status === 401 && authInstance && authInstance.currentUser && typeof authInstance.currentUser.getIdToken === 'function') {
      try {
        token = await authInstance.currentUser.getIdToken(true);
        resp = await fetch(makeUrl(token), options);
      } catch (refreshErr) {
        console.error('fetchWithAuth: token refresh failed', refreshErr);
      }
    }

    return resp;
  }

  async function handleSave() {
    if (!dateKey) return;
    const payload = { text: text || '', time: new Date().toLocaleString() };

    if (firebaseAvailable && userRef.current && cfg && cfg.databaseURL) {
      try {
        const uid = userRef.current.uid;
        const path = `/diaries/${encodeURIComponent(uid)}/${encodeURIComponent(dateKey)}.json`;

        const options = {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        };

        const resp = await fetchWithAuth(path, options);

        if (!resp.ok) {
          const bodyText = await resp.text().catch(() => '');
          throw new Error(`Failed saving remote diary (${resp.status}) ${bodyText}`);
        }

        await loadRemoteEntries(userRef.current, cfg, authRef.current);
      } catch (err) {
        console.error('Failed saving remote diary', err);
        alert(`Failed to save to server (${err && err.message ? err.message : 'unknown error'}). Your entry will be stored locally instead.`);
        saveLocalEntry(payload);
      }
    } else {
      saveLocalEntry(payload);
    }
  }

  function saveLocalEntry(payload) {
    try {
      const map = JSON.parse(localStorage.getItem('diaryEntries') || '{}');
      map[dateKey] = payload;
      localStorage.setItem('diaryEntries', JSON.stringify(map));
      loadLocalEntries();
    } catch (err) {
      console.error('Failed to save local diary entry', err);
    }
  }

  async function handleNewPage() {
    const ok = confirm('Start a new page? This will clear the current date entry.');
    if (!ok) return;

    if (firebaseAvailable && userRef.current && cfg && cfg.databaseURL) {
      try {
        const uid = userRef.current.uid;
        const path = `/diaries/${encodeURIComponent(uid)}/${encodeURIComponent(dateKey)}.json`;
        const resp = await fetchWithAuth(path, { method: 'DELETE' });
        if (!resp.ok) {
          const bodyText = await resp.text().catch(() => '');
          throw new Error(`Failed to delete remote entry (${resp.status}) ${bodyText}`);
        }
        await loadRemoteEntries(userRef.current, cfg, authRef.current);
        setText('');
      } catch (err) {
        console.error('Failed deleting remote entry', err);
        alert('Could not remove remote entry.');
      }
    } else {
      try {
        const map = JSON.parse(localStorage.getItem('diaryEntries') || '{}');
        delete map[dateKey];
        localStorage.setItem('diaryEntries', JSON.stringify(map));
        loadLocalEntries();
        setText('');
      } catch (err) {
        console.error('Failed clearing local entry', err);
      }
    }
  }

  async function handleDateChange(e) {
    const newKey = e.target.value;
    setDateKey(newKey);
    setText('');
    if (firebaseAvailable && userRef.current && cfg && cfg.databaseURL) {
      try {
        const uid = userRef.current.uid;
        const path = `/diaries/${encodeURIComponent(uid)}/${encodeURIComponent(newKey)}.json`;
        const resp = await fetchWithAuth(path);
        if (!resp.ok) { setText(''); return; }
        const body = await resp.json();
        setText(body ? body.text || '' : '');
      } catch (err) {
        console.error('Failed fetch day entry', err);
        setText('');
      }
    } else {
      try {
        const map = JSON.parse(localStorage.getItem('diaryEntries') || '{}');
        setText(map[newKey] ? map[newKey].text : '');
      } catch (err) {
        setText('');
      }
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading diary…</div>;
  }

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>My Diary — Semi‑Colonic</title>
      </Head>

      {/* Shared Topbar provides sign-in / sign-out and mobile drawer */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },

      ]} />

      <div className="site">
        <main className="main" role="main">
          <div className="card-wrap">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ margin: 0, color: '#3b6f7d' }}>My Diary</h2>
                <div style={{ fontSize: 13, color: '#7a9a8f' }}>{firebaseAvailable ? 'Saved to your account' : 'Saved locally'}</div>
              </div>

              <div style={{ color: '#7a9a8f', marginBottom: 12 }}>Daily entries — pick a date or use today.</div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <input type="date" value={dateKey} onChange={handleDateChange} style={{ padding: 8, borderRadius: 8, border: '1px solid #e6eef0' }} />
                <div style={{ flex: 1 }} />
                <button onClick={handleSave} className="btn" style={{ padding: '8px 12px', borderRadius: 12 }}>Save Entry</button>
                <button onClick={handleNewPage} className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: 12 }}>New Page</button>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your thoughts for today..."
                style={{ width: '100%', minHeight: 240, borderRadius: 10, border: '1px solid #e6eef0', padding: 12, resize: 'vertical', fontSize: 15, lineHeight: 1.5 }}
              />

              <hr style={{ margin: '18px 0', border: 'none', borderTop: '1px solid #eee' }} />

              <div style={{ fontWeight: 700, color: '#617489', marginBottom: 8 }}>Recent entries</div>
              <div>
                {entries.length === 0 && <div style={{ color: '#7b8899' }}>No entries yet.</div>}
                {entries.map((item) => (
                  <div key={item.key} style={{ background: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, boxShadow: '0 4px 10px rgba(20,40,60,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{item.key}</div>
                      <div style={{ color: '#6a8f8d', fontSize: 12 }}>{item.time}</div>
                    </div>
                    <div style={{ marginTop: 8, color: '#333', whiteSpace: 'pre-wrap' }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="site-footer" style={{ marginTop: 12 }}>
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved. Use of this site constitutes acceptance of our Terms and Privacy Policy.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --text-primary: #183547; --muted: #7b8899; --card-bg: #fdfefe; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; box-sizing: border-box; }

        .main { padding: 20px 18px; display:flex; justify-content:center; }
        .card-wrap { width:100%; display:flex; justify-content:center; }
        .card { width:100%; max-width:720px; background: var(--card-bg); padding: 24px; border-radius: 12px; box-shadow: 0 6px 18px rgba(20,40,60,0.06); box-sizing: border-box; }

        .btn { background: transparent; border: 1px solid rgba(6,20,40,0.06); padding: 8px 12px; border-radius: 10px; cursor: pointer; color: var(--text-primary); }

        @media (max-width: 820px) {
          .card { max-width: 640px; padding: 18px; }
        }

        @media (max-width: 420px) {
          .card { max-width: 340px; padding: 14px; }
          .main { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}