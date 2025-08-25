import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/services/supabase-server';
import { THEMES } from '@/lib/constants';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('story_templates')
      .select('story_id, theme, title, series_key, page_count, tags')
      .order('title', { ascending: true })
      .limit(100);
    if (error) {
      console.error('themes/list supabase error', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
    // Map to output items, one per story_template row
    const nameToSlug: Record<string, string> = {
      'Adventure & Exploration': 'adventure',
      'Friendship & Kindness': 'friendship',
      'Family & Home Life': 'family',
      'Dreams & Imagination': 'dreams',
    };
    const out = (data || []).map((row: any) => {
      const name = String(row.theme);
      const slug = nameToSlug[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fallback = THEMES.find((t) => t.slug === slug || t.name === name);
      return {
        id: row.story_id as string,
        story_id: row.story_id as string,
        name,
        slug,
        title: String(row.title || name),
        description: (fallback as any)?.description || '',
        series_key: String(row.series_key || row.story_id || ''),
        page_count: Number(row.page_count || 20),
        tags: Array.isArray(row.tags) ? row.tags : [],
      };
    });
    return NextResponse.json({ templates: out });
  } catch (e) {
    console.error('themes/list error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
