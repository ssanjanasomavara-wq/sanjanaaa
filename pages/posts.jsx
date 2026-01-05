import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

/**
 * Community Posts page
 *
 * - Public read of posts (Firestore or localStorage).
 * - Create/Edit/Delete available to authors (owner) and admins (custom claim 'admin' on ID token).
 * - Firestore document shape:
 *    posts/{postId} => { title, body, authorName, authorUid, published: bool, createdAt, updatedAt }
 */

export default function Posts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(null);

  const authRef = useRef(null);
  const authModRef = useRef(null);
  const firestoreRef = useRef(null);
  const firestoreModRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // { id?, title, body, published }
  const [showEditor, setShowEditor] = useState(false);

  const unsubRef = useRef(null);

  // init firebase (if available)
  useEffect(() => {
    let mounted = true;
    let authUnsub = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) {
          setCfg(null);
          setLoading(false);
          loadLocalPosts();
          return;
        }

        const cfgJson = await resp.json();
        setCfg(cfgJson);

        const res = await initFirebaseWithConfig(cfgJson);
        authRef.current = res.auth || null;
        authModRef.current = res.authMod || null;
        firestoreRef.current = res.firestore || null;
        firestoreModRef.current = res.firestoreMod || null;

        if (authModRef.current && typeof authModRef.current.onAuthStateChanged === 'function') {
          authUnsub = authModRef.current.onAuthStateChanged(authRef.current, async (u) => {
            if (!mounted) return;
            setUser(u || null);
            setIsAdmin(false);
            if (u) {
              // check ID token claims for admin/author roles
              try {
                const tokenRes = await u.getIdTokenResult();
                const claims = tokenRes && tokenRes.claims ? tokenRes.claims : {};
                setIsAdmin(Boolean(claims.admin || claims.role === 'admin'));
              } catch (err) {
                console.warn('Could not read token claims', err);
              }
            } else {
              setIsAdmin(false);
            }
          });
        } else {
          setUser(null);
          setIsAdmin(false);
        }

        setLoading(false);
      } catch (err) {
        console.error('Posts init error', err);
        setCfg(null);
        setLoading(false);
        loadLocalPosts();
      }
    })();

    return () => {
      mounted = false;
      if (typeof authUnsub === 'function') authUnsub();
      if (typeof unsubRef.current === 'function') unsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // subscribe posts (firestore or local)
  useEffect(() => {
    // clear previous
    if (typeof unsubRef.current === 'function') {
      try { unsubRef.current(); } catch (e) {}
      unsubRef.current = null;
    }

    const fm = firestoreModRef.current;
    const f = firestoreRef.current;

    if (fm && f) {
      try {
        const { collection, query, orderBy, onSnapshot } = fm;
        const col = collection(f, 'posts');
        const q = query(col, orderBy('createdAt', 'desc'));

        const unsub = onSnapshot(q, (snap) => {
          const arr = [];
          snap.forEach((doc) => {
            const d = doc.data();
            arr.push({
              id: doc.id,
              title: d.title || '',
              body: d.body || '',
              authorName: d.authorName || 'anonymous',
              authorUid: d.authorUid || null,
              published: typeof d.published === 'boolean' ? d.published : true,
              createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
              updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : null,
            });
          });
          setPosts(arr);
        }, (err) => {
          console.error('Realtime posts snapshot error', err);
          loadLocalPosts();
        });

        unsubRef.current = unsub;
      } catch (err) {
        console.error('Failed to subscribe to firestore posts', err);
        loadLocalPosts();
      }
    } else {
      loadLocalPosts();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, firestoreRef.current, firestoreModRef.current]);

  function loadLocalPosts() {
    try {
      const raw = localStorage.getItem('posts') || '[]';
      const arr = JSON.parse(raw).map((p) => ({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : null,
      }));
      // sort desc
      arr.sort((a, b) => (b.createdAt - a.createdAt));
      setPosts(arr);
    } catch (err) {
      console.error('Failed loading local posts', err);
      setPosts([]);
    }
  }

  async function createOrUpdatePost() {
    if (!editing) return;
    const title = (editing.title || '').trim();
    const body = (editing.body || '').trim();
    if (!title) return alert('Title required');

    const fm = firestoreModRef.current;
    const f = firestoreRef.current;
    const auth = authRef.current;
    const uid = auth && auth.currentUser ? auth.currentUser.uid : null;
    const authorName = auth && auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || 'author') : (editing.authorName || 'author');

    if (fm && f) {
      try {
        const { collection, addDoc, doc, updateDoc, serverTimestamp } = fm;
        if (!editing.id) {
          // create
          const colRef = collection(f, 'posts');
          await addDoc(colRef, {
            title,
            body,
            authorName,
            authorUid: uid,
            published: editing.published !== false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          // update (check privileges client-side: author or admin)
          const docRef = doc(f, 'posts', editing.id);
          await updateDoc(docRef, {
            title,
            body,
            updatedAt: serverTimestamp(),
            published: editing.published !== false,
          });
        }
        setEditing(null);
        setShowEditor(false);
      } catch (err) {
        console.error('Failed to save post to firestore', err);
        alert('Failed to save to server, saving locally instead.');
        saveLocalPostFallback({ title, body, authorName, authorUid: uid, published: editing.published !== false });
      }
    } else {
      saveLocalPostFallback({ id: editing.id, title, body, authorName, authorUid: uid, published: editing.published !== false });
      setEditing(null);
      setShowEditor(false);
      loadLocalPosts();
    }
  }

  function saveLocalPostFallback(payload) {
    try {
      const raw = localStorage.getItem('posts') || '[]';
      const arr = JSON.parse(raw);
      if (payload.id) {
        // update existing
        const idx = arr.findIndex((p) => p.id === payload.id);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], ...payload, updatedAt: new Date().toString() };
        }
      } else {
        const newPost = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          title: payload.title,
          body: payload.body,
          authorName: payload.authorName || 'author',
          authorUid: payload.authorUid || null,
          published: payload.published !== false,
          createdAt: new Date().toString(),
          updatedAt: new Date().toString(),
        };
        arr.push(newPost);
      }
      localStorage.setItem('posts', JSON.stringify(arr));
    } catch (err) {
      console.error('Failed saving post locally', err);
    }
  }

  async function onEditPost(p) {
    // only allow if admin or author (client-side check; enforce on server)
    if (!canModify(p)) return alert('You are not allowed to edit this post.');
    setEditing({ id: p.id, title: p.title, body: p.body, published: p.published, authorName: p.authorName });
    setShowEditor(true);
  }

  async function onDeletePost(p) {
    if (!canModify(p)) return alert('You are not allowed to delete this post.');
    if (!confirm('Delete this post?')) return;

    const fm = firestoreModRef.current;
    const f = firestoreRef.current;
    if (fm && f && p.id) {
      try {
        const { doc, deleteDoc } = fm;
        const docRef = doc(f, 'posts', p.id);
        await deleteDoc(docRef);
      } catch (err) {
        console.error('Failed to delete post from firestore', err);
        alert('Failed to delete on server; try again.');
      }
    } else {
      // local
      try {
        const raw = localStorage.getItem('posts') || '[]';
        const arr = JSON.parse(raw).filter((t) => t.id !== p.id);
        localStorage.setItem('posts', JSON.stringify(arr));
        loadLocalPosts();
      } catch (err) {
        console.error('Failed to delete local post', err);
      }
    }
  }

  function canModify(p) {
    if (!p) return false;
    if (isAdmin) return true;
    if (!user) return false;
    return Boolean(p.authorUid && user.uid && p.authorUid === user.uid);
  }

  function openNew() {
    if (!user) {
      // allow creating drafts locally for guests? Here we prefer requiring auth.
      alert('You must sign in to create posts.');
      return;
    }
    setEditing({ title: '', body: '', published: true, authorName: user.displayName || user.email || 'author' });
    setShowEditor(true);
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading posts…</div>;

  return (
    <div className="site-root">
      <div className="site">
        {/* header */}
        <header className="topbar" role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Link href="/" legacyBehavior>
              <a className="brand" aria-label="Semi-colonic home" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="brand-avatar" aria-hidden style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flex: '0 0 40px' }}>
                  <img src="/semi-colonic-logo.png" alt="Semi‑Colonic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontWeight: 700, color: '#183547' }}>Semi-colonic</span>
              </a>
            </Link>

            <nav className="desktop-nav" aria-label="Primary">
              <Link href="/posts" legacyBehavior><a style={{ marginRight: 12 }}>Posts</a></Link>
              <Link href="/chat" legacyBehavior><a style={{ marginRight: 12 }}>Chat</a></Link>
              <Link href="/features" legacyBehavior><a style={{ marginRight: 12 }}>Features</a></Link>
              <Link href="/games" legacyBehavior><a>Games</a></Link>
            </nav>
          </div>

          <div className="topbar-actions" role="navigation" aria-label="Top actions">
            <button aria-label="Notifications" className="btn" title="Notifications">🔔</button>
            <button aria-label="Messages" className="btn" title="Messages">💬</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#556', fontSize: 14 }}>{user ? (user.email || user.displayName || user.uid) : 'guest'}</div>
              <button onClick={() => router.replace('/')} className="btn btn-outline" aria-label="Close posts">Close</button>
            </div>
          </div>
        </header>

        <main style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h1 style={{ margin: 0 }}>Community Posts</h1>
                <div>
                  {user ? (
                    <button onClick={openNew} className="btn btn-strong" style={{ padding: '8px 12px' }}>New Post</button>
                  ) : (
                    <div style={{ fontSize: 13, color: '#7b8899' }}>Sign in to post</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {posts.length === 0 && <div style={{ color: '#7b8899' }}>No posts yet.</div>}
                {posts.map((p) => (
                  <article key={p.id} style={{ background: '#fff', padding: 12, borderRadius: 10, boxShadow: '0 6px 18px rgba(20,40,60,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px' }}>{p.title}</h3>
                        <div style={{ fontSize: 12, color: '#6a8f8d' }}>By {p.authorName} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {canModify(p) && (
                          <>
                            <button onClick={() => onEditPost(p)} className="btn btn-outline" style={{ padding: '6px 8px' }}>Edit</button>
                            <button onClick={() => onDeletePost(p)} className="btn" style={{ padding: '6px 8px', background: '#c0392b', color: '#fff' }}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, color: '#222', whiteSpace: 'pre-wrap' }}>
                      {p.body.length > 500 ? p.body.slice(0, 500) + '…' : p.body}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside style={{ width: 320 }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 10, boxShadow: '0 6px 18px rgba(20,40,60,0.04)' }}>
                <h4 style={{ marginTop: 0 }}>About posts</h4>
                <p style={{ marginTop: 6, color: '#617489' }}>
                  Community posts are public. Only authors (owners) and admins may edit or remove posts. For production, enforce this with Firestore security rules or a server API.
                </p>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, color: '#7b8899' }}>Admin status:</div>
                  <div style={{ fontWeight: 700 }}>{isAdmin ? 'You are an admin' : 'Not an admin'}</div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <footer className="site-footer" style={{ marginTop: 12 }}>
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
        </footer>
      </div>

      {/* Editor modal */}
      {showEditor && editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(6,20,40,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div style={{ width: 'min(900px, 96%)', background: '#fff', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editing.id ? 'Edit Post' : 'New Post'}</h3>
              <div>
                <button onClick={() => { setShowEditor(false); setEditing(null); }} className="btn btn-outline" style={{ marginRight: 8 }}>Cancel</button>
                <button onClick={createOrUpdatePost} className="btn btn-strong">Save</button>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <input
                value={editing.title}
                onChange={(e) => setEditing(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e6eef0' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!editing.published}
                  onChange={(e) => setEditing(prev => ({ ...prev, published: e.target.checked }))}
                /> Published
              </label>
            </div>

            <textarea
              value={editing.body}
              onChange={(e) => setEditing(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Write your post…"
              style={{ width: '100%', minHeight: 240, marginTop: 12, padding: 12, borderRadius: 8, border: '1px solid #e6eef0', fontSize: 15 }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .site-root { min-height: 100vh; }
      `}</style>
    </div>
  );
}
