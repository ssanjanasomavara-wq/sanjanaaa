import { useEffect, useRef, useState } from 'react';

/**
 * InviteWidget (pastel, theme-adaptive)
 *
 * NOTE: This component no longer overrides global .btn tokens.
 * Instead it exposes per-component CSS custom properties (prefixed with
 * --component-*) so the global token set (styles/globals.css) can pick up
 * the component's preferred colors without being overridden at :root.
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
          <div className="invite-card" aria-hidden={false}>
            <div className="invite-code">{inviteCode || '—'}</div>
            <div className="invite-sub muted">{inviteLink || ''}</div>
            <div className="invite-actions">
              <button className="btn btn-outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
              <a
                className="btn btn-strong"
                href={inviteLink || '#'}
                target={inviteLink ? '_blank' : undefined}
                rel={inviteLink ? 'noopener noreferrer' : undefined}
                onClick={(e) => { /* anchor navigation */ }}
              >
                Open link
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /*
         * The component exposes per-component tokens that the global
         * .btn rules will consume if present. These variables are
         * intentionally named --component-* so they don't collide with
         * site-level :root tokens.
         *
         * We removed the previous local .btn overrides so visual
         * behavior is controlled by the global token set in
         * styles/globals.css (which now prefers component variables
         * when available).
         */

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
          background: var(--component-surface, var(--invite-surface, #fff));
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 12px 40px rgba(6,20,40,0.12);
          z-index: 1201;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: var(--component-text, var(--invite-text, inherit));
        }

        .invite-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .invite-header h2 { margin: 0; font-size: 18px; color: var(--component-text-primary, var(--invite-text-primary, var(--text-primary, #183547))); }
        .muted { color: var(--component-muted, var(--invite-muted, #6b7280)); font-size: 13px; margin: 4px 0 0; }

        .invite-body { display:flex; justify-content:center; }
        .invite-card {
          width:100%;
          border-radius:10px;
          background: var(--component-bg, var(--invite-bg, linear-gradient(180deg,#fffafb, #f6fcff)));
          padding:12px;
          display:flex;
          flex-direction:column;
          gap:10px;
          align-items:stretch;
          text-align:center;

          /* per-component tokens (read by styles/globals.css) */
          --component-bg: linear-gradient(180deg,#fffafb, #f6fcff);
          --component-surface: #ffffff;
          --component-muted: #6b7280;
          --component-text: #183547;
          --component-text-primary: #183547;
          --component-cta: #0ea5a4;          /* used by .btn-strong */
          --component-cta-text: #ffffff;     /* used by .btn-strong */
          --component-btn-text: #183547;     /* used by .btn and .btn-outline */
          --component-btn-border: rgba(27,59,58,0.12);
        }

        @media (prefers-color-scheme: dark) {
          .invite-card {
            --component-bg: linear-gradient(180deg,#071122,#061018);
            --component-surface: #071124;
            --component-muted: #9aa6b2;
            --component-text: #d6eef6;
            --component-text-primary: #d6eef6;
            --component-cta: #06b6d4;
            --component-cta-text: #071124;
            --component-btn-text: #d6eef6;
            --component-btn-border: rgba(214,238,246,0.08);
          }
        }

        .invite-code {
          font-weight:800;
          letter-spacing:0.12em;
          font-size:20px;
          color:var(--component-text, var(--text-primary, #1b3b3a));
          background: rgba(255,255,255,0.6);
          padding:10px 12px;
          border-radius:8px;
        }

        .invite-sub { font-size:12px; overflow-wrap:anywhere; color:var(--component-muted, var(--muted)); }

        .invite-actions { display:flex; gap:10px; justify-content:center; margin-top:6px; flex-wrap:wrap; }

        @media (max-width: 420px) {
          .invite-modal { width: calc(100vw - 24px); left:12px; right:12px; transform:none; top:12px; bottom:auto; }
          .invite-card { padding:10px; }
        }
      `}</style>
    </>
  );
}
