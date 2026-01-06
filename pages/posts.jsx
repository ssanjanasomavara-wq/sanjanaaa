import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import Topbar from '../components/Topbar';

/**
 * Community Posts page (refactored for responsive layout & styling)
 *
 * - Preserves existing logic (Firestore or localStorage)
 * - Uses the shared Topbar component for navigation and mobile drawer
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
      alert('You must sign in to create posts.');
      return;
    }
    setEditing({ title: '', body: '', published: true, authorName: user.displayName || user.email || 'author' });
    setShowEditor(true);
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading posts…</div>;

  return (
    <div className="site-root">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Shared top navigation / theme component (includes mobile drawer) */}
            <Topbar links={[
              { href: '/posts', label: 'Posts' },
              { href: '/chat', label: 'Chat' },
              { href: '/features', label: 'Features' },
              { href: '/games', label: 'Games' },
              { href: '/resources', label: 'Resources' },
            ]} />

      <div className="site">
        <main className="main-content">
          <div className="posts-layout">
            <section className="posts-column">
              <div className="posts-header">
                <h1>Community Posts</h1>
                <div>
                  {user ? (
                    <button onClick={openNew} className="btn btn-strong">New Post</button>
                  ) : (
                    <div className="signin-hint">Sign in to post</div>
                  )}
                </div>
              </div>

              <div className="posts-grid">
                {posts.length === 0 && <div className="muted">No posts yet.</div>}
                {posts.map((p) => (
                  <article key={p.id} className="post-card" aria-labelledby={`post-${p.id}-title`}>
                    <div className="post-top">
                      <div>
                        <h3 id={`post-${p.id}-title`}>{p.title}</h3>
                        <div className="meta">By {p.authorName} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                      <div className="post-actions">
                        {canModify(p) && (
                          <>
                            <button onClick={() => onEditPost(p)} className="btn btn-outline">Edit</button>
                            <button onClick={() => onDeletePost(p)} className="btn btn-delete">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="post-body">
                      {p.body && p.body.length > 500 ? p.body.slice(0, 500) + '…' : p.body}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="sidebar">
              <div className="info-card">
                <h4>About posts</h4>
                <p>
                  Community posts are public. Only authors (owners) and admins may edit or remove posts. For production, enforce this with Firestore security rules or a server API.
                </p>

                <div className="admin-status">
                  <div className="muted-label">Admin status:</div>
                  <div className="bold">{isAdmin ? 'You are an admin' : 'Not an admin'}</div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <footer className="site-footer">
          © {new Date().getFullYear()} Semi‑Colonic — Semi‑Colonic Ltd. All rights reserved.
        </footer>
      </div>

      {/* Editor modal */}
      {showEditor && editing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>{editing.id ? 'Edit Post' : 'New Post'}</h3>
              <div>
                <button onClick={() => { setShowEditor(false); setEditing(null); }} className="btn btn-outline" style={{ marginRight: 8 }}>Cancel</button>
                <button onClick={createOrUpdatePost} className="btn btn-strong">Save</button>
              </div>
            </div>

            <div className="modal-body">
              <input
                value={editing.title}
                onChange={(e) => setEditing(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="input-title"
              />
              <label className="published-label">
                <input
                  type="checkbox"
                  checked={!!editing.published}
                  onChange={(e) => setEditing(prev => ({ ...prev, published: e.target.checked }))}
                /> Published
              </label>

              <textarea
                value={editing.body}
                onChange={(e) => setEditing(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your post…"
                className="input-body"
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :root { --max-width: 980px; }

        .site-root { min-height: 100vh; padding: 0; background: var(--bg, #fff); }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        /* main layout */
        .main-content { padding: var(--space-md, 20px); }
        .posts-layout { display: flex; gap: 16px; align-items: flex-start; }
        .posts-column { flex: 1; }
        .sidebar { width: 320px; }

        .posts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .posts-header h1 { margin: 0; font-size: clamp(18px, 2.6vw, 24px); color: var(--text-primary, #183547); }
        .signin-hint { font-size: 13px; color: #7b8899; }

        .posts-grid { display: grid; gap: 12px; }
        .post-card { background: #fff; padding: 12px; border-radius: 10px; box-shadow: 0 6px 18px rgba(20,40,60,0.04); }
        .post-top { display: flex; justify-content: space-between; align-items: center; }
        .post-top h3 { margin: 0 0 6px 0; }
        .meta { font-size: 12px; color: #6a8f8d; }
        .post-actions { display: flex; gap: 8px; }
        .post-body { margin-top: 8px; color: #222; white-space: pre-wrap; }

        .btn { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
        .btn-outline { border: 1px solid rgba(6,20,40,0.08); background: transparent; padding: 6px 8px; border-radius: 8px; }
        .btn-strong { background: var(--cta-strong, #1f9fff); color: #fff; padding: 8px 12px; border-radius: 8px; }
        .btn-delete { background: #c0392b; color: #fff; padding: 6px 8px; border-radius: 8px; }

        .info-card { background: #fff; padding: 12px; border-radius: 10px; box-shadow: 0 6px 18px rgba(20,40,60,0.04); }
        .muted { color: #7b8899; }
        .muted-label { color: var(--text-muted, #7b8899); font-weight: 700; margin-bottom: 4px; }
        .bold { font-weight: 700; }

        /* modal/editor */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(6,20,40,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
        }
        .modal { width: min(900px, 96%); background: #fff; border-radius: 12px; padding: 16px; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; }
        .modal-body { margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }
        .input-title { padding: 10px; border-radius: 8px; border: 1px solid #e6eef0; font-size: 16px; width: 100%; }
        .published-label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .input-body { width: 100%; min-height: 240px; padding: 12px; border-radius: 8px; border: 1px solid #e6eef0; font-size: 15px; }

        .site-footer { margin-top: 12px; padding: 12px 0; font-size: 13px; color: var(--text-muted, #7b8899); text-align: center; }

        @media (max-width: 980px) {
          .site { padding: 0 14px; }
        }

        @media (max-width: 820px) {
          .posts-layout { flex-direction: column-reverse; }
          .sidebar { width: 100%; }
        }

        @media (max-width: 600px) {
          .brand-text { font-size: 14px; }
          .site { padding: 0 12px; }
          .main-content { padding: 14px 6px; }
          .posts-header h1 { font-size: 18px; }
          .brand-avatar { width: 40px; height: 40px; }
          .user-email { max-width: 110px; font-size: 13px; }
          .post-card { padding: 10px; }
        }

        @media (max-width: 420px) {
          .post-body { font-size: 14px; }
          .input-body { min-height: 180px; }
        }
      `}</style>
    </div>
  );
}
