-- ============================================================================
--  Booking Ledger — Supabase schema
--  Run this entire file once in: Supabase Dashboard > SQL Editor > New query
--  It is safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES
--    One row per auth user. Stores their display name and role.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. BOOKINGS
--    The core ledger. `created_by` is used for permission checks;
--    `booked_by_name` is denormalized so realtime events carry the name.
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  booking_date   date not null default current_date,
  party_name     text not null,
  item_name      text not null,
  booking_rate   numeric(14, 2) not null default 0,
  quantity       numeric(14, 2) not null default 0,
  quantity_unit  text not null default 'Bags' check (quantity_unit in ('Bags', 'KG')),
  broker         text not null default '',
  remarks        text,
  created_by     uuid not null references auth.users (id) on delete cascade,
  booked_by_name text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists bookings_created_by_idx on public.bookings (created_by);
create index if not exists bookings_booking_date_idx on public.bookings (booking_date desc);

-- ---------------------------------------------------------------------------
-- 3. HELPER: is_admin()
--    SECURITY DEFINER avoids recursive RLS when checking the caller's role.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. TRIGGER: auto-create a profile when a new auth user signs up.
--    Pulls the name from the user's metadata (set when you create the user).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. TRIGGER: keep updated_at fresh on every booking update.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- PROFILES: any signed-in user can read profiles (small trusted team).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

-- PROFILES: a user may update only their own row, and may NOT change their role.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- BOOKINGS: every signed-in user can read all bookings.
drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select"
  on public.bookings for select
  to authenticated
  using (true);

-- BOOKINGS: a user can insert only as themselves.
drop policy if exists "bookings_insert" on public.bookings;
create policy "bookings_insert"
  on public.bookings for insert
  to authenticated
  with check (created_by = auth.uid());

-- BOOKINGS: only the creator OR an admin can update.
drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update"
  on public.bookings for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

-- BOOKINGS: only the creator OR an admin can delete.
drop policy if exists "bookings_delete" on public.bookings;
create policy "bookings_delete"
  on public.bookings for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. REALTIME
--    Broadcast inserts/updates/deletes on bookings to all connected clients.
-- ---------------------------------------------------------------------------
alter table public.bookings replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- ============================================================================
--  DONE.
--
--  To make someone an ADMIN (can edit/delete any booking), run this once
--  after they have signed in at least once, replacing the email:
--
--    update public.profiles
--    set role = 'admin'
--    where id = (select id from auth.users where email = 'admin@company.com');
--
-- ============================================================================
