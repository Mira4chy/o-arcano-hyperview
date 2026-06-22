-- O Arcano: ficha interativa (HP por parte, status, inventario, livro de magias)
-- Rode este arquivo no Supabase > SQL Editor DEPOIS de supabase-characters.sql.
-- Sao apenas colunas novas na tabela characters; as policies de RLS ja existentes
-- (dono ou Mestre) continuam valendo.

alter table public.characters
  add column if not exists vitals    jsonb not null default '{}'::jsonb,   -- { hp: { "Cabeça": {cur,max}, ... }, mana: {cur,max} }
  add column if not exists statuses  jsonb not null default '[]'::jsonb,   -- [ { name }, ... ]
  add column if not exists inventory jsonb not null default '[]'::jsonb,   -- [ { refId, name, summary, qty }, ... ]
  add column if not exists spells    jsonb not null default '[]'::jsonb;   -- [ { refId, name, summary }, ... ]
