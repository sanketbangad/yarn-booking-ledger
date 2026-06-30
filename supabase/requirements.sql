-- ============================================================================
--  BGI Yarn — Yarn Requirements (procurement board) migration
--  Run this ONCE in the Supabase SQL Editor, AFTER schema.sql.
--  Safe to re-run (idempotent).
-- ============================================================================

create table if not exists public.requirements (
  id                 uuid primary key default gen_random_uuid(),
  po_number          text not null,
  yarn_name          text not null,
  quantity           numeric not null check (quantity > 0),
  quantity_unit      text not null default 'Bags' check (quantity_unit in ('Bags', 'KG')),
  remarks            text,
  fulfilled          boolean not null default false,
  created_by         uuid not null references auth.users(id) on delete cascade,
  created_by_name    text not null,
  fulfilled_by       uuid references auth.users(id) on delete set null,
  fulfilled_by_name  text,
  fulfilled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists requirements_fulfilled_idx on public.requirements(fulfilled);
create index if not exists requirements_created_at_idx on public.requirements(created_at desc);
create index if not exists requirements_po_idx on public.requirements(po_number);

-- Keep updated_at fresh (reuses set_updated_at from schema.sql)
drop trigger if exists set_requirements_updated_at on public.requirements;
create trigger set_requirements_updated_at
  before update on public.requirements
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.requirements enable row level security;

-- Everyone signed in can read.
drop policy if exists "requirements_select_all" on public.requirements;
create policy "requirements_select_all" on public.requirements
  for select to authenticated using (true);

-- Anyone signed in can add a requirement (recorded as themselves).
drop policy if exists "requirements_insert_self" on public.requirements;
create policy "requirements_insert_self" on public.requirements
  for insert to authenticated with check (created_by = auth.uid());

-- Anyone signed in can update (e.g. tick "fulfilled" when they place the order).
drop policy if exists "requirements_update_any" on public.requirements;
create policy "requirements_update_any" on public.requirements
  for update to authenticated using (true);

-- Only the person who raised it, or an admin, can delete it.
drop policy if exists "requirements_delete_own_or_admin" on public.requirements;
create policy "requirements_delete_own_or_admin" on public.requirements
  for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ---------- Realtime ----------
alter table public.requirements replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'requirements'
  ) then
    alter publication supabase_realtime add table public.requirements;
  end if;
end $$;

-- ============================================================================
--  DONE. Raise yarn requirements against a PO; tick them off when ordered.
-- ============================================================================
