import '../styles/globals.css'; // <-- add this line (only once)
import React from 'react';
import '../prototype/find-the-calm.css'; // global prototype styles
import '../styles.css'; // keep your existing global styles if present

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
