# Catálogo

O app lê `public/data/catalog.json`, **gerado** por `npm run catalog` (também executado antes de `npm start`, `npm run build` e `npm test`). Quem edita o catálogo mexe apenas nos arquivos de origem; nenhum componente precisa mudar.

## Arquivos

| Caminho | O que é |
|---|---|
| `public/data/cities/<slug>.json` | uma cidade por arquivo |
| `public/data/attractions/<cidade>-<slug>.json` | uma atração por arquivo |
| `public/data/categories.json` | categorias (ícone Lucide + cor) |
| `public/data/municipalities.json`, `regions.json` | índice IBGE (ver [dados-geograficos.md](dados-geograficos.md)) |
| `public/data/catalog.json` | **gerado**, não editar à mão |

Modelos TypeScript: `src/app/core/models/catalog.models.ts`.

## Como adicionar uma cidade

1. Procure o município em `municipalities.json` e copie o `id` (código IBGE), o `name` e o `regionId`.
2. Crie `public/data/cities/<slug>.json` com `id`, `name`, `slug`, `regionId`, `description`, `coordinates`, `coordinatesSource`, `sources` e `lastVerifiedAt` (AAAA-MM-DD).
3. As coordenadas precisam vir de uma fonte verificável (ex.: Wikidata, propriedade P625), registrada em `coordinatesSource`. **Não estime coordenadas.**
4. Rode `npm run catalog`.

## Como adicionar uma atração

1. Crie `public/data/attractions/<cidade>-<slug>.json` com `id`, `name`, `slug`, `cityId` (id da cidade), `categoryId` (de `categories.json`), `description`, `coordinates`, `coordinatesSource`, `images` (pode ser `[]`), `tags`, `featured`, `sources` e `lastVerifiedAt`.
2. Confirme que a atração fica de fato nesse município (campo "localizado em" da fonte) antes de associá-la.
3. Informações práticas (`practicalInfo`: horário, preço, agendamento, acessibilidade, trilha, avisos) só entram com fonte e data de verificação. Se não houver confirmação recente, omita.
4. Rode `npm run catalog`.

## Fotografias

Cada imagem exige `url`, `alt`, `author`, `license`, `sourceUrl` e `attribution`; o script recusa imagem sem procedência. Prefira Wikimedia Commons / domínio público; confira a licença de cada arquivo. Sem imagem com direitos claros, deixe `images: []` (a interface mostra um placeholder).

## Validações do `npm run catalog`

Campos obrigatórios; ids e slugs únicos; `cityId` existente; `categoryId` existente; cidade com `id`, `name` e `regionId` iguais aos do município IBGE; coordenadas dentro do retângulo de Minas Gerais; fontes com URL http(s); datas AAAA-MM-DD; imagens com procedência completa. Qualquer erro interrompe o comando com a lista de problemas.

## Origem do catálogo inicial (20/11/2026)

- **Coordenadas e município:** Wikidata (propriedade P625 para coordenadas, P131 para "localizado em", P1585 para o código IBGE), consultado pela API pública em 20/11/2026. Cada registro guarda o link do item em `coordinatesSource`. Os dados estruturados do Wikidata são CC0.
- **Associação cidade ↔ atração:** conferida pelo P131 do Wikidata. A Pampulha aponta para o item "Pampulha", que por sua vez está em Belo Horizonte. Os parques nacionais abrangem vários municípios e foram associados a um deles (São Roque de Minas e Santana do Riacho), como explicado na descrição de cada um.
- **Cidades:** `id`, nome e região conferem com o índice IBGE (o script recusa divergências).
- **Descrições:** textos curtos **editoriais, escritos pelo projeto**, sem cópia de texto de terceiros. Não foram revisados por fonte local (prefeitura, turismo oficial); revisar antes da publicação.
- **Imagens:** nenhuma ainda (`images: []`). Entram na Etapa 9, uma a uma, com licença verificada.
- **Informações práticas** (horário, preço etc.): nenhuma; só entram com fonte e data.

## Como o catálogo aparece nas páginas
- **Imagens:** a galeria mostra autor, licença, atribuição e link da fonte de cada foto. Sem `images`, a página informa que não há fotografia com direitos verificados.
- **Informações práticas:** só aparecem os campos preenchidos em `practicalInfo`, com fonte e data. Com mais de 12 meses, a página avisa que podem estar desatualizadas.
- **Fontes:** cada página lista `coordinatesSource`, `sources` e `lastVerifiedAt`.

## Roteiros editoriais
`public/data/itineraries.json` lista os roteiros: `id`, `slug`, `title`, `summary`, `regionId`, `days[{title, stopIds[]}]` e `lastReviewedAt`. Os `stopIds` são ids de atrações existentes. Roteiros são sugestões editoriais: **não** incluem distância, duração nem trajeto, e `npm run catalog` recusa esses campos. Para criar um, agrupe destinos da mesma região/cidade e rode o comando.

