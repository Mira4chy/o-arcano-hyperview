-- O Arcano: Mesa / grid tatico de sessao
-- Rode este arquivo no Supabase > SQL Editor depois das migrations de acesso.
--
-- MVP: salva a cena ativa em JSONB para permitir sincronizacao simples.
-- Versao futura recomendada: separar tokens em public.battle_tokens para RLS por dono.

create table if not exists public.battle_grids (
  id text primary key,
  title text not null default 'Cena ativa',
  state jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.battle_grids
  add column if not exists title text not null default 'Cena ativa',
  add column if not exists state jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_battle_grids_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists battle_grids_touch_updated_at on public.battle_grids;
create trigger battle_grids_touch_updated_at
  before update on public.battle_grids
  for each row execute function public.touch_battle_grids_updated_at();

alter table public.battle_grids enable row level security;

drop policy if exists "battle_grids_approved_select" on public.battle_grids;
drop policy if exists "battle_grids_approved_insert" on public.battle_grids;
drop policy if exists "battle_grids_approved_update" on public.battle_grids;
drop policy if exists "battle_grids_master_delete" on public.battle_grids;

create policy "battle_grids_approved_select" on public.battle_grids
  for select to authenticated
  using (public.current_arcano_role() in ('player', 'admin'));

-- MVP: jogadores aprovados podem entrar/mover tokens pela cena ativa.
-- A UI ainda limita jogadores aos proprios tokens; RLS fina entra na versao com battle_tokens.
create policy "battle_grids_approved_insert" on public.battle_grids
  for insert to authenticated
  with check (public.current_arcano_role() in ('player', 'admin'));

create policy "battle_grids_approved_update" on public.battle_grids
  for update to authenticated
  using (public.current_arcano_role() in ('player', 'admin'))
  with check (public.current_arcano_role() in ('player', 'admin'));

create policy "battle_grids_master_delete" on public.battle_grids
  for delete to authenticated
  using (public.current_arcano_role() = 'admin');

insert into public.battle_grids (id, title, state, is_active)
values (
  'active',
  'Cena ativa',
  '{
    "id": "active",
    "title": "Cena ativa",
    "width": 18,
    "height": 12,
    "cellSize": 42,
    "background": "#101421",
    "showGrid": true,
    "allowPlayerMove": true,
    "tokens": []
  }'::jsonb,
  true
)
on conflict (id) do nothing;
