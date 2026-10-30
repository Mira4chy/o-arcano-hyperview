-- O Arcano: fichas-base do Azul do Velho Mundo (30/10/2026)
-- Rode depois de azul-01-limpeza.sql. Pode ser rodado de novo: atualiza o que já existir.
-- Só traz o que os jogadores podem saber. Os segredos ficam em lore/azul-plano.md.

begin;

-- Era: texto novo, mantendo cor, início, fim e ordem
update public.stories
   set summary = 'Mil anos sob dragões com rosto de gente. Os mortais sobrevivem em cinco cidades que se odeiam.',
       body_html = $html$
<p>Os dragões são centenas, e cada um governa do seu jeito. Uns exigem templo e sacrifício. Outros cobram imposto e fazem guerra. Alguns nunca aparecem, e mesmo assim os reis da região obedecem. Todos têm rosto quase humano, e o rosto muda com os anos até ficar parecido com o de quem os teme.</p>
<p>Entre os territórios dos dragões andam os <strong>Avessos</strong>. Ninguém sabe dizer de onde vem cada um. Alguns parecem animais que deram errado. Outros imitam os dragões que os criaram. Outros não morrem direito.</p>
<p>Os mortais vivem em cinco Refúgios: Ossa, Mirra, Alvar, a Marcha e Cindra. Cada um sobreviveu por um motivo e acha o motivo dos outros indecente. Fora das muralhas há aldeias que pagam tributo, aldeias que seguem regras que ninguém sabe explicar, gente que nunca para de andar e gente que vive debaixo da terra.</p>
<h4>A magia</h4>
<p>Seis em cada dez pessoas nascem com Mana no corpo. Pouca gente consegue controlá-la. A Mana da natureza é fraca: um veio de cristal serve para um amuleto, não para uma arma. Em Cindra o mago é cidadão. Em Ossa e em Mirra, é recurso.</p>
<h4>O Grande Azul</h4>
<p>No centro do anel de terras há um mar que nenhum navio atravessou. Para uns é só água demais. Para os sacerdotes é lugar sagrado. Os pescadores do sul dizem que a maré é a respiração de alguma coisa. Os barcos que tentam chegar ao meio são afundados por dragões, inclusive por dragões que se odeiam.</p>
<h4>A Praga</h4>
<p>Perto do ano 700 começa a Praga. Nos dragões ela tem nome próprio, a Muda: trocam de pele sem parar, e cada pele nova deixa o rosto mais liso e mais humano, até que eles param de se mexer. A Era termina quando o último morre e o mar recua.</p>
$html$
 where tab = 'Eras' and title = 'Azul do Velho Mundo';

-- Deuses, Refúgios: insere ou atualiza pelo id
insert into public.stories (id, tab, title, summary, image, image_path, body_html, tags, subtype, fields) values

