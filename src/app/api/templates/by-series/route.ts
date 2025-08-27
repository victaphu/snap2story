import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/services/supabase-server';

// GET /api/templates/by-series?seriesKey=...&pageCount=...&age=...&includePages=true
// - Filters templates by series_key (required) and optional pageCount
// - When includePages=true and either pageCount is provided or exactly one template matches,
//   returns age-appropriate pages using the DB RPC get_story_pages_for_age
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesKey = searchParams.get('seriesKey')?.trim();
    const storyIdParam = searchParams.get('storyId')?.trim();
    const pageCountStr = searchParams.get('pageCount');
    const includePages = (searchParams.get('includePages') || 'false').toLowerCase() === 'true';
    const includeData = (searchParams.get('includeData') || 'false').toLowerCase() === 'true';
    const ageStr = searchParams.get('age');

    // If storyId is provided, we can bypass series resolution and fetch directly
    if (!seriesKey && !storyIdParam) {
      return NextResponse.json({ error: 'Missing seriesKey or storyId' }, { status: 400 });
    }

    const pageCount = pageCountStr ? parseInt(pageCountStr, 10) : undefined;
    const age = ageStr ? parseInt(ageStr, 10) : undefined;

    let templates: any[] = [];
    let tErr: any = null;
    if (storyIdParam) {
      const selectCols = includeData
        ? 'story_id, series_key, page_count, theme, title, data'
        : 'story_id, series_key, page_count, theme, title';
      const { data, error } = await supabaseAdmin
        .from('story_templates')
        .select(selectCols)
        .eq('story_id', storyIdParam)
        .maybeSingle();
      if (error) tErr = error;
      if (data) templates = [data];
    } else if (seriesKey) {
      const selectCols = includeData
        ? 'story_id, series_key, page_count, theme, title, data'
        : 'story_id, series_key, page_count, theme, title';
      let q = supabaseAdmin
        .from('story_templates')
        .select(selectCols)
        .eq('series_key', seriesKey)
        .order('page_count', { ascending: true });
      if (Number.isFinite(pageCount as number)) {
        q = q.eq('page_count', pageCount as number);
      }
      const { data, error } = await q;
      if (error) tErr = error;
      if (data) templates = data;
    }
    if (tErr) {
      return NextResponse.json({ error: 'Template lookup failed', details: tErr.message }, { status: 500 });
    }
    if (!templates || templates.length === 0) {
      return NextResponse.json({ templates: [] });
    }

    // 2) Optionally return pages for a single selected template (when includePages=true)
    let pages: any[] | undefined;
    let selected: any | undefined;
    const single = storyIdParam
      ? templates[0]
      : Number.isFinite(pageCount as number) ? templates[0] : (templates.length === 1 ? templates[0] : null);

    if (includePages && single) {
      selected = single;
      const storyId = String(single.story_id);

      if (Number.isFinite(age as number)) {
        // Prefer RPC for age-appropriate text selection
        const { data: rows, error: rpcErr } = await supabaseAdmin.rpc('get_story_pages_for_age', {
          p_story_id: storyId,
          p_age: age as number,
        });

        if (!rpcErr && Array.isArray(rows)) {
          pages = rows.map((r: any) => ({
            pageNumber: Number(r.page_number),
            text: String(r.text || ''),
            imageDescription: String(r.image_description || ''),
            isTitle: Boolean(r.is_title_page),
            isDedication: Boolean(r.is_dedication),
          }));
        } else if (rpcErr) {
          // Gracefully degrade: return only structural page info if RPC unavailable
          const { data: basic, error: pErr } = await supabaseAdmin
            .from('story_template_pages')
            .select('page_number, is_title_page, is_dedication, image_description')
            .eq('story_id', storyId)
            .order('page_number');
          if (!pErr && Array.isArray(basic)) {
            pages = basic.map((r: any) => ({
              pageNumber: Number(r.page_number),
              text: '',
              imageDescription: String(r.image_description || ''),
              isTitle: Boolean(r.is_title_page),
              isDedication: Boolean(r.is_dedication),
            }));
          }
        }
      } else {
        // No age provided: return structural pages without text
        const { data: basic, error: pErr } = await supabaseAdmin
          .from('story_template_pages')
          .select('page_number, is_title_page, is_dedication, image_description')
          .eq('story_id', storyId)
          .order('page_number');
        if (!pErr && Array.isArray(basic)) {
          pages = basic.map((r: any) => ({
            pageNumber: Number(r.page_number),
            text: '',
            imageDescription: String(r.image_description || ''),
            isTitle: Boolean(r.is_title_page),
            isDedication: Boolean(r.is_dedication),
          }));
        }
      }
    }

    return NextResponse.json({ templates, selected, pages });
  } catch (e: any) {
    console.error('by-series GET error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
