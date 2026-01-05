import React from 'react';

/**
 * Lightbulb icon - rounded line-icon style SVG
 * @param {number} size - Size of the icon (default: 24)
 * @param {string} color - Color of the icon (default: currentColor)
 * @param {string} className - Additional CSS classes
 */
export default function Lightbulb({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
