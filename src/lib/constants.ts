// Shared constants for styles, prompts, and mappings

export const STYLE_MAP: Record<string, string> = {
  watercolor:
    'Soft Watercolor Storybook: Create artwork in a hand-painted watercolor style, with soft pastels, gentle gradients, and textured paper effects. Keep the look dreamy, light, and calm, with rounded, friendly character designs and simple, uncluttered backgrounds for a soothing, storybook feel. Ensure consistent character proportions, colors, and details across every image.',
  'bright-cartoon':
    "Bright Cartoon (Bluey-Inspired): Produce artwork in a bright, clean children's cartoon style inspired by Bluey, with simple rounded shapes, bold and vibrant colors, minimal shading, and happy, approachable character expressions. Use clean, thick outlines and maintain consistent character sizes, outfits, and colors in every image.",
  'paper-collage':
    'Paper-Cut Collage Style: Create a paper-cut collage art style with layered textures, visible edges, and bright but slightly organic color tones. Each element should look handcrafted from textured paper, with soft shadows adding depth and dimension. Ensure character features and color palettes stay consistent across all pages.',
  fairytale:
    'Fantasy Fairytale Style: Generate illustrations in a classic fairytale style, with detailed but soft linework, whimsical backgrounds, and a touch of magic in the color palette. Use subtle glowing highlights, soft shading, and ornate but approachable designs to make every page feel like a magical adventure. Keep characters visually consistent across all pages.',
  'crayon-marker':
    'Crayon and Marker Sketch: Create images in a childlike crayon and marker sketch style, with bold, imperfect lines, playful textures, and bright primary colors. The style should feel spontaneous and fun, as if drawn by a creative child, while keeping characters clear and expressive. Ensure characters stay consistent throughout the series.',
  'anime-chibi':
    'Anime Chibi / Ghibli-Inspired: Use rounded, chibi-like proportions with big, expressive eyes, soft palettes, gentle shading, and cozy backgrounds. Keep designs adorable and heartwarming, with consistent character proportions, colors, and simple, readable shapes.',
  // Legacy compatibility
  'childrens-cartoon':
    "Bright Cartoon (Bluey-Inspired): Produce artwork in a bright, clean children's cartoon style inspired by Bluey, with simple rounded shapes, bold and vibrant colors, minimal shading, and happy, approachable character expressions. Use clean, thick outlines and maintain consistent character sizes, outfits, and colors in every image.",
  anime:
    'Anime Chibi / Ghibli-Inspired: Use rounded, chibi-like proportions with big, expressive eyes, soft palettes, gentle shading, and cozy backgrounds. Keep designs adorable and heartwarming, with consistent character proportions, colors, and simple, readable shapes.',
  'comic-book':
    'Fantasy Fairytale Style: Generate illustrations in a classic fairytale style, with detailed but soft linework, whimsical backgrounds, and a touch of magic in the color palette. Use subtle glowing highlights, soft shading, and ornate but approachable designs to make every page feel like a magical adventure. Keep characters visually consistent across all pages.',
};

export const FULL_BLEED_TEXT =
  'Generate a single full‑bleed, edge‑to‑edge page image (no borders, frames, margins, mockups, UI, or text).';

// Theme catalog (fallback when DB not available)
export const THEMES: { id: string; slug: string; name: string; description: string }[] = [
  { id: 'adventure', slug: 'adventure', name: 'Adventure & Exploration', description: 'Brave journeys, maps, and curious discoveries.' },
  { id: 'friendship', slug: 'friendship', name: 'Friendship & Kindness', description: 'Helping others, sharing, and feeling proud together.' },
  { id: 'family', slug: 'family', name: 'Family & Home Life', description: 'Cozy moments at home and big family days out.' },
  { id: 'dreams', slug: 'dreams', name: 'Dreams & Imagination', description: 'Magical worlds, gentle wonder, and bedtime sparkles.' },
  { id: 'custom', slug: 'custom', name: 'Custom Adventure', description: 'Tell your own unique story with full control.' },
];

// Age groups for UI selection
export const AGE_GROUPS: { id: string; label: string }[] = [
  { id: '0-1', label: '0–1' },
  { id: '1-3', label: '1–3' },
  { id: '3-4', label: '3–4' },
  { id: '5-6', label: '5–6' },
  { id: '7-8', label: '7–8' },
];

// Supported lengths (pages)
export const LENGTHS: number[] = [10, 20, 30];

// Book structure defaults for UI (can be adjusted per product)
export const BOOK_STRUCTURE = {
  IMAGE_PAGES: 10,
  TEXT_PAGES: 10,
  CONTENT_PAGES: 20,
  TOTAL_PAGES: 22, // includes covers
};

// App-wide limits
export const LIMITS = {
  MAX_IMAGE_SIZE: 8 * 1024 * 1024, // 8 MB
  MAX_HERO_IMAGES: 6,
  MAX_CUSTOM_PAGES: 30,
  PROMPT_MIN_LENGTH: 40,
  PROMPT_MAX_LENGTH: 600,
};

// Pricing (USD)
export const PRICING = {
  DIGITAL_FULL: 14.99,
  CANVA_EXPORT: 9.99,
  SOFTCOVER: 24.99,
  HARDCOVER: 34.99,
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  HEROES: 'heroes',
  PAGES: 'pages',
  EXPORTS: 'exports',
} as const;

// Navigation config (used by mobile + sidebar)
export const NAVIGATION = {
  MOBILE: [
    { id: 'home', icon: 'home', label: 'Home', href: '/' },
    { id: 'create', icon: 'plus', label: 'Create', href: '/create' },
    { id: 'editor', icon: 'wand2', label: 'Editor', href: '/create/editor' },
    { id: 'library', icon: 'library', label: 'Library', href: '/library' },
    { id: 'orders', icon: 'package', label: 'Orders', href: '/orders' },
  ],
  DESKTOP: [
    { id: 'home', icon: 'home', label: 'Home', href: '/' },
    { id: 'create', icon: 'plus', label: 'Create', href: '/create' },
    { id: 'editor', icon: 'wand2', label: 'Editor', href: '/create/editor' },
    { id: 'library', icon: 'library', label: 'Library', href: '/library' },
    { id: 'orders', icon: 'package', label: 'Orders', href: '/orders' },
    { id: 'account', icon: 'user', label: 'Account', href: '/account' },
  ],
};
