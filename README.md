# Minas Explorer

Guia turístico interativo de Minas Gerais: mapa, cidades, atrações e favoritos locais.
Aplicação 100% frontend (sem backend), publicável no GitHub Pages.

> Minas Gerais está mais perto do que você imagina.

**Status:** Etapa 6 (marcadores, busca e filtros) concluída. Roteiro completo em [docs/etapas.md](docs/etapas.md), incluindo a Etapa 12 (modo escuro).

## Tecnologias

| Item | Versão |
|---|---|
| Angular (standalone, Signals) | 22.3 |
| Angular Material / CDK | 22.x |
| Tailwind CSS (via `@tailwindcss/postcss`) | 4.3 |
| SCSS | — |
| Leaflet (+ `@types/leaflet`) | 1.9.4 |
| Ícones: `@lucide/angular` | 1.x |
| Testes: Vitest (via `ng test`) | — |

Divisão de estilos: **Material** = componentes e tema; **Tailwind** = utilitários de layout/espaçamento
(`src/tailwind.css`, só `theme` + `utilities`, sem preflight); **SCSS** = tokens e customizações (`src/styles/`).

## Pré-requisitos

Node.js `^22.22.3 || ^24.15.0 || >=26` e npm. (Desenvolvido com Node 26.13 / npm 12.)

## Instalação e execução

```bash
npm install
npm start        # http://localhost:4200
```

## Scripts

| Comando | Ação |
|---|---|
| `npm start` | valida o catálogo e inicia o servidor de desenvolvimento |
| `npm run catalog` | valida e consolida o catálogo (`public/data/catalog.json`) |
| `npm run geo` | regenera os dados geográficos do IBGE |
| `npm test` | testes unitários |
| `npm run build` | build de produção em `dist/minas-explorer` |
| `npm run watch` | build contínuo (desenvolvimento) |

## Estrutura

```text
src/app/
  core/        config, models, services, utils
  shared/      components, pipes, directives
  features/    map, cities, attractions, regions, favorites, itineraries
  layout/
src/styles/    _tokens.scss, _theme.scss
public/data/   JSON do catálogo (cities/, attractions/)
```

Mais detalhes em [docs/](docs/).
