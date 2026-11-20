# Publicação no GitHub Pages

O site é estático e é publicado por GitHub Actions em **https://leandrorangel94.github.io/minas-explorer/**.

> Nada é publicado até você fazer `git push` na `main` e habilitar o Pages (passos abaixo). O workflow não roda localmente.

## Como funciona

| Peça | Arquivo |
|---|---|
| Build de publicação | `npm run build:pages` → `ng build --base-href /minas-explorer/` (saída em `dist/minas-explorer/browser`) |
| Workflow | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): em push na `main` (ou manualmente), roda `npm ci`, `npm run lint`, `npm test`, `npm run build:pages` e publica o artefato |
| Roteamento | **hash routing** (`/minas-explorer/#/cidades/ouro-preto`): recarregar e abrir links diretos sempre funciona, sem fallback de servidor |
| 404 | `public/404.html`: página do site para endereços inexistentes (o GitHub Pages a usa) |
| SEO | `robots.txt`, `sitemap.xml`, `canonical`, Open Graph/Twitter e `og-image.png` em `public/` e `src/index.html` |
| Atualização das actions | [`.github/dependabot.yml`](../.github/dependabot.yml) abre PRs mensais para as versões das actions |

Os dados (`public/data`) e as imagens (`public/images`) são lidos por **caminhos relativos ao `<base href>`**, por isso funcionam no subdiretório `/minas-explorer/`.

## Habilitar o Pages (uma vez)

1. No GitHub: repositório → **Settings** → **Pages**.
2. Em **Build and deployment** → **Source**, escolha **GitHub Actions**.
3. Faça `git push` na `main` (ou rode o workflow em **Actions** → *Deploy no GitHub Pages* → *Run workflow*).
4. Acompanhe em **Actions**; ao terminar, o endereço aparece no job *deploy* e em **Settings → Pages**.

Para publicar manualmente depois: `git push origin main` (cada push na `main` publica).

## Testar o artefato antes de publicar

```powershell
npm run build:pages
npm run preview:pages   # http://localhost:4600/minas-explorer/
```

O `preview:pages` serve o build **exatamente em `/minas-explorer/`**, como o Pages, e devolve `404.html` para o resto. Confira: mapa e tiles, miniaturas, `/#/cidades/...` com recarga, `/minas-explorer/robots.txt` e um endereço inexistente.

## Se o nome do repositório ou o endereço mudar

Troque `minas-explorer` / `leandrorangel94.github.io` nestes lugares:

1. `package.json`: script `build:pages` (`--base-href /<repo>/`).
2. `scripts/preview-pages.mjs`: constante `BASE`.
3. `src/index.html`: `canonical`, `og:url`, `og:image`, `twitter:image`.
4. `public/robots.txt` e `public/sitemap.xml`.
5. `public/404.html`: link e ícone (`/minas-explorer/`).

**Domínio próprio:** configure o domínio em Settings → Pages, use `--base-href /` e atualize os itens 3 a 5.

## Roteamento e indexação

Escolha feita: **hash routing**. Com History API, o GitHub Pages não tem fallback de SPA (links diretos viriam com status 404), e sem pré-renderização isso não melhoraria a indexação.

- O Google e outros buscadores ignoram o fragmento (`#/...`); por isso o `sitemap.xml` lista só a URL real. As páginas de cidade e atração funcionam para pessoas, mas não são páginas separadas para busca.
- **Pré-renderização estática** foi avaliada e adiada: exigiria renderização no servidor (`@angular/ssr`), tornar o Leaflet seguro para SSR (usa `window`) e ler o catálogo durante o build. Se a indexação das páginas internas passar a ser prioridade, é a evolução natural (e as URLs pré-renderizadas entrariam no `sitemap.xml`).

## Versões das actions

O workflow usa `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3` e `actions/deploy-pages@v4` (versões estáveis conhecidas). **Não foi possível consultar as versões mais novas neste ambiente**; o Dependabot sugere atualizações. Se o GitHub avisar que uma versão está obsoleta, altere o número da versão no workflow.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Página em branco / `404` em `main.js` | `--base-href` diferente do nome do repositório |
| Mapa sem tiles | bloqueio de rede ao `tile.openstreetmap.org` (servidor público, sem SLA) |
| Workflow falha em `npm ci` | `package-lock.json` desatualizado: rode `npm install` e faça commit |
| Workflow falha em *Testes* | rode `npm test` localmente: o catálogo e os dados são validados antes |
| Deploy não aparece | **Settings → Pages → Source** não está em *GitHub Actions* |
