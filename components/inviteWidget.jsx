import { useEffect, useState } from 'react';

export default function InviteWidget({ visible, onClose, inviteCode = 'TTASOK', inviteLink }) {
  const [copied, setCopied] = useState('');
  useEffect(() => {
    if (!visible) setCopied('');
  }, [visible]);

  if (!visible) return null;

  const textToShare = `Join me on Semi-colonic! Use code ${inviteCode}. ${inviteLink || ''}`;

  async function handleWhatsAppShare() {
    const base = 'https://wa.me/?text=' + encodeURIComponent(textToShare);
    window.open(base, '_blank', 'noopener');
  }

  function handleInstagram() {
    // Instagram doesn't support direct text share; open a profile or suggest copy
    window.open('https://instagram.com', '_blank', 'noopener');
  }

  function handleTikTok() {
    window.open('https://tiktok.com', '_blank', 'noopener');
  }

  async function handleCopy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Semi-colonic invite',
          text: textToShare,
          url: inviteLink,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      // fallback to copy
      handleCopy(textToShare, 'link');
    }
  }

  return (
    <div className="invite-overlay" role="dialog" aria-modal="true" aria-label="Invite others">
      <div className="invite-modal">
        <div className="invite-header">
          <strong>Invite friends</strong>
          <button aria-label="Close invite" onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="invite-body">
          <p>Share Semi-colonic with friends. Use invite code <strong>{inviteCode}</strong>.</p>

          <div className="actions">
            <button className="btn" onClick={handleWhatsAppShare}>Share on WhatsApp</button>
            <button className="btn" onClick={handleInstagram}>Open Instagram</button>
            <button className="btn" onClick={handleTikTok}>Open TikTok</button>
            <button className="btn" onClick={() => handleCopy(inviteLink || window.location.href, 'link')}>Copy invite link</button>
            <button className="btn" onClick={() => handleCopy(inviteCode, 'code')}>Copy invite code</button>
            <button className="btn" onClick={handleNativeShare}>Native share</button>
          </div>

          <div style={{ marginTop: 10, color: '#444' }}>
            {copied ? <em>Copied {copied} ✓</em> : <span>Share via social apps or copy the invite.</span>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .invite-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(6,20,40,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .invite-modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(6,20,40,0.3);
        }
        .invite-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #eee;
          font-size: 16px;
        }
        .invite-body { padding: 16px; }
        .close-btn { background: transparent; border: none; font-size: 18px; cursor:pointer; }
        .actions { display:flex; gap:10px; flex-wrap:wrap; margin-top: 8px; }
        .btn {
          padding: 8px 10px;
          background: #f6f7f9;
          border: 1px solid #e7e9ee;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
