import React from 'react';
import Link from 'next/link';

/**
 * ImageGrid - Displays a responsive grid of images or text tiles, each optionally linking to a destination.
 *
 * Items supports two shapes:
 * - Image tile: { src, alt, caption, href }
 * - Text tile:  { title, subtitle, href }
 *
 * Backwards compatibility: you can still pass `images` (old name). Prefer `items` for new usage.
 *
 * @param {Array} items - Array of tile objects (see shapes above)
 * @param {Array} images - Backwards-compat prop (same shape as items)
 * @param {string} className - Additional class name added to container
 */
export default function ImageGrid({ items = null, images = [], className = '' }) {
  const tiles = Array.isArray(items) && items.length ? items : images;

  if (!tiles || tiles.length === 0) {
    return null;
  }

  const isExternal = (href) => typeof href === 'string' && /^https?:\/\//i.test(href);
  const isInternal = (href) => typeof href === 'string' && href.startsWith('/');

  return (
    <div className={`image-grid ${className}`.trim()}>
      {tiles.map((item, index) => {
        const key = item.id || item.src || item.title || index;
        const href = item.href || item.link || null;

        // Image content vs text tile
        const content = item.src ? (
          <>
            <img
              className="image-grid__img"
              src={item.src}
              alt={item.alt || item.title || `Image ${index + 1}`}
              loading={item.loading || 'lazy'}
            />
            {item.caption ? <div className="image-grid__caption">{item.caption}</div> : null}
          </>
        ) : (
          <div className="image-grid__tile">
            <div className="image-grid__tile-title">{item.title}</div>
            {item.subtitle ? <div className="image-grid__tile-subtitle">{item.subtitle}</div> : null}
          </div>
        );

        const ariaLabel = item.ariaLabel || item.title || item.alt || `Item ${index + 1}`;

        // If we have an href, prefer Next.js Link for internal links,
        // plain anchor for external links.
        if (href) {
          if (isInternal(href)) {
            return (
              <Link key={key} href={href} legacyBehavior>
                <a className="image-grid__item image-grid__link" aria-label={ariaLabel}>
                  {content}
                </a>
              </Link>
            );
          }

          // external link
          return (
            <a
              key={key}
              className="image-grid__item image-grid__link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ariaLabel}
            >
              {content}
            </a>
          );
        }

        // Non-link item (render as button if onClick provided, otherwise div)
        if (typeof item.onClick === 'function') {
          return (
            <button
              key={key}
              type="button"
              className="image-grid__item image-grid__button"
              onClick={item.onClick}
              aria-label={ariaLabel}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={key} className="image-grid__item">
            {content}
          </div>
        );
      })}

      <style jsx>{`
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          align-items: stretch;
        }

        .image-grid__item,
        .image-grid__link,
        .image-grid__button {
          display: block;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 6px 18px rgba(20,40,60,0.04);
          border: 1px solid rgba(6,20,40,0.04);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }

        .image-grid__item:focus,
        .image-grid__link:focus,
        .image-grid__button:focus {
          outline: 3px solid rgba(31,159,255,0.18);
          outline-offset: 2px;
        }

        .image-grid__item:hover,
        .image-grid__link:hover,
        .image-grid__button:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(20,40,60,0.08);
        }

        .image-grid__img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          display: block;
          background: linear-gradient(180deg, #f6f9fb, #fff);
        }

        .image-grid__caption {
          padding: 10px 12px;
          font-size: 14px;
          color: #183547;
          font-weight: 600;
        }

        .image-grid__tile {
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          min-height: 120px;
        }

        .image-grid__tile-title {
          font-weight: 700;
          color: #183547;
          font-size: 15px;
        }

        .image-grid__tile-subtitle {
          margin-top: 6px;
          color: #617489;
          font-size: 13px;
        }

        @media (max-width: 480px) {
          .image-grid__img,
          .image-grid__tile {
            height: auto;
            min-height: 100px;
          }
        }
      `}</style>
    </div>
  );
}
