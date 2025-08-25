import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/services/supabase-server';

// Fallback defaults by key
const FALLBACK_DEFAULTS: Record<string, { label: string; default_value?: string; input_type?: 'text'|'textarea'|'select'; description?: string; options?: any }>= {
  heroName: { label: 'Hero Name', description: 'Main character name' },
  friendName: { label: 'Friend Name', default_value: 'Buddy' },
  hero_description: { label: 'Hero Description', description: 'Brief appearance/traits', input_type: 'textarea' },
  friend_description: { label: 'Friend Description', input_type: 'textarea' },
  setting: { label: 'Setting', default_value: 'enchanted forest' },
  animal_type: { label: 'Animal Type', default_value: 'sparrows' },
  guardian_creature: { label: 'Guardian Creature', default_value: 'friendly dragon' },
  favourite_food: { label: 'Favourite Food', default_value: 'cookies' },
  pet_name: { label: 'Pet Name', default_value: 'Milo' },
  dream_goal: { label: 'Dream Goal', default_value: 'reach the sky bridge' },
  dedication: { label: 'Personalised message', description: 'Shown on the first page', input_type: 'textarea' },
};

function extractPlaceholdersFromJson(jsonStr: string): string[] {
  const set = new Set<string>();
  const re = /\{([A-Za-z0-9_]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(jsonStr))) set.add(m[1]);
  return Array.from(set);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storyId = searchParams.get('storyId');
  if (!storyId) return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });

  try {
    // 1) Try explicit placeholders
    let rows: any[] | null = null;
    try {
      const q = await supabaseAdmin
        .from('story_template_placeholders')
        .select('*')
        .eq('story_id', storyId)
        .order('sort_order', { ascending: true });
      if (!q.error) rows = q.data || null;
    } catch {}
    if (rows && rows.length) {
      return NextResponse.json({ placeholders: rows });
    }

    // 2) Fallback: infer from story_templates.data JSON
    const { data: tmpl, error: tErr } = await supabaseAdmin
      .from('story_templates')
      .select('data')
      .eq('story_id', storyId)
      .single();
    if (tErr) throw tErr;

    const dataStr = typeof tmpl?.data === 'string' ? tmpl.data : JSON.stringify(tmpl?.data || {});
    const keys = extractPlaceholdersFromJson(dataStr);
    const inferred = keys.map((k, i) => ({
      id: `${storyId}-${k}`,
      story_id: storyId,
      key: k,
      label: FALLBACK_DEFAULTS[k]?.label || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: FALLBACK_DEFAULTS[k]?.description || null,
      input_type: FALLBACK_DEFAULTS[k]?.input_type || 'text',
      default_value: FALLBACK_DEFAULTS[k]?.default_value || '',
      options: FALLBACK_DEFAULTS[k]?.options || null,
      required: k === 'heroName',
      sort_order: i,
    }));
    return NextResponse.json({ placeholders: inferred });
  } catch (e) {
    console.error('placeholders GET error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
