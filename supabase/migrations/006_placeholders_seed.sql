-- Seed explicit placeholders for selected story templates.
-- Even though the API can infer placeholders from story_templates.data,
-- having explicit entries allows customized labels, input types, defaults,
-- required flags, and ordering per story.

create extension if not exists pgcrypto;

-- Minimal table (only if not present). In some environments a later migration
-- may drop this table; this seed is intended for projects that keep it.
create table if not exists public.story_template_placeholders (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  key text not null,
  label text not null,
  description text,
  input_type text not null default 'text',
  default_value text,
  options jsonb,
  required boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique (story_id, key)
);

alter table public.story_template_placeholders enable row level security;
drop policy if exists "service_role_all" on public.story_template_placeholders;
create policy "service_role_all" on public.story_template_placeholders for all
  using ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' )
  with check ( coalesce((auth.jwt() ->> 'role'),'') = 'service_role' );

-- Helper: upsert a placeholder row
-- Note: Using plain INSERT ... ON CONFLICT to avoid function definitions

-- Placeholders for travel_world_v2_multiage (20p baseline)
insert into public.story_template_placeholders (story_id, key, label, description, input_type, default_value, required, sort_order)
values
  ('travel_world_v2_multiage', 'heroName', 'Hero Name', 'Main character name', 'text', 'Ava', true, 0),
  ('travel_world_v2_multiage', 'friendName', 'Friend Name', 'Best friend or travel buddy', 'text', 'Max', false, 1),
  ('travel_world_v2_multiage', 'hero_description', 'Hero Description', 'AI-extracted from the uploaded hero photo (no need to edit)', 'textarea', 'Extract the hero''s key visual features from the uploaded image (hair color/style, eye color, complexion, clothing colors, typical expression, accessories). Create a child-friendly storybook representation according to the selected illustration style. Ensure clear likeness without photorealism or direct copy; do not superimpose the real photo. Keep features consistent across images.', false, 2),
  ('travel_world_v2_multiage', 'friend_description', 'Friend Description', 'AI-extracted from the second person in the photo (if present)', 'textarea', 'If a second person is present in the uploaded image, extract their distinctive features (approx. age, hairstyle, clothing colors, notable traits) and use them as the friend. Otherwise, create a companion character based on the hero with slightly smaller scale and complementary traits. Represent them in a child-friendly storybook style with strong likeness, not an exact copy.', false, 3),
  ('travel_world_v2_multiage', 'title_style', 'Title Text Style', 'Guidance for how the book title should look on the cover', 'textarea', 'Colorful, playful children''s book lettering with a hand-drawn feel; bold, high-contrast, large and highly readable. Friendly curves, gentle outlines, and warm palette; avoid thin or hard-to-read fonts.', false, 6),
  ('travel_world_v2_multiage', 'location', 'First Stop Location', 'City or country for their first destination', 'text', 'Paris, France', false, 4),
  ('travel_world_v2_multiage', 'pet_name', 'Pet Name', 'Name of a favorite pet (optional)', 'text', 'Milo', false, 5)
on conflict (story_id, key) do update
  set label = excluded.label,
      description = excluded.description,
      input_type = excluded.input_type,
      default_value = excluded.default_value,
      required = excluded.required,
      sort_order = excluded.sort_order;

