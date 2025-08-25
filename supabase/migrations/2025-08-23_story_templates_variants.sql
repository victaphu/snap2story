-- Add variant + tagging to story_templates
alter table if exists public.story_templates
  add column if not exists series_key text,
  add column if not exists page_count integer,
  add column if not exists tags text[] default '{}'::text[];

-- Backfill sensible defaults for existing rows
update public.story_templates
  set series_key = coalesce(series_key, story_id),
      page_count = coalesce(page_count, 20)
  where series_key is null or page_count is null;

-- Unique variant per series + page count
create unique index if not exists story_templates_series_page_uk
  on public.story_templates (series_key, page_count);

