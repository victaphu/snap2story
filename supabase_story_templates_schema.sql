-- Normalized schema to make querying templates easier by page and age
-- Depends on public.story_templates created in supabase_story_templates_seed.sql

-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists pgcrypto;

-- Per-page table extracted from data->'pages'
create table if not exists public.story_template_pages (
  id uuid primary key default gen_random_uuid(),
  story_id text not null references public.story_templates(story_id) on delete cascade,
  page_number numeric not null,
  kind text,
  is_title_page boolean default false,
  is_dedication boolean default false,
  image_description text,
  art_style_notes text,
  title_overlay jsonb,
  raw_page jsonb not null,
  created_at timestamptz default now(),
  unique (story_id, page_number)
);

-- Text variants per page by age range (e.g., 0-1, 1-3, 3-4, 5-6, 7-8)
create table if not exists public.story_page_texts (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  page_id uuid not null references public.story_template_pages(id) on delete cascade,
  age_min int not null,
  age_max int not null,
  text text not null,
  created_at timestamptz default now(),
  unique (page_id, age_min, age_max)
);

-- Add generated int4range column for efficient age queries (@> operator)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'story_page_texts'
      and column_name = 'age_range'
  ) then
    execute 'alter table public.story_page_texts add column age_range int4range generated always as (int4range(age_min, age_max, ''[]'')) stored';
  end if;
end $$;

-- Helpful indexes
create index if not exists idx_story_template_pages_story_page on public.story_template_pages (story_id, page_number);
create index if not exists idx_story_page_texts_page on public.story_page_texts (page_id);
create index if not exists idx_story_page_texts_age on public.story_page_texts (age_min, age_max);
create index if not exists idx_story_page_texts_age_range on public.story_page_texts using gist (age_range);
create index if not exists idx_story_page_texts_story on public.story_page_texts (story_id);

-- RLS mirroring story_templates: allow service_role to do all
alter table public.story_template_pages enable row level security;
drop policy if exists "service_role_all" on public.story_template_pages;
create policy "service_role_all" on public.story_template_pages
  for all using ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' )
  with check ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' );

alter table public.story_page_texts enable row level security;
drop policy if exists "service_role_all" on public.story_page_texts;
create policy "service_role_all" on public.story_page_texts
  for all using ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' )
  with check ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' );

-- Backfill pages from story_templates.data->'pages'
with pages as (
  select
    t.story_id,
    p as page_json
  from public.story_templates t
  cross join lateral jsonb_array_elements(t.data->'pages') as p
)
insert into public.story_template_pages (
  story_id,
  page_number,
  kind,
  is_title_page,
  is_dedication,
  image_description,
  art_style_notes,
  title_overlay,
  raw_page
)
select
  story_id,
  (page_json->>'pageNumber')::numeric,
  nullif(page_json->>'kind',''),
  coalesce((page_json->>'isTitlePage')::boolean, false),
  coalesce((page_json->>'isDedication')::boolean, false),
  page_json->>'imageDescription',
  page_json->>'artStyleNotes',
  case when page_json ? 'titleOverlay' then page_json->'titleOverlay' else null end,
  page_json
from pages
on conflict (story_id, page_number) do nothing;

-- Backfill page texts (age buckets) from each page's text object
with page_rows as (
  select
    sp.id as page_id,
    sp.story_id,
    sp.page_number,
    sp.raw_page->'text' as text_obj
  from public.story_template_pages sp
),
texts as (
  select
    page_id,
    story_id,
    page_number,
    key as age_key,
    value as text_value
  from page_rows
  cross join lateral jsonb_each(page_rows.text_obj)
)
insert into public.story_page_texts (
  story_id,
  page_id,
  age_min,
  age_max,
  text
)
select
  story_id,
  page_id,
  split_part(age_key, '-', 1)::int as age_min,
  split_part(age_key, '-', 2)::int as age_max,
  text_value::text
from texts
on conflict do nothing;

-- Convenience function: fetch ordered pages with the appropriate text for a given age
create or replace function public.get_story_pages_for_age(p_story_id text, p_age int)
returns table (
  story_id text,
  page_number numeric,
  kind text,
  is_title_page boolean,
  is_dedication boolean,
  text text,
  image_description text,
  art_style_notes text,
  title_overlay jsonb
) language sql stable as $$
  select
    p.story_id,
    p.page_number,
    p.kind,
    p.is_title_page,
    p.is_dedication,
    t.text,
    p.image_description,
    p.art_style_notes,
    p.title_overlay
  from public.story_template_pages p
  left join public.story_page_texts t
    on t.page_id = p.id
   and p_age between t.age_min and t.age_max
  where p.story_id = p_story_id
  order by p.page_number
$$;

-- Example query (uncomment to test):
-- select * from public.get_story_pages_for_age('adventure_flexible_multiage', 5);

-- Convenience function: list templates that have content for a given age
create or replace function public.get_story_templates_for_age(p_age int)
returns table (
  story_id text,
  theme text,
  title text
) language sql stable as $$
  select distinct t.story_id, t.theme, t.title
  from public.story_templates t
  join public.story_template_pages p on p.story_id = t.story_id
  join public.story_page_texts x on x.page_id = p.id
  where x.age_range @> p_age
  order by t.title
$$;

-- Example query (uncomment to test):
-- select * from public.get_story_templates_for_age(5);
