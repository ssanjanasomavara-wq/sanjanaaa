import { useEffect, useRef, useState } from 'react';

/**
 * InviteWidget (pastel, theme-adaptive)
 *
 * Uses global .btn, .btn-outline, .btn-strong tokens from styles/globals.css.
 * Keeps component-local layout / surface variables but does not override button tokens.
 */
export default function InviteWidget({ visible = false, onClose = () => {}, inviteCode = '', inviteLink = '' }) {
  const modalRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const prev = document.activeElement;
    const site = document.querySelector('.site');
    if (site) site.setAttribute('aria-hidden', 'true');
    // focus the modal for assistive tech
    setTimeout(() => modalRef.current?.focus?.(), 60);

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (site) site.removeAttribute('aria-hidden');
      if (prev && prev.focus) prev.focus();
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink || inviteCode || '');
      setCopied(true);
    } catch (err) {
      console.error('copy failed', err);
      setCopied(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="invite-backdrop" onClick={onClose} />

      <div
        className="invite-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Invite dialog"
        ref={modalRef}
        tabIndex={-1}
      >
        <header className="invite-header">
          <div>
            <h2>Invite a friend</h2>
            <p className="muted">Share this code or link to join the community</p>
          </div>
          <button className="btn btn-plain" aria-label="Close invite" onClick={onClose}>✕</button>
        </header>

        <div className="invite-body">
          <div className="invite-card">
            <div className="invite-code">{inviteCode || '—'}</div>
            <div className="invite-sub muted">{inviteLink || ''}</div>
            <div className="invite-actions">
              <button className="btn btn-outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
              <a className="btn btn-strong" href={inviteLink || '#'} onClick={(e) => { /* anchor navigation */ }}>
                Open link
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :root {
          --invite-bg: linear-gradient(180deg,#fffafb, #f6fcff);
          --invite-surface: #ffffff;
          --muted: #6b7280;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --invite-bg: linear-gradient(180deg,#071122,#061018);
            --invite-surface: #071124;
            --muted: #9aa6b2;
          }
        }

        .invite-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(6,20,40,0.36);
          z-index: 1200;
        }

        .invite-modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: min(92vw, 460px);
          background: var(--invite-surface);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 12px 40px rgba(6,20,40,0.12);
          z-index: 1201;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .invite-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .invite-header h2 { margin: 0; font-size: 18px; color: var(--text-primary, #183547); }
        .muted { color: var(--muted); font-size: 13px; margin: 4px 0 0; }

        .invite-body { display:flex; justify-content:center; }
        .invite-card {
          width:100%;
          border-radius:10px;
          background: var(--invite-bg);
          padding:12px;
          display:flex;
          flex-direction:column;
          gap:10px;
          align-items:stretch;
          text-align:center;
        }

        .invite-code {
          font-weight:800;
          letter-spacing:0.12em;
          font-size:20px;
          color:var(--text-primary, #1b3b3a);
          background: rgba(255,255,255,0.6);
          padding:10px 12px;
          border-radius:8px;
        }

        .invite-sub { font-size:12px; overflow-wrap:anywhere; color:var(--muted); }

        .invite-actions { display:flex; gap:10px; justify-content:center; margin-top:6px; flex-wrap:wrap; }

        /* No .btn rules here — buttons use global styles from styles/globals.css */

        @media (max-width: 420px) {
          .invite-modal { width: calc(100vw - 24px); left:12px; right:12px; transform:none; top:12px; bottom:auto; }
          .invite-card { padding:10px; }
        }
      `}</style>
    </>
  );
}
