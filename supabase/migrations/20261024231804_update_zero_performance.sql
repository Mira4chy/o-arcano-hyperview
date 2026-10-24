-- Atualização Zero: reduz reavaliações de autenticação nas policies e
-- adiciona o índice que suporta a relação entre personagens e raças.

create index if not exists characters_race_id_idx
  on public.characters (race_id);

alter policy access_requests_own_select
  on public.access_requests
  using (user_id = (select auth.uid()));

alter policy master_palette_owner_select
  on public.master_palette
  using (user_id = (select auth.uid()));

alter policy master_palette_owner_insert
  on public.master_palette
  with check (user_id = (select auth.uid()));

alter policy master_palette_owner_update
  on public.master_palette
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy master_palette_owner_delete
  on public.master_palette
  using (user_id = (select auth.uid()));

alter policy characters_owner_select
  on public.characters
  using (
    user_id = (select auth.uid())
    or (select public.current_arcano_role()) = 'admin'
  );

alter policy characters_owner_insert
  on public.characters
  with check (
    user_id = (select auth.uid())
    and (select public.current_arcano_role()) = any (array['player'::text, 'admin'::text])
  );

alter policy characters_owner_update
  on public.characters
  using (
    user_id = (select auth.uid())
    or (select public.current_arcano_role()) = 'admin'
  )
  with check (
    user_id = (select auth.uid())
    or (select public.current_arcano_role()) = 'admin'
  );

alter policy characters_owner_delete
  on public.characters
  using (
    user_id = (select auth.uid())
    or (select public.current_arcano_role()) = 'admin'
  );
