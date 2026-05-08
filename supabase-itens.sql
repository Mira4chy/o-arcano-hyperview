-- O Arcano: campos extras para a categoria Itens (subtype + dossie estruturado)
-- Rode este arquivo UMA VEZ no Supabase > SQL Editor.

alter table public.stories
  add column if not exists subtype text,
  add column if not exists fields jsonb default '{}'::jsonb;

-- Garante que valores antigos fiquem como objeto vazio quando nulos.
update public.stories set fields = '{}'::jsonb where fields is null;

-- Forca o PostgREST a reconhecer as colunas novas.
notify pgrst, 'reload schema';
