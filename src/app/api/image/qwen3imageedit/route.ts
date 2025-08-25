import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/services/supabase-server';
import { deriveCoverSceneFromCsv } from '@/lib/story-csv';
import { getCoverScene } from '@/lib/cover-prompts';
import { THEMES } from '@/lib/constants';

type Payload = {
  imageBase64: string; // required, data URL or URL
  imageBase64_2?: string; // optional second image
  scene?: string;
  styleNotes?: string;
  keepLikeness?: boolean;
  bookId?: string; // optional: derive scene from DB
  prompt?: string; // optional: direct prompt override
};

const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    let { imageBase64, imageBase64_2, scene, styleNotes, keepLikeness = true, bookId } = body;
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });

    // If a bookId is provided and scene is not specified, try to derive it from DB (theme + age)
    if (!scene && bookId) {
      try {
        const { data: book, error } = await supabaseAdmin
          .from('books')
          .select('theme, age_group, length')
          .eq('id', bookId)
          .single();
        if (!error && book?.theme) {
          const themeId = book.theme as string;
          const selectedAge = typeof book.age_group === 'string' ? book.age_group : '5-6';
          const selectedLength = typeof book.length === 'number' ? book.length : 20;
          const themeName = THEMES.find(t => t.slug === themeId)?.name || themeId;
          const csvScene = deriveCoverSceneFromCsv(selectedAge, themeName, selectedLength, {});
          const fallback = getCoverScene(themeId);
          scene = csvScene || fallback.scene;
          if (fallback.notes) styleNotes = [styleNotes, fallback.notes].filter(Boolean).join('. ');
        }
      } catch (e) {
        console.warn('qwen3imageedit: failed to derive scene from DB', e);
      }
    }

    const parts: string[] = [];
    parts.push("Create a single children's picture-book page illustration (not a book mockup). Full-bleed, edge-to-edge, no frames or margins.");
    parts.push('Focus on the hero as the sole subject: isolate the hero cleanly from the original photo and remove everything that is not part of the hero before composing the scene.');
    parts.push('After isolating the hero, rebuild the background, scene, palette, and lighting according to the instructions; do not leave remnants of the original background.');
    parts.push('Clothing: adjust the outfit to be appropriate for the scene (colors and patterns may change) while staying age-appropriate.');
    parts.push('Ignore any white padding or borders added during preprocessing; treat padding as non-subject and do not reproduce white margins. Focus framing and composition on the character and the scene.');
    if (scene) {
      parts.push(`Place the subject into this new scene: ${scene}.`);
      parts.push('Ensure subject scale, lighting, and shadows match the new environment.');
    } else {
      parts.push('Keep the overall composition similar while stylizing.');
    }
    if (keepLikeness) {
      parts.push('Keep exact likeness: hair, skin tone, facial features, clothing colors.');
    }
    parts.push('Art style: bright whimsical storybook, soft watercolour textures, rounded shapes, expressive faces, warm and inviting lighting.');
    if (styleNotes) parts.push(styleNotes);
    const prompt = body.prompt && typeof body.prompt === 'string' && body.prompt.trim().length > 0
      ? body.prompt
      : parts.join(' ');

    // Build DashScope request body
    const content: any[] = [];
    const normalizeImage = (img: string) => {
      // Accept data URLs or remote URLs. If bare base64, prefix a data URL.
      if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) return img;
      return `data:image/png;base64,${img}`;
    };
    content.push({ image: normalizeImage(imageBase64) });
    if (imageBase64_2) content.push({ image: normalizeImage(imageBase64_2) });
    content.push({ text: prompt });

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

    const key = process.env.QWEN_3_IMAGE_EDIT_KEY;
    if (!key) return NextResponse.json({ error: 'Missing QWEN_3_IMAGE_EDIT_KEY' }, { status: 500 });

    const resp = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(dashscopeReq),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return NextResponse.json({ error: 'DashScope request failed', status: resp.status, details: errText }, { status: 502 });
    }
    const data = await resp.json();

    // Try extracting an image result from common DashScope shapes
    const tryExtractImage = (obj: any): string | undefined => {
      // messages -> content[{image}]
      const msgContent = obj?.output?.choices?.[0]?.message?.content;
      if (Array.isArray(msgContent)) {
        const imgItem = msgContent.find((c: any) => typeof c?.image === 'string');
        if (imgItem?.image) return imgItem.image as string;
      }
      // content at top-level output
      const outContent = obj?.output?.content;
      if (Array.isArray(outContent)) {
        const imgItem = outContent.find((c: any) => typeof c?.image === 'string');
        if (imgItem?.image) return imgItem.image as string;
      }
      // results list
      const result0 = obj?.output?.results?.[0];
      if (result0?.image_base64) return `data:image/png;base64,${result0.image_base64}`;
      if (typeof result0?.image === 'string') return result0.image as string;
      if (typeof result0?.output_image_url === 'string') return result0.output_image_url as string;
      return undefined;
    };

    const image = tryExtractImage(data);
    if (!image) {
      return NextResponse.json({ error: 'No image returned', raw: data }, { status: 502 });
    }

    // Return a URL (link). If we received a data URL, upload to storage and return a public link.
    let imageUrl = image;
    if (image.startsWith('data:')) {
      try {
        const match = /^data:(image\/[^;]+);base64,(.*)$/i.exec(image);
        const mime = match?.[1] || 'image/png';
        const b64 = match?.[2] || '';
        const buffer = Buffer.from(b64, 'base64');
        const path = `previews/${Date.now()}-${Math.random().toString(36).slice(2)}.${mime.includes('jpeg') ? 'jpg' : mime.includes('png') ? 'png' : 'png'}`;
        const { error: upErr } = await supabaseAdmin.storage.from('pages').upload(path, buffer, {
          contentType: mime,
          upsert: true,
        });
        if (!upErr) {
          const { data: pub } = supabaseAdmin.storage.from('pages').getPublicUrl(path);
          imageUrl = pub.publicUrl;
        }
      } catch (e) {
        console.warn('Failed to upload data URL to storage, returning data URL instead');
      }
    }

    return NextResponse.json({ image: imageUrl, promptUsed: prompt, provider: 'qwen-image-edit', raw: undefined });
  } catch (e) {
    console.error('qwen3imageedit error:', e);
    return NextResponse.json({ error: 'Qwen image edit failed' }, { status: 500 });
  }
}
