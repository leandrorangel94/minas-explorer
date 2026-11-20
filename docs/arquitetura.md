# Arquitetura

Organização por funcionalidades em `src/app` (`core`, `shared`, `features`, `layout`).
Pastas ainda vazias contêm `.gitkeep` e serão preenchidas nas próximas etapas.

Ordem dos estilos globais (`angular.json`): `src/tailwind.css` (theme + utilities em camadas) e depois
`src/styles.scss` (tokens + tema Material). Tailwind sem preflight evita conflitos de reset com o Material.
Dados do catálogo: JSON em `public/data` (Etapa 5). Roteamento e publicação: Etapa 11.

## Layout e UI (Etapa 2)
- `layout/header` (marca, busca visual, navegação; menu `mat-menu` no mobile) e `layout/footer`.
- `shared/components`: `destination-card` (com placeholder e tratamento de erro de imagem), `empty-state`, `section-title`.
- Rotas lazy com `loadComponent`, em hash routing: `/`, `/roteiros`, `/favoritos`, `/guia-de-estilo` (referência visual interna).
- Tokens em `src/styles/_tokens.scss` (variáveis CSS `--me-*`); tema Material em `_theme.scss`.
- Visibilidade responsiva do cabeçalho é feita em SCSS: o CSS de componentes sobrepõe as utilities do Tailwind (que ficam em `@layer`).
- Acessibilidade: link "Ir para o conteúdo", foco visível, `aria-current` na navegação, `prefers-reduced-motion`.

## Mapa (Etapa 3)
- `features/map/minas-map`: componente `me-minas-map` que encapsula o Leaflet. Cria o mapa fora da zona do Angular, observa resize (`ResizeObserver` + `invalidateSize`) e destrói mapa/observer no `DestroyRef`. Entrada `points` (marcadores) e saída `pointSelected`.
- `core/config/map.config.ts`: provedor de tiles isolado (OpenStreetMap, com atribuição) e viewport inicial. O retângulo de enquadramento é **aproximado** e serve só de viewport; o contorno oficial do estado (IBGE) entra na Etapa 4.
- Ícones padrão do Leaflet: PNGs copiados para `leaflet/` via `assets` do `angular.json` e configurados em `core/utils/leaflet-icons.ts` (caminhos relativos ao `<base href>`).
- `leaflet.css` carregado em `angular.json`; `allowedCommonJsDependencies: ["leaflet"]` silencia o aviso de CommonJS.
- Home alterna Mapa/Lista. Sem catálogo ainda, nenhum marcador é exibido (nada fictício).
- Política OSM: tiles públicos sem SLA; trocar de provedor mexendo só em `TILE_PROVIDER`.

## Geografia (Etapa 4)
- Dados do IBGE em `public/data` (contorno, 13 regiões, 853 municípios), gerados por `scripts/prepare-geo-data.mjs`. Detalhes, fonte e pendências em [dados-geograficos.md](dados-geograficos.md).
- `core/models/geo.models.ts` e `core/services/geo-data.service.ts` (HttpClient, cache com `shareReplay`).
- `me-minas-map` recebe `boundary` (GeoJSON) e desenha o contorno sob os marcadores. Se o carregamento falhar, o mapa funciona sem contorno.
- Mudanças em `angular.json` (assets/styles) exigem reiniciar o `ng serve`.

## Catálogo (Etapa 5)
- Origem: `public/data/cities/*.json` e `attractions/*.json` (1 entidade por arquivo) + `categories.json`; `npm run catalog` valida e gera `catalog.json`, que o app lê via `CatalogService`. Guia completo em [catalogo.md](catalogo.md).
- Modelos em `core/models/catalog.models.ts`; funções puras em `core/utils/catalog.utils.ts`.
- `npm start`, `npm run build` e `npm test` rodam a validação antes.

## Exploração: busca, filtros e mapa (Etapa 6)
- `features/explore/explorer.store.ts` (signals): `query`, `categoryIds`, `regionId`, `selectedId`; `results` é calculado com `filterAttractions` (`core/utils/search.utils.ts`: busca sem acento, todas as palavras, categorias por "ou", região pela cidade). Lista e mapa leem o **mesmo** `results`.
- O cabeçalho escreve em `query`; `me-filters-panel` (chips de categoria = legenda do mapa + região), `me-results-list` (cards) e `me-minas-map` leem/escrevem na store.
- Mapa: marcadores `L.divIcon` com ícone Lucide da categoria (`core/utils/category-icons.ts`; a categoria nunca depende só da cor), marcador selecionado destacado, popup montado com `textContent`. Seleção sincronizada nos dois sentidos (card ↔ marcador).
- Viewport: sem filtros enquadra Minas inteira; com filtros ajusta aos resultados (`RESULTS_FIT_OPTIONS`).
- Responsivo: ≥1024px painel lateral + mapa; abaixo, alternador Mapa/Lista e filtros recolhíveis. Cards compactos no painel (`BreakpointObserver`).
- Clustering: **não adotado ainda** (7 destinos; sem sobreposição relevante). Reavaliar na Etapa 9, quando o catálogo crescer (ex.: `leaflet.markercluster`).

### Mapa minimalista e focado em Minas
Técnicas combinadas, sem trocar de provedor de tiles (continua OpenStreetMap):
1. **Tiles dessaturados por CSS** (`--me-map-tile-filter`: tons de cinza, contraste e brilho suaves) em `styles/_leaflet.scss`.
2. **Máscara fora de MG**: polígono "mundo" com buraco no formato do estado (contorno IBGE), numa pane própria entre tiles e contorno; cor em `--me-map-mask`.
3. **Navegação limitada** ao entorno do estado (`setMaxBounds` com folga de 12% + `minZoom` calculado), com `zoomSnap` 0,25 para enquadrar melhor.
4. Controles, atribuição, popup e marcadores com visual discreto, todos via variáveis CSS (preparado para o modo escuro).
Alternativa avaliada e **não adotada**: tiles "Positron" da CARTO (estilo ainda mais limpo e com variante escura), por depender de outro provedor e de termos de uso a confirmar; a troca continua possível em `TILE_PROVIDER`.
