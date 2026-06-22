# O Arcano Hyperview

Arquivo estatico para o RPG dark fantasy **O Arcano**, com interface glass dark,
menu lateral recolhivel e pagina inicial de apresentacao.

## Abrir

Abra `index.html` no navegador ou use o servidor local em `http://127.0.0.1:5173/`.
Nao ha etapa de build.

## Customizar conteudo

Edite `assets/js/content.js`.

A pagina inicial fica em `index`. Cada registro fica em `entries` e usa uma aba em `tab`:

- `Index`
- `Itens`
- `Magias`
- `Bestiario`
- `Paises`
- `Cenarios`
- `Eras`
- `Sistemas`
- `Persona`
- `Historias`
- `Racas`
- `Mapa`
- `Deuses`

Para adicionar uma pagina:

1. Copie um objeto existente em `entries`.
2. Troque `id`, `tab`, `title`, `summary`, `fields` e `body`.
3. Coloque imagens novas em `assets/images` e referencie o caminho em `image`.

## Estrutura

- `index.html`: marcacao principal.
- `assets/css/styles.css`: menu lateral recolhivel, interface glass dark e responsividade.
- `assets/js/content.js`: dados customizaveis da wiki.
- `assets/js/app.js`: menu, busca e renderizacao dos templates.
- `assets/images`: imagens geradas e simbolo do projeto.

## Supabase (migrations SQL)

Rode os arquivos abaixo UMA VEZ no Supabase > SQL Editor, na ordem:

1. `supabase-access-requests.sql` — tabelas base (stories, index_config, access_requests) + RLS.
2. `supabase-tags.sql` — coluna `tags` em `stories`.
3. `supabase-itens.sql` — colunas `subtype` e `fields` em `stories`.
4. `supabase-master-palette.sql` — paleta de cores personalizada do Mestre (necessaria para salvar cores no editor de texto).
5. `supabase-characters.sql` — tabela `characters` (fichas de personagem dos jogadores) + RLS. Depende da funcao criada em `supabase-access-requests.sql`.
6. `supabase-characters-sheet.sql` — colunas da ficha interativa (`vitals`, `statuses`, `inventory`, `spells`) na tabela `characters`.

## Persona — criador de personagens

A aba **Persona** deixou de ser uma categoria de NPCs e virou o **criador de fichas de
personagem dos jogadores**. Cada ficha fica vinculada ao usuario (coluna `user_id`):

- Qualquer conta aprovada cria/edita as **proprias** fichas (varias por conta); o **Mestre**
  (admin) ve as fichas de todos os jogadores.
- A ficha tem: **raca** (puxa HP por parte do corpo e Mana do dossie da raca, editaveis),
  **atributos** (todos comecam em 10 + 6 pontos para distribuir; a cada 2 pontos, +1 de
  modificador; o `Modificador` da raca soma no modificador final), **O Despertar**
  (ver abaixo), **pericias/talentos** e **identidade narrativa** (papel, desejo, ferida e
  historia em rich-text).

### O Despertar (mago / nao-mago)

Durante a criacao, o jogador rola **1d100** (ate 3 tentativas, mantem a ultima) com uma
animacao de ritual:

- **1–70:** nasce **Nao-Mago**. **71–100:** nasce **Mago**.
- Mago pode **Aceitar a Mana** (rola 1d100 da Escola: 1–50 Elemental, 51–85 Arcanista,
  86–95 Druidico, 96–100 Celestial) ou **Renunciar** (vira nao-mago).
- **Mago que aceitou:** Resistencia travada em **14** na criacao (o Mestre pode exceder
  narrativamente).
- **Nao-Mago / renunciou:** **+1 Nivel de HP** (adicionado manualmente nas partes do corpo)
  e **+1 ponto em um atributo aleatorio** (rolado no Despertar, respeitando o teto).

Para ajustar a lista de atributos, os numeros (base 10 / pool 6 / teto 16 / trava 14 do mago)
ou as faixas/escolas, edite as constantes `CHAR_ATTRIBUTES`, `CHAR_ATTR_BASE`,
`CHAR_POINT_POOL`, `CHAR_ATTR_MAX`, `CHAR_MAGE_RES_CAP`, `AWAKEN_MAGE_MIN` e `MAGIC_SCHOOLS`
no topo de `assets/js/app.js`.

Observacao: entradas antigas de `stories` com `tab = 'Persona'` (se existirem no banco) deixam
de aparecer nessa aba, que agora lista somente fichas da tabela `characters`.

### Ficha viva (interativa)

Depois de criada, a ficha (`#/Persona/<id>`) funciona como um documento vivo — o **dono** e o
**Mestre** podem alterar; mudancas salvam sozinhas no Supabase:

- **Pontos de Vida:** cada parte do corpo tem uma barra (atual/maximo) com campo de valor e
  botoes **Dano**/**Curar**; a Mana tem **Gastar**/**Restaurar**. A cor da barra muda conforme
  a vida cai (verde → ambar → vermelho).
- **Status:** lista de condicoes (ex.: Sangramento) que da pra adicionar/remover. (Os efeitos
  mecanicos de cada status serao desenvolvidos depois.)
- **Inventario** e **Livro de Magias:** adicione itens da aba **Itens** e magias da aba
  **Magias** (puxa nome/resumo do codex e vira link) ou entradas **avulsas** escritas a mao;
  itens tem quantidade (+/−).

Requer a migracao `supabase-characters-sheet.sql`. Se ela nao tiver rodado, a criacao de ficha
continua funcionando (sem o estado vivo) e a ficha avisa ao tentar salvar HP/status/itens.

## Editor do Mestre (criar / editar entradas)

Em qualquer categoria criavel (Cenarios, Eras, Sistemas, Mapa, Deuses, Historias, Itens, Racas) o Mestre tem:

- **Editor rich-text** com negrito, italico, sublinhado, tachado, H2/H3, paragrafo, citacao (blockquote), listas com marcadores e numeradas, alinhamento, codigo inline, separador horizontal e cor do texto.
- **Paleta de cores salvas**: clique no `+` ao lado da paleta para guardar a cor atual; ela passa a aparecer na toolbar de todas as suas sessoes (sincroniza pelo Supabase, por usuario).
- **Link interno**: selecione um trecho de texto e clique no icone de corrente. Um modal mostra todas as historias do site para escolher o destino — o leitor podera clicar e ir direto.
- **Tags reaproveitaveis**: as tags ja usadas em outras entradas da MESMA categoria aparecem como sugestao logo abaixo do campo. Clicar em uma sugestao reaproveita label e cor.
- **Editar uma entrada existente**: na pagina de detalhe, o botao "Editar" leva ao mesmo formulario com tudo pre-preenchido. Salvar sobrescreve a entrada (a opcao de deletar continua disponivel).
