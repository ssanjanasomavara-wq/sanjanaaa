import React from 'react';
import PropTypes from 'prop-types';

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

  return (
    <div className={`image-grid ${className}`.trim()}>
      {tiles.map((item, index) => {
        const key = item.id || item.src || item.title || index;
        const href = item.href || item.link || null;

        // Determine content: image (if item.src present) or text tile (title)
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

        // Wrap with anchor if href provided, otherwise plain div
        if (href) {
          return (
            <a
              key={key}
              className="image-grid__item image-grid__link"
              href={href}
              target={isExternal(href) ? '_blank' : undefined}
              rel={isExternal(href) ? 'noopener noreferrer' : undefined}
              aria-label={item.ariaLabel || item.title || item.alt || `Link ${index + 1}`}
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
              aria-label={item.ariaLabel || item.title || item.alt || `Button ${index + 1}`}
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

ImageGrid.propTypes = {
  // Preferred generic prop
  items: PropTypes.arrayOf(
    PropTypes.shape({
      // image shape
      src: PropTypes.string,
      alt: PropTypes.string,
      caption: PropTypes.string,
      // tile shape
      title: PropTypes.string,
      subtitle: PropTypes.string,
      // linking
      href: PropTypes.string,
      link: PropTypes.string, // alternative name
      onClick: PropTypes.func,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      loading: PropTypes.oneOf(['eager', 'lazy']),
      ariaLabel: PropTypes.string,
    })
  ),
  // Backwards compatibility
  images: PropTypes.array,
  className: PropTypes.string,
};