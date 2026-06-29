-- ============================================================================
--  Booking Ledger — Deliveries & Godowns (receiving) migration
--  Run this ONCE in the Supabase SQL Editor, AFTER schema.sql.
--  Safe to re-run (idempotent).
-- ============================================================================

-- ---------- GODOWNS (the pick-list of warehouses) ----------
create table if not exists public.godowns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- A couple of starter godowns (rename or delete these to match yours).
insert into public.godowns (name) values ('Main Godown'), ('Godown 2')
on conflict (name) do nothing;

-- ---------- DELIVERIES (each receipt against a booking) ----------
create table if not exists public.deliveries (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references public.bookings(id) on delete cascade,
  quantity_received  numeric not null check (quantity_received > 0),
  quantity_unit      text not null default 'Bags' check (quantity_unit in ('Bags', 'KG')),
  godown_name        text not null,
  received_date      date not null default current_date,
  remarks            text,
  received_by        uuid not null references auth.users(id) on delete cascade,
  received_by_name   text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists deliveries_booking_id_idx on public.deliveries(booking_id);
create index if not exists deliveries_received_date_idx on public.deliveries(received_date desc);
create index if not exists deliveries_godown_idx on public.deliveries(godown_name);

-- ---------- Keep updated_at fresh (reuses set_updated_at from schema.sql) ----------
drop trigger if exists set_deliveries_updated_at on public.deliveries;
create trigger set_deliveries_updated_at
  before update on public.deliveries
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.godowns enable row level security;
alter table public.deliveries enable row level security;

-- Godowns: everyone signed in can read and add; only admins rename/remove.
drop policy if exists "godowns_select_all" on public.godowns;
create policy "godowns_select_all" on public.godowns
  for select to authenticated using (true);

drop policy if exists "godowns_insert_any" on public.godowns;
create policy "godowns_insert_any" on public.godowns
  for insert to authenticated with check (true);

drop policy if exists "godowns_update_admin" on public.godowns;
create policy "godowns_update_admin" on public.godowns
  for update to authenticated using (public.is_admin());

drop policy if exists "godowns_delete_admin" on public.godowns;
create policy "godowns_delete_admin" on public.godowns
  for delete to authenticated using (public.is_admin());

-- Deliveries: all signed-in users can read and record receipts.
drop policy if exists "deliveries_select_all" on public.deliveries;
create policy "deliveries_select_all" on public.deliveries
  for select to authenticated using (true);

drop policy if exists "deliveries_insert_self" on public.deliveries;
create policy "deliveries_insert_self" on public.deliveries
  for insert to authenticated with check (received_by = auth.uid());

-- Edit / delete a receipt only if you recorded it, or you're an admin.
drop policy if exists "deliveries_update_own_or_admin" on public.deliveries;
create policy "deliveries_update_own_or_admin" on public.deliveries
  for update to authenticated
  using (received_by = auth.uid() or public.is_admin());

drop policy if exists "deliveries_delete_own_or_admin" on public.deliveries;
create policy "deliveries_delete_own_or_admin" on public.deliveries
  for delete to authenticated
  using (received_by = auth.uid() or public.is_admin());

-- ---------- Realtime ----------
alter table public.deliveries replica identity full;
alter table public.godowns replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'deliveries'
  ) then
    alter publication supabase_realtime add table public.deliveries;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'godowns'
  ) then
    alter publication supabase_realtime add table public.godowns;
  end if;
end $$;

-- ============================================================================
--  DONE. You can now record deliveries against bookings and track pending
--  quantity + which godown stock landed in.
-- ============================================================================
