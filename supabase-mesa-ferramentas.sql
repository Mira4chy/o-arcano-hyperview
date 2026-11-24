-- O Arcano: ferramentas da mesa (notas, iniciativa, mensagens fixadas, NPCs em combate)
-- Rode DEPOIS de supabase-mesa-chat.sql. Pode rodar mais de uma vez.

-- Notas privadas: cada pessoa tem as suas; o Mestre tem tambem as anotacoes de Mestre.
create table if not exists public.mesa_notes (
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'pessoal' check (kind in ('pessoal', 'mestre')),
  body text not null default '' check (char_length(body) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (mesa_id, user_id, kind)
);

alter table public.mesa_notes enable row level security;

drop policy if exists "mesa_notes_owner" on public.mesa_notes;
create policy "mesa_notes_owner" on public.mesa_notes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid()) and public.is_mesa_member(mesa_id)
    and (kind = 'pessoal' or public.is_mesa_master(mesa_id))
  );

grant select, insert, update, delete on public.mesa_notes to authenticated;

-- Estado compartilhado da mesa (iniciativa). Todos leem; o Mestre escreve.
create table if not exists public.mesa_state (
  mesa_id uuid primary key references public.mesas(id) on delete cascade,
  initiative jsonb not null default '{}'::jsonb,   -- { round, turn, entries: [{ id, name, value, color }] }
  updated_at timestamptz not null default now()
);

alter table public.mesa_state enable row level security;

drop policy if exists "mesa_state_select" on public.mesa_state;
drop policy if exists "mesa_state_master_write" on public.mesa_state;

create policy "mesa_state_select" on public.mesa_state for select to authenticated
  using (public.is_mesa_member(mesa_id) or (select public.current_arcano_tier()) = 'platina');
create policy "mesa_state_master_write" on public.mesa_state for all to authenticated
  using (public.is_mesa_master(mesa_id))
  with check (public.is_mesa_master(mesa_id));

grant select, insert, update on public.mesa_state to authenticated;

-- Mensagens fixadas (o Mestre fixa).
alter table public.mesa_messages
  add column if not exists pinned boolean not null default false;

-- NPCs em combate: HP atual e condicoes.
alter table public.mesa_npcs
  add column if not exists combat jsonb not null default '{}'::jsonb;   -- { cur, max, conds: [] }

do $$
begin
  begin
    alter publication supabase_realtime add table public.mesa_state;
  exception when duplicate_object then null;
  end;
end $$;

notify pgrst, 'reload schema';
