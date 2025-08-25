-- Create or replace RPC to return full per-page details for a story template
-- chosen by story_id and an age (numeric). This projects age-appropriate text
-- while preserving other page configuration fields from the JSON template.

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
  -- Map numeric age to the closest bucket used in templates
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
    coalesce(
      page->'text'->>v_age_bucket,
      page->>'text',
      ''
    ) as text,
    coalesce(page->>'imageDescription','') as image_description,
    coalesce(page->>'artStyleNotes','') as art_style_notes,
    page as raw
  from pages
  order by page_number;
end;
$$;

-- Optional: grant execute privileges to anon/authenticated as needed
-- grant execute on function public.get_story_pages_full_for_age(text, integer) to anon, authenticated;

