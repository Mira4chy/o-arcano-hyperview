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

## Editor do Mestre (criar / editar entradas)

Em qualquer categoria criavel (Cenarios, Eras, Sistemas, Mapa, Deuses, Historias, Itens, Racas) o Mestre tem:

- **Editor rich-text** com negrito, italico, sublinhado, tachado, H2/H3, paragrafo, citacao (blockquote), listas com marcadores e numeradas, alinhamento, codigo inline, separador horizontal e cor do texto.
- **Paleta de cores salvas**: clique no `+` ao lado da paleta para guardar a cor atual; ela passa a aparecer na toolbar de todas as suas sessoes (sincroniza pelo Supabase, por usuario).
- **Link interno**: selecione um trecho de texto e clique no icone de corrente. Um modal mostra todas as historias do site para escolher o destino — o leitor podera clicar e ir direto.
- **Tags reaproveitaveis**: as tags ja usadas em outras entradas da MESMA categoria aparecem como sugestao logo abaixo do campo. Clicar em uma sugestao reaproveita label e cor.
- **Editar uma entrada existente**: na pagina de detalhe, o botao "Editar" leva ao mesmo formulario com tudo pre-preenchido. Salvar sobrescreve a entrada (a opcao de deletar continua disponivel).
