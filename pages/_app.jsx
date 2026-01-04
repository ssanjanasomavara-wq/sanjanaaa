import Head from 'next/head';
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
        <meta name="theme-color" content="#0b1324" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
