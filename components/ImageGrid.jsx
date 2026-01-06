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
    </div>
  );
}