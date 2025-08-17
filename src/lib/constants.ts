export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1025,
} as const;

export const NAVIGATION = {
  DESKTOP: [
    { id: 'home', label: 'Home', href: '/', icon: 'home' },
    { id: 'create', label: 'Create', href: '/create', icon: 'wand2' },
    { id: 'library', label: 'My Stories', href: '/library', icon: 'library' },
    { id: 'orders', label: 'Orders', href: '/orders', icon: 'package' },
    { id: 'help', label: 'Help', href: '/help', icon: 'help-circle' },
    { id: 'account', label: 'Account', href: '/account', icon: 'user' },
  ],
  MOBILE: [
    { id: 'home', label: 'Home', href: '/', icon: 'home' },
    { id: 'create', label: 'Create', href: '/create', icon: 'wand2' },
    { id: 'library', label: 'Library', href: '/library', icon: 'library' },
    { id: 'orders', label: 'Orders', href: '/orders', icon: 'package' },
    { id: 'account', label: 'Account', href: '/account', icon: 'user' },
  ],
} as const;

// Productized themes (fixed 4) per brief
export const THEMES = [
  {
    id: 'adventure',
    name: 'Adventure & Exploration',
    slug: 'adventure',
    description: 'Curious journeys, discoveries, and brave moments',
    image: '/themes/adventure.jpg',
  },
  {
    id: 'friendship',
    name: 'Friendship & Kindness',
    slug: 'friendship',
    description: 'Helping others, sharing, and big-hearted teamwork',
    image: '/themes/friendship.jpg',
  },
  {
    id: 'family',
    name: 'Family & Home Life',
    slug: 'family',
    description: 'Everyday magic with the people we love',
    image: '/themes/family.jpg',
  },
  {
    id: 'dreams',
    name: 'Dreams & Imagination',
    slug: 'dreams',
    description: 'Whimsical worlds, bedtime wonder, and cozy scenes',
    image: '/themes/dreams.jpg',
  },
] as const;

// Pricing (USD) per brief
export const PRICING = {
  DIGITAL_FULL: 14.99, // 20–30 page full digital book
  CANVA_EXPORT: 4.99,  // add-on to push assets to Canva
  // Printing is pass-through via Lulu; keep placeholders for UI display when needed
  SOFTCOVER: 25,
  HARDCOVER: 50,
} as const;

// Age groups per brief
export const AGE_GROUPS = [
  { id: '0-1', label: '0–1' },
  { id: '1-3', label: '1–3' },
  { id: '3-4', label: '3–4' },
  { id: '5-6', label: '5–6' },
  { id: '7-8', label: '7–8' },
] as const;

// Supported lengths per brief
export const LENGTHS = [10, 20, 30] as const;

// Free tier configuration
export const FREE_TIER = {
  PAGES: 10,
  WATERMARK: true,
  DEDICATION_INCLUDED: true,
  MAX_FREE_BOOKS: 1,
} as const;

export const LIMITS = {
  MAX_HERO_IMAGES: 3,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_RETRY_COUNT: 3,
  MAX_CUSTOM_PAGES: 10, // Content pages, not including cover
  MAX_CUSTOM_IMAGES: 10, // Up to 10 images in custom stories
  AI_STORY_PAGES: 20, // 10 image pages + 10 text pages
  AI_IMAGE_PAGES: 10,
  AI_TEXT_PAGES: 10,
  PROMPT_MIN_LENGTH: 10,
  PROMPT_MAX_LENGTH: 500,
} as const;

export const CUSTOM_STORY = {
  MAX_TOTAL_PAGES: 11, // 1 cover + 10 content pages
  MAX_CONTENT_PAGES: 10,
  INCLUDES_COVER: true,
  MAX_TEXT_LENGTH: 1000, // Per page
  RECOMMENDED_TEXT_LENGTH: 150, // Per page for readability
} as const;

export const BOOK_STRUCTURE = {
  TOTAL_PAGES: 22, // Front cover + 10 image + 10 text + back cover
  CONTENT_PAGES: 20, // 10 image + 10 text
  IMAGE_PAGES: 10,
  TEXT_PAGES: 10,
  HAS_FRONT_COVER: true,
  HAS_BACK_COVER: true,
} as const;

export const STORAGE_BUCKETS = {
  HEROES: 'heroes',
  PAGES: 'pages',
  EXPORTS: 'exports',
} as const;
