// Tasks feature page
import Head from 'next/head';
import Link from 'next/link';

export default function Tasks() {
  return (
    <>
      <Head>
        <title>Tasks — Semi‑Colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%)',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <Link 
            href="/dashboard"
            style={{
              display: 'inline-block',
              marginBottom: '24px',
              padding: '10px 20px',
              background: 'white',
              color: '#5a5adb',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            ← Back to Dashboard
          </Link>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px 32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📋</div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Manage Your Tasks
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              This feature is coming soon. This is a placeholder page for the Tasks feature,
              where you'll organize and manage your daily tasks and priorities.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
