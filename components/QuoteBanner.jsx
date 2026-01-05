import React from 'react';

/**
 * QuoteBanner component - displays an inspirational quote with author
 * Uses the DM Serif Display font for elegant quote styling
 */
export default function QuoteBanner({ text, author, className = '' }) {
  return (
    <div className={`quote-banner ${className}`}>
      <p className="quote-banner__text">{text}</p>
      {author && <p className="quote-banner__author">— {author}</p>}
    </div>
  );
}
