# Mapa de arquitetura: de Codex para Plataforma

Estado analisado: commit `c294cdb`. Arquivos: `app.js` (7.186 linhas), `styles.css` (7.427), `content.js`, `config.js`, 6 arquivos `.sql`.

## 0. Visao

**O Arcano · Mesas de RPG.** "O Arcano" e a marca da plataforma. O sistema de regras atual passa a ser o **Modulo Arcano**, um entre varios modulos.

- **Modulo** = um sistema de RPG (regras, ficha, conteudo oficial).
- **Mesa** = uma campanha. Toda mesa nasce com **um modulo escolhido na criacao**, e ele **nao muda depois**. Isso evita migrar fichas entre sistemas e simplifica muito o codigo.
- O usuario tem uma conta so e pode participar de varias mesas, de modulos diferentes, como Mestre em umas e Jogador em outras.

### Dois tipos de mesa

| | Mesa oficial | Mesa da comunidade |
|---|---|---|
| Quem cria | **Mestre Oficial** (aprovado pela plataforma) | Qualquer usuario |
| Modulo | Arcano (ou outro modulo oficial) | Arcano ou Livre |
| Entrada | Vitrine publica: jogadores se candidatam ou entram em vagas | Convite por link |
| Conteudo | Usa o **codex oficial** do modulo e pode publicar historias nele | Usa o codex oficial (leitura) + conteudo proprio, privado da mesa |
| Selo | "Oficial" | Nenhum |

### Papeis na plataforma

- **Usuario**: cria mesas da comunidade e joga em qualquer mesa.
- **Mestre Oficial**: tudo do usuario, mais criar conteudo oficial (codex do modulo, historias publicadas) e mestrar mesas oficiais.
- **Admin**: aprova Mestres Oficiais, modera conteudo e denuncias.

Alem disso, **dentro de cada mesa** existe o papel de Mestre ou Jogador, como hoje.

**Isso ja existe em parte.** O fluxo atual de aprovacao (`access_requests` com papel `admin`) e o "Mestre" de hoje sao, na pratica, o Mestre Oficial. O codex atual (`stories`) e o codex oficial do Modulo Arcano. A mudanca e deixar de bloquear o site inteiro para quem nao foi aprovado: a aprovacao passa a valer so para ganhar o papel de Mestre Oficial.

## 1. Como o sistema funciona hoje

- Site estatico, sem build. Um unico IIFE em `app.js` com router por hash (`#/`), views por funcao e Supabase direto do navegador.
- **Nao existe o conceito de "mesa".** O site inteiro e uma unica campanha implicita ("Campanha ativa: O Arcano" fixo no `index.html`). Tudo que e conteudo pertence a esse mundo unico.
- Acesso: qualquer pessoa pede acesso (`access_requests`), o Mestre aprova manualmente no dashboard do Supabase. Papel e **global**: `admin` (Mestre) ou `player`.

### Tabelas atuais

| Tabela | Conteudo | Observacao |
|---|---|---|
| `access_requests` | pedido/aprovacao e papel global | vira a base do perfil, mas o papel precisa sair daqui |
| `stories` | todo o codex (`tab` = Cenarios, Eras, Itens, Racas, Bestiario, Magias...) com `body_html`, `tags`, `subtype`, `fields jsonb` | ja e um modelo generico de "pagina de conteudo" |
| `characters` | ficha | colunas especificas do Arcano: `is_mage`, `race_id`, `attributes`, `hp`, `mana`, `vitals`, `spells`, `inventory`, `identity` |
| `index_config` | pagina inicial (1 linha) | vira config por mesa |
| `master_palette` | paleta de cores do Mestre | preferencia de usuario, ja e por `user_id` |
| storage `banners` | imagens | sem separacao por mesa |

## 2. Classificacao do codigo

### A) Plataforma (reaproveitavel como esta ou com ajuste pequeno)

| Parte | Linhas em `app.js` | Observacao |
|---|---|---|
| Auth e perfil | 586 a 1050 | hoje trava o site ate aprovacao manual; numa rede social o cadastro precisa ser aberto |
| Persistencia de entradas (CRUD + upload de banner) | 1211 a 1330 | generico, so falta escopo por mesa |
| Paleta do Mestre | 1555 a 1595 | ja por usuario |
| `sanitizeHtml` | 1644 | **critico**: ver risco de seguranca abaixo |
| Router, `render`, `animateView`, busca global | 1742, 4297, 4433, 6957 | funciona, mas e acoplado ao catalogo fixo de abas |
| Editor rico, tags, banner, seletor de links entre entradas | 2116, 4501, 4574, 5549, 5681 | bom candidato a modulo "conteudo" |
| Tema visual, cosmos, intro | `styles.css`, `cosmos.js` | identidade da marca, fica |

