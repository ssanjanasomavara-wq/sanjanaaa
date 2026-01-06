import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig, isFirebaseInitialized } from '../lib/firebaseClient';
import Topbar from '../components/Topbar';

/**
 * Community Chat page (responsive update)
 *
 * - Uses shared <Topbar /> for top navigation and mobile drawer so sign-out is consistent with other pages
 * - Styled to match dashboard.jsx layout (centered site container, top navigation)
 * - Responsive for phones (iPhone), tablets (iPad) and desktop (PC)
 * - Keeps Firestore/local fallback behavior unchanged
 */

const CHANNELS = [
  { id: 'general', title: 'General' },
  { id: 'support', title: 'Support' },
  { id: 'offtopic', title: 'Off-topic' },
  { id: 'resources', title: 'Resources' },
];

export default function Chat() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(null);

  const authRef = useRef(null);
  const authModRef = useRef(null);
  const firestoreRef = useRef(null);
  const firestoreModRef = useRef(null);

  const [user, setUser] = useState(null);

  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState([]); // { id, name, uid?, text, createdAt }
  const [text, setText] = useState('');
  const [displayName, setDisplayName] = useState('');

  const unsubRef = useRef(null);
  const listRef = useRef(null);

  // Init firebase (if available) and subscribe to auth/messages
  useEffect(() => {
    let mounted = true;
    let authUnsub = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) {
          // No firebase configured: fallback to local only
          setCfg(null);
          setLoading(false);
          loadLocalMessages(channel);
          return;
        }

        const cfgJson = await resp.json();
        setCfg(cfgJson);

        const res = await initFirebaseWithConfig(cfgJson);
        // may contain auth, authMod, firestore, firestoreMod
        authRef.current = res.auth || null;
        authModRef.current = res.authMod || null;
        firestoreRef.current = res.firestore || null;
        firestoreModRef.current = res.firestoreMod || null;

        // subscribe to auth state if available
        if (authModRef.current && typeof authModRef.current.onAuthStateChanged === 'function') {
          authUnsub = authModRef.current.onAuthStateChanged(authRef.current, (u) => {
            if (!mounted) return;
            setUser(u || null);
          });
        } else {
          setUser(null);
        }

        setLoading(false);
      } catch (err) {
        console.error('Chat init error', err);
        setCfg(null);
        setLoading(false);
        loadLocalMessages(channel);
      }
    })();

    return () => {
      mounted = false;
      if (typeof authUnsub === 'function') authUnsub();
      if (typeof unsubRef.current === 'function') unsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to messages for selected channel (Firestore if available, else local)
  useEffect(() => {
    // clear previous subscription
    if (typeof unsubRef.current === 'function') {
      try { unsubRef.current(); } catch (e) {}
      unsubRef.current = null;
    }

    // If we have firestore module and instance, use realtime updates
    const fm = firestoreModRef.current;
    const f = firestoreRef.current;

    if (fm && f) {
      try {
        const { collection, query, orderBy, onSnapshot } = fm;
        // collection path: channels/{channel}/messages
        const col = collection(f, 'channels', channel, 'messages');
        const q = query(col, orderBy('createdAt', 'asc'));

        const unsub = onSnapshot(q, (snap) => {
          const arr = [];
          snap.forEach((doc) => {
            const d = doc.data();
            arr.push({
              id: doc.id,
              name: d.name || 'anonymous',
              uid: d.uid || null,
              text: d.text || '',
              createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
            });
          });
          setMessages(arr);
          // scroll to bottom after next paint
          setTimeout(() => scrollToBottom(), 50);
        }, (err) => {
          console.error('Realtime chat snapshot error', err);
          // fallback to local if snapshot fails
          loadLocalMessages(channel);
        });

        unsubRef.current = unsub;
      } catch (err) {
        console.error('Failed to subscribe to firestore messages', err);
        loadLocalMessages(channel);
      }
    } else {
      // local fallback
      loadLocalMessages(channel);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, cfg, firestoreRef.current, firestoreModRef.current]);

  // Scroll to bottom helper
  function scrollToBottom() {
    if (!listRef.current) return;
    try {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    } catch (e) {}
  }

  // Load messages from localStorage for a channel
  function loadLocalMessages(ch) {
    try {
      const key = `chat_${ch}`;
      const raw = localStorage.getItem(key) || '[]';
      const arr = JSON.parse(raw).map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
      setMessages(arr);
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      console.error('Failed loading local messages', err);
      setMessages([]);
    }
  }

  // Send message (Firestore if available, else local)
  async function sendMessage() {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    const nameToUse = user ? (user.displayName || user.email || user.uid) : (displayName ? displayName.trim() : 'guest');

    const fm = firestoreModRef.current;
    const f = firestoreRef.current;

    if (fm && f) {
      try {
        const { collection, addDoc, serverTimestamp } = fm;
        const colRef = collection(f, 'channels', channel, 'messages');
        await addDoc(colRef, {
          name: nameToUse,
          uid: user ? user.uid : null,
          text: trimmed,
          createdAt: serverTimestamp(),
        });
        setText('');
      } catch (err) {
        console.error('Failed to send message to firestore', err);
        alert('Failed to send message to server, saving locally instead.');
        saveLocalMessage({ name: nameToUse, text: trimmed, createdAt: new Date() });
        setText('');
      }
    } else {
      // local
      saveLocalMessage({ name: nameToUse, text: trimmed, createdAt: new Date() });
      setText('');
      // update local view immediately
      loadLocalMessages(channel);
    }
  }

  function saveLocalMessage(msg) {
    try {
      const key = `chat_${channel}`;
      const raw = localStorage.getItem(key) || '[]';
      const arr = JSON.parse(raw);
      arr.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, ...msg, createdAt: msg.createdAt.toString() });
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (err) {
      console.error('Failed to save local message', err);
    }
  }

  // small helper to format time
  function fmtTime(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading chat…</div>;

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Shared Topbar provides sign-in / sign-out button and mobile drawer */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
      ]} />

      <div className="site">
        <main style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
            {/* Channels */}
            <aside style={{ borderRadius: 12 }}>
              <div style={{ padding: 12, background: '#fff', borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.04)' }}>
                <div style={{ fontWeight: 800, color: '#183547', marginBottom: 8 }}>Channels</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CHANNELS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setChannel(c.id)}
                      className={`channel-btn ${c.id === channel ? 'active' : ''}`}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        background: c.id === channel ? 'linear-gradient(90deg,#d8b37b,#c87a3c)' : 'transparent',
                        color: c.id === channel ? '#fff' : '#183547',
                        fontWeight: 700,
                      }}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: '#617489' }}>
                  {cfg ? 'Connected to Firestore' : 'Local-only chat'}
                </div>
              </div>
            </aside>

            {/* Chat area */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 6px 18px rgba(20,40,60,0.04)', padding: 12, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, color: '#183547' }}>{CHANNELS.find((c) => c.id === channel)?.title}</div>
                  <div style={{ fontSize: 13, color: '#7a9a8f' }}>{messages.length} messages</div>
                </div>

                <div ref={listRef} style={{ overflowY: 'auto', flex: 1, padding: '8px 6px', borderTop: '1px solid #f1f5f7' }}>
                  {messages.length === 0 && <div style={{ color: '#7b8899', padding: 12 }}>No messages yet — say hello 👋</div>}
                  {messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef5f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#264653' }}>
                        {m.name ? m.name.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontWeight: 700, color: '#183547' }}>{m.name || 'anonymous'}</div>
                          <div style={{ color: '#7b8899', fontSize: 12 }}>{fmtTime(m.createdAt)}</div>
                        </div>
                        <div style={{ marginTop: 4, color: '#222', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Composer */}
                <div style={{ marginTop: 8 }}>
                  {!user && (
                    <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name (optional)"
                        style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e6eef0' }}
                      />
                      <div style={{ fontSize: 12, color: '#7a9a8f', alignSelf: 'center' }}>You are posting as guest</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Write a message… (Enter to send)"
                      style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #e6eef0', resize: 'none' }}
                    />
                    <button onClick={sendMessage} className="btn btn-strong" style={{ borderRadius: 10, padding: '10px 14px' }}>Send</button>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: '#7b8899' }}>
                    {cfg ? 'Messages are public to this community channel.' : 'Messages are stored locally in this browser.'}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="site-footer" style={{ marginTop: 12 }}>
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
        </footer>
      </div>

      <style jsx>{`
        :root { --max-width: 980px; --cta-strong: #1f9fff; --brand: #1f9fff; --text-primary: #183547; }

        html, body {
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text-primary);
        }

        .site-root { min-height: 100vh; padding: 0; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        .brand-avatar img { display: block; }
        .channel-btn:focus { outline: 2px solid rgba(20,40,60,0.08); }

        /* Button styles — visible in light theme */
        .btn { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: var(--brand); font-weight: 600; }
        .btn:focus { outline: 2px solid rgba(31,159,255,0.18); }
        .btn-outline { border: 1px solid rgba(6,20,40,0.08); background: #fff; padding: 6px 8px; border-radius: 8px; color: var(--brand); font-weight: 600; }
        .btn-strong { background: var(--cta-strong); color: #fff; padding: 8px 12px; border-radius: 8px; font-weight: 700; border: none; }
        .btn-delete { background: #c0392b; color: #fff; padding: 6px 8px; border-radius: 8px; }

        .site-footer { margin-top: 12px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        /* layout adjustments for responsiveness */
        @media (max-width: 980px) {
          .site { padding: 0 14px; }
        }

        @media (max-width: 820px) {
          main > div { grid-template-columns: 1fr; }
          aside { order: 2; }
          section { order: 1; }
        }

        @media (max-width: 600px) {
          .desktop-nav { display: none; }
          .brand-avatar { width: 40px; height: 40px; }
          .site { padding: 0 12px; }
          main { padding: 14px; }
        }

        @media (max-width: 420px) {
          .brand-avatar { width: 36px; height: 36px; }
        }
      `}</style>
    </div>
  );
}
