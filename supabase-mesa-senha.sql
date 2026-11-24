-- O Arcano: senha da mesa
--  * só o dono define ou remove a senha;
--  * para entrar pelo convite é preciso a senha (quem já é membro não digita nada);
--  * mesa com senha cujo dono é Platina fica invisível para outros Platina que não sejam membros.
--    Mesa com senha de dono Bronze/Prata/Ouro continua visível para Platina.
-- Rode DEPOIS de supabase-fichas-mestre.sql. Pode rodar mais de uma vez.

alter table public.mesas
  add column if not exists has_password boolean not null default false;

-- O hash fica numa tabela sem nenhuma policy: ninguém lê pela API, só as funções abaixo.
create table if not exists public.mesa_secrets (
  mesa_id uuid primary key references public.mesas(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.mesa_secrets enable row level security;
revoke all on public.mesa_secrets from anon, authenticated;

-- Mesa trancada para Platina de fora: tem senha e o dono é Platina.
create or replace function public.mesa_hidden_from_platina(p_mesa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.mesas m
    join public.access_requests ar on ar.user_id = m.owner_id
    where m.id = p_mesa and m.has_password and ar.tier = 'platina'
  );
$$;
revoke all on function public.mesa_hidden_from_platina(uuid) from public, anon;
grant execute on function public.mesa_hidden_from_platina(uuid) to authenticated;

-- Platina de fora enxerga a mesa? (Platina e mesa não trancada)
create or replace function public.platina_can_see_mesa(p_mesa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_arcano_tier() = 'platina' and not public.mesa_hidden_from_platina(p_mesa);
$$;
revoke all on function public.platina_can_see_mesa(uuid) from public, anon;
grant execute on function public.platina_can_see_mesa(uuid) to authenticated;

-- Dono define (texto) ou remove (null/vazio) a senha.
create or replace function public.set_mesa_password(p_mesa uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.mesas where id = p_mesa and owner_id = auth.uid()) then
    raise exception 'Apenas o dono da mesa define a senha.';
  end if;
  if p_password is null or length(trim(p_password)) = 0 then
    delete from public.mesa_secrets where mesa_id = p_mesa;
    update public.mesas set has_password = false where id = p_mesa;
    return;
  end if;
  if length(p_password) < 4 or length(p_password) > 72 then
    raise exception 'A senha precisa ter de 4 a 72 caracteres.';
  end if;
  insert into public.mesa_secrets (mesa_id, password_hash, updated_at)
  values (p_mesa, crypt(p_password, gen_salt('bf')), now())
  on conflict (mesa_id) do update set password_hash = excluded.password_hash, updated_at = now();
  update public.mesas set has_password = true where id = p_mesa;
end;
$$;
revoke all on function public.set_mesa_password(uuid, text) from public, anon;
grant execute on function public.set_mesa_password(uuid, text) to authenticated;

-- Entrar pelo convite: pede a senha quando a mesa tem uma (membros já entram direto).
drop function if exists public.join_mesa(text);
create or replace function public.join_mesa(p_code text, p_password text default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_mesa uuid;
  v_hash text;
begin
  if auth.uid() is null or public.current_arcano_role() not in ('player', 'admin') then
    raise exception 'Acesso ainda nao aprovado.';
  end if;
  select id into v_mesa from public.mesas where invite_code = lower(trim(p_code));
  if v_mesa is null then
    raise exception 'Convite invalido.';
  end if;
  if exists (select 1 from public.mesa_members where mesa_id = v_mesa and user_id = auth.uid()) then
    return v_mesa;
  end if;
  select password_hash into v_hash from public.mesa_secrets where mesa_id = v_mesa;
  if v_hash is not null then
    if p_password is null or length(p_password) = 0 then
      raise exception 'MESA_SENHA_NECESSARIA';
    end if;
    if crypt(p_password, v_hash) <> v_hash then
      raise exception 'MESA_SENHA_INCORRETA';
    end if;
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
revoke all on function public.join_mesa(text, text) from public, anon;
grant execute on function public.join_mesa(text, text) to authenticated;

-- Visão de Platina de fora respeita a tranca.
drop policy if exists "mesas_platina_select" on public.mesas;
drop policy if exists "mesa_members_platina_select" on public.mesa_members;
drop policy if exists "mesa_messages_platina_select" on public.mesa_messages;
drop policy if exists "mesa_npcs_platina_select" on public.mesa_npcs;

create policy "mesas_platina_select" on public.mesas for select to authenticated
  using (public.platina_can_see_mesa(id));
create policy "mesa_members_platina_select" on public.mesa_members for select to authenticated
  using (public.platina_can_see_mesa(mesa_id));
create policy "mesa_messages_platina_select" on public.mesa_messages for select to authenticated
  using (public.platina_can_see_mesa(mesa_id));
create policy "mesa_npcs_platina_select" on public.mesa_npcs for select to authenticated
  using (public.platina_can_see_mesa(mesa_id));

drop policy if exists "mesa_state_select" on public.mesa_state;
create policy "mesa_state_select" on public.mesa_state for select to authenticated
  using (public.is_mesa_member(mesa_id) or public.platina_can_see_mesa(mesa_id));

-- Fichas: Platina vê todas, menos as de mesas trancadas de outro Platina.
drop policy if exists "characters_owner_select" on public.characters;
drop policy if exists "characters_owner_update" on public.characters;
drop policy if exists "characters_owner_delete" on public.characters;

create policy "characters_owner_select" on public.characters for select to authenticated
  using (
    user_id = (select auth.uid())
    or ((select public.current_arcano_tier()) = 'platina' and (mesa_id is null or not public.mesa_hidden_from_platina(mesa_id)))
  );
create policy "characters_owner_update" on public.characters for update to authenticated
  using (
    user_id = (select auth.uid())
    or ((select public.current_arcano_tier()) = 'platina' and (mesa_id is null or not public.mesa_hidden_from_platina(mesa_id)))
  )
  with check (
    user_id = (select auth.uid())
    or ((select public.current_arcano_tier()) = 'platina' and (mesa_id is null or not public.mesa_hidden_from_platina(mesa_id)))
  );
create policy "characters_owner_delete" on public.characters for delete to authenticated
  using (
    user_id = (select auth.uid())
    or ((select public.current_arcano_tier()) = 'platina' and (mesa_id is null or not public.mesa_hidden_from_platina(mesa_id)))
  );

notify pgrst, 'reload schema';
