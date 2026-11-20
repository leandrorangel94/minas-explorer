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
