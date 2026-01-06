import React from 'react';

export default function Mood({ size = 48, color = '#6faab6', className = '' }) {
  // A friendly smiling face icon to represent mood / check-in
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
      <circle cx="32" cy="32" r="30" fill={color} opacity="0.14" />
      <circle cx="32" cy="32" r="22" fill={color} opacity="0.22" />
      <circle cx="32" cy="32" r="18" fill="#ffffff" />
      <circle cx="24" cy="26" r="3" fill="#0f1724" />
      <circle cx="40" cy="26" r="3" fill="#0f1724" />
      <path d="M22 40c3.333-4 6.667-6 14-6s10.667 2 14 6" stroke="#0f1724" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}