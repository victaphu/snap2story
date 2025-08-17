import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { getStoryTemplate, generateBookTitle } from '@/lib/story-templates';
import { getCoverScene } from '@/lib/cover-prompts';
import { deriveCoverSceneFromCsv } from '@/lib/story-csv';
import { THEMES } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/services/supabase-server';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function mapThemeToStoryId(themeSlug: string | null | undefined): string | null {
  if (!themeSlug) return null;
  const mapping: Record<string, string> = {
    adventure: 'adventure_flexible_multiage',
    friendship: 'friendship_flexible_multiage',
    family: 'family_flexible_multiage',
    dreams: 'dreams_flexible_multiage',
  };
  return mapping[themeSlug] || null;
}

export async function POST(request: NextRequest) {
  try {
    const { heroName: heroNameInput, themeId: themeIdInput, heroAnalysis: heroAnalysisInput, originalImageBase64, maskBase64, coverPromptOverride, size, ageGroup: ageGroupInput, length: lengthInput, bookId } = await request.json();

    // Optionally load story/book details from Supabase when a bookId is provided
    let dbBook: any | null = null;
    if (bookId) {
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();
      if (error) {
        console.error('Failed to fetch book for preview generation:', error);
      } else {
        dbBook = data;
      }
    }

    // Merge inputs with DB-backed details (DB values take precedence when present)
    const themeId = (dbBook?.theme as string) || themeIdInput;
    const ageGroup = (dbBook?.age_group as string) || ageGroupInput;
    const length = (typeof dbBook?.length === 'number' ? dbBook.length : undefined) ?? lengthInput;
    const heroAnalysis = heroAnalysisInput; // currently not stored; keep from input
    const heroName = heroNameInput || 'Hero';

    if (!themeId || !heroAnalysis || !originalImageBase64) {
      return NextResponse.json(
        { error: 'Theme, hero analysis, and image are required' },
        { status: 400 }
      );
    }

    // Try to load the story template dynamically from Supabase for the given theme + age
    let storyTemplate: any | null = null;
    try {
      const storyId = mapThemeToStoryId(themeId);
      if (storyId && supabaseAdmin) {
        // Fetch template meta
        const { data: meta, error: metaErr } = await supabaseAdmin
          .from('story_templates')
          .select('story_id, theme, title')
          .eq('story_id', storyId)
          .maybeSingle();

        if (!metaErr && meta) {
          // Parse numeric age from group like "5-6" -> 5
          const ageNum = typeof ageGroup === 'string' ? parseInt(ageGroup.split('-')[0] || '5', 10) : 5;
          const { data: pageRows, error: rpcErr } = await supabaseAdmin.rpc('get_story_pages_for_age', {
            p_story_id: storyId,
            p_age: ageNum,
          });

          if (!rpcErr && Array.isArray(pageRows) && pageRows.length > 0) {
            const pages = pageRows.map((r: any) => ({
              pageNumber: Number(r.page_number),
              text: String(r.text || ''),
              imageDescription: String(r.image_description || ''),
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
    } catch (dbErr) {
      console.error('Supabase template fetch failed; falling back:', dbErr);
    }

    // Fallback to local templates when DB not available
    if (!storyTemplate) {
      storyTemplate = getStoryTemplate(themeId);
      if (!storyTemplate) {
        return NextResponse.json(
          { error: 'Invalid theme selected' },
          { status: 400 }
        );
      }
    }

    // Use DB title if available, otherwise generate with hero's name
    const bookTitle = (dbBook?.title as string)
      || (typeof (storyTemplate as any)?.title === 'string'
          ? (storyTemplate as any).title.replace(/{heroName}/g, heroName)
          : generateBookTitle(themeId, heroName));

    // Create enhanced prompt using hero analysis and uploaded image
    const heroDescription = `${heroAnalysis.age} with ${heroAnalysis.hairColor} hair, ${heroAnalysis.complexion} complexion, wearing ${heroAnalysis.clothing}`;

    // Determine theme name for CSV mapping
    const themeName = THEMES.find(t => t.slug === themeId)?.name || storyTemplate.theme;
    const selectedAge = typeof ageGroup === 'string' ? ageGroup : '5-6';
    const selectedLength = typeof length === 'number' ? length : 20;

    // Try deriving cover scene from CSV's first page image prompt
    const csvVars: Record<string, string> = {
      hero_name: heroName,
      hero_description: `${heroAnalysis?.age || ''} ${heroAnalysis?.hairColor ? 'with ' + heroAnalysis.hairColor + ' hair,' : ''} ${heroAnalysis?.complexion || ''} ${heroAnalysis?.clothing ? ', wearing ' + heroAnalysis.clothing : ''}`.replace(/\s+/g, ' ').trim() || 'from the photo',
    };
    const csvScene = deriveCoverSceneFromCsv(selectedAge, themeName, selectedLength, csvVars);

    // Fallback to predefined theme prompts when CSV scene is not available
    const { scene: defaultScene, notes } = getCoverScene(themeId);
    const baseScene = csvScene || defaultScene;

    // Optional override allows per-request art direction while maintaining defaults
    const customScene = (typeof coverPromptOverride === 'string' && coverPromptOverride.trim().length > 0)
      ? coverPromptOverride.trim()
      : baseScene;

    // Use image-to-image (edits) to repaint the uploaded photo into a themed cover while maintaining likeness
    const prompt = [
      "Repaint this photo as a front cover for a children's book.",
      `Main character: ${heroName}, ${heroDescription}, ${heroAnalysis.expression} expression. Keep exact likeness from the photo (hair, skin tone, facial features, clothing colors). Include distinctive features: ${heroAnalysis.distinctiveFeatures}.`,
      `Scene: Place the character ${customScene}. Ensure subject scale, lighting, and shadows match the environment. Leave clean space for title placement. Remove anything that isn't the main character first, and then place the character into the main scene. Make sure his clothes are appropriate for the scene that he is in`,
      // Strong constraints to avoid cropped title text
      `Book title: Render \"${bookTitle}\" prominently in large, colorful, child-friendly lettering, well integrated and clearly readable. Place within a safe area with at least 10% padding from every edge; do not let any letters touch or cross the canvas edges. Ensure the entire title is fully within frame (no cropping) with good contrast (outline or drop shadow if needed). Prefer positioning in the top third and scale to fit the safe area.`,
      'Art style: bright whimsical storybook style, soft watercolour textures, rounded shapes, expressive faces, warm and inviting lighting.',
      notes ? `Additional style notes: ${notes}.` : '',
    ].join(' ');

    console.log('generated prompt is', prompt);

    // If mocking is enabled, skip OpenAI image generation and echo original image as cover
    const MOCK_PREVIEW = (process.env.MOCK_PREVIEW || '').toLowerCase() === 'true';

    if (MOCK_PREVIEW) {
      const previewData = {
        id: `preview-${Date.now()}`,
        title: bookTitle,
        themeId,
        coverImage: originalImageBase64, // echo the uploaded image as the cover
        originalImage: originalImageBase64,
        storyTemplate: storyTemplate,
        heroAnalysis: heroAnalysis,
        imageInspiration: 'mocked preview (no AI generation)',
        pages: [
          {
            id: 'title-page',
            type: 'title' as const,
            title: bookTitle,
            text: `A magical ${storyTemplate.theme.toLowerCase()} story featuring ${heroName}!`,
            imageUrl: originalImageBase64,
          }
        ],
        heroName,
        theme: storyTemplate.theme,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(previewData);
    }

    // Convert data URL to file for edits API with correct mime/extension
    const dataUrl: string = originalImageBase64 as string;
    
    // More robust MIME type detection
    let mime = 'image/png'; // default
    let ext = 'png'; // default
    
    if (dataUrl.startsWith('data:')) {
      const mimeMatch = dataUrl.match(/^data:(image\/[^;]+);base64,/i);
      if (mimeMatch) {
        mime = mimeMatch[1].toLowerCase();
        // Extract extension from MIME type
        if (mime.includes('jpeg') || mime.includes('jpg')) {
          ext = 'jpg';
          mime = 'image/jpeg'; // Normalize to jpeg
        } else if (mime.includes('png')) {
          ext = 'png';
          mime = 'image/png';
        } else if (mime.includes('webp')) {
          ext = 'webp';
          mime = 'image/webp';
        }
      }
    }
    
    const base64 = dataUrl.split(',')[1] || '';
    const imageBuf = Buffer.from(base64, 'base64');
    
    // Log MIME type detection for debugging
    console.log(`Detected MIME type: ${mime}, extension: ${ext}`);

    // Optional mask to preserve subject and repaint background
    let maskFile: File | undefined;
    if (typeof maskBase64 === 'string' && maskBase64.startsWith('data:')) {
      const [, maskB64] = (maskBase64 as string).split(',');
      const maskBuf = Buffer.from(maskB64, 'base64');
      maskFile = await toFile(maskBuf, 'cover-mask.png', { type: 'image/png' });
    }

    const editResp = await openai.images.edit({
      model: 'gpt-image-1',
      image: await toFile(imageBuf, `cover-source.${ext}`, { type: mime }),
      ...(maskFile ? { mask: maskFile } : {}),
      prompt,
      // Generate a square, lower-resolution image for previews
      // Allow override via request body `size`, but default to square 512x512
      size: (typeof size === 'string' && /^(\d+)x\1$/.test(size)) ? (size as any) : '1024x1024',
    });

    const generatedImageBase64 = editResp.data?.[0]?.b64_json;

    if (!generatedImageBase64) {
      return NextResponse.json(
        { error: 'Failed to generate title page' },
        { status: 500 }
      );
    }

    // Log image size for debugging
    const imageSizeKB = Math.round((generatedImageBase64.length * 3) / 4 / 1024);
    console.log(`Generated image size: ${imageSizeKB}KB`);

    // Create data URL for the generated image
    const generatedImageDataUrl = `data:image/png;base64,${generatedImageBase64}`;

    // Create preview data with the generated title page
    const previewData = {
      id: `preview-${Date.now()}`,
      title: bookTitle,
      themeId,
      coverImage: generatedImageDataUrl,
      originalImage: originalImageBase64,
      storyTemplate: storyTemplate,
      heroAnalysis: heroAnalysis,
      imageInspiration: 'photo-to-cover stylization',
      pages: [
        {
          id: 'title-page',
          type: 'title',
          title: bookTitle,
          text: `A magical ${storyTemplate.theme.toLowerCase()} story featuring ${heroName}!`,
          imageUrl: generatedImageDataUrl,
        }
      ],
      heroName,
      theme: storyTemplate.theme,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(previewData);

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
