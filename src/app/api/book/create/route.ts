import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/services/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, theme, age_group, length, mode, placeholders } = body || {};
    if (!theme || !age_group || !length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure profile exists
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ clerk_id: userId, email: body?.email || '' }, { onConflict: 'clerk_id' })
      .select('*')
      .single();
    if (pErr || !profile) {
      return NextResponse.json({ error: 'Profile upsert failed' }, { status: 500 });
    }

    // Create book
    const { data: book, error: bErr } = await supabaseAdmin
      .from('books')
      .insert({
        user_id: profile.id,
        title: title || null,
        theme,
        age_group,
        length,
        mode: mode || 'quick',
        status: 'draft',
      })
      .select('*')
      .single();
    if (bErr || !book) {
      return NextResponse.json({ error: 'Book creation failed' }, { status: 500 });
    }

    // Seed placeholder pages according to length
    const pages = Array.from({ length: Number(length) }, (_, i) => ({
      book_id: book.id,
      page_number: i + 1,
      text: { blocks: [] },
      prompt: { theme },
    }));
    await supabaseAdmin.from('book_pages').insert(pages);

    // Save placeholder overrides if provided
    if (placeholders && typeof placeholders === 'object') {
      const kv = Object.entries(placeholders as Record<string, string>).map(([key, value]) => ({ book_id: book.id, key, value }));
      if (kv.length) {
        await supabaseAdmin.from('book_placeholder_values').upsert(kv, { onConflict: 'book_id,key' });
      }
    }

    return NextResponse.json({ success: true, bookId: book.id });
  } catch (e) {
    console.error('book/create error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
