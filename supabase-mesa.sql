-- O Arcano: Mesa de jogo (rolador compartilhado + rastreador de combate)
-- Rode no Supabase > SQL Editor DEPOIS de supabase-access-requests.sql
-- (depende de public.current_arcano_role()). Pode ser executado mais de uma vez.

-- ── Rolagens compartilhadas ─────────────────────────────
create table if not exists public.table_rolls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author text not null default '',
  label text not null default '',
  expr text not null,
  detail jsonb not null default '{}'::jsonb,
  total int not null,
  created_at timestamptz not null default now()
);

create index if not exists table_rolls_created_idx on public.table_rolls (created_at desc);

alter table public.table_rolls enable row level security;

drop policy if exists "table_rolls_select" on public.table_rolls;
drop policy if exists "table_rolls_insert" on public.table_rolls;
drop policy if exists "table_rolls_master_delete" on public.table_rolls;

create policy "table_rolls_select" on public.table_rolls
  for select to authenticated
  using (public.current_arcano_role() in ('player', 'admin'));

create policy "table_rolls_insert" on public.table_rolls
  for insert to authenticated
  with check (user_id = auth.uid() and public.current_arcano_role() in ('player', 'admin'));

create policy "table_rolls_master_delete" on public.table_rolls
  for delete to authenticated
  using (public.current_arcano_role() = 'admin');

grant select, insert, delete on public.table_rolls to authenticated;

-- ── Combate (um unico registro, id = 1) ─────────────────
create table if not exists public.table_combat (
  id int primary key check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.table_combat enable row level security;

drop policy if exists "table_combat_select" on public.table_combat;
drop policy if exists "table_combat_master_insert" on public.table_combat;
drop policy if exists "table_combat_master_update" on public.table_combat;

create policy "table_combat_select" on public.table_combat
  for select to authenticated
  using (public.current_arcano_role() in ('player', 'admin'));

create policy "table_combat_master_insert" on public.table_combat
  for insert to authenticated
  with check (public.current_arcano_role() = 'admin');

create policy "table_combat_master_update" on public.table_combat
  for update to authenticated
  using (public.current_arcano_role() = 'admin')
  with check (public.current_arcano_role() = 'admin');

grant select, insert, update on public.table_combat to authenticated;

insert into public.table_combat (id, state) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ── Tempo real ──────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.table_rolls;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.table_combat;
  exception when duplicate_object then null;
  end;
end $$;

notify pgrst, 'reload schema';
