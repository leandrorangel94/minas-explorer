# Minas Explorer

> **Minas tem um destino para cada jeito de viajar.**

Guia turístico interativo de Minas Gerais: descubra cidades históricas, parques, cachoeiras, museus e sabores em um mapa, filtre por categoria e região, consulte fotografias com crédito, salve favoritos e siga roteiros sugeridos.

Aplicação **100% frontend** (sem backend, sem banco de dados, sem login), publicada como site estático no GitHub Pages: **https://leandrorangel94.github.io/minas-explorer/**

## Funcionalidades

- **Mapa interativo** (Leaflet + OpenStreetMap) focado em Minas Gerais, com contorno oficial do IBGE, marcadores por categoria (ícone + cor) e agrupamento de marcadores próximos.
- **Busca** por cidade ou atração (sem diferenciar acentos) e **filtros** por categoria e região. Mapa e lista sempre mostram os mesmos resultados; a lista é uma alternativa completa ao mapa.
- **Páginas de cidade e de atração** com galeria de fotos e créditos (autor, licença, fonte), informações práticas só quando verificadas (com fonte e data) e links para o Google Maps.
- **Favoritos** guardados apenas no navegador (LocalStorage), sem conta nem sincronização.
- **Roteiros editoriais**: sugestões de destinos por dia, sem distâncias nem tempos inventados.
- **Modo claro, escuro ou do sistema**, responsivo (320 px a telas largas) e acessível (WCAG 2.2 AA verificado com axe-core).

## Tecnologias

| Item | Versão |
|---|---|
| Angular (standalone, Signals, rotas lazy) | 22.3 |
| Angular Material / CDK | 22.x |
| Tailwind CSS (layout e espaçamento, via `@tailwindcss/postcss`) | 4.3 |
| SCSS (tokens, tema claro/escuro, componentes) | — |
| Leaflet + `leaflet.markercluster` | 1.9.4 / 1.5.3 |
| `@angular/animations` (transições de página, listas, filtros, galeria) | 22.3 |
| Ícones: `lucide` (SVG puro, registro em `core/utils/icons.ts`) | 1.x |
| Testes: Vitest (via `ng test`), jsdom, `axe-core` | — |
| Qualidade: ESLint + `angular-eslint` | — |
| Hospedagem: GitHub Pages via GitHub Actions | — |

Divisão de estilos: **Material** = componentes e tema; **Tailwind** = utilitários de layout (`src/tailwind.css`, sem reset); **SCSS** = tokens e estilos de componentes (`src/styles/`).

## Requisitos

- **Node.js** `^22.22.3`, `^24.15.0` ou `>=26` (exigência do Angular 22) e **npm**.

## Instalação e execução

```bash
npm install
npm start          # valida o catálogo e abre http://localhost:4200
```

## Scripts

| Comando | Ação |
|---|---|
| `npm start` | valida o catálogo e inicia o servidor de desenvolvimento |
| `npm test` | valida o catálogo e roda os testes (unitários, de integração e de acessibilidade) |
| `npm run lint` | ESLint (TypeScript e acessibilidade de templates) |
| `npm run build` | valida o catálogo e gera o build de produção em `dist/minas-explorer` |
| `npm run build:pages` | build de publicação, com `--base-href /minas-explorer/` |
| `npm run preview:pages` | serve o build de publicação em `http://localhost:4600/minas-explorer/` (como no Pages) |
| `npm run catalog` | valida e consolida o catálogo (`public/data/catalog.json`) e atualiza `docs/creditos.md` |
| `npm run geo` | regenera os dados geográficos do IBGE |

## Clima, informações complementares e hospedagens

