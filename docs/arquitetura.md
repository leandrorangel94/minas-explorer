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

## Páginas de detalhe (Etapa 7)
- Rotas (hash): `/cidades/:citySlug` e `/cidades/:citySlug/:attractionSlug`, lazy, com `withComponentInputBinding()` (os slugs chegam como `input()`).
- `features/cities/city-page` e `features/attractions/attraction-page` leem a `ExplorerStore` (catálogo único). Estados: carregando, erro, "não encontrada".
- `PageMetaService` define título da aba e meta description por página (SPA; não substitui SSR).
- Componentes compartilhados: `me-image-gallery` (créditos obrigatórios: autor, licença, fonte; `loading="lazy"`; imagem com erro vira placeholder; sem imagem, mensagem honesta), `me-practical-info` (só campos informados, sempre com fonte e data; após 12 meses avisa que pode estar desatualizada; sem dados, diz que não foram verificados), `me-breadcrumbs`.
- Links externos (`core/utils/external-links.ts`): Google Maps (ponto e rota) montados só com as coordenadas do catálogo, sempre com `target="_blank" rel="noopener noreferrer"`.
- Ligação com a home: card ("Ver detalhes") e popup do marcador (`href` via `Location.prepareExternalUrl`, compatível com hash routing). Nas páginas de detalhe, "Ver no mapa" volta à home com a cidade filtrada ou a atração selecionada.

## Favoritos e roteiros (Etapa 8)
- `core/services/favorites.service.ts`: favoritos (cidade/atração) em signals, salvos **só no LocalStorage** (`minas-explorer:favorites:v1`, formato `{version, items}`). Valida o que lê (descarta itens inválidos/duplicados, limite de 500), tolera storage indisponível (modo privado/bloqueio/cota cheia: continua em memória e `persistent()` vira `false`, o que a tela de favoritos avisa) e sincroniza abas pelo evento `storage`. Não guarda dados pessoais.
- `me-favorite-button` (alternância com `aria-pressed`), usado na lista, nas páginas de cidade/atração, na tela de favoritos e nos roteiros. O cabeçalho mostra o contador.
- `features/favorites/favorites-page`: lista cidades e atrações favoritas, explica que ficam apenas neste navegador/dispositivo e não sincronizam, "Remover todos" com confirmação e limpeza de favoritos que não existem mais no catálogo.
- Roteiros: `public/data/itineraries.json` (escrito à mão e validado por `npm run catalog`). Rotas `/roteiros` e `/roteiros/:slug`. São **editoriais**: dias e paradas por id de atração, sem distância, duração ou trajeto (o validador recusa esses campos). Cada parada abre detalhes, o mapa interno e o Google Maps.

## Clustering (Etapa 9)
`leaflet.markercluster` agrupa marcadores próximos (Belo Horizonte, Ouro Preto e Mariana ficam a poucos km). Grupos usam o mesmo ícone/cor da marca, `disableClusteringAtZoom: 13` e, ao selecionar um destino dentro de um grupo, o mapa aproxima até ele aparecer e abre o popup.

**Armadilha:** com `import * as L from 'leaflet'`, o bundle de produção cria uma cópia do módulo antes de o plugin se registrar, e `L.markerClusterGroup` some. Por isso `minas-map.ts` usa o import default para obter a função. O Vitest não reproduz isso: valide mudanças no mapa também no build de produção.

## Modo escuro (Etapa 12)
- **Tokens** em `src/styles/_tokens.scss`: tema claro em `:root`; escuro no mixin `dark-tokens`, aplicado em `@media (prefers-color-scheme: dark)` (quando não há `data-theme="light"`) e em `:root[data-theme='dark']`. Componentes nunca usam cores fixas: só tokens (`--me-*`). Papéis do Material (`--mat-sys-*`) apontam para os tokens, e `mat.theme` usa `theme-type: color-scheme`.
- **`ThemeService`** (`core/services/theme.service.ts`): preferência `system | light | dark` em LocalStorage (`minas-explorer:theme:v1`, com `try/catch`; inválido ou indisponível = sistema). Só define `data-theme` quando o usuário escolhe claro/escuro; em "sistema" o CSS segue o SO. Acompanha mudanças do SO (`matchMedia`) e de outras abas (`storage`).
- **Sem "flash":** script inline em `index.html` aplica `data-theme` antes do primeiro render; `<meta name="color-scheme" content="light dark">`.
- **Alternador** no cabeçalho (menu com Sistema/Claro/Escuro, `role="menuitemradio"`, `aria-checked`, rótulo com o tema atual).
- **Mapa:** `--me-map-*` (fundo, máscara, contorno e filtro dos tiles: no escuro `invert + hue-rotate`, sem trocar de provedor). `MinasMap` relê as cores ao trocar de tema e redesenha contorno e máscara.
- **Categorias:** a cor de cada categoria é clareada no escuro com `color-mix(... white)` controlado por `--me-cat-lighten` (0% no claro, 48% no escuro) onde vira texto, ícone ou borda; o ícone do marcador selecionado usa `--me-on-marker`.
- **Contraste:** `core/theme-contrast.spec.ts` calcula WCAG AA a partir dos próprios tokens nos dois temas (texto ≥ 4,5:1; interface ≥ 3:1) e das cores das categorias. Ao criar um token de cor, ele precisa ter valor no escuro (o teste cobra).

