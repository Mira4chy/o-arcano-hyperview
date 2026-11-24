-- O Arcano: fichas controladas pelo Mestre (NPC como ficha, atribuir dono, níveis)
-- Rode DEPOIS de supabase-mesa-ferramentas.sql. Pode rodar mais de uma vez.

alter table public.characters
  add column if not exists is_npc boolean not null default false,
  add column if not exists npc_visible boolean not null default false,
  add column if not exists level_grant jsonb not null default '{}'::jsonb;   -- { points, by, at } concedido pelo Mestre

-- Jogadores não veem NPCs ocultos da mesa.
drop policy if exists "characters_mesa_select" on public.characters;
create policy "characters_mesa_select" on public.characters for select to authenticated
  using (
    mesa_id is not null and public.is_mesa_member(mesa_id)
    and (not is_npc or npc_visible or public.is_mesa_master(mesa_id))
  );

-- O Mestre da mesa cria fichas para os jogadores (e NPCs).
drop policy if exists "characters_mesa_master_insert" on public.characters;
create policy "characters_mesa_master_insert" on public.characters for insert to authenticated
  with check (mesa_id is not null and public.is_mesa_master(mesa_id));

-- Regras que a policy sozinha não cobre:
--  * o dono da ficha precisa participar da mesa (também ao trocar o dono);
--  * só o Mestre (ou Platina) concede nível; o dono só pode limpar a concessão ao subir.
create or replace function public.characters_check_mesa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.mesa_id is not null
     and (tg_op = 'INSERT' or new.mesa_id is distinct from old.mesa_id or new.user_id is distinct from old.user_id)
     and not exists (select 1 from public.mesa_members m where m.mesa_id = new.mesa_id and m.user_id = new.user_id) then
    raise exception 'O dono da ficha nao participa desta mesa.';
  end if;

  if coalesce(new.level_grant, '{}'::jsonb) <> '{}'::jsonb
     and (tg_op = 'INSERT' or new.level_grant is distinct from old.level_grant)
     and not (new.mesa_id is not null and public.is_mesa_master(new.mesa_id))
     and public.current_arcano_tier() is distinct from 'platina' then
    raise exception 'Apenas o Mestre concede niveis.';
  end if;

  return new;
end;
$$;

revoke all on function public.characters_check_mesa() from public, anon, authenticated;

notify pgrst, 'reload schema';
