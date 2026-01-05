import React from 'react';

/**
 * QuoteBanner - Displays an inspirational quote with author attribution
 * Uses DM Serif Display for quote text and Poppins for author
 * 
 * @param {string} quote - The quote text to display
 * @param {string} author - The author's name
 */
export default function QuoteBanner({ quote, author }) {
  return (
    <div className="quote-banner">
      <blockquote className="quote-banner__text">
        "{quote}"
      </blockquote>
      {author && (
        <p className="quote-banner__author">{author}</p>
      )}
    </div>
  );
}
