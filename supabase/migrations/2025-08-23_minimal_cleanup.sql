-- Minimal schema: templates + core book tables + placeholders + buckets
-- And cleanup of legacy/unused tables. Idempotent where possible.

create extension if not exists pgcrypto;

-- 0) Cleanup legacy tables (safe no-ops if not present)
drop table if exists public.users cascade;
drop table if exists public.stories cascade;
drop table if exists public.story_pages cascade;
drop table if exists public.custom_stories cascade;
drop table if exists public.custom_pages cascade;
-- Normalized mirrors not needed by current code
drop table if exists public.story_template_pages cascade;
drop table if exists public.story_page_texts cascade;

-- 1) story_templates (source of truth for pages/text/prompts)
create table if not exists public.story_templates (
  id uuid primary key default gen_random_uuid(),
  story_id text unique not null,
  theme text not null,
  title text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table public.story_templates enable row level security;
-- Admin/service-role full access; reads normally performed server-side
drop policy if exists "service_role_all" on public.story_templates;
create policy "service_role_all" on public.story_templates for all
  using ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' )
  with check ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' );

-- 1b) RPC returning age-appropriate page rows from story_templates JSON
create or replace function public.get_story_pages_full_for_age(
  p_story_id text,
  p_age integer
)
returns table (
  page_number numeric,
  kind text,
  is_title boolean,
  is_dedication boolean,
  text text,
  image_description text,
  art_style_notes text,
  raw jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age_bucket text;
begin
  if p_age <= 1 then
    v_age_bucket := '0-1';
  elsif p_age <= 3 then
    v_age_bucket := '1-3';
  elsif p_age <= 4 then
    v_age_bucket := '3-4';
  elsif p_age <= 6 then
    v_age_bucket := '5-6';
  else
    v_age_bucket := '7-8';
  end if;

  return query
  with t as (
    select data from public.story_templates where story_id = p_story_id
  ), pages as (
    select jsonb_array_elements(t.data->'pages') as page
    from t
  )
  select
    (page->>'pageNumber')::numeric as page_number,
    coalesce(page->>'kind','content') as kind,
    coalesce((page->>'isTitlePage')::boolean, false) as is_title,
    coalesce((page->>'isDedication')::boolean, false) as is_dedication,
    coalesce(page->'text'->>v_age_bucket, page->>'text', '') as text,
    coalesce(page->>'imageDescription','') as image_description,
    coalesce(page->>'artStyleNotes','') as art_style_notes,
    page as raw
  from pages
  order by page_number;
end;
$$;

-- 2) Profiles (Clerk user → profile row)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text not null,
  points integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select using (clerk_id = auth.jwt() ->> 'sub');
create policy profiles_insert on public.profiles for insert with check (clerk_id = auth.jwt() ->> 'sub');
create policy profiles_update on public.profiles for update using (clerk_id = auth.jwt() ->> 'sub');

-- Helper to resolve current profile id
create or replace function public.current_profile_id()
returns uuid language sql stable as $$
  select id from public.profiles where clerk_id = coalesce((auth.jwt() ->> 'sub')::text, '') limit 1;
$$;

-- 3) Books + Book pages
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  theme text,
  age_group text,
  length integer check (length in (10,20,30)),
  mode text,
  status text,
  created_at timestamptz not null default now()
);
create index if not exists books_user_created_idx on public.books(user_id, created_at desc);
alter table public.books enable row level security;
drop policy if exists books_select on public.books;
drop policy if exists books_insert on public.books;
drop policy if exists books_update on public.books;
create policy books_select on public.books for select using (user_id = public.current_profile_id());
create policy books_insert on public.books for insert with check (user_id = public.current_profile_id());
create policy books_update on public.books for update using (user_id = public.current_profile_id());

create table if not exists public.book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  page_number integer not null,
  text jsonb,
  image_url text,
  prompt jsonb,
  created_at timestamptz not null default now(),
  unique(book_id, page_number)
);
create index if not exists book_pages_book_idx on public.book_pages(book_id, page_number);
alter table public.book_pages enable row level security;
drop policy if exists book_pages_select on public.book_pages;
drop policy if exists book_pages_insert on public.book_pages;
drop policy if exists book_pages_update on public.book_pages;
create policy book_pages_select on public.book_pages for select using (
  exists (select 1 from public.books b where b.id = book_pages.book_id and b.user_id = public.current_profile_id())
);
create policy book_pages_insert on public.book_pages for insert with check (
  exists (select 1 from public.books b where b.id = book_pages.book_id and b.user_id = public.current_profile_id())
);
create policy book_pages_update on public.book_pages for update using (
  exists (select 1 from public.books b where b.id = book_pages.book_id and b.user_id = public.current_profile_id())
);

-- 4) Per-book placeholder values
create table if not exists public.book_placeholder_values (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz default now(),
  unique (book_id, key)
);
alter table public.book_placeholder_values enable row level security;
drop policy if exists book_placeholder_values_select on public.book_placeholder_values;
drop policy if exists book_placeholder_values_upsert on public.book_placeholder_values;
create policy book_placeholder_values_select on public.book_placeholder_values for select using (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.user_id = public.current_profile_id()
  )
);
create policy book_placeholder_values_upsert on public.book_placeholder_values for all using (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.user_id = public.current_profile_id()
  )
) with check (
  exists (
    select 1 from public.books b
    where b.id = book_id and b.user_id = public.current_profile_id()
  )
);

-- 5) Storage buckets used by the app
insert into storage.buckets (id, name, public) values
  ('pages','pages', true),
  ('exports','exports', false)
on conflict (id) do nothing;

