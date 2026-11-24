-- O Arcano: Mesas de RPG (MVP)
-- Cada mesa escolhe um sistema (por enquanto so 'arcano') e tem tres abas:
-- chat, fichas (characters com mesa_id) e NPCs (fichas no formato do Bestiario).
-- Rode no Supabase > SQL Editor DEPOIS de supabase-access-requests.sql e
-- supabase-characters.sql. Pode ser executado mais de uma vez.

-- ── Mesas ───────────────────────────────────────────────
create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  system text not null default 'arcano' check (system in ('arcano')),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  invite_code text not null unique default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.mesa_members (
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'jogador' check (role in ('mestre', 'jogador')),
  display_name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (mesa_id, user_id)
);

create index if not exists mesa_members_user_idx on public.mesa_members (user_id);

create table if not exists public.mesa_messages (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author text not null default '',
  kind text not null default 'fala' check (kind in ('fala', 'narracao', 'fora')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists mesa_messages_mesa_idx on public.mesa_messages (mesa_id, created_at desc);

create table if not exists public.mesa_npcs (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  summary text not null default '',
  image text not null default '',
  image_path text not null default '',
  body_html text not null default '',
  tags jsonb not null default '[]'::jsonb,
  fields jsonb not null default '{}'::jsonb,
  source_entry_id text,
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mesa_npcs_mesa_idx on public.mesa_npcs (mesa_id);

-- Fichas passam a pertencer a uma mesa.
alter table public.characters
  add column if not exists mesa_id uuid references public.mesas(id) on delete set null;

create index if not exists characters_mesa_idx on public.characters (mesa_id);

-- ── Funcoes auxiliares (security definer evita recursao nas policies) ──
create or replace function public.is_mesa_member(p_mesa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mesa_members m where m.mesa_id = p_mesa and m.user_id = auth.uid());
$$;

create or replace function public.is_mesa_master(p_mesa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mesa_members m where m.mesa_id = p_mesa and m.user_id = auth.uid() and m.role = 'mestre');
$$;

-- Versao por texto, para as policies do storage (o nome da pasta nem sempre e uuid).
create or replace function public.is_mesa_master_path(p_mesa text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mesa_members m where m.mesa_id::text = p_mesa and m.user_id = auth.uid() and m.role = 'mestre');
$$;

revoke all on function public.is_mesa_master_path(text) from public, anon;
grant execute on function public.is_mesa_master_path(text) to authenticated;
revoke all on function public.is_mesa_member(uuid) from public, anon;
revoke all on function public.is_mesa_master(uuid) from public, anon;
grant execute on function public.is_mesa_member(uuid) to authenticated;
grant execute on function public.is_mesa_master(uuid) to authenticated;

-- Quem cria a mesa entra como Mestre.
create or replace function public.mesa_add_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.mesa_members (mesa_id, user_id, role, display_name)
  values (
    new.id, new.owner_id, 'mestre',
    coalesce((select ar.display_name from public.access_requests ar where ar.user_id = new.owner_id), '')
  )
  on conflict (mesa_id, user_id) do update set role = 'mestre';
  return new;
end;
$$;

drop trigger if exists mesas_add_owner on public.mesas;
create trigger mesas_add_owner after insert on public.mesas
  for each row execute function public.mesa_add_owner();

-- Entrar numa mesa pelo codigo de convite.
create or replace function public.join_mesa(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_mesa uuid;
begin
  if auth.uid() is null or public.current_arcano_role() not in ('player', 'admin') then
    raise exception 'Acesso ainda nao aprovado.';
  end if;
  select id into v_mesa from public.mesas where invite_code = lower(trim(p_code));
  if v_mesa is null then
    raise exception 'Convite invalido.';
  end if;
  insert into public.mesa_members (mesa_id, user_id, role, display_name)
  values (
    v_mesa, auth.uid(), 'jogador',
    coalesce((select ar.display_name from public.access_requests ar where ar.user_id = auth.uid()), '')
  )
  on conflict (mesa_id, user_id) do nothing;
  return v_mesa;
end;
$$;

revoke all on function public.join_mesa(text) from public, anon;
grant execute on function public.join_mesa(text) to authenticated;

-- Uma ficha so pode ser colocada numa mesa da qual o dono participa.
create or replace function public.characters_check_mesa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.mesa_id is not null
     and (tg_op = 'INSERT' or new.mesa_id is distinct from old.mesa_id)
     and not exists (select 1 from public.mesa_members m where m.mesa_id = new.mesa_id and m.user_id = new.user_id) then
    raise exception 'O dono da ficha nao participa desta mesa.';
  end if;
  return new;
end;
$$;

drop trigger if exists characters_check_mesa on public.characters;
create trigger characters_check_mesa before insert or update on public.characters
  for each row execute function public.characters_check_mesa();

-- Funcoes de gatilho nao devem ser chamadas pela API.
revoke all on function public.mesa_add_owner() from public, anon, authenticated;
revoke all on function public.characters_check_mesa() from public, anon, authenticated;

-- ── RLS ─────────────────────────────────────────────────
alter table public.mesas enable row level security;
alter table public.mesa_members enable row level security;
alter table public.mesa_messages enable row level security;
alter table public.mesa_npcs enable row level security;

drop policy if exists "mesas_select" on public.mesas;
drop policy if exists "mesas_insert" on public.mesas;
drop policy if exists "mesas_update" on public.mesas;
drop policy if exists "mesas_delete" on public.mesas;

create policy "mesas_select" on public.mesas for select to authenticated
  using (owner_id = auth.uid() or public.is_mesa_member(id));
create policy "mesas_insert" on public.mesas for insert to authenticated
  with check (owner_id = auth.uid() and public.current_arcano_role() in ('player', 'admin'));
create policy "mesas_update" on public.mesas for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "mesas_delete" on public.mesas for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "mesa_members_select" on public.mesa_members;
drop policy if exists "mesa_members_update" on public.mesa_members;
drop policy if exists "mesa_members_delete" on public.mesa_members;

create policy "mesa_members_select" on public.mesa_members for select to authenticated
  using (public.is_mesa_member(mesa_id));
create policy "mesa_members_update" on public.mesa_members for update to authenticated
  using (public.is_mesa_master(mesa_id) or user_id = auth.uid())
  with check (public.is_mesa_master(mesa_id) or (user_id = auth.uid() and role = 'jogador'));
-- Sair da mesa (o proprio jogador) ou remover alguem (o Mestre).
create policy "mesa_members_delete" on public.mesa_members for delete to authenticated
  using (user_id = auth.uid() or public.is_mesa_master(mesa_id));

drop policy if exists "mesa_messages_select" on public.mesa_messages;
drop policy if exists "mesa_messages_insert" on public.mesa_messages;
drop policy if exists "mesa_messages_delete" on public.mesa_messages;

create policy "mesa_messages_select" on public.mesa_messages for select to authenticated
  using (public.is_mesa_member(mesa_id));
create policy "mesa_messages_insert" on public.mesa_messages for insert to authenticated
  with check (
    user_id = auth.uid() and public.is_mesa_member(mesa_id)
    and (kind <> 'narracao' or public.is_mesa_master(mesa_id))
  );
create policy "mesa_messages_delete" on public.mesa_messages for delete to authenticated
  using (user_id = auth.uid() or public.is_mesa_master(mesa_id));

drop policy if exists "mesa_npcs_select" on public.mesa_npcs;
drop policy if exists "mesa_npcs_insert" on public.mesa_npcs;
drop policy if exists "mesa_npcs_update" on public.mesa_npcs;
drop policy if exists "mesa_npcs_delete" on public.mesa_npcs;

create policy "mesa_npcs_select" on public.mesa_npcs for select to authenticated
  using (public.is_mesa_master(mesa_id) or (visible and public.is_mesa_member(mesa_id)));
create policy "mesa_npcs_insert" on public.mesa_npcs for insert to authenticated
  with check (public.is_mesa_master(mesa_id));
create policy "mesa_npcs_update" on public.mesa_npcs for update to authenticated
  using (public.is_mesa_master(mesa_id)) with check (public.is_mesa_master(mesa_id));
create policy "mesa_npcs_delete" on public.mesa_npcs for delete to authenticated
  using (public.is_mesa_master(mesa_id));

-- Fichas: todos da mesa leem (como o canal de fichas do Discord); o Mestre da mesa edita.
drop policy if exists "characters_mesa_select" on public.characters;
drop policy if exists "characters_mesa_master_update" on public.characters;

create policy "characters_mesa_select" on public.characters for select to authenticated
  using (mesa_id is not null and public.is_mesa_member(mesa_id));
create policy "characters_mesa_master_update" on public.characters for update to authenticated
  using (mesa_id is not null and public.is_mesa_master(mesa_id))
  with check (mesa_id is not null and public.is_mesa_master(mesa_id));

grant select, insert, update, delete on public.mesas to authenticated;
grant select, update, delete on public.mesa_members to authenticated;
grant select, insert, delete on public.mesa_messages to authenticated;
grant select, insert, update, delete on public.mesa_npcs to authenticated;

-- ── Imagens dos NPCs: mesas/<mesa_id>/... no bucket banners ──
drop policy if exists "mesa_images_master_upload" on storage.objects;
drop policy if exists "mesa_images_master_delete" on storage.objects;

create policy "mesa_images_master_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = 'mesas'
    and public.is_mesa_master_path((storage.foldername(name))[2])
  );
create policy "mesa_images_master_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = 'mesas'
    and public.is_mesa_master_path((storage.foldername(name))[2])
  );

-- ── Tempo real do chat ──────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.mesa_messages;
  exception when duplicate_object then null;
  end;
end $$;

notify pgrst, 'reload schema';
