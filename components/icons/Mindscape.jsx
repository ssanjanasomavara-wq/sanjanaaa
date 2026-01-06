import React from 'react';

export default function Mindscape({ size = 48, color = '#8fbfa8', className = '' }) {
  // A small abstract landscape: sun over layered hills to represent "Mindscape"
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <rect width="64" height="64" rx="12" fill={color} opacity="0.12" />
      <g transform="translate(6 10)">
        <circle cx="26" cy="6" r="6" fill="#ffd166" />
        <path d="M0 34c10-12 22-12 32 0 10-12 22-12 32 0v10H0V34z" fill="#ffffff" opacity="0.95"/>
        <path d="M0 44c12-10 24-10 32 0 8-10 20-10 32 0v6H0v-6z" fill="#e6f4ee"/>
      </g>
    </svg>
  );
}