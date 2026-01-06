import Head from 'next/head';
import '../styles/theme.css'; // centralized pastel seaside theme
import '../styles/globals.css';
import React from 'react';
import '../prototype/find-the-calm.css'; // global prototype styles
import '../styles.css'; // keep your existing global styles if present

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Semi‑Colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/semicolonic-ico.png" />
        <meta name="theme-color" content="#e8f4f8" />
        {/* Font preconnects and Poppins stylesheet for global typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Component {...pageProps} />

      <style jsx global>{`
        :root {
          --brand-color: #1f9fff;
          --brand-strong: #1f9fff;
          --text-primary: #183547;
          --text-secondary: #617489;
          --text-muted: #7b8899;
          --max-width: 980px;
        }

        html, body, #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: var(--bg, #fff);
          color: var(--text-primary);
        }

        /* Button defaults to use brand colors on light theme */
        .btn {
          border: none;
          background: transparent;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          color: var(--brand-color);
          font-weight: 600;
          font-family: inherit;
        }

        .btn-outline {
          border: 1px solid var(--brand-color);
          background: transparent;
          padding: 6px 8px;
          border-radius: 8px;
          color: var(--brand-color);
        }

        .btn-strong {
          background: var(--brand-strong);
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.04);
        }

        .btn-delete {
          background: #c0392b;
          color: #fff;
          padding: 6px 8px;
          border-radius: 8px;
        }

        /* Utility globals used across pages */
        .site-root { min-height: 100vh; }
        .site { max-width: var(--max-width); margin: 0 auto; padding: 0 18px; }

        /* Small responsive tweaks to ensure centered content */
        @media (max-width: 980px) { .site { padding: 0 14px; } }
        @media (max-width: 600px) { .site { padding: 0 12px; } }
      `}</style>
    </>
  );
}
