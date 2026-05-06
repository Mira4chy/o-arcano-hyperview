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
- `Grupos`
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
