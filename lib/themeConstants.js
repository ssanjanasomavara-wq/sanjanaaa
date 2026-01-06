/**
 * Shared constants for theme-related content
 */

// Seaside placeholder images
export const SEASIDE_IMAGES = [
  { src: '/images/sea1.jpg', alt: 'Calming ocean gradient', caption: 'Ocean Serenity' },
  { src: '/images/sea2.jpg', alt: 'Warm sand gradient', caption: 'Sandy Shores' },
  { src: '/images/sea3.jpg', alt: 'Seafoam gradient', caption: 'Gentle Waves' },
  { src: '/images/sea4.jpg', alt: 'Sunset gradient', caption: 'Peaceful Sunset' }
];

export const THINGS_IMAGES = [
  { src: '/images/things.jpeg', alt: 'Things gradient', caption: 'Things you know' },
  { src: '/images/nos.jpeg', alt: 'Nostalgia gradient', caption: 'Nostalgic feeling' },
  { src: '/images/compliment.jpeg', alt: 'Compliment gradient', caption: 'You light up a room' },
  { src: '/images/sky.jpeg', alt: 'Sky gradient', caption: 'Peaceful Sky' }
];

/**
 * THINGS_ITEMS
 * Mixed array for use with ImageGrid (supports image tiles and text tiles).
 * - Image tile: { src, alt, caption, href }
 * - Text tile:  { title, subtitle, href }
 *
 * Use this wherever you need grid items that can navigate to pages.
 */
export const THINGS_ITEMS = [
  // Image tile linking to Features page
  {
    src: '/images/things.jpeg',
    alt: 'Things gradient',
    caption: 'Things you know',
    href: '/features'
  },
  // Text tile linking to Features (explicit text tile)
  {
    title: 'App Features',
    subtitle: 'Explore app features',
    href: '/features'
  },
  
  // Text tile linking to Games
  {
    title: 'Mindful Games',
    subtitle: 'Relaxing mini-games',
    href: '/games'
  },
  // Image tile with a link (static)
  {
    src: '/images/nos.jpeg',
    alt: 'Nostalgia gradient',
    caption: 'Nostalgic feeling',
    href: '/games'
  },
  
  // Image tile linking to Resources
  {
    src: '/images/compliment.jpeg',
    alt: 'Compliment gradient',
    caption: 'You light up a room',
    href: '/resources'
  },
  // Text tile linking to Resources
  {
    title: 'Resources',
    subtitle: 'Books and other suggestions',
    href: '/resources'
  },
  // Text tile linking to Resources
  {
    title: 'Community Post',
    subtitle: 'Browse community posts',
    href: '/posts'
  },
  // Fallback image tile (no link)
  {
    src: '/images/sky.jpeg',
    alt: 'Chat with your community',
    caption: 'Join community conversations',
    href: '/chat'

  }
];

// Inspirational quotes
export const QUOTES = {
  home: {
    quote: "The tide goes out. The tide comes back. You're safe to pause here.",
    author: "Semi-colonic"
  },
  dashboard: {
    quote: "Not the end—just a moment to rest.",
    author: "Semi-colonic"
  },
  features: {
    quote: "Find peace in small moments. Explore features designed to support your wellness journey.",
    author: "Semi-colonic"
  },
  resources: {
    quote: "What does a semicolon mean? A semicolon is used when a sentence could end — but doesn’t. It represents choosing to continue, even when stopping feels easier.",
    author: "Semi-colonic"
  },
  games: {
    quote: "What is semi‑colonic? Semi‑colonic lives in the pause before that choice. This app is not about fixing yourself or being productive. It’s a place to rest, reflect, and continue gently.",
    author: "Semi-colonic"
  }
};