### B) Especifico do sistema Arcano (vira o "modulo Arcano")

| Parte | Linhas | O que e |
|---|---|---|
| Bestiario: atributos, HP por parte, drops, habilidades | 324 a 486, 4346 a 4433, 5013 a 5199 | regras e formularios do bestiario |
| Dados e despertar: d100, escolas, modificadores de atributo | 486 a 586, 6294 a 6403 | mecanica do Arcano |
| Racas: dossie, HP, modificadores | 217 a 324, 4933 a 5549 | ficha de raca |
| Magias: escopos, custo, formulario | 141 a 217, 2378 a 2972 | sistema de magia |
| Ficha de personagem: vitals, defesa, inventario, livro de magias, despertar | 3534 a 4272, 6403 a 6857 | o maior bloco, ~1.700 linhas |
| Lista de abas e textos | `content.js` | catalogo do mundo O Arcano |

Estimativa: **cerca de 45% do `app.js` e especifico do Arcano**, 35% e plataforma, 20% e interface compartilhada que mistura os dois.

### C) Conteudo do mundo (pertence a uma mesa, nao a plataforma)

Historias, cenarios, eras, deuses, mapa, lore. Hoje em `stories` sem dono de mesa. A pasta `lore/` e a lore do Arcano e ficaria como conteudo oficial do sistema.

## 3. Lacunas para o novo objetivo

1. **Mesa nao existe.** Precisa nascer como entidade: `tables` (id, nome, dono, `system_id`, visibilidade) e `table_members` (mesa, usuario, papel).
2. **Papel global vs papel por mesa.** Hoje "admin" ve todas as fichas e edita todas as historias. Com varias mesas isso vira falha grave: o Mestre de uma mesa nao pode ver a mesa dos outros. As policies RLS inteiras (`current_arcano_role()`) precisam ser refeitas com base em `table_members`.
3. **Sistema nao existe.** `characters` e `stories` precisam de `system_id`, e a parte variavel deve ir para um `data jsonb` descrito por esquema, em vez de colunas fixas.
4. **Social nao existe.** Faltam perfil publico, seguidores, posts, comentarios, reacoes, denuncias e bloqueio.
5. **Conteudo gerado por usuarios** exige moderacao para entrar nas lojas (Apple e Google).

## 4. Riscos tecnicos que ja existem

- **XSS armazenado.** `body_html` e sanitizado por funcao propria no navegador. Em contexto social, onde um usuario le o HTML de outro, isso precisa ser trocado por DOMPurify e idealmente sanitizado tambem no servidor.
- **SQL manual.** Os `.sql` rodam a mao no SQL Editor, sem versionamento. Precisa migrar para migracoes da Supabase CLI antes de mexer no schema de verdade.
- **Monolito de 7 mil linhas** sem modulos nem testes. Qualquer mudanca de schema exige tocar em muitos pontos.
- **Cadastro com aprovacao manual** nao escala e impede a rede social.
- `server.err.log` e `server.out.log` estao versionados e devem sair do git.

## 5. Plano enxuto (v1)

O plano original tinha 8 etapas e misturava plataforma, rede social, multi-sistema e lojas. Para uma pessoa so, isso nao termina. A v1 abaixo tem **5 etapas** e um objetivo unico:

> **Qualquer pessoa cria uma conta, cria uma mesa escolhendo um modulo (Arcano ou Livre), convida amigos por link e joga com fichas e codex. Mestres Oficiais publicam conteudo no codex oficial e abrem mesas oficiais na vitrine.**

O "social" da v1 e so o necessario para as pessoas se encontrarem: perfil, vitrine de mesas oficiais e historias oficiais publicadas. Feed, posts e seguidores ficam para a v2.

### Modelo de dados da v1

| Tabela | Campos principais |
|---|---|
| `profiles` | `user_id`, nome, avatar, `platform_role` (`user`, `official_master`, `admin`) |
| `master_applications` | pedido para virar Mestre Oficial (substitui `access_requests`) |
| `modules` | `id` (`arcano`, `livre`), nome, `is_official` |
| `tables` | `module_id` fixo, `owner_id`, `is_official`, `visibility` (`private`, `listed`), vagas |
| `table_members` | `table_id`, `user_id`, `role` (`master`, `player`), `status` (`invited`, `applied`, `active`) |
| `stories` | ganha `module_id` e `table_id` **opcional**: sem `table_id` = conteudo oficial do modulo; com `table_id` = conteudo privado da mesa. Ganha `published` para historias oficiais visiveis ao publico |
| `characters` | ganha `table_id` e `data jsonb` |

