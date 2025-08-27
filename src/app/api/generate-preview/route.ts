// app/api/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStoryTemplate, generateBookTitle } from '@/lib/story-templates';
import { getCoverScene } from '@/lib/cover-prompts';
import { deriveCoverSceneFromCsv } from '@/lib/story-csv';
import { THEMES } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/services/supabase-server';
import { addTextOverlay } from '@/lib/text-overlay';

export const runtime = 'nodejs';

// Use queue system for longer-running requests
const useQueue = process.env.USE_QUEUE_SYSTEM === 'true';

// ---------- Utilities ----------
type NonEmpty<T extends string> = T & { __brand: 'nonempty' };
const ne = (s?: string | null): NonEmpty<string> | null => {
  const v = (s ?? '').trim();
  return v ? (v as NonEmpty<string>) : null;
};

const parseIntSafe = (s?: string | number | null, fallback = 0) => {
  if (typeof s === 'number') return s;
  if (!s) return fallback;
  const n = parseInt(String(s), 10);
  return Number.isFinite(n) ? n : fallback;
};


function mapThemeToStoryId(themeSlug: string | null | undefined): string | null {
  if (!themeSlug) return null;
  const mapping: Record<string, string> = {
    adventure: 'adventure_flexible_multiage',
    friendship: 'friendship_flexible_multiage',
    family: 'family_flexible_multiage',
    dreams: 'dreams_flexible_multiage',
    travel: 'travel_world_v2_multiage',
  };
  return mapping[themeSlug] || null;
}


// Consistent art style definitions used across all image generation
const STYLE_MAP: Record<string, string> = {
  // Core styles
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
  // Legacy compatibility mappings
  'childrens-cartoon':
    "Bright Cartoon (Bluey-Inspired): Produce artwork in a bright, clean children's cartoon style inspired by Bluey, with simple rounded shapes, bold and vibrant colors, minimal shading, and happy, approachable character expressions. Use clean, thick outlines and maintain consistent character sizes, outfits, and colors in every image.",
  anime:
    'Anime Chibi / Ghibli-Inspired: Use rounded, chibi-like proportions with big, expressive eyes, soft palettes, gentle shading, and cozy backgrounds. Keep designs adorable and heartwarming, with consistent character proportions, colors, and simple, readable shapes.',
  'comic-book':
    'Fantasy Fairytale Style: Generate illustrations in a classic fairytale style, with detailed but soft linework, whimsical backgrounds, and a touch of magic in the color palette. Use subtle glowing highlights, soft shading, and ornate but approachable designs to make every page feel like a magical adventure. Keep characters visually consistent across all pages.',
};

// prints: 8x8in @300 DPI unless overridden; safe-area 10% default
function buildPrompt(opts: {
  kind: 'cover' | 'interior' | 'dedication';
  heroName: string;
  scene: string;
  bookTitle?: string | null;       // add title if provided
  styleKey?: string | null;
  safeAreaPct?: number;            // default 10
  includeTitle?: boolean;          // enable title text
}) {
  const hero = (opts.heroName || 'Hero').trim();
  const scene = (opts.scene || 'in a whimsical child-friendly environment').trim();
  const title = opts.bookTitle?.trim() || null;
  const safeArea = Math.max(5, Math.min(20, Math.round(opts.safeAreaPct ?? 10)));

  const artStyleClause = opts.styleKey && STYLE_MAP[opts.styleKey]
    ? `Art style: ${STYLE_MAP[opts.styleKey]}`
    : '';

  // Core image generation instructions
  const basePrompt = [
    artStyleClause, // Put illustration style first
    `Create a full-bleed title page with no borders or frames.`,
    `Character: ${hero} matching the appearance from the uploaded photo. Convert the hero into their animated cartoon form matching the image style and scene, make. the character a hero and pose them in appropriate pose for image`,
    `Add a friendly companion if no other people are in the original photo.`,
    `Scene: ${scene}`,
    `Style: Child-friendly, warm, heartwarming with natural proportions.`,
  ].filter(Boolean);

  // Add title if requested
  if (opts.includeTitle && title) {
    basePrompt.push(
      `Title: Add "${title}" in large, hand-lettered, colorful text at the top-center with high contrast and readability.`
    );
  }

  // Add safety constraints
  basePrompt.push(
    `Keep important content within ${safeArea}% safe area from edges.`,
    `AVOID: borders, frames, mockups, templates, extra limbs, distorted anatomy, low contrast, motion blur.`
  );

  return basePrompt.join(' ');
}



