import { useEffect, useRef, useState } from 'react';

export default function ChatPopup({ visible, onClose }) {
  const [messages, setMessages] = useState(() => [
    { id: 'sys-1', from: 'bot', text: 'Hi! I am Semi-colonic assistant. How can I help today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setInput('');
    }
  }, [visible]);

  useEffect(() => {
    // scroll to bottom
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, visible]);

  if (!visible) return null;

  async function sendMessage() {
    if (!input.trim()) return;
    const text = input.trim();
    const id = `u-${Date.now()}`;
    setMessages((s) => [...s, { id, from: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Chat webhook error');
      }
      const data = await res.json();
      const botText = data.reply || 'Sorry — no reply.';
      setMessages((s) => [...s, { id: `b-${Date.now()}`, from: 'bot', text: botText }]);
    } catch (err) {
      console.error(err);
      setMessages((s) => [...s, { id: `b-err-${Date.now()}`, from: 'bot', text: 'Sorry, chat failed. Please try again later.' }]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-overlay" role="dialog" aria-modal="true" aria-label="Chat with Semi-colonic">
      <div className="chat-modal">
        <div className="chat-header">
          <strong>Chat with Semi-colonic</strong>
          <button aria-label="Close chat" onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="chat-body" ref={listRef}>
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.from === 'bot' ? 'bot' : 'user'}`}>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            rows={1}
          />
          <button className="send-btn" onClick={sendMessage} disabled={sending || !input.trim()}>
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-overlay {
          position: fixed;
          inset: 0;
          z-index: 1300;
          background: rgba(6,20,40,0.35);
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 18px;
        }
        .chat-modal {
          width: 100%;
          max-width: 640px;
          height: 70vh;
          background: #fff;
          border-radius: 12px;
          display:flex;
          flex-direction:column;
          overflow: hidden;
          box-shadow: 0 28px 90px rgba(6,20,40,0.3);
        }
        .chat-header {
          padding: 12px 14px;
          border-bottom: 1px solid #eee;
          display:flex;
          align-items:center;
          justify-content:space-between;
        }
        .close-btn { background: transparent; border: none; font-size: 18px; cursor:pointer; }
        .chat-body {
          padding: 12px;
          overflow:auto;
          flex: 1;
          background: linear-gradient(180deg,#fbfdff,#fff);
        }
        .msg { margin-bottom: 10px; display:flex; }
        .msg.user { justify-content: flex-end; }
        .bubble {
          max-width: 74%;
          padding: 10px 12px;
          border-radius: 12px;
          background: #f1f5f8;
          color: #1f2d36;
        }
        .msg.bot .bubble { background: #0f667f; color: white; }
        .chat-input {
          padding: 10px;
          display:flex;
          gap:8px;
          align-items:center;
          border-top: 1px solid #eee;
        }
        textarea {
          flex: 1;
          resize: none;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #e6e9ee;
          min-height: 40px;
          max-height: 120px;
          font-family: inherit;
        }
        .send-btn {
          padding: 10px 12px;
          border-radius: 8px;
          background: linear-gradient(90deg,#d8b37b,#c87a3c);
          color: #fff;
          border: none;
          cursor: pointer;
        }
        .send-btn[disabled] { opacity: 0.6; cursor: default; }
      `}</style>
    </div>
  );
}
