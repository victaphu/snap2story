import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/services/supabase-server';

async function ensureOwnership(bookId: string, userId: string) {
  const { data: book, error: bErr } = await supabaseAdmin
    .from('books')
    .select('id, user_id')
    .eq('id', bookId)
    .single();
  if (bErr || !book) return false;
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('id, clerk_id')
    .eq('id', book.user_id)
    .eq('clerk_id', userId)
    .single();
  if (pErr || !profile) return false;
  return true;
}

export async function POST(req: NextRequest, { params }: { params: { bookId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookId = params.bookId;
    if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    const ok = await ensureOwnership(bookId, userId);
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const values = (body?.values || {}) as Record<string, string>;
    const rows = Object.entries(values).map(([key, value]) => ({ book_id: bookId, key, value }));
    if (!rows.length) return NextResponse.json({ success: true, upserted: 0 });

    const { error: uErr } = await supabaseAdmin
      .from('book_placeholder_values')
      .upsert(rows, { onConflict: 'book_id,key' });
    if (uErr) throw uErr;
    return NextResponse.json({ success: true, upserted: rows.length });
  } catch (e) {
    console.error('books/[bookId]/placeholders POST error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
