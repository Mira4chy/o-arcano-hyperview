-- O Arcano: niveis de acesso (Bronze, Prata, Ouro, Platina)
-- Substitui "Jogador/Mestre" como tipo de conta. Mestre e Jogador continuam
-- existindo so dentro de cada mesa (mesa_members.role).
--   bronze  = usuario comum (todo cadastro novo, sem aprovacao)
--   prata   = VIP (por enquanto igual ao bronze)
--   ouro    = moderador: cria e edita o Livro do Arcano
--   platina = administrador: livro, todas as mesas e o painel de usuarios
-- Rode DEPOIS de supabase-access-requests.sql e supabase-mesas.sql. Pode rodar mais de uma vez.

alter table public.access_requests
  add column if not exists tier text not null default 'bronze'
    check (tier in ('bronze', 'prata', 'ouro', 'platina'));

-- Contas que ja existiam: Mestre aprovado vira Platina; o resto vira Bronze.
-- So roda uma vez: depois disso o nivel e mantido pelo painel.
do $$
begin
  if not exists (select 1 from public.access_requests where tier <> 'bronze') then
    update public.access_requests
      set tier = case when status = 'approved' and approved_role = 'admin' then 'platina' else 'bronze' end;
  end if;
end $$;

-- Ninguem mais espera aprovacao.
update public.access_requests
  set status = 'approved',
      approved_role = case when tier in ('ouro', 'platina') then 'admin' else 'player' end,
      updated_at = now()
  where status <> 'approved'
     or approved_role is distinct from (case when tier in ('ouro', 'platina') then 'admin' else 'player' end);

-- Nivel de quem esta logado.
create or replace function public.current_arcano_tier()
returns text language sql stable security definer set search_path = public as $$
  select ar.tier from public.access_requests ar where ar.user_id = auth.uid() limit 1;
$$;

revoke all on function public.current_arcano_tier() from public, anon;
grant execute on function public.current_arcano_tier() to authenticated;

-- Compatibilidade com as policies antigas: Ouro e Platina editam o livro ('admin'),
-- Bronze e Prata leem ('player'). Quem nao tem registro fica 'pending'.
create or replace function public.current_arcano_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((
    select case when ar.tier in ('ouro', 'platina') then 'admin' else 'player' end
    from public.access_requests ar
    where ar.user_id = auth.uid()
    limit 1
  ), 'pending');
$$;

-- Cadastro novo ja entra como Bronze, aprovado.
create or replace function public.create_access_request_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.access_requests (user_id, email, display_name, requested_role, approved_role, status, tier)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'player', 'player', 'approved', 'bronze'
  )
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        updated_at = now();
  return new;
end;
$$;

revoke all on function public.create_access_request_for_new_user() from public, anon, authenticated;

-- Platina troca o nivel de outra conta (nunca o proprio, para ninguem se trancar fora).
create or replace function public.set_user_tier(p_user uuid, p_tier text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_arcano_tier() is distinct from 'platina' then
    raise exception 'Apenas Platina pode alterar niveis.';
  end if;
  if p_user = auth.uid() then
    raise exception 'Voce nao pode alterar o proprio nivel.';
  end if;
  if p_tier not in ('bronze', 'prata', 'ouro', 'platina') then
    raise exception 'Nivel invalido.';
  end if;
  update public.access_requests
    set tier = p_tier,
        approved_role = case when p_tier in ('ouro', 'platina') then 'admin' else 'player' end,
        status = 'approved',
        updated_at = now()
    where user_id = p_user;
end;
$$;

revoke all on function public.set_user_tier(uuid, text) from public, anon;
grant execute on function public.set_user_tier(uuid, text) to authenticated;

-- Platina ve a lista de contas.
drop policy if exists "access_requests_platina_select" on public.access_requests;
create policy "access_requests_platina_select" on public.access_requests for select to authenticated
  using (public.current_arcano_tier() = 'platina');

-- Fichas: so Platina ve e mexe nas fichas de todo mundo (Ouro nao).
drop policy if exists "characters_owner_select" on public.characters;
drop policy if exists "characters_owner_update" on public.characters;
drop policy if exists "characters_owner_delete" on public.characters;

create policy "characters_owner_select" on public.characters for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_arcano_tier()) = 'platina');
create policy "characters_owner_update" on public.characters for update to authenticated
  using (user_id = (select auth.uid()) or (select public.current_arcano_tier()) = 'platina')
  with check (user_id = (select auth.uid()) or (select public.current_arcano_tier()) = 'platina');
create policy "characters_owner_delete" on public.characters for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.current_arcano_tier()) = 'platina');

-- Platina le todas as mesas (moderacao). Escrever no chat continua exigindo participar.
drop policy if exists "mesas_platina_select" on public.mesas;
drop policy if exists "mesa_members_platina_select" on public.mesa_members;
drop policy if exists "mesa_messages_platina_select" on public.mesa_messages;
drop policy if exists "mesa_npcs_platina_select" on public.mesa_npcs;

create policy "mesas_platina_select" on public.mesas for select to authenticated
  using ((select public.current_arcano_tier()) = 'platina');
create policy "mesa_members_platina_select" on public.mesa_members for select to authenticated
  using ((select public.current_arcano_tier()) = 'platina');
create policy "mesa_messages_platina_select" on public.mesa_messages for select to authenticated
  using ((select public.current_arcano_tier()) = 'platina');
create policy "mesa_npcs_platina_select" on public.mesa_npcs for select to authenticated
  using ((select public.current_arcano_tier()) = 'platina');

notify pgrst, 'reload schema';
