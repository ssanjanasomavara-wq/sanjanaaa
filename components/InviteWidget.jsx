import { useEffect, useRef, useState } from 'react';

/**
 * InviteWidget (pastel, theme-adaptive)
 *
 * Props:
 * - visible (bool)
 * - onClose (func)
 * - inviteCode (string)
 * - inviteLink (string)
 *
 * This component uses a pastel theme with good contrast, adapts to dark mode,
 * and includes a copy-to-clipboard action with a small confirmation message.
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
              <a className="btn btn-strong" href={inviteLink || '#'} onClick={(e) => { /* navigation handled by anchor */ }}>
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
          --outline-bg: rgba(115, 197, 179, 0.12); /* soft mint */
          --outline-border: rgba(115,197,179,0.26);
          --outline-color: #0f5132;
          --strong-bg: linear-gradient(90deg,#ffd6e0,#fff1c9);
          --strong-color: #2f1313;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --invite-bg: linear-gradient(180deg,#071122,#061018);
            --invite-surface: #071124;
            --muted: #9aa6b2;
            --outline-bg: rgba(50,150,120,0.06);
            --outline-border: rgba(50,150,120,0.18);
            --outline-color: #8ee1c7;
            --strong-bg: linear-gradient(90deg,#663342,#4f3f2d);
            --strong-color: #fff8f6;
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

        .invite-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .invite-header h2 { margin: 0; font-size: 18px; color: var(--text-primary, #183547); }
        .muted { color: var(--muted); font-size: 13px; margin: 4px 0 0; }

        .invite-body { display: flex; justify-content: center; }
        .invite-card {
          width: 100%;
          border-radius: 10px;
          background: var(--invite-bg);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
          text-align: center;
        }

        .invite-code {
          font-weight: 800;
          letter-spacing: 0.12em;
          font-size: 20px;
          color: var(--text-primary, #1b3b3a);
          background: rgba(255,255,255,0.6);
          padding: 10px 12px;
          border-radius: 8px;
        }

        .invite-sub { font-size: 12px; overflow-wrap: anywhere; color: var(--muted); }

        .invite-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 6px;
          flex-wrap: wrap;
        }

        .btn { font-weight: 700; padding: 10px 14px; border-radius: 10px; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }

        .btn.btn-plain { background: transparent; color: var(--muted); }

        .btn.btn-outline {
          background: var(--outline-bg);
          color: var(--outline-color);
          border: 1px solid var(--outline-border);
        }

        .btn.btn-strong {
          background: var(--strong-bg);
          color: var(--strong-color);
          box-shadow: 0 8px 20px rgba(17,24,39,0.06);
        }

        @media (max-width: 420px) {
          .invite-modal { width: calc(100vw - 24px); left: 12px; right: 12px; transform: none; top: 12px; bottom: auto; }
          .invite-card { padding: 10px; }
        }
      `}</style>
    </>
  );
}
