import Head from 'next/head';
import Link from 'next/link';

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

  async function handleSave() {
    if (!dateKey) return;
    const payload = { text: text || '', time: new Date().toLocaleString() };

    if (firebaseAvailable && userRef.current && cfg && cfg.databaseURL) {
      try {
        const authInstance = authRef.current;
        const uid = userRef.current.uid;

        let token = null;
        try {
          token = authInstance && authInstance.currentUser && typeof authInstance.currentUser.getIdToken === 'function'
            ? await authInstance.currentUser.getIdToken()
            : null;
        } catch (tErr) {
          // token retrieval may fail; surface it
          console.error('Error getting ID token', tErr);
          throw new Error('Failed to get authentication token: ' + (tErr && tErr.message ? tErr.message : tErr));
        }

        const base = cfg.databaseURL.replace(/\/$/, '');
        // Use PUT to set the entry for the specific date
        const url = `${base}/diaries/${encodeURIComponent(uid)}/${encodeURIComponent(dateKey)}.json${token ? `?auth=${token}` : ''}`;

        // Helpful debug logs so you can inspect Network/Console
        console.debug('Saving diary entry', { url, hasToken: !!token, dateKey, uid, payload });

        const resp = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          // include server response body in the thrown error for easier debugging
          const bodyText = await resp.text().catch(() => '');
          throw new Error(`Failed saving remote diary (${resp.status}) ${bodyText}`);
        }

        await loadRemoteEntries(userRef.current, cfg, authRef.current);
        alert('Entry saved to your account.');
      } catch (err) {
        console.error('Failed saving remote diary', err);
        alert(`Failed to save to server (${err && err.message ? err.message : 'unknown error'}). Your entry will be stored locally instead.`);
        saveLocalEntry(payload);
      }
    } else {
      // Guest or firebase not available -> localStorage
      saveLocalEntry(payload);
      alert('Saved locally in your browser.');
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
        const authInstance = authRef.current;
        const uid = userRef.current.uid;
        const token = authInstance && authInstance.currentUser && typeof authInstance.currentUser.getIdToken === 'function'
          ? await authInstance.currentUser.getIdToken()
          : null;
        const base = cfg.databaseURL.replace(/\/$/, '');
        const url = `${base}/diaries/${encodeURIComponent(uid)}/${encodeURIComponent(dateKey)}.json${token ? `?auth=${token}` : ''}`;
        // Delete the entry for this date
        const resp = await fetch(url, { method: 'DELETE' });
        if (!resp.ok) throw new Error('Failed to delete remote entry');
        await loadRemoteEntries(userRef.current, cfg, authRef.current);
        setText('');
      } catch (err) {
        console.error('Failed deleting remote entry', err);
        alert('Could not remove remote entry.');
      }
    } else {
      // local
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

  // Allow user to change date and load that day's content (local or remote)
  async function handleDateChange(e) {
    const newKey = e.target.value;
    setDateKey(newKey);
    setText('');
    if (firebaseAvailable && userRef.current && cfg && cfg.databaseURL) {
      // try to fetch the day's entry from remote
      try {
        const authInstance = authRef.current;
        const uid = userRef.current.uid;
        const token = authInstance && authInstance.currentUser && typeof authInstance.currentUser.getIdToken === 'function'
          ? await authInstance.currentUser.getIdToken()
          : null;
        const base = cfg.databaseURL.replace(/\/$/, '');
        const url = `${base}/diaries/${encodeURIComponent(uid)}/${encodeURIComponent(newKey)}.json${token ? `?auth=${token}` : ''}`;
        const resp = await fetch(url);
        if (!resp.ok) { setText(''); return; }
        const body = await resp.json();
        setText(body ? body.text || '' : '');
      } catch (err) {
        console.error('Failed fetch day entry', err);
        setText('');
      }
    } else {
      // local
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
      <div className="site">
        {/* Top navigation (matches dashboard layout & sizing) */}
        <header className="topbar" role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Link href="/" legacyBehavior>
              <a className="brand" aria-label="Semi-colonic home" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="brand-avatar"
                  aria-hidden
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flex: '0 0 40px',
                  }}
                >
                  <img src="/semi-colonic-logo.png" alt="Semi‑Colonic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontWeight: 700, color: '#183547' }}>Semi-colonic</span>
              </a>
            </Link>

            <nav className="desktop-nav" aria-label="Primary">
              <Link href="/posts" legacyBehavior><a style={{ marginRight: 12 }}>Posts</a></Link>
              <Link href="/chat" legacyBehavior><a style={{ marginRight: 12 }}>Chat</a></Link>
              <Link href="/features" legacyBehavior><a style={{ marginRight: 12 }}>Features</a></Link>
              <Link href="/games" legacyBehavior><a style={{ marginRight: 12 }}>Games</a></Link>
            </nav>
          </div>

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#556', fontSize: 14 }}>{user ? (user.email || user.uid) : 'guest'}</div>
              <button onClick={() => router.replace('/')} className="btn btn-outline" aria-label="Sign out">Sign out</button>
            </div>
          </div>
        </header>

        <main style={{ padding: 18, display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 720, width: '100%' }}>
            <div style={{ background: '#fdfefe', padding: 24, borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ margin: 0, color: '#3b6f7d' }}>My Diary</h2>
                <div style={{ fontSize: 13, color: '#7a9a8f' }}>{firebaseAvailable ? 'Saved to your account' : 'Saved locally'}</div>
              </div>

              <div style={{ color: '#7a9a8f', marginBottom: 12 }}>Daily entries — pick a date or use today.</div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
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
    </div>
  );
}
