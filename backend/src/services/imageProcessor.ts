import { ImageGenerationJobData } from '../types/index';

// Interface for image generation response
interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  previewData?: any;
}

// Type definitions from generate-preview
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

// Theme to story mapping
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

// Art style definitions
const STYLE_MAP: Record<string, string> = {
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

// Build comprehensive prompt based on generate-preview logic
function buildPrompt(opts: {
  kind: 'cover' | 'interior' | 'dedication';
  heroName: string;
  scene: string;
  bookTitle?: string | null;
  styleKey?: string | null;
  safeAreaPct?: number;
  includeTitle?: boolean;
}) {
  const hero = (opts.heroName || 'Hero').trim();
  const scene = (opts.scene || 'in a whimsical child-friendly environment').trim();
  const title = opts.bookTitle?.trim() || null;
  const safeArea = Math.max(5, Math.min(20, Math.round(opts.safeAreaPct ?? 10)));

  const artStyleClause = opts.styleKey && STYLE_MAP[opts.styleKey]
    ? `Art style: ${STYLE_MAP[opts.styleKey]}`
    : '';

  // Place illustration style at the very start for stronger conditioning
  const basePrompt = [
    artStyleClause,
    `Create a full-bleed title page with no borders or frames.`,
    `Character: ${hero} matching the appearance from the uploaded photo. Convert the hero into their animated cartoon form matching the image style and scene, make the character a hero and pose them in appropriate pose for image`,
    `Add a friendly companion if no other people are in the original photo.`,
    `Scene: ${scene}`,
    `Style: Child-friendly, warm, heartwarming with natural proportions.`,
  ].filter(Boolean);

  if (opts.includeTitle && title) {
    basePrompt.push(
      `Title: Add "${title}" in large, hand-lettered, colorful text at the top-center with high contrast and readability.`
    );
  }

  basePrompt.push(
    `Keep important content within ${safeArea}% safe area from edges.`,
    `AVOID: borders, frames, mockups, templates, extra limbs, distorted anatomy, low contrast, motion blur.`
  );

  return basePrompt.join(' ');
}

// Qwen image generation using qwen3imageedit endpoint logic
const generateWithQwen = async (params: ImageGenerationJobData, prompt: string): Promise<ImageGenerationResult> => {
  try {
    console.log(`🐉 Qwen: Starting image generation for job ${params.jobId}`);
    const content: any[] = [];
    const normalizeImage = (img: string) => {
      if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) return img;
      return `data:image/png;base64,${img}`;
    };
    
    console.log(`🐉 Qwen: Processing image data for job ${params.jobId}`);
    content.push({ image: normalizeImage(params.originalImageBase64) });
    content.push({ text: prompt });
    console.log(`🐉 Qwen: Prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`🐉 Qwen: Image data length: ${params.originalImageBase64.length} chars`);

    const dashscopeReq = {
      model: 'qwen-image-edit',
      input: {
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      },
      parameters: {
        negative_prompt: '',
        watermark: false,
      },
    };

    console.log(`🐉 Qwen: Sending API request for job ${params.jobId}...`);
    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_3_IMAGE_EDIT_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dashscopeReq)
    });

    console.log(`🐉 Qwen: Received response for job ${params.jobId}, status: ${response.status}`);
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`🐉 Qwen: API error for job ${params.jobId}: ${response.status} - ${errText}`);
      throw new Error(`Qwen API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    console.log(`🐉 Qwen: Processing API response for job ${params.jobId}`);
    
    // Extract image using the same logic from qwen3imageedit
    const tryExtractImage = (obj: any): string | undefined => {
      const msgContent = obj?.output?.choices?.[0]?.message?.content;
      if (Array.isArray(msgContent)) {
        const imgItem = msgContent.find((c: any) => typeof c?.image === 'string');
        if (imgItem?.image) return imgItem.image as string;
      }
      const outContent = obj?.output?.content;
      if (Array.isArray(outContent)) {
        const imgItem = outContent.find((c: any) => typeof c?.image === 'string');
        if (imgItem?.image) return imgItem.image as string;
      }
      const result0 = obj?.output?.results?.[0];
      if (result0?.image_base64) return `data:image/png;base64,${result0.image_base64}`;
      if (typeof result0?.image === 'string') return result0.image as string;
      if (typeof result0?.output_image_url === 'string') return result0.output_image_url as string;
      return undefined;
    };

    const image = tryExtractImage(data);
    if (!image) {
      console.error(`🐉 Qwen: No image returned from API for job ${params.jobId}`);
      throw new Error('No image returned from Qwen API');
    }

    console.log(`🐉 Qwen: Successfully extracted image for job ${params.jobId}, length: ${image.length} chars`);
    return {
      success: true,
      imageUrl: image
    };
  } catch (error) {
    console.error(`🐉 Qwen: Generation error for job ${params.jobId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// OpenAI image generation fallback (using same logic as generate-preview)
const generateWithOpenAI = async (params: ImageGenerationJobData, prompt: string): Promise<ImageGenerationResult> => {
  try {
    console.log(`🤖 OpenAI: Starting image generation for job ${params.jobId}`);
    
    // Dynamic import for OpenAI SDK
    console.log(`🤖 OpenAI: Loading OpenAI SDK...`);
    const { default: OpenAI } = await import('openai');
    const { toFile } = await import('openai/uploads');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log(`🤖 OpenAI: Processing image data for job ${params.jobId}`);
    const dataUrl: string = params.originalImageBase64;
    const mimeMatch = /^data:(image\/[^;]+);base64,/i.exec(dataUrl);
    let mime = (mimeMatch?.[1] || 'image/png').toLowerCase();
    let ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' :
      mime.includes('webp') ? 'webp' : 'png';

    const base64 = dataUrl.split(',')[1] || '';
    const imageBuf = Buffer.from(base64, 'base64');
    console.log(`🤖 OpenAI: Image buffer size: ${imageBuf.length} bytes, format: ${mime}`);

    let maskFile: any | undefined;
    if (params.maskBase64 && params.maskBase64.startsWith('data:')) {
      console.log(`🤖 OpenAI: Processing mask file for job ${params.jobId}`);
      const [, maskB64] = params.maskBase64.split(',');
      const maskBuf = Buffer.from(maskB64, 'base64');
      maskFile = await toFile(maskBuf, 'cover-mask.png', { type: 'image/png' });
    }

    console.log(`🤖 OpenAI: Sending image edit request for job ${params.jobId}...`);
    console.log(`🤖 OpenAI: Prompt: "${prompt.substring(0, 100)}..."`);
    
    const editResp = await openai.images.edit({
      model: 'gpt-image-1',
      image: await toFile(imageBuf, `cover-source.${ext}`, { type: mime }),
      ...(maskFile ? { mask: maskFile } : {}),
      prompt,
      size: '1024x1024',
    });

    console.log(`🤖 OpenAI: Received response for job ${params.jobId}`);
    const generatedImageBase64 = editResp.data?.[0]?.b64_json;
    if (!generatedImageBase64) {
      throw new Error('Failed to generate title page (OpenAI)');
    }
    
    console.log(`🤖 OpenAI: Successfully generated image for job ${params.jobId}, size: ${generatedImageBase64.length} chars`);
    return {
      success: true,
      imageUrl: `data:image/png;base64,${generatedImageBase64}`
    };
  } catch (error) {
    console.error(`🤖 OpenAI: Generation error for job ${params.jobId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Generate book title from template or fallback
const generateBookTitle = (themeId: string, heroName: string): string => {
  // Simple fallback title generation - you can expand this
  const themeNames: Record<string, string> = {
    adventure: 'Adventure',
    friendship: 'Friendship',
    family: 'Family',
    dreams: 'Dreams',
    travel: 'Travel'
  };
  const themeName = themeNames[themeId] || 'Adventure';
  return `${heroName}'s ${themeName} Story`;
};

// Add text overlay for interior pages
// Note: Text overlay is handled on the frontend side to avoid canvas compilation issues
const addTextOverlay = async (options: {
  text: string;
  imageBase64: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  cornerRadius?: number;
  position?: 'bottom' | 'top' | 'center';
  maxWidth?: number;
  lineHeight?: number;
}): Promise<string> => {
  // For now, return the original image without text overlay
  // Text overlay will be handled on the frontend in generate-preview API
  console.log(`Text overlay requested for interior page: "${options.text}"`);
  console.log('Text overlay will be handled by frontend generate-preview API');
  return options.imageBase64;
};

// Main image processing function with complete generate-preview logic
export const processImageGeneration = async (params: ImageGenerationJobData): Promise<ImageGenerationResult> => {
  console.log(`Processing image generation for job: ${params.jobId}`);
  
  try {
    const {
      heroName,
      themeId,
      storyId,
      originalImageBase64,
      ageGroup,
      length,
      styleKey,
      kind,
      storyText,
      coverPromptOverride
    } = params;

    // Input validation
    // themeId is optional; caller provides all required context
    if (!ne(originalImageBase64)) {
      throw new Error('An uploaded image is required');
    }

    // Resolve book title strictly from provided input (no auto-generation)
    const providedTitle = (params as any).bookTitle ? String((params as any).bookTitle).trim() : '';
    const bookTitle = providedTitle || '';
    
    // For now, use a simple scene - in production you'd query Supabase for story templates
    // Build the prompt: for cover, only use caller-supplied prompt. No defaults.
    let prompt: string;
    if ((kind || 'cover') === 'cover') {
      const p = (coverPromptOverride || '').trim();
      if (!p) throw new Error('Missing coverPromptOverride for cover generation');
      prompt = p;
    } else {
      // For non-cover cases, retain existing builder behavior
      const defaultScene = `${heroName} in a magical ${themeId || 'adventure'} adventure`;
      const customScene = ne(coverPromptOverride) ?? (defaultScene as NonEmpty<string>);
      prompt = buildPrompt({
        kind: kind || 'interior',
        heroName,
        scene: customScene,
        bookTitle,
        styleKey: styleKey || null,
        safeAreaPct: 10,
        includeTitle: false,
      });
    }

    console.log(`Generated prompt for job ${params.jobId}:`, prompt);

    // Mock mode short-circuit
    if ((process.env.MOCK_PREVIEW || '').toLowerCase() === 'true') {
      console.log(`🎭 Mock mode enabled for job ${params.jobId}, returning mock response`);
      
      const previewData = {
        id: `preview-${Date.now()}`,
        title: bookTitle || undefined,
        themeId,
        coverImage: originalImageBase64,
        originalImage: originalImageBase64,
        heroAnalysis: null,
        imageInspiration: 'mocked preview (no AI generation)',
        promptsUsed: {
          cover: prompt,
          story: [] as string[],
        },
        pages: [
          {
            id: 'title-page',
            type: 'title',
          title: bookTitle || undefined,
          text: '',
          imageUrl: originalImageBase64,
        },
      ],
        heroName,
        theme: themeId,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        imageUrl: originalImageBase64,
        previewData
      };
    }

    // Try Qwen first, fallback to OpenAI if it fails
    console.log(`🎯 Attempting image generation for job ${params.jobId} with Qwen...`);
    let result = await generateWithQwen(params, prompt);
    
    if (!result.success && process.env.OPENAI_API_KEY) {
      console.log(`🔄 Qwen failed for job ${params.jobId}, trying OpenAI fallback`);
      result = await generateWithOpenAI(params, prompt);
    } else if (!result.success) {
      console.log(`❌ Both Qwen and OpenAI unavailable/failed for job ${params.jobId}`);
    } else {
      console.log(`✅ Qwen successfully generated image for job ${params.jobId}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Image generation failed');
    }

    let generatedImageDataUrl = result.imageUrl!;

    // Add text overlay for interior pages (but not cover)
    if (kind === 'interior' && storyText && storyText.trim()) {
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

    // Build preview data similar to generate-preview response
    const previewData = {
      id: `preview-${Date.now()}`,
      title: bookTitle || undefined,
      themeId,
      coverImage: generatedImageDataUrl,
      originalImage: originalImageBase64,
      heroAnalysis: null,
      imageInspiration: 'photo-to-cover stylization',
      promptsUsed: {
        cover: prompt,
        story: [] as string[],
      },
      pages: [
        {
          id: 'title-page',
          type: 'title',
        title: bookTitle || undefined,
        text: '',
        imageUrl: generatedImageDataUrl,
      },
      ],
      heroName,
      theme: themeId,
      createdAt: new Date().toISOString(),
    };

    console.log(`Successfully generated image for job: ${params.jobId}`);
    console.log(`🎯 Final generated image URL for job ${params.jobId}: ${generatedImageDataUrl.substring(0, 100)}... (length: ${generatedImageDataUrl.length} chars)`);
    
    return {
      success: true,
      imageUrl: generatedImageDataUrl,
      previewData
    };
  } catch (error) {
    console.error(`Failed to generate image for job: ${params.jobId}, error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Enhanced processing steps with better progress tracking
export const processWithProgress = async (
  params: ImageGenerationJobData,
  progressCallback: (progress: number, message: string) => void
): Promise<ImageGenerationResult> => {
  // Check if mock mode is enabled for faster progress
  const isMockMode = (process.env.MOCK_PREVIEW || '').toLowerCase() === 'true';
  
  if (isMockMode) {
    // Slightly slower mock progress to avoid race conditions with WebSocket
    progressCallback(5, 'Worker picked up job from queue...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    progressCallback(25, 'Mock mode: Validating parameters...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    progressCallback(50, 'Mock mode: Preparing mock response...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    progressCallback(75, 'Mock mode: Generating mock preview...');
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = await processImageGeneration(params);
    
    progressCallback(100, 'Mock image generation completed successfully!');
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay before completion
    return result;
  }
  
  // Standard progress for real image generation
  progressCallback(5, 'Worker picked up job from queue...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  progressCallback(15, 'Validating parameters and preparing...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  progressCallback(25, 'Analyzing uploaded image...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  progressCallback(35, 'Loading story templates and themes...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  progressCallback(45, 'Crafting AI generation prompt...');
  await new Promise(resolve => setTimeout(resolve, 700));
  
  progressCallback(60, 'Sending to AI for image generation...');
  const result = await processImageGeneration(params);
  
  if (result.success) {
    progressCallback(80, 'Processing generated image...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (params.kind === 'interior' && params.storyText) {
      progressCallback(90, 'Adding text overlay to image...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      progressCallback(90, 'Finalizing and optimizing image...');
      await new Promise(resolve => setTimeout(resolve, 700));
    }
    
    progressCallback(95, 'Almost ready...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    progressCallback(100, 'Image generation completed successfully!');
    return result;
  } else {
    throw new Error(result.error || 'Image generation failed');
  }
};