// ---------- Route ----------
export async function POST(request: NextRequest) {
  try {
    // If queue system is enabled, delegate to backend service
    if (useQueue) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const payload = await request.json();

      const response = await fetch(`${backendUrl}/api/jobs/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Backend service unavailable' }));
        return NextResponse.json({ 
          error: 'Queue service error', 
          details: error.error || `HTTP ${response.status}` 
        }, { status: 502 });
      }

      return NextResponse.json(await response.json());
    }
    const payload = await request.json();

    const {
      heroName: heroNameInput,
      themeId: themeIdInput,
      storyId: storyIdInput,
      seriesKey: seriesKeyInput,
      originalImageBase64,
      maskBase64,
      coverPromptOverride,
      ageGroup: ageGroupInput,
      length: lengthInput,
      styleKey,
      kind: kindInput,
      storyText: storyTextInput,
    } = payload ?? {};

    // Extract and validate inputs
    const kind = String(kindInput || 'cover').toLowerCase() as 'cover' | 'interior';
    const themeId = themeIdInput;
    const ageGroup = ageGroupInput;
    const length = lengthInput;
    const heroName = heroNameInput || 'Hero';
    const storyText = storyTextInput || '';

    // Input validation
    if (!themeId) {
      return NextResponse.json({ error: 'Missing themeId' }, { status: 400 });
    }
    if (!ne(originalImageBase64)) {
      return NextResponse.json({ error: 'An uploaded image is required' }, { status: 400 });
    }

    // --- Resolve story template (DB preferred; local fallback)
    let storyTemplate: any | null = null;
    let fullPageRows: any[] = [];
    try {
      let storyId: string | null = storyIdInput || mapThemeToStoryId(themeId);
      console.log('story id is', storyId);
      const desiredLength = typeof length === 'number' ? length : (parseIntSafe(lengthInput, 0) || 10);
      const seriesKey = ne(seriesKeyInput) ? String(seriesKeyInput) : null;

      // Prefer explicit series key when available
      if (!storyId && seriesKey && desiredLength) {
        const { data: variant } = await supabaseAdmin
          .from('story_templates')
          .select('story_id')
          .eq('series_key', seriesKey)
          .eq('page_count', desiredLength)
          .maybeSingle();
        if (variant?.story_id) storyId = String(variant.story_id);
      }

      // If we have storyId & desired page count, swap for sibling variant
      if (storyId && desiredLength) {
        const { data: baseRow } = await supabaseAdmin
          .from('story_templates')
          .select('series_key')
          .eq('story_id', storyId)
          .maybeSingle();

        const seriesKey = baseRow?.series_key as string | undefined;
        if (seriesKey) {
          const { data: variant } = await supabaseAdmin
            .from('story_templates')
            .select('story_id')
            .eq('series_key', seriesKey)
            .eq('page_count', desiredLength)
            .maybeSingle();
          if (variant?.story_id) storyId = String(variant.story_id);
        }
      }

      // If still no storyId, try theme name + page_count
      if (!storyId && themeId && desiredLength) {
        const themeName = THEMES.find((t) => t.slug === themeId)?.name || themeId;
        const { data: found } = await supabaseAdmin
          .from('story_templates')
          .select('story_id')
          .eq('theme', themeName)
          .eq('page_count', desiredLength)
          .order('created_at', { ascending: true })
          .maybeSingle();
        if (found?.story_id) storyId = String(found.story_id);
      }

      if (storyId) {
        const { data: meta, error: metaErr } = await supabaseAdmin
          .from('story_templates')
          .select('story_id, theme, title')
          .eq('story_id', storyId)
          .maybeSingle();

        if (!metaErr && meta) {
          const ageNum = typeof ageGroup === 'string'
            ? parseIntSafe(ageGroup.split('-')[0], 5)
            : 5;

          const { data: pageRows, error: rpcErr } = await supabaseAdmin.rpc(
            'get_story_pages_full_for_age',
            { p_story_id: storyId, p_age: ageNum }
          );

          if (!rpcErr && Array.isArray(pageRows) && pageRows.length > 0) {
            fullPageRows = pageRows;
            const pages = pageRows.map((r: any) => ({
              pageNumber: Number(r.page_number),
              text: String(r.text || ''),
              imageDescription: String(r.image_description || ''),
              isTitle: Boolean(r.is_title),
              isDedication: Boolean(r.is_dedication),
            }));
            storyTemplate = {
              id: storyId,
              theme: meta.theme,
              title: meta.title,
              pages,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Supabase template fetch failed; falling back to local templates:', e);
    }

    // Fallback to local templates when DB lookup fails
    if (!storyTemplate) {
      storyTemplate = getStoryTemplate(themeId);
      if (!storyTemplate) {
        return NextResponse.json({ error: 'Template not found for selected theme/series and page count' }, { status: 400 });
      }
    }

    // --- Generate book title from template or fallback
    const bookTitle = typeof storyTemplate?.title === 'string'
      ? storyTemplate.title.replace(/{heroName}/g, heroName)
      : generateBookTitle(themeId, heroName);

    console.log('template loaded:', { 
      storyTemplate: storyTemplate?.title, 
      storyId: storyIdInput, 
      fullStoryTemplate: !!storyTemplate,
      templateType: storyTemplate ? 'database' : 'local',
      dbMeta: fullPageRows.length > 0 ? 'found' : 'empty',
      bookTitle,
      kind
    });

    // --- Scene from story template page-0 (title page)
    let templateScene: string | null = null;
    let notes: string | null = null;

    // Try to get imageDescription from page-0 (title page) of the story template
    if (fullPageRows.length > 0) {
      const titlePage = fullPageRows.find((r: any) => r.is_title || r.page_number === 0);
      if (titlePage?.image_description) {
        // Apply placeholder substitution to the template scene
        let scene = String(titlePage.image_description);
        scene = scene.replace(/{heroName}/g, heroName);
        scene = scene.replace(/{hero_description}/g, 'from the photo');
        scene = scene.replace(/{friendName}/g, 'companion');
        scene = scene.replace(/{friend_description}/g, 'friendly companion');
        templateScene = scene;
      }
    } else if (storyTemplate?.pages?.length > 0) {
      // Check local story template pages for title page
      const titlePage = storyTemplate.pages.find((p: any) => p.isTitle || p.pageNumber === 0);
      if (titlePage?.imageDescription) {
        let scene = String(titlePage.imageDescription);
        scene = scene.replace(/{heroName}/g, heroName);
        scene = scene.replace(/{hero_description}/g, 'from the photo');
        scene = scene.replace(/{friendName}/g, 'companion');
        scene = scene.replace(/{friend_description}/g, 'friendly companion');
        templateScene = scene;
      }
    }

    // Fallback to CSV/default scenes if no template scene
    if (!templateScene) {
      const themeName = THEMES.find((t) => t.slug === themeId)?.name || storyTemplate.theme;
      const selectedAge = typeof ageGroup === 'string' ? ageGroup : '5-6';
      const selectedLength = typeof length === 'number' ? length : 20;

      const csvVars: Record<string, string> = {
        hero_name: heroName,
        hero_description: 'from the photo',
      };
      const csvScene = deriveCoverSceneFromCsv(selectedAge, themeName, selectedLength, csvVars);
      const { scene: defaultScene, notes: defaultNotes } = getCoverScene(themeId);
      templateScene = csvScene || defaultScene;
      notes = defaultNotes || null;
    }

    const customScene = ne(coverPromptOverride) ?? (templateScene as NonEmpty<string>);

    // --- Prompt (cover vs interior)
    const prompt = buildPrompt({
      kind,
      heroName,
      scene: customScene,
      bookTitle,
      styleKey: styleKey || null,
      safeAreaPct: 10,
      includeTitle: kind === 'cover'
    }) + (notes ? ` Additional style notes: ${notes}.` : '');

    // --- Preview short-circuit
    if ((process.env.MOCK_PREVIEW || '').toLowerCase() === 'true') {
      return NextResponse.json({
        id: `preview-${Date.now()}`,
        title: bookTitle,
        themeId,
        coverImage: originalImageBase64,
        originalImage: originalImageBase64,
        storyTemplate,
        heroAnalysis: null,
        imageInspiration: 'mocked preview (no AI generation)',
        promptsUsed: { cover: prompt, story: [] as string[] },
        pages: [
          {
            id: 'title-page',
            type: 'title' as const,
            title: bookTitle,
            text: `A magical ${String(storyTemplate.theme).toLowerCase()} story featuring ${heroName}!`,
            imageUrl: originalImageBase64,
          },
        ],
        heroName,
        theme: storyTemplate.theme,
        createdAt: new Date().toISOString(),
      });
    }

    // --- Provider switch
    const provider = (process.env.IMAGE_EDIT_PROVIDER || 'qwen').toLowerCase();
    let generatedImageDataUrl: string;

    if (provider === 'qwen') {
      console.log('prompt', prompt);
      const origin =
        request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const qwenResp = await fetch(`${origin}/api/image/qwen3imageedit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: originalImageBase64,
          prompt,
          // Optionally pass mask if your Qwen endpoint supports it:
          ...(typeof maskBase64 === 'string' && maskBase64.startsWith('data:')
            ? { maskBase64 }
            : {}),
        }),
      });
      if (!qwenResp.ok) {
        const errText = await qwenResp.text().catch(() => '');
        return NextResponse.json({ error: 'Failed to generate title page (Qwen)', details: errText }, { status: 502 });
      }
      const qwenData = await qwenResp.json();
      const generatedImage = qwenData?.image as string | undefined;
      if (!generatedImage) {
        return NextResponse.json({ error: 'No image returned by Qwen' }, { status: 502 });
      }
      generatedImageDataUrl = generatedImage;
    } else {
      // OpenAI fallback
      const OpenAI = (await import('openai')).default;
      const { toFile } = await import('openai/uploads');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const dataUrl: string = originalImageBase64 as string;
      const mimeMatch = /^data:(image\/[^;]+);base64,/i.exec(dataUrl);
      let mime = (mimeMatch?.[1] || 'image/png').toLowerCase();
      let ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' :
        mime.includes('webp') ? 'webp' : 'png';

      const base64 = dataUrl.split(',')[1] || '';
      const imageBuf = Buffer.from(base64, 'base64');

      let maskFile: File | undefined;
      if (typeof maskBase64 === 'string' && maskBase64.startsWith('data:')) {
        const [, maskB64] = maskBase64.split(',');
        const maskBuf = Buffer.from(maskB64, 'base64');
        maskFile = await toFile(maskBuf, 'cover-mask.png', { type: 'image/png' });
      }

      const editResp = await openai.images.edit({
        model: 'gpt-image-1',
        image: await toFile(imageBuf, `cover-source.${ext}`, { type: mime }),
        ...(maskFile ? { mask: maskFile } : {}),
        prompt,
        size: '1024x1024',
      });

      const generatedImageBase64 = editResp.data?.[0]?.b64_json;
      if (!generatedImageBase64) {
        return NextResponse.json({ error: 'Failed to generate title page (OpenAI)' }, { status: 500 });
      }
      generatedImageDataUrl = `data:image/png;base64,${generatedImageBase64}`;
    }

    // --- Add text overlay for interior pages (but not cover)
    if (kind === 'interior' && storyText.trim()) {
      try {
        generatedImageDataUrl = await addTextOverlay({
          text: storyText,
          imageBase64: generatedImageDataUrl,
          fontSize: 28,
          fontFamily: 'Comic Sans MS, cursive, fantasy',
          textColor: '#2d3748',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 4,
          padding: 16,
          cornerRadius: 12,
          position: 'bottom',
          maxWidth: 0.9,
          lineHeight: 1.3,
        });
      } catch (error) {
        console.warn('Failed to add text overlay:', error);
        // Continue without overlay if it fails
      }
    }

    // --- Select first two non-title/dedication image prompts
    const storyImagePrompts: string[] = [];
    try {
      const src = Array.isArray(fullPageRows) && fullPageRows.length > 0
        ? fullPageRows
        : (storyTemplate?.pages || []);
      for (const r of src) {
        const isTitle = Boolean((r.is_title ?? r.isTitle) || false);
        const isDed = Boolean((r.is_dedication ?? r.isDedication) || false);
        const desc = String(r.image_description ?? r.imageDescription ?? '');
        const pn = Number((r.page_number ?? r.pageNumber) ?? NaN);
        if (!isTitle && !isDed && (isFinite(pn) ? pn >= 1 : true) && desc.trim()) {
          storyImagePrompts.push(desc.trim());
          if (storyImagePrompts.length >= 2) break;
        }
      }
    } catch (e) {
      console.warn('Story image prompt extraction failed:', e);
    }

    // --- Response
    return NextResponse.json({
      id: `preview-${Date.now()}`,
      title: bookTitle,
      themeId,
      coverImage: generatedImageDataUrl,
      originalImage: originalImageBase64,
      storyTemplate,
      heroAnalysis: null,
      imageInspiration: 'photo-to-cover stylization',
      promptsUsed: {
        cover: prompt,
        story: storyImagePrompts,
      },
      pages: [
        {
          id: 'title-page',
          type: 'title',
          title: bookTitle,
          text: `A magical ${String(storyTemplate.theme).toLowerCase()} story featuring ${heroName}!`,
          imageUrl: generatedImageDataUrl,
        },
      ],
      heroName,
      theme: storyTemplate.theme,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
