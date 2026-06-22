-- O Arcano: fichas de personagem dos jogadores (aba Persona)
-- Rode este arquivo no Supabase > SQL Editor DEPOIS de supabase-access-requests.sql
-- (depende da funcao public.current_arcano_role()).

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  race_id text references public.stories(id) on delete set null,
  race_name text default '',
  is_mage boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,   -- {"Força": 12, "Destreza": 10, ...}
  point_pool int default 0,                          -- pontos restantes (auditoria)
  skills jsonb not null default '[]'::jsonb,          -- perícias / talentos (lista de strings)
  magic jsonb not null default '{}'::jsonb,           -- placeholder: {"tradicoes":[],"magias":[]}
  hp jsonb not null default '{}'::jsonb,              -- {"Cabeça":"55/55", ...} editável
  mana text default '',                               -- "15/15"
  identity jsonb not null default '{}'::jsonb,        -- {"papel":"","desejo":"","ferida":"","bodyHtml":""}
  image text default '',
  image_path text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_user_id_idx on public.characters (user_id);

alter table public.characters enable row level security;

drop policy if exists "characters_owner_select" on public.characters;
drop policy if exists "characters_owner_insert" on public.characters;
drop policy if exists "characters_owner_update" on public.characters;
drop policy if exists "characters_owner_delete" on public.characters;

-- Leitura: o dono ve as suas; o Mestre (admin aprovado) ve todas.
create policy "characters_owner_select" on public.characters
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_arcano_role() = 'admin'
  );

-- Criacao: somente o proprio usuario, e precisa estar aprovado (player ou admin).
create policy "characters_owner_insert" on public.characters
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_arcano_role() in ('player', 'admin')
  );

-- Edicao: o dono ou o Mestre.
create policy "characters_owner_update" on public.characters
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.current_arcano_role() = 'admin'
  )
  with check (
    user_id = auth.uid()
    or public.current_arcano_role() = 'admin'
  );

-- Remocao: o dono ou o Mestre.
create policy "characters_owner_delete" on public.characters
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.current_arcano_role() = 'admin'
  );
