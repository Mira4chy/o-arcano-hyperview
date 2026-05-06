-- O Arcano: tags personalizadas nas historias
-- Rode no Supabase > SQL Editor antes de criar historias com tags.

alter table public.stories
  add column if not exists tags jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
