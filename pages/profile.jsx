import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';
import Topbar from '../components/Topbar';

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('');

  const authRef = useRef(null);
  const authModRef = useRef(null);
  const firestoreRef = useRef(null);
  const firestoreModRef = useRef(null);
  const cfgRef = useRef(null);
  const mountedRef = useRef(true);
  const uidRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    let unsub = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Missing firebase config');
        const cfg = await resp.json();
        cfgRef.current = cfg;

        const init = await initFirebaseWithConfig(cfg) || {};

        const { auth, authMod, firestore, firestoreMod, app } = init;
        authRef.current = auth || null;
        authModRef.current = authMod || null;
        firestoreRef.current = firestore || null;
        firestoreModRef.current = firestoreMod || null;

        // If firestore wasn't returned, attempt to construct from firestoreMod or fallback
        if (!firestoreRef.current && firestoreModRef.current && typeof firestoreModRef.current.getFirestore === 'function') {
          try {
            firestoreRef.current = firestoreModRef.current.getFirestore(app);
          } catch (err) {
            console.warn('Could not derive firestore instance', err);
          }
        }

        const loadProfile = async (uid, userEmail) => {
          uidRef.current = uid;
          setEmail(userEmail || '');
          setStatusMsg('Loading profile...');
          try {
            if (!firestoreRef.current || !firestoreModRef.current) {
              setStatusMsg('Firestore not available');
              setLoading(false);
              return;
            }

            const { doc, getDoc } = firestoreModRef.current;
            const ref = doc(firestoreRef.current, 'profiles', uid);
            const snap = await getDoc(ref);
            if (!mountedRef.current) return;
            if (snap && snap.exists()) {
              const data = snap.data();
              setFirstName(data.firstName || '');
              setLastName(data.lastName || '');
              setPhone(data.phone || '');
              setLanguage((data.preferences && data.preferences.language) || '');
            }
            setStatusMsg('');
          } catch (err) {
            console.error('Profile load error', err);
            setStatusMsg('Failed to load profile');
          } finally {
            if (mountedRef.current) setLoading(false);
          }
        };

        // Auth handling (modular style)
        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          unsub = authMod.onAuthStateChanged(auth, (user) => {
            if (!mountedRef.current) return;
            if (!user) {
              router.replace('/');
              return;
            }
            loadProfile(user.uid, user.email || '');
          });

          // If already signed in
          const cur = auth && auth.currentUser;
          if (cur) loadProfile(cur.uid, cur.email || '');
        } else {
          const cur = auth && auth.currentUser;
          if (!cur) {
            router.replace('/');
            return;
          }
          await loadProfile(cur.uid, cur.email || '');
        }
      } catch (err) {
        console.error('Profile init error', err);
        router.replace('/');
      }
    })();

    return () => {
      mountedRef.current = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [router]);

  async function saveProfile() {
    setSaving(true);
    setStatusMsg('Saving...');
    try {
      const uid = uidRef.current;
      if (!uid) throw new Error('No user id');

      if (!firestoreRef.current || !firestoreModRef.current) throw new Error('No Firestore instance');

      const payload = {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        preferences: {
          language: language || ''
        },
        updatedAt: new Date().toISOString()
      };

      const { doc, setDoc } = firestoreModRef.current;
      const ref = doc(firestoreRef.current, 'profiles', uid);
      // merge:true behavior to allow partial updates and avoid overwriting unexpected fields
      await setDoc(ref, payload, { merge: true });

      if (mountedRef.current) {
        setStatusMsg('Profile saved');
        setTimeout(() => { if (mountedRef.current) setStatusMsg(''); }, 1600);
      }
    } catch (err) {
      console.error('Save profile failed', err);
      if (mountedRef.current) setStatusMsg('Save failed: ' + (err.message || ''));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading profile…</div>;

  return (
    <div className="site-root">
      <Head>
        <title>Your Profile — Semi‑Colonic</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Shared Topbar provides sign-in / sign-out button and mobile drawer */}
      <Topbar links={[
        { href: '/posts', label: 'Posts' },
        { href: '/chat', label: 'Chat' },
        { href: '/features', label: 'Features' },
        { href: '/games', label: 'Games' },
        { href: '/resources', label: 'Resources' },
      ]} />

      <div className="site" style={{ padding: 18 }}>
        <main style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* keep dashboard/settings quick-actions near the content since header is now Topbar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <Link href="/dashboard" legacyBehavior><a className="btn">Dashboard</a></Link>
            <Link href="/settings" legacyBehavior><a className="btn btn-primary">Settings</a></Link>
            <div style={{ marginLeft: 'auto', color: '#617489' }}>{statusMsg}</div>
          </div>

          <section className="content-card">
            <div style={{ marginBottom: 12 }}>
              <label className="muted-label">Email (from account)</label>
              <div style={{ color: '#222' }}>{email}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="muted-label">First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label className="muted-label">Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label className="muted-label">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            </div>

            <div style={{ marginTop: 10 }}>
              <label className="muted-label">Preferred language</label>
              <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. en, fr, es" />
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button className="btn btn-strong" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button className="btn btn-outline" onClick={() => router.reload()}>Reload</button>
              <div style={{ marginLeft: 'auto', color: '#617489', alignSelf: 'center' }}>{statusMsg}</div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        :root {
          --cta-strong: #1f9fff;
          --text-primary: #183547;
          --text-secondary: #617489;
        }

        .site-root {
          min-height: 100vh;
          background: linear-gradient(180deg, #e8f4f8, #d8eef5);
          font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .site { max-width: 980px; margin: 0 auto; }

        .muted-label { display:block; color:#7b8899; font-weight:700; margin-bottom:6px; font-size:13px; }
        input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(6,20,40,0.06);
          outline: none;
          font-size: 14px;
        }

        /* Buttons: Ensure visible brand color in light theme */
        .btn { background: transparent; border: 1px solid rgba(6,20,40,0.06); padding: 8px 10px; border-radius: 10px; cursor: pointer; color: var(--text-primary); font-weight:700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
        .btn-outline { border: 1px solid rgba(20,40,60,0.06); padding: 8px 12px; background: transparent; color: var(--text-primary); }
        .btn-strong, .btn-primary { background: linear-gradient(90deg,var(--cta-strong),#c87a3c); color: #fff; padding: 8px 12px; border-radius: 12px; border: none; }
        .btn-ghost { background: transparent; }

        .content-card {
          padding: 16px;
          border-radius: 12px;
          background: linear-gradient(180deg,#ffffff,#fbfdff);
          box-shadow: 0 8px 20px rgba(6,20,40,0.04);
        }

        @media (max-width: 560px) {
          .content-card { padding: 12px; }
          div[style*="grid-template-columns"] { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}