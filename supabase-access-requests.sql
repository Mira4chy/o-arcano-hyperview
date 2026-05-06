-- O Arcano: fluxo de solicitacao/aprovacao de acesso
-- Rode este arquivo no Supabase > SQL Editor.

create table if not exists public.access_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text default '',
  requested_role text not null default 'player'
    check (requested_role in ('player', 'admin')),
  approved_role text
    check (approved_role in ('player', 'admin')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_access_request_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted_role text;
begin
  wanted_role := coalesce(new.raw_user_meta_data->>'requested_role', 'player');
  if wanted_role not in ('player', 'admin') then
    wanted_role := 'player';
  end if;

  insert into public.access_requests (
    user_id,
    email,
    display_name,
    requested_role,
    approved_role,
    status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    wanted_role,
    null,
    'pending'
  )
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        requested_role = excluded.requested_role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_access_request on auth.users;
create trigger on_auth_user_created_access_request
  after insert on auth.users
  for each row execute function public.create_access_request_for_new_user();

-- Preenche a tabela para usuarios que ja existiam antes do trigger.
insert into public.access_requests (
  user_id,
  email,
  display_name,
  requested_role,
  approved_role,
  status
)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  case
    when raw_user_meta_data->>'requested_role' in ('player', 'admin')
      then raw_user_meta_data->>'requested_role'
    else 'player'
  end,
  null,
  'pending'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.current_arcano_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
      select ar.approved_role
      from public.access_requests ar
      where ar.user_id = auth.uid()
        and ar.status = 'approved'
      limit 1
    ), 'pending');
$$;

grant execute on function public.current_arcano_role() to authenticated;

alter table public.access_requests enable row level security;

drop policy if exists "access_requests_own_select" on public.access_requests;
drop policy if exists "access_requests_admin_select" on public.access_requests;
drop policy if exists "access_requests_admin_update" on public.access_requests;

create policy "access_requests_own_select" on public.access_requests
  for select to authenticated
  using (user_id = auth.uid());

-- Sem policy de update aqui: a aprovacao deve ser feita no Supabase Dashboard
-- (Table Editor), que usa permissao administrativa do projeto.

-- Historias: leitura para contas aprovadas, escrita so para Mestre aprovado.
alter table public.stories enable row level security;

drop policy if exists "stories_public_select" on public.stories;
drop policy if exists "stories_public_insert" on public.stories;
drop policy if exists "stories_public_update" on public.stories;
drop policy if exists "stories_public_delete" on public.stories;
drop policy if exists "stories_auth_select" on public.stories;
drop policy if exists "stories_admin_insert" on public.stories;
drop policy if exists "stories_admin_update" on public.stories;
drop policy if exists "stories_admin_delete" on public.stories;
drop policy if exists "stories_approved_select" on public.stories;
drop policy if exists "stories_master_insert" on public.stories;
drop policy if exists "stories_master_update" on public.stories;
drop policy if exists "stories_master_delete" on public.stories;

create policy "stories_approved_select" on public.stories
  for select to authenticated
  using (public.current_arcano_role() in ('player', 'admin'));

create policy "stories_master_insert" on public.stories
  for insert to authenticated
  with check (public.current_arcano_role() = 'admin');

create policy "stories_master_update" on public.stories
  for update to authenticated
  using (public.current_arcano_role() = 'admin')
  with check (public.current_arcano_role() = 'admin');

create policy "stories_master_delete" on public.stories
  for delete to authenticated
  using (public.current_arcano_role() = 'admin');

-- Index: leitura para contas aprovadas, edicao so para Mestre aprovado.
alter table public.index_config enable row level security;

drop policy if exists "index_public_select" on public.index_config;
drop policy if exists "index_public_insert" on public.index_config;
drop policy if exists "index_public_update" on public.index_config;
drop policy if exists "index_auth_select" on public.index_config;
drop policy if exists "index_admin_insert" on public.index_config;
drop policy if exists "index_admin_update" on public.index_config;
drop policy if exists "index_approved_select" on public.index_config;
drop policy if exists "index_master_insert" on public.index_config;
drop policy if exists "index_master_update" on public.index_config;

create policy "index_approved_select" on public.index_config
  for select to authenticated
  using (public.current_arcano_role() in ('player', 'admin'));

create policy "index_master_insert" on public.index_config
  for insert to authenticated
  with check (public.current_arcano_role() = 'admin');

create policy "index_master_update" on public.index_config
  for update to authenticated
  using (public.current_arcano_role() = 'admin')
  with check (public.current_arcano_role() = 'admin');

-- Storage: bucket publico para leitura, upload/alteracao/remocao so por Mestre.
drop policy if exists "banners_public_upload" on storage.objects;
drop policy if exists "banners_public_update" on storage.objects;
drop policy if exists "banners_public_delete" on storage.objects;
drop policy if exists "banners_admin_upload" on storage.objects;
drop policy if exists "banners_admin_update" on storage.objects;
drop policy if exists "banners_admin_delete" on storage.objects;
drop policy if exists "banners_master_upload" on storage.objects;
drop policy if exists "banners_master_update" on storage.objects;
drop policy if exists "banners_master_delete" on storage.objects;

create policy "banners_master_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'banners' and public.current_arcano_role() = 'admin');

create policy "banners_master_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'banners' and public.current_arcano_role() = 'admin')
  with check (bucket_id = 'banners' and public.current_arcano_role() = 'admin');

create policy "banners_master_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'banners' and public.current_arcano_role() = 'admin');
