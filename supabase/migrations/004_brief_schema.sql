-- Brief-driven core schema for StoryMosaic
-- Tables: profiles, books, book_pages, orders, referrals, reminders, uploads
-- RLS: owner-only via Clerk JWT (sub) mapped to profiles.clerk_id

-- Extensions
create extension if not exists pgcrypto;

-- Helper function to resolve current profile id from Clerk JWT
create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id from profiles where clerk_id = coalesce((auth.jwt() ->> 'sub')::text, '') limit 1;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text not null,
  points integer not null default 0,
  referral_code text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;

create policy profiles_select on public.profiles for select
  using (clerk_id = auth.jwt() ->> 'sub');

create policy profiles_insert on public.profiles for insert
  with check (clerk_id = auth.jwt() ->> 'sub');

create policy profiles_update on public.profiles for update
  using (clerk_id = auth.jwt() ->> 'sub');

create policy profiles_delete on public.profiles for delete
  using (clerk_id = auth.jwt() ->> 'sub');

-- Books
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  theme text,
  age_group text,
  length integer check (length in (10,20,30)),
  mode text,
  special_date date,
  status text,
  canva_exported boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists books_user_created_idx on public.books(user_id, created_at desc);

alter table public.books enable row level security;

drop policy if exists books_select on public.books;
drop policy if exists books_insert on public.books;
drop policy if exists books_update on public.books;
drop policy if exists books_delete on public.books;

create policy books_select on public.books for select
  using (user_id = current_profile_id());

create policy books_insert on public.books for insert
  with check (user_id = current_profile_id());

create policy books_update on public.books for update
  using (user_id = current_profile_id());

create policy books_delete on public.books for delete
  using (user_id = current_profile_id());

-- Book pages
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
drop policy if exists book_pages_delete on public.book_pages;

create policy book_pages_select on public.book_pages for select
  using (exists (
    select 1 from public.books b
    where b.id = book_pages.book_id and b.user_id = current_profile_id()
  ));

create policy book_pages_insert on public.book_pages for insert
  with check (exists (
    select 1 from public.books b
    where b.id = book_pages.book_id and b.user_id = current_profile_id()
  ));

create policy book_pages_update on public.book_pages for update
  using (exists (
    select 1 from public.books b
    where b.id = book_pages.book_id and b.user_id = current_profile_id()
  ));

create policy book_pages_delete on public.book_pages for delete
  using (exists (
    select 1 from public.books b
    where b.id = book_pages.book_id and b.user_id = current_profile_id()
  ));

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  type text check (type in ('digital','canva','print')),
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null,
  stripe_pi text,
  lulu_job_id text,
  status text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
drop policy if exists orders_insert on public.orders;
drop policy if exists orders_update on public.orders;
drop policy if exists orders_delete on public.orders;

create policy orders_select on public.orders for select
  using (user_id = current_profile_id());

create policy orders_insert on public.orders for insert
  with check (user_id = current_profile_id());

create policy orders_update on public.orders for update
  using (user_id = current_profile_id());

create policy orders_delete on public.orders for delete
  using (user_id = current_profile_id());

-- Referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id, created_at desc);

alter table public.referrals enable row level security;

drop policy if exists referrals_select on public.referrals;
drop policy if exists referrals_insert on public.referrals;

-- Allow referrer to view their referral rows
create policy referrals_select on public.referrals for select
  using (referrer_id = current_profile_id());

-- Inserts handled by server (service role) normally; allow client-side only for own referrer_id
create policy referrals_insert on public.referrals for insert
  with check (referrer_id = current_profile_id());

-- Reminders
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  date date,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reminders_user_date_idx on public.reminders(user_id, date);

alter table public.reminders enable row level security;

drop policy if exists reminders_select on public.reminders;
drop policy if exists reminders_insert on public.reminders;
drop policy if exists reminders_update on public.reminders;
drop policy if exists reminders_delete on public.reminders;

create policy reminders_select on public.reminders for select
  using (user_id = current_profile_id());

create policy reminders_insert on public.reminders for insert
  with check (user_id = current_profile_id());

create policy reminders_update on public.reminders for update
  using (user_id = current_profile_id());

create policy reminders_delete on public.reminders for delete
  using (user_id = current_profile_id());

-- Uploads
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  kind text check (kind in ('hero','friend','pet','pro-image')),
  created_at timestamptz not null default now()
);

create index if not exists uploads_user_created_idx on public.uploads(user_id, created_at desc);

alter table public.uploads enable row level security;

drop policy if exists uploads_select on public.uploads;
drop policy if exists uploads_insert on public.uploads;
drop policy if exists uploads_delete on public.uploads;

create policy uploads_select on public.uploads for select
  using (user_id = current_profile_id());

create policy uploads_insert on public.uploads for insert
  with check (user_id = current_profile_id());

create policy uploads_delete on public.uploads for delete
  using (user_id = current_profile_id());

-- Optional: unique referral_code index where not null
create unique index if not exists profiles_referral_code_uniq on public.profiles(coalesce(referral_code,'')) where referral_code is not null;

