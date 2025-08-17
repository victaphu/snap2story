// Per-theme cover scene guidance and optional style notes.

export const COVER_SCENES: Record<string, { scene: string; notes?: string }> = {
  adventure: {
    scene: 'standing proudly on a winding path with rolling hills, map and compass motifs, gentle breeze, playful clouds',
    notes: 'hint of journey ahead, tiny critters watching curiously',
  },
  friendship: {
    scene: 'alongside a friendly companion in a sunny park, sharing and smiling, flowers and heart motifs, gentle sunbeams',
    notes: 'togetherness and kindness visual cues',
  },
  family: {
    scene: 'in a cozy home doorway with warm light, family motifs like heart garlands and framed drawings',
    notes: 'soft interior light and homely textures',
  },
  dreams: {
    scene: 'under a magical night sky filled with stars and a friendly moon, soft clouds and sparkles',
    notes: 'glow, stardust particles, calm night palette',
  },
};

export function getCoverScene(themeId: string): { scene: string; notes?: string } {
  return COVER_SCENES[themeId] || { scene: 'in a whimsical children\'s story cover scene fitting the theme' };
}

