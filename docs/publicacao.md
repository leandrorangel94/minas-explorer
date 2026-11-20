# Publicação na Vercel

O site é estático e é publicado pela **Vercel** (plano gratuito "Hobby", que aceita repositórios privados), a partir do repositório no GitHub. A Vercel faz o build e a publicação; o GitHub Actions só roda verificações.

> Nada é publicado até você importar o projeto na Vercel (passos abaixo). Depois disso, cada `git push` na `main` publica sozinho, e cada branch ou pull request ganha um endereço de prévia.

## Como funciona

| Peça | Arquivo |
|---|---|
| Configuração da Vercel | [`vercel.json`](../vercel.json): `npm ci`, `npm run build`, saída em `dist/minas-explorer/browser`, cabeçalhos de segurança e de cache |
| Build | `npm run build` valida o catálogo, gera o site e roda `scripts/apply-site-url.mjs` |
| URL do site | marcador no código, trocado no build (seção abaixo) |
| Roteamento | **hash routing** (`/#/cidades/ouro-preto`): recarregar e abrir links diretos sempre funciona, sem regras de reescrita |
| 404 | `public/404.html`: página do site para endereços inexistentes (a Vercel a usa) |
| SEO | `robots.txt`, `sitemap.xml`, `canonical`, Open Graph/Twitter e `og-image.png` |
| Verificações | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): lint, testes e build em cada push e pull request |

Dados (`public/data`) e imagens (`public/images`) são lidos por **caminhos relativos ao `<base href>`**, então o site funciona na raiz do domínio (como na Vercel) ou em subdiretório.

## Publicar pela primeira vez

1. Crie conta em [vercel.com](https://vercel.com) e entre com o GitHub (**Continue with GitHub**).
2. **Add New → Project**. Se o repositório for privado, autorize a Vercel a acessá-lo (ela pede permissão ao GitHub).
3. Escolha o repositório `minas-explorer` e confira (a Vercel lê o `vercel.json`):
   - **Framework Preset:** Angular (ou *Other*)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/minas-explorer/browser`
   - **Install Command:** `npm ci`
   - **Node.js Version:** `24.x` (em *Settings → General*; o Angular 22 exige Node `^22.22.3`, `^24.15.0` ou `>=26`)
4. Clique em **Deploy**. Em cerca de 1 a 2 minutos o site abre em `https://<projeto>.vercel.app`.

O endereço só é conhecido depois do primeiro deploy. Se o nome do projeto for `minas-explorer` e estiver livre, será `https://minas-explorer.vercel.app` (o padrão usado no build). **Confira o endereço real em *Domains* e veja a seção seguinte.**

## URL do site (canonical, Open Graph, robots, sitemap)

`src/index.html`, `public/robots.txt` e `public/sitemap.xml` usam o marcador `%SITE_URL%`, trocado **no build** por `scripts/apply-site-url.mjs`. A URL é escolhida nesta ordem:

1. variável `SITE_URL`, se existir (ex.: domínio próprio);
2. `VERCEL_PROJECT_PRODUCTION_URL`, que **a Vercel define sozinha** em todo build (o domínio de produção do projeto, também nas prévias);
3. `https://minas-explorer.vercel.app`, o padrão (build local).

Na prática, **não precisa configurar nada**: a Vercel já fornece o endereço de produção. Só defina `SITE_URL` (*Settings → Environment Variables*) se usar domínio próprio. Depois de publicar, confira abrindo `/robots.txt` e o código-fonte da página (`canonical`).

## Domínio próprio (opcional)

*Settings → Domains → Add*, siga a configuração de DNS indicada e defina `SITE_URL=https://seu-dominio.com.br` nas variáveis de ambiente. O site fica na raiz do domínio, então nada mais muda.

## Testar o build antes de publicar

```powershell
npm run build
npm run preview   # http://localhost:4600/
```

O `preview` serve o build como a hospedagem fará e devolve `404.html` para caminhos inexistentes. Para simular um subdiretório: `$env:BASE="/subpasta/"; npm run preview` (exige build com `ng build --base-href /subpasta/`).

## Roteamento e indexação

Escolha: **hash routing**. Com History API seria preciso configurar reescritas (a Vercel suporta), mas sem pré-renderização isso não melhoraria a indexação.

- O Google e outros buscadores ignoram o fragmento (`#/...`); por isso o `sitemap.xml` lista só a URL real. As páginas de cidade e atração funcionam para pessoas, mas não são páginas separadas para busca.
- **Pré-renderização estática** foi avaliada e adiada: exigiria renderização no servidor (`@angular/ssr`), tornar o Leaflet seguro para SSR (usa `window`) e ler o catálogo durante o build. Se a indexação das páginas internas virar prioridade, é a evolução natural (e as URLs entrariam no `sitemap.xml`).

## Cabeçalhos (`vercel.json`)

- Segurança: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` sem câmera, microfone, localização e pagamento.
- Cache: `images/` por 1 dia (com revalidação em segundo plano) e `media/` (arquivos com hash) por 1 ano.
- **Sem `Content-Security-Policy` por enquanto:** o site carrega tiles do OpenStreetMap e fontes do Google, e uma política errada quebraria o mapa. Pode ser adicionada com testes no navegador.

## Plano gratuito: o que considerar

- O plano Hobby é para uso **pessoal e não comercial**; um portfólio ou guia sem fins lucrativos se enquadra. Confirme os termos e limites atuais em vercel.com/docs (não consegui consultá-los neste ambiente).
- O site é **público** na internet; só o repositório fica privado.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Build falha em `npm ci` | `package-lock.json` desatualizado: rode `npm install` e faça commit |
| Build falha com erro de versão do Node | em *Settings → General*, defina Node.js Version `24.x` |
| Página em branco com `404` nos arquivos `.js` | *Output Directory* diferente de `dist/minas-explorer/browser` |
| Mapa sem tiles | bloqueio de rede ao `tile.openstreetmap.org` (servidor público, sem SLA) |
| `canonical` com endereço errado | defina `SITE_URL` nas variáveis de ambiente e faça novo deploy |
| Aviso de GitHub Pages falhando | o workflow de Pages foi removido; apague quaisquer execuções antigas e desative o Pages em *Settings → Pages* se quiser |
