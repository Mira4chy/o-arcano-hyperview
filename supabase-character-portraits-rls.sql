-- Executar depois de supabase-access-requests.sql.
-- Permite que jogadores aprovados gravem e removam apenas seus proprios retratos.

drop policy if exists "character_portraits_player_upload" on storage.objects;
drop policy if exists "character_portraits_player_delete" on storage.objects;

create policy "character_portraits_player_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'banners'
    and public.current_arcano_role() = 'player'
    and (
      (
        (storage.foldername(name))[1] = 'characters'
        and (storage.foldername(name))[2] = ((select auth.uid())::text)
      )
      or name like ('characters/' || ((select auth.uid())::text) || '-%')
    )
  );

create policy "character_portraits_player_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'banners'
    and public.current_arcano_role() = 'player'
    and (
      (
        (storage.foldername(name))[1] = 'characters'
        and (storage.foldername(name))[2] = ((select auth.uid())::text)
      )
      or name like ('characters/' || ((select auth.uid())::text) || '-%')
    )
  );
