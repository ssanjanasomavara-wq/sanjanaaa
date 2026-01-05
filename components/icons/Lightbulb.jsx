import React from 'react';

/**
 * Lightbulb Icon - Rounded line stroke icon
 * 
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {string} className - Additional CSS classes
 */
export default function Lightbulb({ size = 24, className = '' }) {
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
        d="M9 18h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 22h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 14a5 5 0 1 0-6 0v3h6v-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
