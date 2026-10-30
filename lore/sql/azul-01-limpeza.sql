-- O Arcano: limpeza do Codex para o plano do Azul do Velho Mundo (30/10/2026)
-- Rode no Supabase > SQL Editor, em uma única execução.
-- Passo 0 cria uma cópia completa da tabela; para desfazer, restaure a partir dela.

begin;

-- 0. Backup
create table if not exists public.stories_backup_20261030 as
  select * from public.stories;

-- 1. Entradas sem conteúdo
delete from public.stories
 where tab = 'Magias' and title ~ '^a+$';

-- 2. História baseada em Oram (será reescrita como "Os Que Afundam", em Alvar)
delete from public.stories
 where tab = 'Historias' and title = 'O Grande Azul';

-- 3. Presságio da Morte: o corpo era só texto de teste; recebe texto real (Avesso sonhado)
update public.stories
   set body_html = $html$
<h4>Classificação</h4>
<p>Não é uma espécie. Os bandos têm sempre o mesmo número de aves, e quando uma morre outra aparece no galho em que ela estava, com as mesmas falhas nas penas. Naturalistas de Alvar abriram uma delas: o crânio estava vazio.</p>
<h4>Comportamento</h4>
<p>Pousam onde alguma coisa vai terminar: uma ponte que vai cair, uma casa onde alguém vai morrer, um exército na véspera. Chegam dias antes. Matar o bando não impede nada. Só muda o lugar de onde ele observa.</p>
<h4>Relato de campo</h4>
<blockquote>Contei quarenta e um no telhado da minha mãe. No enterro eram quarenta e dois, e o novo estava olhando para mim. — Tessa Ruan, de Ossa</blockquote>
$html$
 where id = 'pressagio-da-morte';

-- 4. Veyra sai do mundo
update public.stories
   set title = 'Sino Mudo'
 where tab = 'Itens' and title = 'Sino de Veyra';

update public.stories
   set body_html = replace(body_html, 'metalurgista de Veyra', 'metalurgista de Ossa')
 where tab = 'Bestiario' and title = 'Ferrugem-Mirim';

-- 5. Histórias da Era do Azul marcadas com a tag errada
update public.stories
   set tags = (
     select coalesce(jsonb_agg(
              case when t->>'label' = 'Terra Média'
                   then jsonb_build_object('label', 'Azul do Velho Mundo', 'color', '#117ee4')
                   else t end), '[]'::jsonb)
       from jsonb_array_elements(tags) as t
   )
 where tab = 'Historias' and title in ('Refratário', 'Onde a Luz Não Alcança');

commit;
