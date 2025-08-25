-- Backfill series_key, page_count, and tags using current seeder data
-- Strategy:
-- - series_key: strip a trailing _{N}p from story_id if present; else story_id
-- - page_count: prefer {N} from story_id suffix; else max pageNumber >= 1 from data->pages; else 20
-- - tags: derive a primary tag from theme name (adventure|friendship|family|dreams)

-- Ensure columns exist (idempotent with prior migration)
alter table if exists public.story_templates
  add column if not exists series_key text,
  add column if not exists page_count integer,
  add column if not exists tags text[] default '{}'::text[];

with calc as (
  select
    id,
    story_id,
    -- Size from story_id suffix like my_story_20p
    nullif((regexp_match(story_id, '_(\d+)p$'))[1], '')::int as size_from_id,
    -- Max integer pageNumber >= 1 from JSON pages
    (
      select coalesce(max((p->>'pageNumber')::int), 0)
      from jsonb_array_elements(data->'pages') as p
      where (p->>'pageNumber') ~ '^\\d+(?:\\.0+)?$' and (p->>'pageNumber')::numeric >= 1
    ) as max_page_num
  from public.story_templates
)
update public.story_templates t
set
  series_key = coalesce(t.series_key, regexp_replace(t.story_id, '_(?:\\d+)p$', '')),
  page_count = coalesce(t.page_count,
                        (select c.size_from_id from calc c where c.id = t.id),
                        nullif((select c.max_page_num from calc c where c.id = t.id), 0),
                        20),
  tags = case
    when array_length(t.tags,1) is not null then t.tags
    when t.theme ilike 'Adventure%' then array['adventure']
    when t.theme ilike 'Friendship%' then array['friendship']
    when t.theme ilike 'Family%' then array['family']
    when t.theme ilike 'Dreams%' then array['dreams','bedtime']
    else array[]::text[]
  end
where (t.series_key is null or t.page_count is null or array_length(t.tags,1) is null);

-- Keep a uniqueness guarantee per (series_key, page_count)
create unique index if not exists story_templates_series_page_uk
  on public.story_templates (series_key, page_count);

