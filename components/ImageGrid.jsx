import React from 'react';

/**
 * ImageGrid component - displays a responsive grid of images
 * @param {Array} images - Array of image objects with { src, alt } properties
 * @param {string} className - Additional CSS classes
 */
export default function ImageGrid({ images = [], className = '' }) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`image-grid ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="image-grid__item">
          <img src={image.src} alt={image.alt || `Image ${index + 1}`} />
        </div>
      ))}
    </div>
  );
}