## Ícones e acessibilidade (Etapa 10)
- **Ícones:** `core/utils/icons.ts` é o registro único (Lucide, SVG puro) de ícones de interface e de categorias; `me-icon` (`shared/components/icon`) os renderiza, sempre `aria-hidden`. Um ícone novo precisa ser importado e registrado ali (o teste `shared-a11y.spec.ts` garante que os ícones de `categories.json` existam). O pacote `@lucide/angular` foi removido: não tem tree-shaking e custava 87 kB no bundle inicial.
- **Troca de página** (`app.ts`): foco no `<main>`, anúncio do título via `LiveAnnouncer` e rolagem ao topo; o link "Ir para o conteúdo" é tratado em código, pois com hash routing `href="#conteudo"` viraria rota.
- **Títulos:** cada página tem um único `<h1>` (`me-section-title [level]="1"`, hero da home ou `me-empty-state [level]="1"` nas páginas "não encontrada").
- **Imagens:** cada foto tem `url` (960 px) e `thumbUrl` (480 px); cards e galeria usam `srcset`/`sizes` e `decoding="async"`.
- Detalhes e resultados da revisão em [qualidade.md](qualidade.md).

## Layout para telas grandes
Um único contêiner (`--me-container`: 1920 px, 2240 px a partir de 2200 px) com margem fluida (`--me-gutter`) alinha cabeçalho, hero, conteúdo e rodapé nas mesmas bordas. Tokens de espaçamento em múltiplos de 8 px, escala de texto por largura (106% a 1600 px, 112,5% a 2200 px), painel e mapa com altura relativa à tela e hero em duas colunas com os números do catálogo. Princípios usados: hierarquia, alinhamento, proximidade e consistência. Não foi possível consultar material específico da Insany Design nem do uiBoost.

## Animações, esqueletos e clima (20/11/2026)

- **Animações** (`@angular/animations`, `provideAnimationsAsync()`): os gatilhos ficam em `shared/animations.ts` (`pageTransition`, `staggerIn`, `fadeIn`, `expandCollapse`, `crossFade`, `heartPop`). Com `prefers-reduced-motion`, `app.html` desliga tudo via `[@.disabled]`. Nos testes, `src/test-providers.ts` (configurado em `angular.json`) usa `provideAnimationsAsync('noop')`.
- **Esqueletos** (`shared/components/skeleton`): `me-skeleton` (bloco com brilho), `me-explorer-skeleton` (home), `me-detail-skeleton` e `me-cards-skeleton` (detalhes, favoritos, roteiros), todos com `role="status"` e texto oculto "Carregando…". Cores em `--me-skeleton-base/shine`.
- **Clima** (`core/services/weather.service.ts` + `shared/components/weather`): Open-Meteo (atual + 7 dias: temperatura, sensação, chance de chuva, umidade, vento, UV, nascer/pôr do sol), códigos WMO traduzidos para pt-BR, cache por coordenada, estados de carregamento e erro, atribuição visível.
- **Complementares** (`core/services/enrichment.service.ts` + `shared/components/place-extras`): leem `data/enrichment.json` (opcional). `npm run catalog` valida ids, fontes (https, licença, data) e o limite de 3 hospedagens. Gerado por `scripts/enrich-catalog.mjs`.
- **Popup do mapa**: `MapPoint.imageUrl/imageAlt`; a miniatura só recebe `src` ao abrir o popup (não baixa dezenas de imagens de uma vez).
- **Camadas**: `.me-map` usa `isolation: isolate`, então os painéis do Leaflet (z-index até 1000) nunca passam por cima do cabeçalho fixo. O botão de zoom desabilitado usa tokens (`_leaflet.scss`).
- **Home**: filtros em faixa horizontal no desktop; lista + mapa lado a lado com altura derivada da janela (`--me-explorer-height`), para caber na primeira tela.