- **Clima** (seção em cada cidade e atração): consulta ao vivo o [Open-Meteo](https://open-meteo.com/) (sem chave; CC BY 4.0, com atribuição na tela). O cache fica em memória.
- **Sobre o local, curiosidades, dados práticos do OpenStreetMap e as 3 hospedagens mais próximas**: gerados **offline** por `npm run enrich` (Wikipédia em pt, CC BY-SA 4.0, e OpenStreetMap via Overpass, ODbL) e gravados em `public/data/enrichment.json`. Cada bloco traz fonte, licença e data; só aparece o que foi encontrado. O script é retomável (preserva o que já existe; `--force` refaz) e faz uma requisição por vez.
- Nenhuma chave de API é usada nem fica no repositório. Detalhes em [docs/arquitetura.md](docs/arquitetura.md).

## Publicação no GitHub Pages

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) roda lint, testes e build a cada push na `main` e publica o resultado. **Passo único:** em *Settings → Pages → Source*, escolha **GitHub Actions**. Instruções completas, teste local do artefato e solução de problemas em [docs/publicacao.md](docs/publicacao.md).

## Estrutura de pastas

```text
src/app/
  core/        config, models, services (catálogo, geografia, favoritos, tema), utils
  shared/      componentes reutilizáveis (card, galeria, ícone, favoritar...)
  features/    home (explorar), map, explore (busca/filtros/lista), cities,
               attractions, favorites, itineraries, style-guide
  layout/      cabeçalho e rodapé
src/styles/    tokens (claro/escuro), tema, Leaflet
public/
  data/        catálogo (cities/, attractions/, categories.json, itineraries.json),
               geo/ (contorno do IBGE), regions.json, municipalities.json
  images/      fotografias (WebP, 960 px e 480 px)
scripts/       validação do catálogo, preparo dos dados do IBGE, preview do Pages
docs/          documentação detalhada
.github/       workflow de deploy e Dependabot
```

## Fontes de dados e créditos

| Dado | Fonte |
|---|---|
| Contorno do estado, regiões intermediárias e 853 municípios | [IBGE](https://servicodados.ibge.gov.br/) (API de localidades e malhas) — [docs/dados-geograficos.md](docs/dados-geograficos.md) |
| Coordenadas e localização das cidades e atrações | [Wikidata](https://www.wikidata.org/) (dados estruturados sob CC0), conferidos contra o IBGE |
| Mapa base | © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (servidor público de tiles, sem SLA) |
| Fotografias | [Wikimedia Commons](https://commons.wikimedia.org/): domínio público, CC BY ou CC BY-SA, com autor e licença em [docs/creditos.md](docs/creditos.md) |
| Textos de apresentação e roteiros | editoriais, escritos pelo projeto (ainda sem revisão por fonte local) |

**Pendência:** os termos de uso exatos dos dados do IBGE ainda precisam ser confirmados (ver `docs/dados-geograficos.md`).

## Como adicionar conteúdo

Tudo é feito editando JSON em `public/data`, sem mexer em componentes; `npm run catalog` valida (referências, coordenadas em Minas Gerais, fontes, imagens e licenças) e recusa o que estiver errado. Guia completo em [docs/catalogo.md](docs/catalogo.md).

- **Cidade:** crie `public/data/cities/<slug>.json` com o código IBGE do município (`id`), coordenadas **com fonte verificável** e `lastVerifiedAt`. Não estime coordenadas.
- **Atração:** crie `public/data/attractions/<slug>.json` com `cityId`, `categoryId`, coordenadas com fonte, `sources` e `lastVerifiedAt`. Confirme a localização administrativa antes de associá-la a um município.
- **Fotografia:** use só Wikimedia Commons, domínio público ou imagem própria/autorizada. Confira a licença do arquivo, grave em `public/images` (WebP 960 px e miniatura `-480`) e preencha `url`, `thumbUrl`, `alt`, `author`, `license`, `sourceUrl` e `attribution`. O validador recusa imagem remota (hotlink), arquivo inexistente e licença fora da lista.
- **Informações práticas** (horário, preço, agendamento): só com fonte e data de verificação; sem confirmação recente, não publique.

## Documentação

[docs/etapas.md](docs/etapas.md) · [docs/arquitetura.md](docs/arquitetura.md) · [docs/setup.md](docs/setup.md) · [docs/catalogo.md](docs/catalogo.md) · [docs/dados-geograficos.md](docs/dados-geograficos.md) · [docs/qualidade.md](docs/qualidade.md) · [docs/publicacao.md](docs/publicacao.md) · [docs/creditos.md](docs/creditos.md)
