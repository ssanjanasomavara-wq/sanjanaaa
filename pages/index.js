// Landing page for Semi‑Colonic
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Semi‑Colonic — Home</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%)',
        padding: '24px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '600px',
          background: 'white',
          padding: '48px 32px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700',
            marginBottom: '16px',
            color: '#111827'
          }}>
            semi<span style={{ color: '#5a5adb' }}>;</span>colonic
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#6b7280',
            marginBottom: '32px'
          }}>
            Not the end—just a moment to rest.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link href="/login" style={{
              padding: '12px 24px',
              background: 'linear-gradient(90deg, #5a5adb, #7aa2ff)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(90,90,219,0.2)'
            }}>
              Get Started
            </Link>
            <Link href="/dashboard" style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#5a5adb',
              border: '2px solid #5a5adb',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600'
            }}>
              Dashboard
            </Link>
          </div>

          <p style={{ 
            marginTop: '32px', 
            fontSize: '0.85rem', 
            color: '#9aa6d9'
          }}>
            You're safe to pause here.
          </p>
        </div>
      </div>
    </>
  );
}
