import Head from 'next/head';
import Link from 'next/link';

export default function Begin() {
  return (
    <>
      <Head>
        <title>Begin — Semi;colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: linear-gradient(180deg, #f6f7fb 0%, #eef2ff 100%);
          padding: 24px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .card {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(11, 22, 77, 0.04);
          text-align: center;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 16px;
          color: #111827;
        }
        p {
          color: #6b7280;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .back-link {
          display: inline-block;
          padding: 12px 24px;
          background: #5a5adb;
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .back-link:hover {
          opacity: 0.9;
        }
      `}</style>

      <div className="page-wrapper">
        <div className="container">
          <div className="card">
            <div className="icon">🌅</div>
            <h1>Begin</h1>
            <p>
              Start your day with intention and clarity. This is a placeholder for the Begin feature.
              <br /><br />
              Future functionality will include morning routines, intention setting, and gentle wake-up exercises.
            </p>
            <Link href="/dashboard" className="back-link">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
