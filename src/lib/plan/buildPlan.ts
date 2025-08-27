export type DbPage = { pageNumber: number; text: string; imageDescription: string; isTitle?: boolean; isDedication?: boolean; raw?: any };

export type GenItem = {
  key: string;
  label: string;
  prompt: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  image?: string;
  canEdit?: boolean;
  regenCount?: number;
  storyText?: string;
  pageType?: 'blank' | 'text-only' | 'static' | 'generated';
  staticImagePath?: string;
  progress?: number;
  message?: string;
  errorMessage?: string;
  kind?: 'cover' | 'interior' | 'dedication';
};

// Build the per-page generation plan from db pages and UI state
export function buildGenerationPlan(opts: {
  dbPages: DbPage[];
  length: number;
  styleDescription: string;
  existingCover?: string;
  dedicationText?: string;
}): GenItem[] {
  const { dbPages, length, styleDescription, existingCover, dedicationText } = opts;
  const plan: GenItem[] = [];

  // 1. Cover — reuse previously generated image; do not regenerate
  plan.push({
    key: 'cover',
    label: 'Front Cover (Page 1)',
    prompt: '',
    status: existingCover ? 'done' : 'pending',
    image: existingCover || undefined,
    canEdit: false,
    regenCount: 0,
    pageType: 'generated',
  });

  // 2. Blank page
  plan.push({
    key: 'blank-page',
    label: 'Page 2 - Intentionally Blank',
    prompt: '',
    status: 'done',
    canEdit: false,
    pageType: 'blank',
  });

  // 3. Dedication (AI via backend generation)
  plan.push({
    key: 'dedication',
    label: 'Dedication Page (Page 3)',
    prompt: [
      'Generate a single full‑bleed, edge‑to‑edge page image (no borders, frames, margins, mockups, UI, or text).',
      'Create a warm, inviting background perfect for a dedication page.',
      'Use soft, gentle colors and subtle patterns or textures.',
      'The design should be calming and not too busy, suitable for overlaying text.',
      'Include elements like soft clouds, gentle gradients, or subtle nature motifs.',
      `Art style: ${styleDescription}.`,
      'Generate only the background illustration without any text.',
    ].join(' '),
    status: 'pending',
    canEdit: true,
    regenCount: 0,
    pageType: 'generated',
    kind: 'dedication',
    storyText: dedicationText || undefined,
  });

  // 4. Interior pages: alternating text-only and text+image pages
  const content = (dbPages || []).filter((p) => !p.isTitle && !p.isDedication && p.pageNumber >= 1);
  const desired = Math.max(0, Number(length || 0));

  // Pairing strategy: for each narrative chunk, create a text-only page and a generated image page
  for (let i = 0; i < desired && i < content.length; i++) {
    const p = content[i];
    const text = String(p.text || '').trim();
    const imageDesc = String(p.imageDescription || '').trim();

    // Text-only page
    plan.push({
      key: `text-${i + 1}`,
      label: `Page ${i + 4} - Story Text`,
      prompt: '',
      status: 'done',
      canEdit: false,
      pageType: 'text-only',
      storyText: text,
    });

    // Generated image page
    plan.push({
      key: `img-${i + 1}`,
      label: `Page ${i + 5} - Story Image`,
      prompt: [
        'Generate a single full‑bleed, edge‑to‑edge page image (no borders, frames, margins, mockups, UI, or text).',
        imageDesc,
        `Art style: ${styleDescription}.`,
      ].join(' '),
      status: 'pending',
      canEdit: true,
      regenCount: 0,
      pageType: 'generated',
      kind: 'interior',
      storyText: text,
    });
  }

  // 5. Last 3 static images (back matter)
  plan.push({
    key: 'static-1',
    label: 'Back Matter 1',
    prompt: '',
    status: 'done',
    canEdit: false,
    pageType: 'static',
    staticImagePath: '/images/print/endpaper-1.jpg',
  });
  plan.push({
    key: 'static-2',
    label: 'Back Matter 2',
    prompt: '',
    status: 'done',
    canEdit: false,
    pageType: 'static',
    staticImagePath: '/images/print/endpaper-2.jpg',
  });
  plan.push({
    key: 'static-3',
    label: 'Back Matter 3',
    prompt: '',
    status: 'done',
    canEdit: false,
    pageType: 'static',
    staticImagePath: '/images/print/logo-page.jpg',
  });

  return plan;
}

