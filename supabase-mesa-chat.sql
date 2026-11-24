-- O Arcano: chat da mesa (falar como personagem, dados, cenas, imagens, sussurros)
-- Rode DEPOIS de supabase-mesas.sql e supabase-niveis.sql. Pode rodar mais de uma vez.

-- ── Mensagens: novos tipos e dados ─────────────────────
alter table public.mesa_messages
  add column if not exists speaker jsonb not null default '{}'::jsonb,   -- { type: self|character|npc|avulso|narrador, id, name, image, color }
  add column if not exists tone text not null default 'normal',
  add column if not exists data jsonb not null default '{}'::jsonb,      -- rolagem, cena, imagem
  add column if not exists whisper_to uuid references auth.users(id) on delete cascade,
  add column if not exists edited_at timestamptz;

alter table public.mesa_messages drop constraint if exists mesa_messages_kind_check;
alter table public.mesa_messages add constraint mesa_messages_kind_check
  check (kind in ('fala', 'narracao', 'fora', 'acao', 'rolagem', 'cena', 'imagem'));
alter table public.mesa_messages drop constraint if exists mesa_messages_tone_check;
alter table public.mesa_messages add constraint mesa_messages_tone_check
  check (tone in ('normal', 'grita', 'baixo'));
-- Rolagem, cena e imagem podem vir sem texto.
alter table public.mesa_messages drop constraint if exists mesa_messages_body_check;
alter table public.mesa_messages add constraint mesa_messages_body_check
  check (char_length(body) <= 4000);

create index if not exists mesa_messages_whisper_idx on public.mesa_messages (whisper_to) where whisper_to is not null;

-- Sussurro: so quem mandou e quem recebeu leem.
drop policy if exists "mesa_messages_select" on public.mesa_messages;
create policy "mesa_messages_select" on public.mesa_messages for select to authenticated
  using (
    public.is_mesa_member(mesa_id)
    and (whisper_to is null or user_id = (select auth.uid()) or whisper_to = (select auth.uid()))
  );

-- Narracao, cena e rolagem secreta sao do Mestre. Sussurro so para quem esta na mesa.
drop policy if exists "mesa_messages_insert" on public.mesa_messages;
create policy "mesa_messages_insert" on public.mesa_messages for insert to authenticated
  with check (
    user_id = (select auth.uid()) and public.is_mesa_member(mesa_id)
    and (kind not in ('narracao', 'cena') or public.is_mesa_master(mesa_id))
    and (coalesce((data->>'secret')::boolean, false) = false or public.is_mesa_master(mesa_id))
    and (whisper_to is null or exists (
      select 1 from public.mesa_members m where m.mesa_id = mesa_messages.mesa_id and m.user_id = mesa_messages.whisper_to
    ))
  );

-- Editar: o autor edita a propria mensagem; o Mestre pode marcar imagens como guardadas/expiradas.
drop policy if exists "mesa_messages_update" on public.mesa_messages;
create policy "mesa_messages_update" on public.mesa_messages for update to authenticated
  using (user_id = (select auth.uid()) or public.is_mesa_master(mesa_id))
  with check (user_id = (select auth.uid()) or public.is_mesa_master(mesa_id));

grant update on public.mesa_messages to authenticated;

-- ── Rolagens secretas: o resultado fica aqui ate o Mestre revelar ──
create table if not exists public.mesa_secret_rolls (
  message_id uuid primary key references public.mesa_messages(id) on delete cascade,
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.mesa_secret_rolls enable row level security;

drop policy if exists "mesa_secret_rolls_master" on public.mesa_secret_rolls;
create policy "mesa_secret_rolls_master" on public.mesa_secret_rolls for all to authenticated
  using (public.is_mesa_master(mesa_id))
  with check (public.is_mesa_master(mesa_id));

grant select, insert, delete on public.mesa_secret_rolls to authenticated;

-- ── Acervo de imagens do Mestre ─────────────────────────
create table if not exists public.mesa_images (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  url text not null,
  path text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists mesa_images_mesa_idx on public.mesa_images (mesa_id, created_at desc);

alter table public.mesa_images enable row level security;

drop policy if exists "mesa_images_master" on public.mesa_images;
create policy "mesa_images_master" on public.mesa_images for all to authenticated
  using (public.is_mesa_master(mesa_id))
  with check (public.is_mesa_master(mesa_id));

grant select, insert, update, delete on public.mesa_images to authenticated;

-- ── Imagens dos jogadores no chat: mesas/<mesa>/chat/<user>/... ──
create or replace function public.is_mesa_member_path(p_mesa text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mesa_members m where m.mesa_id::text = p_mesa and m.user_id = auth.uid());
$$;

revoke all on function public.is_mesa_member_path(text) from public, anon;
grant execute on function public.is_mesa_member_path(text) to authenticated;

drop policy if exists "mesa_chat_images_member_upload" on storage.objects;
drop policy if exists "mesa_chat_images_member_delete" on storage.objects;

create policy "mesa_chat_images_member_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = 'mesas'
    and (storage.foldername(name))[3] = 'chat'
    and (storage.foldername(name))[4] = ((select auth.uid())::text)
    and public.is_mesa_member_path((storage.foldername(name))[2])
  );
create policy "mesa_chat_images_member_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = 'mesas'
    and (storage.foldername(name))[3] = 'chat'
    and (storage.foldername(name))[4] = ((select auth.uid())::text)
  );

notify pgrst, 'reload schema';