-- Placeholders for 10p variant
insert into public.story_template_placeholders (story_id, key, label, description, input_type, default_value, required, sort_order)
values
  ('travel_world_v2_multiage_10page', 'heroName', 'Hero Name', 'Main character name', 'text', 'Ava', true, 0),
  ('travel_world_v2_multiage_10page', 'friendName', 'Friend Name', 'Best friend or travel buddy', 'text', 'Max', false, 1),
  ('travel_world_v2_multiage_10page', 'hero_description', 'Hero Description', 'AI-extracted from the uploaded hero photo (no need to edit)', 'textarea', 'Extract the hero''s key visual features from the uploaded image (hair color/style, eye color, complexion, clothing colors, typical expression, accessories). Create a child-friendly storybook representation according to the selected illustration style. Ensure clear likeness without photorealism or direct copy; do not superimpose the real photo. Keep features consistent across images.', false, 2),
  ('travel_world_v2_multiage_10page', 'friend_description', 'Friend Description', 'AI-extracted from the second person in the photo (if present)', 'textarea', 'If a second person is present in the uploaded image, extract their distinctive features (approx. age, hairstyle, clothing colors, notable traits) and use them as the friend. Otherwise, create a companion character based on the hero with slightly smaller scale and complementary traits. Represent them in a child-friendly storybook style with strong likeness, not an exact copy.', false, 3),
  ('travel_world_v2_multiage_10page', 'title_style', 'Title Text Style', 'Guidance for how the book title should look on the cover', 'textarea', 'Colorful, playful children''s book lettering with a hand-drawn feel; bold, high-contrast, large and highly readable. Friendly curves, gentle outlines, and warm palette; avoid thin or hard-to-read fonts.', false, 6),
  ('travel_world_v2_multiage_10page', 'location', 'First Stop Location', 'City or country for their first destination', 'text', 'Paris, France', false, 4),
  ('travel_world_v2_multiage_10page', 'pet_name', 'Pet Name', 'Name of a favorite pet (optional)', 'text', 'Milo', false, 5)
on conflict (story_id, key) do update
  set label = excluded.label,
      description = excluded.description,
      input_type = excluded.input_type,
      default_value = excluded.default_value,
      required = excluded.required,
      sort_order = excluded.sort_order;

-- Placeholders for 30p deluxe variant
insert into public.story_template_placeholders (story_id, key, label, description, input_type, default_value, required, sort_order)
values
  ('travel_world_v2_multiage_30page', 'heroName', 'Hero Name', 'Main character name', 'text', 'Ava', true, 0),
  ('travel_world_v2_multiage_30page', 'friendName', 'Friend Name', 'Best friend or travel buddy', 'text', 'Max', false, 1),
  ('travel_world_v2_multiage_30page', 'hero_description', 'Hero Description', 'AI-extracted from the uploaded hero photo (no need to edit)', 'textarea', 'Extract the hero''s key visual features from the uploaded image (hair color/style, eye color, complexion, clothing colors, typical expression, accessories). Create a child-friendly storybook representation according to the selected illustration style. Ensure clear likeness without photorealism or direct copy; do not superimpose the real photo. Keep features consistent across images.', false, 2),
  ('travel_world_v2_multiage_30page', 'friend_description', 'Friend Description', 'AI-extracted from the second person in the photo (if present)', 'textarea', 'If a second person is present in the uploaded image, extract their distinctive features (approx. age, hairstyle, clothing colors, notable traits) and use them as the friend. Otherwise, create a companion character based on the hero with slightly smaller scale and complementary traits. Represent them in a child-friendly storybook style with strong likeness, not an exact copy.', false, 3),
  ('travel_world_v2_multiage_30page', 'title_style', 'Title Text Style', 'Guidance for how the book title should look on the cover', 'textarea', 'Colorful, playful children''s book lettering with a hand-drawn feel; bold, high-contrast, large and highly readable. Friendly curves, gentle outlines, and warm palette; avoid thin or hard-to-read fonts.', false, 6)
  ('travel_world_v2_multiage_30page', 'location', 'First Stop Location', 'City or country for their first destination', 'text', 'Paris, France', false, 4),
  ('travel_world_v2_multiage_30page', 'pet_name', 'Pet Name', 'Name of a favorite pet (optional)', 'text', 'Milo', false, 5)
on conflict (story_id, key) do update
  set label = excluded.label,
      description = excluded.description,
      input_type = excluded.input_type,
      default_value = excluded.default_value,
      required = excluded.required,
      sort_order = excluded.sort_order;