Regras de acesso (RLS) resumidas:
- Conteudo oficial publicado: leitura publica. Escrita so por Mestre Oficial ou Admin.
- Conteudo de mesa: leitura e escrita so por membros ativos; escrita de codex so pelo Mestre da mesa.
- Mesa oficial: so Mestre Oficial cria.
- Ficha: o dono edita; o Mestre da **mesma mesa** le e edita.

Cada etapa deixa o site funcionando.

**Etapa 0, higiene**
Schema em migracoes da Supabase CLI, logs fora do git, DOMPurify no lugar do `sanitizeHtml` proprio.

**Etapa 1, separar plataforma e Modulo Arcano**
Dividir `app.js` em `core/` (auth, router, supabase, editor, busca) e `modules/arcano/` (ficha, bestiario, racas, magias, dados). Definir o **contrato de modulo**: um objeto com `id`, `nome`, `abas` do codex, `renderFicha`, `renderFormFicha` e `fichaPadrao`. O Arcano passa a ser carregado por esse contrato. Pronto quando o site funciona igual.

**Etapa 2, Mesas e papeis**
Tabelas `profiles`, `modules`, `tables` e `table_members`. O codex atual vira o **codex oficial do Modulo Arcano** e os Mestres aprovados hoje viram Mestres Oficiais. As fichas atuais vao para uma primeira mesa oficial. Policies refeitas conforme o modelo acima. Telas: "Minhas mesas", "Criar mesa" (escolha de modulo; opcao "oficial" so para Mestre Oficial) e convite por link. Pronto quando dois Mestres nao veem os dados um do outro e um usuario comum le o codex oficial mas nao edita.

**Etapa 3, Modulo Livre**
Um segundo modulo minimo: ficha com campos livres que o Mestre define (texto, numero, lista), sem formulas, e codex com abas simples. Pronto quando uma mesa "Livre" funciona sem carregar nada do Arcano. **Isso prova que a plataforma e multi-sistema** sem precisar de um motor de regras.

**Etapa 4, abertura e lancamento**
Cadastro aberto (a aprovacao manual passa a valer so para Mestre Oficial, via `master_applications`). Perfil publico simples. **Vitrine**: mesas oficiais com vagas, onde jogadores se candidatam e o Mestre aceita. **Historias oficiais publicadas** com leitura publica, que servem de porta de entrada para quem ainda nao tem conta. Denunciar e bloquear, termos de uso e politica de privacidade, limite de mesas por conta. PWA (instalavel no celular). Pronto = lancamento da v1.

### Fora da v1 (vai para a v2 ou depois)

- Feed, posts, curtidas, seguidores, notificacoes
- Chat em tempo real, voz, mapa tatico ou grid
- Motor de regras com formulas em esquema JSON
- Outros modulos alem de Arcano e Livre (ex.: modulos feitos pela comunidade)
- Apps nativos na App Store e Play Store
- Marketplace ou pagamentos

## 6. Decisoes tomadas

| Decisao | Escolha | Consequencia |
|---|---|---|
| Marca | O Arcano · Mesas de RPG | Arcano e marca da plataforma e tambem nome de um modulo. |
| Modulo da mesa | Escolhido na criacao, fixo | Sem migracao de fichas entre sistemas. |
| Ficha dos modulos | Contrato de modulo em codigo + campos livres em JSON no Modulo Livre | **Revisa a escolha anterior de esquema JSON com formulas**, que era a parte mais arriscada. O Arcano continua em codigo, atras do contrato. Um motor de regras em JSON fica para a v2, se fizer falta. |
| Quem cria mesas | Qualquer usuario | Limite de mesas por conta e moderacao na Etapa 4. |
| Publico inicial | Publico geral | Termos, privacidade, denuncia e bloqueio entram antes do lancamento. |
| Equipe | Sozinho | Etapas em sequencia, v1 com 5 etapas. |
| Repositorio | Mesmo repositorio, pasta `modules/` | Separar so se surgirem modulos de terceiros. |
| Backend | So Supabase | Edge Functions apenas quando necessario (ex.: moderacao). |

### Lancamento

1. **Beta fechado** com a comunidade atual ao fim da Etapa 3: valida mesas e os dois modulos.
2. **Abertura ao publico** ao fim da Etapa 4.
