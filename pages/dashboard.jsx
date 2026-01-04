import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initFirebaseWithConfig } from '../lib/firebaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;
    // Safety timeout: if auth initialization doesn't call the listener within this time,
    // assume unauthenticated and redirect.
    const INIT_TIMEOUT_MS = 7000;
    let initTimeout = null;

    (async () => {
      try {
        const resp = await fetch('/api/firebase-config', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Missing firebase config');
        const cfg = await resp.json();

        const { auth, authMod } = await initFirebaseWithConfig(cfg);

        // Prefer authMod.onAuthStateChanged(auth, cb) if available
        if (authMod && typeof authMod.onAuthStateChanged === 'function') {
          // start safety timeout — will redirect if listener never fires
          initTimeout = setTimeout(() => {
            if (!mounted) return;
            // Listener didn't fire in time; treat as unauthenticated
            router.replace('/');
          }, INIT_TIMEOUT_MS);

          unsubscribe = authMod.onAuthStateChanged(auth, (user) => {
            if (!mounted) return;
            // listener fired; cancel timeout
            if (initTimeout) { clearTimeout(initTimeout); initTimeout = null; }

            if (!user) {
              // Not signed in — redirect to index which is the auth surface
              router.replace('/');
              return;
            }
            // Signed in — show dashboard
            setUserEmail(user.email || 'Unknown');
            setLoading(false);
          });
        } else {
          // Fallback: small delay then check currentUser
          initTimeout = setTimeout(() => {
            if (!mounted) return;
            const user = auth && auth.currentUser;
            if (!user) {
              router.replace('/');
              return;
            }
            setUserEmail(user.email || 'Unknown');
            setLoading(false);
          }, 300);
        }
      } catch (err) {
        console.error('Dashboard init error', err);
        router.replace('/');
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      if (initTimeout) clearTimeout(initTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading dashboard…</div>;

  return (
    <div style={{ padding: 18, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
      <p>Welcome back — signed in as <strong>{userEmail}</strong></p>
      <p>Wire this page up with your app routes and components (posts, chat, profile, etc.).</p>
    </div>
  );
}
