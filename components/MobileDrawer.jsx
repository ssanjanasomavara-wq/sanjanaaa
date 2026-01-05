import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

/**
 * MobileDrawer (Portal)
 *
 * Renders the drawer into a portal attached to document.body so it sits outside
 * the page DOM flow (useful for z-index, stacking contexts and positioning).
 *
 * Props:
 * - open (bool)
 * - onClose (func)
 * - mobileMenuButtonRef (ref)
 * - onInvite (func)
 * - onChat (func)
 * - links (array of { href, label })
 */
export default function MobileDrawer({
  open = false,
  onClose = () => {},
  mobileMenuButtonRef = null,
  onInvite = () => {},
  onChat = () => {},
  links = [
    { href: '/posts', label: 'Posts' },
    { href: '/chat', label: 'Chat' },
    { href: '/features', label: 'Features' },
    { href: '/resources', label: 'Resources' },
    { href: '/settings', label: 'Settings' },
  ],
}) {
  const drawerRef = useRef(null);
  const previousActiveRef = useRef(null);
  const portalElRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Create portal container on mount (client-only)
  useEffect(() => {
    setMounted(true);
    const el = document.createElement('div');
    el.className = 'mobile-drawer-portal';
    portalElRef.current = el;
    document.body.appendChild(el);
    return () => {
      if (portalElRef.current && document.body.contains(portalElRef.current)) {
        document.body.removeChild(portalElRef.current);
      }
    };
  }, []);

  // Focus-trap, aria-hidden, scroll-lock while open
  useEffect(() => {
    if (!mounted) return;
    const drawer = drawerRef.current;

    if (open) {
      previousActiveRef.current = document.activeElement;
      const site = document.querySelector('.site');
      if (site) site.setAttribute('aria-hidden', 'true');

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const focusables = drawer ? drawer.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])') : [];
      if (focusables && focusables.length > 0) focusables[0].focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === 'Tab') {
          const nodes = Array.from(focusables);
          if (nodes.length === 0) return;
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => {
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
        document.body.style.overflow = prevOverflow || '';
        if (site) site.removeAttribute('aria-hidden');
        if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
          previousActiveRef.current.focus();
        } else if (mobileMenuButtonRef && mobileMenuButtonRef.current) {
          mobileMenuButtonRef.current.focus();
        }
      };
    } else {
      const site = document.querySelector('.site');
      if (site) site.removeAttribute('aria-hidden');
    }
  }, [open, mounted, onClose, mobileMenuButtonRef]);

  if (!mounted || !portalElRef.current) return null;

  return createPortal(
    <>
      <div
        className={`drawer-backdrop ${open ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        id="mobile-drawer"
        ref={drawerRef}
        className={`mobile-drawer ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="brand-avatar" aria-hidden="true">
              <img src="/semi-colonic-logo.png" alt="" />
            </div>
            <div className="drawer-title">Semi-colonic</div>
          </div>
          <button
            className="btn btn-plain drawer-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Mobile primary navigation">
          {links.map((l) => (
            <Link href={l.href} legacyBehavior key={l.href}>
              <a onClick={onClose}>{l.label}</a>
            </Link>
          ))}
        </nav>

        <div className="drawer-actions">
          <button
            className="btn btn-outline"
            onClick={() => {
              onInvite();
              onClose();
            }}
          >
            Invite
          </button>
          <button
            className="btn btn-strong"
            onClick={() => {
              onChat();
              onClose();
            }}
          >
            Chat
          </button>
        </div>
      </aside>

      <style jsx>{`
        /* Backdrop */
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(6,20,40,0.36);
          opacity: 0;
          pointer-events: none;
          transition: opacity 220ms ease;
          z-index: 1000;
        }
        .drawer-backdrop.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Drawer */
        .mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(84vw, 360px);
          max-width: 420px;
          background: #fff;
          box-shadow: -16px 0 40px rgba(6,20,40,0.12);
          transform: translateX(100%);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          padding: 12px;
          gap: 12px;
          border-left: 1px solid rgba(6,20,40,0.04);
          transition: transform 300ms cubic-bezier(.2,.9,.2,1);
          -webkit-overflow-scrolling: touch;
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drawer-title {
          font-weight: 700;
          color: var(--text-primary);
        }
        .drawer-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .drawer-nav a {
          padding: 10px 8px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-primary);
        }
        .drawer-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          justify-content: space-between;
        }

        @media (prefers-reduced-motion: reduce) {
          .drawer-backdrop { transition: none; }
          .mobile-drawer { transition: none; transform: none !important; right: 0; width: 100%; }
        }

        /* Make drawer full-screen on narrow / taller phones (covers iPhone 13 Pro) */
        @media (max-width: 430px) and (min-height: 800px) {
          .mobile-drawer {
            width: 100vw;
            height: 100vh;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            border-left: none;
            border-radius: 0;
          }
        }

        /* very small phones fallback */
        @media (max-width: 420px) {
          .mobile-drawer { width: 100vw; }
        }
      `}</style>
    </>,
    portalElRef.current
  );
}
