-- O Arcano: paleta de cores personalizada do Mestre
-- Cada Mestre tem sua propria paleta de cores que aparece no editor de texto.
-- Rode este arquivo UMA VEZ no Supabase > SQL Editor.

create table if not exists public.master_palette (
  user_id uuid primary key references auth.users(id) on delete cascade,
  colors jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.master_palette enable row level security;

drop policy if exists "master_palette_owner_select" on public.master_palette;
drop policy if exists "master_palette_owner_insert" on public.master_palette;
drop policy if exists "master_palette_owner_update" on public.master_palette;
drop policy if exists "master_palette_owner_delete" on public.master_palette;

create policy "master_palette_owner_select" on public.master_palette
  for select to authenticated
  using (user_id = auth.uid());

create policy "master_palette_owner_insert" on public.master_palette
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "master_palette_owner_update" on public.master_palette
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "master_palette_owner_delete" on public.master_palette
  for delete to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
