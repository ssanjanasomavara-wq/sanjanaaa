import React from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/theme.css'; // centralized pastel seaside theme
import '../styles.css'; // keep your existing global styles if present
import '../prototype/find-the-calm.css'; // global prototype styles

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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin={true} />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
