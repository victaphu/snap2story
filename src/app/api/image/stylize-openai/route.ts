import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { supabaseAdmin } from '@/lib/services/supabase-server';
import { deriveCoverSceneFromCsv } from '@/lib/story-csv';
import { getCoverScene } from '@/lib/cover-prompts';
import { THEMES } from '@/lib/constants';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Payload = {
  imageBase64: string; // data URL
  scene?: string; // e.g., "on a pirate ship at sunset"
  styleNotes?: string; // extra art direction
  keepLikeness?: boolean; // default true
  maskBase64?: string; // optional PNG mask (transparent where edits occur)
  size?: '1024x1024' | '1024x1536' | '1536x1024' | '512x512';
  bookId?: string; // optional: derive scene from DB-stored story
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    let { imageBase64, scene, styleNotes, keepLikeness = true, maskBase64, size = '1024x1024', bookId } = body;
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });

    const [, base64] = imageBase64.split(',');
    const imageBuf = Buffer.from(base64, 'base64');

    let maskFile: File | undefined;
    if (maskBase64) {
      const [, maskB64] = maskBase64.split(',');
      const maskBuf = Buffer.from(maskB64, 'base64');
      maskFile = await toFile(maskBuf, 'mask.png');
    }

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
        console.warn('stylize-openai: failed to derive scene from DB', e);
      }
    }

    const parts: string[] = [];
    // Core instruction
    parts.push('Repaint this photo in a children\'s storybook illustration style.');
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

    const prompt = parts.join(' ');

    const resp = await openai.images.edit({
      model: 'gpt-image-1',
      image: await toFile(imageBuf, 'source.png'),
      ...(maskFile ? { mask: maskFile } : {}),
      prompt,
      size,
    });

    const b64 = resp.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    return NextResponse.json({ image: `data:image/png;base64,${b64}`, promptUsed: prompt });
  } catch (e) {
    console.error('stylize-openai error:', e);
    return NextResponse.json({ error: 'Stylize (OpenAI) failed' }, { status: 500 });
  }
}

