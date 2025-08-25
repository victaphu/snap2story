-- Cleanup deprecated placeholders schema in favor of inferring from story_templates JSON
-- and per-book values stored in public.book_placeholder_values.

drop view if exists public.v_story_placeholders cascade;
drop table if exists public.story_template_placeholders cascade;

-- Keep book_placeholder_values (still used by the app)
create table if not exists public.book_placeholder_values (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz default now(),
  unique (book_id, key)
);

