import React from 'react';

/**
 * ImageGrid - Displays a responsive grid of images with captions
 * 
 * @param {Array} images - Array of image objects with {src, alt, caption}
 */
export default function ImageGrid({ images = [] }) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="image-grid">
      {images.map((image, index) => (
        <div key={index} className="image-grid__item">
          <img
            src={image.src}
            alt={image.alt || ''}
            className="image-grid__image"
          />
          {image.caption && (
            <div className="image-grid__caption">{image.caption}</div>
          )}
        </div>
      ))}
    </div>
  );
}