## Curadoria da Etapa 9 (20/11/2026)

**Estado do catálogo:** 34 cidades, 60 atrações (50 com fotografia), as **13 regiões** do IBGE representadas e 7 roteiros.

**Como foi levantado**
- Candidatos: consulta SPARQL ao Wikidata (itens turísticos com coordenadas, município com código IBGE e número de artigos) e buscas por nome. Descartados os sem coordenadas (Parque do Sabiá, Serra do Papagaio) ou sem município (Lago de Furnas).
- Coordenadas e município: Wikidata (P625, P131), conferidos contra o índice IBGE; o validador recusa divergências.
- Parques que abrangem vários municípios foram associados a um deles, e a descrição diz isso.
- Descrições: textos curtos editoriais, escritos pelo projeto a partir dos dados do Wikidata. Os mais genéricos (ex.: "Caverna em Sete Lagoas") são propositalmente simples para não afirmar nada não verificado; vale enriquecê-los com fonte local.

**Fotografias (Wikimedia Commons)**
- Para cada foto: licença, autor e página conferidos pela API do Commons; só entram domínio público, CC0, CC BY e CC BY-SA.
- Versionadas em `public/images` (sem hotlink), redimensionadas a 960 px e convertidas para WebP. Cada foto foi conferida visualmente e recebeu texto alternativo escrito pelo projeto.
- Descartadas: fotos de baixa resolução, foto com criança identificável e fotos que não representam o item.
- Créditos completos em [creditos.md](creditos.md) (gerado por `npm run catalog`).
- `npm run catalog` recusa imagem remota, arquivo inexistente, licença fora da lista ou sem autor/fonte.

**Pendências de curadoria**
- Atrações sem foto: Peruaçu, Gruta Rei do Mato, Basílica do Pilar, Centro Histórico de Diamantina e Estação de São João del-Rei (as fotos candidatas tinham baixa resolução ou não representavam o item).
- Nenhuma informação prática (horário, entrada) foi cadastrada: sem fonte oficial recente, não se publica.
- Revisão das descrições por fonte local e ampliação nas 3 regiões sem cidades.

> Nota (Etapa 12): a cor de `categories.json` precisa ter contraste ≥ 4,5:1 sobre branco (é usada como texto); o teste `theme-contrast.spec.ts` verifica isso também no tema escuro, onde a cor é clareada automaticamente.

## Expansão de 20/11/2026
- +11 cidades e +38 atrações (cachoeiras, museus, igrejas e cidades históricas, parques e serras), com coordenadas e município do Wikidata conferidos contra o IBGE, e +33 fotos do Wikimedia Commons (CC BY ou CC BY-SA), conferidas visualmente. Descartadas fotos com menos de 800 px e a da Cachoeira das Andorinhas (não representa o lugar).
- Casos de associação mais fraca (o Wikidata só traz a localização na descrição): Gruta de Maquiné (Cordisburgo) e Parque Estadual do Rio Preto (São Gonçalo do Rio Preto). Sem foto: Maquiné, Andorinhas, Museu de Cabangu, Museu dos Dinossauros e Catedral de Governador Valadares.
- 4 novos roteiros editoriais (Diamantina e Serro, cachoeiras de Poços de Caldas, Sabará e Belo Horizonte).

## Dados complementares (`enrichment.json`)

Arquivo gerado por `npm run enrich` (não editar à mão), chave = id da cidade ou atração:

- `about`: descrição e curiosidades extraídas da introdução do artigo da Wikipédia (pt), aceitas só se o artigo estiver a até 40 km do destino e o título for parecido com o nome. Licença CC BY-SA 4.0.
- `practical` (atrações): horário, entrada, acessibilidade, telefone e site encontrados no OpenStreetMap por nome em até 400 m. Dados colaborativos (ODbL); a tela avisa para confirmar antes de ir.
- `lodging`: até 3 hospedagens mais próximas (`tourism=hotel|guest_house|hostel|motel|chalet|apartment|camp_site`), buscando em 3 km, 10 km e 25 km.

Cada bloco tem `source` (nome, url, licença, `retrievedAt`). Execução: `npm run enrich` (retoma de onde parou), `-- --only=<id>` para um item, `-- --force` para refazer. Use com moderação: o Overpass é um serviço público compartilhado. Uma alternativa paga (Google Places) **não** está implementada; exigiria chave própria, que nunca deve ser versionada.

## Candidatos a novos destinos

`npm run candidates` consulta o Wikidata (CC0) por categoria e a licença das fotos no Commons, e gera `candidates/candidates.md` e `candidates.json` (pasta ignorada pelo Git) para revisão manual; não altera o catálogo. Opções: `--category=<id>`, `--limit=<n>`, `--no-licenses`. O mapeamento categoria → classes do Wikidata fica em `scripts/find-candidates.mjs` e pode ser refinado com o prompt de [prompt-categorias.md](prompt-categorias.md).
