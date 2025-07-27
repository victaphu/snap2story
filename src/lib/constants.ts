export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1025,
} as const;

export const NAVIGATION = {
  DESKTOP: [
    { id: 'home', label: 'Home', href: '/', icon: 'home' },
    { id: 'create', label: 'Create', href: '/create', icon: 'plus' },
    { id: 'library', label: 'My Stories', href: '/library', icon: 'library' },
    { id: 'orders', label: 'Orders', href: '/orders', icon: 'package' },
    { id: 'help', label: 'Help', href: '/help', icon: 'help-circle' },
    { id: 'account', label: 'Account', href: '/account', icon: 'user' },
  ],
  MOBILE: [
    { id: 'home', label: 'Home', href: '/', icon: 'home' },
    { id: 'create', label: 'Create', href: '/create', icon: 'plus' },
    { id: 'library', label: 'Library', href: '/library', icon: 'library' },
    { id: 'orders', label: 'Orders', href: '/orders', icon: 'package' },
    { id: 'account', label: 'Account', href: '/account', icon: 'user' },
  ],
} as const;

export const THEMES = [
  {
    id: 'bedtime',
    name: 'Bedtime',
    slug: 'bedtime',
    description: 'Peaceful stories for bedtime',
    image: '/themes/bedtime.jpg',
  },
  {
    id: 'family',
    name: 'Family Adventures',
    slug: 'family-adventures',
    description: 'Fun family experiences',
    image: '/themes/family.jpg',
  },
  {
    id: 'celebrations',
    name: 'Celebrations',
    slug: 'celebrations',
    description: 'Special occasions and holidays',
    image: '/themes/celebrations.jpg',
  },
  {
    id: 'travel',
    name: 'Travel',
    slug: 'travel',
    description: 'Adventures around the world',
    image: '/themes/travel.jpg',
  },
  {
    id: 'places',
    name: 'Visiting Places',
    slug: 'visiting-places',
    description: 'Exploring new locations',
    image: '/themes/places.jpg',
  },
  {
    id: 'custom',
    name: 'Customize Your Own',
    slug: 'custom',
    description: 'Create your unique story',
    image: '/themes/custom.jpg',
  },
] as const;

export const PRICING = {
  STORY_CREATION: 5, // AI generation fee
  PDF: 5,
  SOFTCOVER: 25,
  HARDCOVER: 50,
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