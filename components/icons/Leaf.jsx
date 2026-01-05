import React from 'react';

/**
 * Leaf Icon - Rounded line stroke icon
 * 
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {string} className - Additional CSS classes
 */
export default function Leaf({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`icon ${className}`}
      aria-hidden="true"
    >
      <path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
