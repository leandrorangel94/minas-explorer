# Setup

## Pré-requisitos

- **Node.js** `^22.22.3`, `^24.15.0` ou `>=26` (exigência do Angular 22) e npm.
- Sem variáveis de ambiente, chaves de API, backend ou banco de dados.

## Instalação e execução

```bash
npm install
npm start      # valida o catálogo e abre http://localhost:4200
```

Mudanças no `angular.json` (assets, estilos) exigem reiniciar o `npm start`.

## Scripts

| Comando | Ação |
|---|---|
| `npm start` | valida o catálogo e inicia o servidor de desenvolvimento |
| `npm test` | valida o catálogo e roda os testes (Vitest + jsdom) |
| `npm run lint` | ESLint com `angular-eslint` (inclui acessibilidade de templates) |
| `npm run build` | valida o catálogo e gera o build de produção em `dist/minas-explorer/browser` |
| `npm run build:pages` | build de publicação (`--base-href /minas-explorer/`) |
| `npm run preview:pages` | serve o build de publicação em `http://localhost:4600/minas-explorer/` |
| `npm run catalog` | valida e consolida o catálogo; gera `public/data/catalog.json` e `docs/creditos.md` |
| `npm run geo` | baixa e trata os dados geográficos do IBGE (`scripts/prepare-geo-data.mjs`) |

## Observações

- Os dados do catálogo são JSON em `public/data`; ver [catalogo.md](catalogo.md).
- Os ícones vêm do pacote `lucide` (SVG puro) e são registrados em `src/app/core/utils/icons.ts`. O pacote `lucide-angular` não é usado (não é compatível com o Angular 22 e não tem tree-shaking).
- Publicação: ver [publicacao.md](publicacao.md).
