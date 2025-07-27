-- Enable RLS
alter table if exists public.users enable row level security;
alter table if exists public.stories enable row level security;
alter table if exists public.story_pages enable row level security;
alter table if exists public.custom_stories enable row level security;
alter table if exists public.custom_pages enable row level security;
alter table if exists public.orders enable row level security;

-- Create users table
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  clerk_id text unique not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create stories table
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  theme text,
  subtheme text,
  custom_prompt text,
  status text check (status in ('draft', 'generating', 'ready', 'failed')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  retry_count integer default 0,
  title text
);

-- Create story_pages table
create table if not exists public.story_pages (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.stories(id) on delete cascade not null,
  page_num integer not null,
  page_type text check (page_type in ('front_cover', 'back_cover', 'image', 'text')) not null,
  text text not null,
  image_url text,
  edited_text text,
  edited_image_url text,
  unique(story_id, page_num)
);

-- Create custom_stories table
create table if not exists public.custom_stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create custom_pages table
create table if not exists public.custom_pages (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.custom_stories(id) on delete cascade not null,
  page_num integer not null,
  text text not null,
  image_url text,
  prompt text,
  unique(story_id, page_num)
);

-- Create orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  story_id uuid references public.stories(id) on delete cascade,
  custom_story_id uuid references public.custom_stories(id) on delete cascade,
  product_type text check (product_type in ('pdf', 'soft', 'hard')) not null,
  stripe_session_id text,
  status text check (status in ('pending', 'paid', 'in_production', 'shipped', 'failed')) default 'pending',
  lulu_order_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_amount integer, -- in cents
  check ((story_id is not null and custom_story_id is null) or (story_id is null and custom_story_id is not null))
);

-- Create storage buckets
insert into storage.buckets (id, name, public) values 
  ('heroes', 'heroes', true),
  ('pages', 'pages', true),
  ('exports', 'exports', false)
on conflict (id) do nothing;

-- RLS Policies

-- Users can only see their own data
create policy "Users can view own profile" on public.users
  for select using (auth.uid()::text = clerk_id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid()::text = clerk_id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid()::text = clerk_id);

-- Stories policies
create policy "Users can view own stories" on public.stories
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can insert own stories" on public.stories
  for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can update own stories" on public.stories
  for update using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can delete own stories" on public.stories
  for delete using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Story pages policies
create policy "Users can view own story pages" on public.story_pages
  for select using (story_id in (
    select id from public.stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

create policy "Users can insert own story pages" on public.story_pages
  for insert with check (story_id in (
    select id from public.stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

create policy "Users can update own story pages" on public.story_pages
  for update using (story_id in (
    select id from public.stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

create policy "Users can delete own story pages" on public.story_pages
  for delete using (story_id in (
    select id from public.stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

-- Custom stories policies
create policy "Users can view own custom stories" on public.custom_stories
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can insert own custom stories" on public.custom_stories
  for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can update own custom stories" on public.custom_stories
  for update using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can delete own custom stories" on public.custom_stories
  for delete using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Custom pages policies
create policy "Users can view own custom pages" on public.custom_pages
  for select using (story_id in (
    select id from public.custom_stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

create policy "Users can insert own custom pages" on public.custom_pages
  for insert with check (story_id in (
    select id from public.custom_stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

create policy "Users can update own custom pages" on public.custom_pages
  for update using (story_id in (
    select id from public.custom_stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

create policy "Users can delete own custom pages" on public.custom_pages
  for delete using (story_id in (
    select id from public.custom_stories 
    where user_id in (select id from public.users where clerk_id = auth.uid()::text)
  ));

-- Orders policies
create policy "Users can view own orders" on public.orders
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can insert own orders" on public.orders
  for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can update own orders" on public.orders
  for update using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Storage policies
create policy "Users can upload heroes" on storage.objects
  for insert with check (bucket_id = 'heroes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view heroes" on storage.objects
  for select using (bucket_id = 'heroes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete heroes" on storage.objects
  for delete using (bucket_id = 'heroes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view pages" on storage.objects
  for select using (bucket_id = 'pages' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view exports" on storage.objects
  for select using (bucket_id = 'exports' and auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create user record when signing up via Clerk
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (clerk_id, email)
  values (new.clerk_id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Indexes for performance
create index if not exists idx_stories_user_id on public.stories(user_id);
create index if not exists idx_stories_status on public.stories(status);
create index if not exists idx_story_pages_story_id on public.story_pages(story_id);
create index if not exists idx_custom_stories_user_id on public.custom_stories(user_id);
create index if not exists idx_custom_pages_story_id on public.custom_pages(story_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);