import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

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
  const dbRef = useRef(null);
  const dbModRef = useRef(null);
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

        const init = await initFirebaseWithConfig(cfg);
        // initFirebaseWithConfig is used in dashboard — try to pull auth/authMod & db/dbMod
        const { auth, authMod, db, dbMod } = init || {};

        authRef.current = auth;
        authModRef.current = authMod;
        dbRef.current = db;
        dbModRef.current = dbMod;

        // helper to load profile once we have uid
        const loadProfile = async (uid, userEmail) => {
          uidRef.current = uid;
          setEmail(userEmail || '');
          setStatusMsg('Loading profile...');
          try {
            let data = null;
            const path = `profiles/${uid}`;

            // Try modular SDK: dbMod.get(dbMod.ref(db, path))
            if (dbMod && typeof dbMod.get === 'function' && typeof dbMod.ref === 'function' && db) {
              const profileRef = dbMod.ref(db, path);
              const snap = await dbMod.get(profileRef);
              if (snap && snap.exists && typeof snap.val === 'function') data = snap.val();
            }
            // Try modular onValue fallback
            else if (dbMod && typeof dbMod.onValue === 'function' && typeof dbMod.ref === 'function' && db) {
              // read once using promise wrapper
              data = await new Promise((resolve) => {
                const profileRef = dbMod.ref(db, path);
                const off = dbMod.onValue(profileRef, (snap) => {
                  if (snap && snap.exists && typeof snap.val === 'function') {
                    resolve(snap.val());
                  } else {
                    resolve(null);
                  }
                  if (typeof off === 'function') off();
                }, { onlyOnce: true });
              });
            }
            // Namespaced SDK: db.ref(path).once('value')
            else if (db && typeof db.ref === 'function' && typeof db.ref().once === 'function') {
              const snap = await db.ref(path).once('value');
              data = snap && snap.val ? snap.val() : null;
            }
            // Fallback to REST if databaseURL provided in config
            else if (cfg && cfg.databaseURL) {
              const url = `${cfg.databaseURL.replace(/\/$/, '')}/${path}.json`;
              const r = await fetch(url, { method: 'GET' });
              if (r.ok) {
                const j = await r.json();
                data = j;
              }
            }

            if (!mountedRef.current) return;
            if (data) {
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

        // Listen for auth state
        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          unsub = authMod.onAuthStateChanged(auth, (user) => {
            if (!mountedRef.current) return;
            if (!user) {
              router.replace('/');
              return;
            }
            loadProfile(user.uid, user.email || '');
          });

          // In case currentUser already set
          const cur = auth && auth.currentUser;
          if (cur) loadProfile(cur.uid, cur.email || '');
        } else {
          // Namespaced or other: try auth.currentUser directly
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

      const payload = {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        preferences: {
          language: language || ''
        },
        updatedAt: new Date().toISOString()
      };

      const path = `profiles/${uid}`;

      const db = dbRef.current;
      const dbMod = dbModRef.current;
      const cfg = cfgRef.current;

      // Try modular SDK set: dbMod.set(dbMod.ref(db, path), payload)
      if (dbMod && typeof dbMod.set === 'function' && typeof dbMod.ref === 'function' && db) {
        const profileRef = dbMod.ref(db, path);
        await dbMod.set(profileRef, payload);
      }
      // Try namespaced: db.ref(path).set(payload)
      else if (db && typeof db.ref === 'function' && typeof db.ref().set === 'function') {
        await db.ref(path).set(payload);
      }
      // Fallback to REST (requires databaseURL in config)
      else if (cfg && cfg.databaseURL) {
        const url = `${cfg.databaseURL.replace(/\/$/, '')}/${path}.json`;
        const r = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          throw new Error('Failed to save profile via REST API');
        }
      } else {
        throw new Error('No supported Realtime DB interface found');
      }

      if (mountedRef.current) {
        setStatusMsg('Profile saved');
        // small delay then clear status
        setTimeout(() => { if (mountedRef.current) setStatusMsg(''); }, 1800);
      }
    } catch (err) {
      console.error('Save profile failed', err);
      if (mountedRef.current) setStatusMsg('Save failed');
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading profile…</div>;

  return (
    <div className="site-root">
      <div className="site" style={{ padding: 18 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Link href="/" legacyBehavior><a style={{ textDecoration: 'none', color: '#183547', fontWeight: 700 }}>← Back</a></Link>
          <h2 style={{ margin: 0 }}>Your Profile</h2>
        </header>

        <main style={{ maxWidth: 760, margin: '0 auto' }}>
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
        .content-card {
          padding: 16px;
          border-radius: 12px;
          background: linear-gradient(180deg,#ffffff,#fbfdff);
          box-shadow: 0 8px 20px rgba(6,20,40,0.04);
        }
        .muted-label { display:block; color:#7b8899; font-weight:700; margin-bottom:6px; font-size:13px; }
        input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(6,20,40,0.06);
          outline: none;
          font-size: 14px;
        }
        .btn { background: transparent; border: none; font-weight:700; padding:8px 10px; border-radius:10px; cursor:pointer; }
        .btn-outline { border: 1px solid rgba(20,40,60,0.06); padding: 8px 12px; background: transparent; }
        .btn-strong { background: linear-gradient(90deg,#d8b37b,#c87a3c); color: #fff; padding: 8px 12px; border-radius: 12px; }
        @media (max-width: 560px) {
          .content-card { padding: 12px; }
          div[style*="grid-template-columns"] { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
