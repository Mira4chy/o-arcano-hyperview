-- O Arcano: dragões do Azul do Velho Mundo (30/10/2026)
-- Ficha geral + as três Coroas nomeadas. Pode rodar de novo (upsert).

begin;

insert into public.stories (id, tab, title, summary, image, image_path, body_html, tags, subtype, fields) values

('dragao', 'Bestiario', 'Dragão',
 'Centenas deles governam o Azul do Velho Mundo. Todos têm rosto de gente, e nenhum tem o rosto com que nasceu.', '', '',
 $html$
<h2>Classificação</h2>
<p>O corpo é o que se espera: pescoço longo, asas de couro, escamas que lâmina comum não atravessa. O rosto não. Lábios, pálpebras, nariz e sobrancelha de gente, esticados sobre um crânio grande demais. Atrás dos lábios, três fileiras de dentes.</p>
<p>O rosto muda. Um dragão temido por uma aldeia passa décadas ficando parecido com a aldeia. Os que têm muitos súditos ganham rostos menores ao longo do pescoço, que piscam e sorriem sozinhos e não pensam nada. O povo chama isso de falsa hidra.</p>
<h2>Como se movem</h2>
<p>Devagar, e depois rápido demais. Ficam imóveis por horas na mesma pose. Imitam gestos humanos com um atraso, como quem copia sem entender: acenam depois que a pessoa já baixou a mão, sorriem quando alguém chora.</p>
<h2>Hierarquia</h2>
<p>Coroas são os grandes, umas vinte, com reino, culto ou exército. Senhores dominam um vale, um lago, uma estrada, e vivem do tributo das aldeias. Errantes são jovens ou exilados sem chão, e ninguém sabe o que querem.</p>
<p>Quase nunca dois dragões dividem território. Quando cruzam, é raro, e os filhos são poucos. Os Draconatos vêm de outro jeito, e ninguém em Mirra fala disso.</p>
<h2>O que todos fazem</h2>
<p>Afundam os barcos que apontam para o centro do Grande Azul. Coroas que se odeiam fazem isso do mesmo jeito, sem combinar.</p>
<h2>Relato de campo</h2>
<blockquote>Ele ficou a tarde inteira olhando a gente pela janela do moinho. No fim do dia piscou, e foi a primeira vez que eu vi minha própria cara de medo. — moleira sem nome, do Ventre Verde</blockquote>
$html$,
 $j$[{"label":"Dragão","color":"#7a1f1f"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]$j$::jsonb, null,
 $j${
  "DF":"5","DM":"5","Mana":"220","Tipo":"Dragão (Senhor)","Perigo":"Pesadelo","DA Base":"Força",
  "Habitat":"Vales, lagos e estradas que cobram tributo",
  "Instinto":"Ser temido pelo maior número possível de rostos",
  "PartesHP":[{"name":"Cabeça","hp":"180"},{"name":"Pescoço","hp":"220"},{"name":"Tórax","hp":"360"},{"name":"Asa Direita","hp":"160"},{"name":"Asa Esquerda","hp":"160"},{"name":"Cauda","hp":"200"}],
  "Atributos":{"Força":22,"Carisma":18,"Destreza":14,"Sabedoria":18,"Resistência":22,"Inteligência":18},
  "Habilidades":[
   {"name":"Rosto Emprestado","kind":"Passiva","cost":"","range":"Próprio","trigger":"Ao ser visto por um mortal pela primeira vez","duration":"Sempre","effect":"O mortal faz teste de Sabedoria contra a DA. Se falhar, sofre Pânico. Quem já viveu sob o domínio deste dragão tem desvantagem.","limit":"Cegueira impede o efeito.","summary":"Ninguém espera ver o próprio vizinho naquela cara.","source":"custom","refId":""},
   {"name":"Baforada","kind":"Ativa","cost":"20 MP","range":"Cone 6q","trigger":"","duration":"3 turnos","effect":"Ataque de Força contra a DA de todos no cone. 6d8 de dano de calor e Queimadura II.","limit":"Uma vez a cada 3 rodadas.","summary":"","source":"custom","refId":""},
   {"name":"Atraso","kind":"Passiva","cost":"","range":"Próprio","trigger":"Quando um alvo adjacente agir","duration":"Sempre","effect":"Uma vez por rodada, repete a ação física do alvo contra ele, um instante depois, usando a própria Força.","limit":"Não copia magias.","summary":"Ele copia o seu golpe antes de você terminar de entender o que fez.","source":"custom","refId":""}
  ]
 }$j$::jsonb),

('ilharia', 'Bestiario', 'Ilhária',
 'A Coroa de Mirra. Os fiéis dizem que ela sorri. O sorriso é o da Suma Sacerdotisa.', '', '',
 $html$
<h2>Classificação</h2>
<p>Coroa do Ventre Verde e deusa de Mirra. É a maior dragoa ao sul do Grande Azul de que se tem notícia, e a única que vive dentro de um templo construído para ela.</p>
<h2>Aparência</h2>
<p>O rosto principal é o da Suma Sacerdotisa atual, com as rugas que ela ainda não tem. Ao longo do pescoço há onze rostos menores. São os escolhidos dos últimos Dízimos, e os familiares reconhecem cada um. Os rostos menores acompanham as preces com a boca, sem som.</p>
<h2>Domínio</h2>
<p>Ilhária não cobra ouro. Cobra gente, uma vez por estação. Em troca, os Avessos do brejo não sobem a encosta de Mirra, e nenhuma outra Coroa se aproxima. Faz isso há trezentos anos.</p>
<h2>Comportamento</h2>
<p>Passa semanas deitada sob a cúpula, de olhos abertos. Quando se mexe, os sacerdotes declaram festa. Gosta de ouvir cantos, e prefere magos: o Dízimo os escolhe primeiro.</p>
<h2>Relato de campo</h2>
<blockquote>Minha filha subiu no inverno. Na primavera ela estava no pescoço, terceira de baixo para cima, rezando comigo. — viúva Orsa, de Mirra</blockquote>
$html$,
 $j$[{"label":"Dragão","color":"#7a1f1f"},{"label":"Coroa","color":"#b8860b"},{"label":"Falso deus","color":"#8a6d3b"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]$j$::jsonb, null,
 $j${
  "DF":"6","DM":"6","Mana":"340","Tipo":"Dragão (Coroa)","Perigo":"Cataclismo","DA Base":"Carisma",
  "Habitat":"O templo de Mirra, no Ventre Verde",
  "Instinto":"Ser adorada por quem ela está comendo",
  "PartesHP":[{"name":"Rosto da Sacerdotisa","hp":"260"},{"name":"Rostos do Dízimo (11)","hp":"40"},{"name":"Pescoço","hp":"320"},{"name":"Tórax","hp":"520"},{"name":"Asa Direita","hp":"220"},{"name":"Asa Esquerda","hp":"220"},{"name":"Cauda","hp":"280"}],
  "Atributos":{"Força":24,"Carisma":26,"Destreza":12,"Sabedoria":22,"Resistência":24,"Inteligência":20},
  "Habilidades":[
   {"name":"Ela Sorri","kind":"Ativa","cost":"25 MP","range":"Área 8q","trigger":"","duration":"2 turnos","effect":"Ataque de Carisma contra a DA de todos que a vejam. Quem falhar sofre Pânico. Fiéis de Mirra que falharem também sofrem Atordoamento e passam o turno ajoelhados.","limit":"Cegueira ou olhos fechados anulam, mas impõem desvantagem em ataques contra ela.","summary":"Um sorriso que você conhece de casa.","source":"custom","refId":""},
   {"name":"Coro do Dízimo","kind":"Passiva","cost":"","range":"Próprio","trigger":"Ao sofrer dano mágico","duration":"Sempre","effect":"Um dos Rostos do Dízimo grita no lugar dela. O dano mágico é reduzido em 3d6 após a DM e o conjurador sofre Silêncio por 1 turno.","limit":"Cada Rosto destruído deixa de gritar. Sem Rostos, a passiva acaba.","summary":"","source":"custom","refId":""},
   {"name":"Hálito do Brejo","kind":"Ativa","cost":"20 MP","range":"Cone 8q","trigger":"","duration":"3 turnos","effect":"Ataque de Resistência contra a DA. 6d8 de dano tóxico, Veneno e Corte de Cura.","limit":"Uma vez a cada 3 rodadas.","summary":"Cheira a casa fechada depois de um enterro.","source":"custom","refId":""},
   {"name":"Prefere Magos","kind":"Passiva","cost":"","range":"Área 12q","trigger":"Início de cada rodada","duration":"Sempre","effect":"Sabe a posição de toda criatura com Mana viva em alcance, como Marcar Alvo. Contra magos, os ataques dela têm vantagem.","limit":"","summary":"","source":"custom","refId":""}
  ]
 }$j$::jsonb),

('ossevar', 'Bestiario', 'Ossevar',
 'Uma Coroa de que ninguém fala, porque ninguém sabe que existe. O rosto dela não tem dono.', '', '',
 $html$
<h2>Classificação</h2>
<p>Coroa sem reino conhecido. Os poucos registros falam de um dragão que desceu às Serras de Vidro e não voltou a subir. Nenhuma aldeia paga tributo a ele.</p>
<h2>Aparência</h2>
<p>Como ninguém o teme, o rosto não tem de quem copiar. É liso, como uma máscara de cera antes de alguém pintar os traços: um esboço de nariz, pálpebras sem cílios, uma boca que é só um corte. Às vezes o esboço se mexe como se tentasse lembrar uma expressão.</p>
<h2>Hábitos</h2>
<p>Dorme enrolado numa galeria funda e respira devagar. O ar que sai dele sobe por fendas na rocha, e onde ele chega, a Mana dos vivos fica mais fácil de segurar. Escuta tudo o que é dito perto das fendas e repete o que ouve, com as vozes de quem disse.</p>
<h2>Comportamento</h2>
<p>Não caça. Não aparece. Quando um Avesso se aproxima da serra, some, e não sobra osso. Ele quer ser necessário sem ser visto, e consegue.</p>
<h2>Relato de campo</h2>
<blockquote>Juro que ouvi minha voz no fundo da fenda. Dizia a coisa certa, a que eu ainda não tinha pensado. — mineiro de sal, das Serras de Vidro</blockquote>
$html$,
 $j$[{"label":"Dragão","color":"#7a1f1f"},{"label":"Coroa","color":"#b8860b"},{"label":"Poder oculto","color":"#4b5563"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]$j$::jsonb, null,
 $j${
  "DF":"6","DM":"6","Mana":"360","Tipo":"Dragão (Coroa)","Perigo":"Cataclismo","DA Base":"Inteligência",
  "Habitat":"Galerias profundas das Serras de Vidro",
  "Instinto":"Ser necessário sem ser visto",
  "PartesHP":[{"name":"Rosto Liso","hp":"240"},{"name":"Pescoço","hp":"300"},{"name":"Tórax","hp":"540"},{"name":"Pulmões de Fenda","hp":"180"},{"name":"Asa Direita","hp":"200"},{"name":"Asa Esquerda","hp":"200"},{"name":"Cauda","hp":"260"}],
  "Atributos":{"Força":22,"Carisma":20,"Destreza":14,"Sabedoria":24,"Resistência":24,"Inteligência":26},
  "Habilidades":[
   {"name":"Hálito do Poço","kind":"Passiva","cost":"","range":"Área 40q","trigger":"Sempre","duration":"Sempre","effect":"Magos em alcance recebem +1d6 em testes de conjuração. Um mago que passou um ano inteiro sob o Hálito sofre -1d6 em conjuração quando sai do alcance.","limit":"Se os Pulmões de Fenda forem destruídos, a passiva acaba.","summary":"A magia fica fácil, e depois fica impossível longe dele.","source":"custom","refId":""},
   {"name":"Voz de Quem Falou","kind":"Ativa","cost":"15 MP","range":"Área 20q","trigger":"","duration":"3 turnos","effect":"Ataque de Inteligência contra a DA. Fala com a voz de um aliado do alvo. Quem falhar sofre Desorientação e trata o próximo comando desse aliado como suspeito.","limit":"Só usa vozes que já ouviu.","summary":"","source":"custom","refId":""},
   {"name":"Fôlego Contido","kind":"Ativa","cost":"30 MP","range":"Área 6q","trigger":"","duration":"2 turnos","effect":"Puxa o ar de uma área. Ataque de Resistência contra a DA. 5d8 de dano e Silêncio. Magias persistentes na área exigem o dobro de Consumo de Mana.","limit":"Uma vez a cada 3 rodadas.","summary":"","source":"custom","refId":""},
   {"name":"Rosto sem Dono","kind":"Passiva","cost":"","range":"Próprio","trigger":"Ao ser visto","duration":"Sempre","effect":"Não causa Pânico. Quem o encara por um turno inteiro sofre Desorientação por 1 turno, porque o rosto começa a copiar o dele.","limit":"","summary":"","source":"custom","refId":""}
  ]
 }$j$::jsonb),

('gharm', 'Bestiario', 'Gharm',
 'O rei-dragão do oeste. Fala com a voz do rei que comeu e usa a coroa dele dentro da testa.', '', '',
 $html$
<h2>Classificação</h2>
<p>Coroa das terras do oeste, a região que o povo chama apenas de Coroas, porque lá há mais dragões-reis do que em qualquer outro lugar. Gharm governa em aberto: cobra imposto, convoca soldados, declara guerra.</p>
<h2>Aparência</h2>
<p>O rosto é o do rei Edmar de Vesk, que Gharm comeu no dia em que tomou a capital. A coroa do rei afundou na testa e a pele cresceu por cima; dá para ver o relevo dos dentes de ouro sob a escama. Pelo pescoço há sete rostos de generais vencidos, de olhos sempre abertos.</p>
<h2>Domínio</h2>
<p>Mantém a corte de Vesk funcionando. Os ministros despacham, os juízes julgam, os coletores coletam. Os decretos saem lidos na voz de Edmar. Quem reclama do imposto é chamado à sala do trono, e a sala do trono é grande o bastante para ele caber.</p>
<h2>Comportamento</h2>
<p>É o único dragão que se sabe usar mapas. Faz guerra contra outras Coroas por rios e estradas, nunca por ouro. Ossa paga a ele para que a fronteira continue quieta, e os dois fingem que não.</p>
<h2>Relato de campo</h2>
<blockquote>Ele me condecorou. Disse meu nome, o nome do meu pai e o da aldeia, com a voz do rei morto, e eu ajoelhei porque o corpo lembrou antes de mim. — capitã Ruel Haddar, de Vesk</blockquote>
$html$,
 $j$[{"label":"Dragão","color":"#7a1f1f"},{"label":"Coroa","color":"#b8860b"},{"label":"Rei tirano","color":"#9a3412"},{"label":"Azul do Velho Mundo","color":"#117ee4"}]$j$::jsonb, null,
 $j${
  "DF":"6","DM":"5","Mana":"300","Tipo":"Dragão (Coroa)","Perigo":"Cataclismo","DA Base":"Força",
  "Habitat":"A capital de Vesk, nas Coroas do oeste",
  "Instinto":"Ter tudo em ordem, inclusive o medo",
  "PartesHP":[{"name":"Rosto do Rei","hp":"280"},{"name":"Coroa Fundida","hp":"120"},{"name":"Rostos dos Generais (7)","hp":"50"},{"name":"Pescoço","hp":"340"},{"name":"Tórax","hp":"560"},{"name":"Asa Direita","hp":"240"},{"name":"Asa Esquerda","hp":"240"},{"name":"Cauda","hp":"300"}],
  "Atributos":{"Força":26,"Carisma":22,"Destreza":12,"Sabedoria":18,"Resistência":26,"Inteligência":22},
  "Habilidades":[
   {"name":"Decreto","kind":"Ativa","cost":"20 MP","range":"Área 10q","trigger":"","duration":"1 turno","effect":"Fala uma ordem curta com a voz de Edmar. Ataque de Carisma contra a DA de quem ouvir. Quem falhar cumpre a ordem na próxima ação, se ela não for se ferir. Antigos súditos de Vesk têm desvantagem.","limit":"Silêncio na área anula.","summary":"O corpo obedece à voz antes da cabeça perceber de quem ela é.","source":"custom","refId":""},
   {"name":"Coroa Fundida","kind":"Passiva","cost":"","range":"Próprio","trigger":"Sempre","duration":"Sempre","effect":"Imune a Atordoamento e Desorientação enquanto a Coroa Fundida estiver intacta.","limit":"Destruir a coroa exige atingir a testa, com desvantagem.","summary":"","source":"custom","refId":""},
   {"name":"Conselho de Guerra","kind":"Passiva","cost":"","range":"Área 20q","trigger":"Início de cada rodada","duration":"Sempre","effect":"Para cada Rosto de General intacto, um aliado de Gharm em alcance ganha +1 em ataques nesta rodada (máximo +7, dividido como ele quiser).","limit":"","summary":"Os generais não falam. Só olham para onde ele deve atacar.","source":"custom","refId":""},
   {"name":"Fogo de Cerco","kind":"Ativa","cost":"30 MP","range":"Linha 12q","trigger":"","duration":"3 turnos","effect":"Ataque de Força contra a DA de tudo na linha. 7d8 de dano de calor e Queimadura III. Muralhas de madeira na linha caem.","limit":"Uma vez a cada 3 rodadas.","summary":"","source":"custom","refId":""}
  ]
 }$j$::jsonb)

on conflict (id) do update
   set tab = excluded.tab, title = excluded.title, summary = excluded.summary,
       body_html = excluded.body_html, tags = excluded.tags, fields = excluded.fields;

commit;
