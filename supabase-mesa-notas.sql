-- O Arcano: notas da mesa
--  * "pessoal": cada membro tem a sua; todos da mesa leem, só o dono escreve;
--  * "mestre": anotações do Mestre, só ele lê;
--  * "npc": anotação do Mestre sobre um NPC (target = id do NPC), só ele lê.
-- Rode DEPOIS de supabase-mesa-ferramentas.sql. Pode rodar mais de uma vez.

alter table public.mesa_notes add column if not exists target text not null default '';

alter table public.mesa_notes drop constraint if exists mesa_notes_kind_check;
alter table public.mesa_notes add constraint mesa_notes_kind_check check (kind in ('pessoal', 'mestre', 'npc'));

alter table public.mesa_notes drop constraint if exists mesa_notes_pkey;
alter table public.mesa_notes add constraint mesa_notes_pkey primary key (mesa_id, user_id, kind, target);

drop policy if exists "mesa_notes_owner" on public.mesa_notes;
drop policy if exists "mesa_notes_read_pessoal" on public.mesa_notes;

create policy "mesa_notes_owner" on public.mesa_notes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid()) and public.is_mesa_member(mesa_id)
    and (kind = 'pessoal' or public.is_mesa_master(mesa_id))
  );

create policy "mesa_notes_read_pessoal" on public.mesa_notes for select to authenticated
  using (kind = 'pessoal' and public.is_mesa_member(mesa_id));

notify pgrst, 'reload schema';