('amada', 'Deuses', 'A Amada',
 'A deusa da criação. Todo mundo reza para ela. Ninguém nunca ouviu resposta.', '', '',
 $html$
<p>Fez as estrelas com o próprio sangue, as noites com o cabelo e a Mana com tudo o que não conseguiu deixar firme. É o que dizem os templos e o que está riscado nas pedras mais velhas. Por isso a Mana é viva, e por isso é instável.</p>
<p>O culto da Amada existe em todos os Refúgios, com regras diferentes em cada um. Uma regra é igual em todos: a prece é feita em voz baixa. Ninguém sabe de onde veio esse costume.</p>
<p>Ela não responde. Os sacerdotes dizem que ela ouve. Os outros acham que ela foi embora.</p>
$html$,
 '[{"label":"Criação","color":"#117ee4"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb),

('katharsis', 'Deuses', 'Katharsis',
 'O deus do fim. Dorme em algum lugar e acorda no último dia.', '', '',
 $html$
<p>Os sacerdotes ensinam que a Amada criou o fim no mesmo instante em que criou a vida, e que Katharsis é esse fim. Ele dorme. Quando acordar, tudo termina.</p>
<p>Ninguém reza para que ele acorde. Rezam para que demore. Os cultos de Katharsis enterram os mortos de rosto para baixo, para que não vejam o dia em que ele abrir os olhos.</p>
<p>Onde ele dorme, os livros não dizem. Cada culto aponta um lugar: uma montanha, o céu, o fundo da terra.</p>
$html$,
 '[{"label":"Fim","color":"#7a1f1f"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb),

('ossa', 'Cenarios', 'Ossa',
 'Muralhas de osso de Avesso. Ninguém dorme na vigília duas vezes.', '', '',
 $html$
<p>A muralha é feita com os ossos dos Avessos que morreram tentando entrar. Os vivos evitam chegar perto dela. Ninguém sabe por quê, e Ossa não pergunta: só empilha mais.</p>
<h4>Governo</h4>
<p>O Conselho das Ameias. Todo adulto serve na muralha. Quem dorme em serviço é posto dentro dela.</p>
<h4>Magos</h4>
<p>Registrados ao nascer. Os mais fortes viram lanternas: acorrentados nas torres e acesos a noite inteira.</p>
<h4>O que vende</h4>
<p>Soldados. E, quando ninguém está ouvindo, Draconatos.</p>
$html$,
 '[{"label":"Refúgio","color":"#8a6d3b"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb),

('mirra', 'Cenarios', 'Mirra',
 'Paga Ilhária com gente, uma vez por estação, e vive em paz.', '', '',
 $html$
<p>Mirra fica no Ventre Verde, onde nenhuma muralha aguenta muito tempo. Não precisa: Ilhária protege a cidade. Em troca, a cada estação, o Dízimo escolhe quem sobe ao templo.</p>
<h4>Governo</h4>
<p>A Teocracia do Rosto. A Suma Sacerdotisa fala por Ilhária e diz que Ilhária sorri.</p>
<h4>Magos</h4>
<p>Sobem primeiro. Ilhária prefere.</p>
<h4>O que se diz</h4>
<p>Que o rosto do dragão ficou parecido com o da Suma Sacerdotisa. Quem diz isso em voz alta costuma ser escolhido no Dízimo seguinte.</p>
$html$,
 '[{"label":"Refúgio","color":"#8a6d3b"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb),

('alvar', 'Cenarios', 'Alvar',
 'A cidade erguida sobre uma pedra branca que já estava lá.', '', '',
 $html$
<p>A pedra de Alvar não cria musgo, não esquenta ao sol e não deixa os Avessos subirem. Ninguém a cortou. A cidade foi construída em cima dela, e os porões mais fundos ainda não chegaram ao fim.</p>
<h4>Governo</h4>
<p>As Linhagens da Pedra, famílias donas das partes mais velhas e do que está escrito nelas. Alugam o resto.</p>
<h4>Magos</h4>
<p>Registrados e vigiados. Alvar não persegue ninguém. Só anota.</p>
<h4>O que vende</h4>
<p>O único porto grande do sul. Os barcos de Alvar seguem a costa e nunca apontam para o centro.</p>
$html$,
 '[{"label":"Refúgio","color":"#8a6d3b"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb),

('a-marcha', 'Cenarios', 'A Marcha',
 'A cidade que nunca para.', '', '',
 $html$
<p>Depois de perder as muralhas, um povo inteiro decidiu não parar mais. A Marcha é uma fileira de carroças, torres sobre rodas e colossos domados que puxam tudo pela Trilha dos Colossos, sempre pelo mesmo caminho.</p>
<h4>Governo</h4>
<p>A Casa das Contas. Tudo tem preço, inclusive o lugar na fila.</p>
<h4>Magos</h4>
<p>Contratados. Empurram, aquecem e erguem pontes. Mago sem contrato anda a pé.</p>
<h4>A lei</h4>
<p>A Marcha não volta por ninguém.</p>
$html$,
 '[{"label":"Refúgio","color":"#8a6d3b"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb),

('cindra', 'Cenarios', 'Cindra',
 'A cidade dos magos, nas Serras de Vidro.', '', '',
 $html$
<p>Cindra recebe todo mago que foge de Ossa ou de Mirra. Os Avessos não chegam perto das muralhas, e o Colégio diz que é por causa dos feitiços que os magos renovam toda noite.</p>
<h4>Governo</h4>
<p>O Colégio dos Magos. As decisões saem do Poço do Colégio, onde a magia fica mais forte e a voz do Conselho ecoa de baixo.</p>
<h4>Magos</h4>
<p>Cidadãos. Quem nasceu sem Mana é tolerado e paga mais imposto.</p>
<h4>O que vende</h4>
<p>Magia: curas, feitiços de muralha e magos de aluguel.</p>
$html$,
 '[{"label":"Refúgio","color":"#8a6d3b"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]'::jsonb, null, '{}'::jsonb)

on conflict (id) do update
   set tab = excluded.tab,
       title = excluded.title,
       summary = excluded.summary,
       body_html = excluded.body_html,
       tags = excluded.tags;

commit;
