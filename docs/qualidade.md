# Qualidade, acessibilidade e otimização

Resultado da revisão da Etapa 10 (20/11/2026) e como repeti-la.

## Verificações automáticas

| Comando | O que faz |
|---|---|
| `npm test` | valida o catálogo e roda os testes (Vitest + jsdom) |
| `npm run lint` | ESLint com `angular-eslint`: regras de TypeScript e de **acessibilidade de templates** (`alt`, teclado, foco) |
| `npm run build` | valida o catálogo e gera o build de produção (sem avisos) |

Os testes incluem:

- **`a11y.spec.ts`**: `axe-core` (WCAG 2.x A/AA + boas práticas) em cada página, incluindo "não encontrada", e exatamente um `<h1>` por página.
- **`core/theme-contrast.spec.ts`**: contraste WCAG AA calculado a partir dos tokens, nos dois temas (texto 4,5:1; interface 3:1), e das cores das categorias.
- **`app-shell.spec.ts`**: link "Ir para o conteúdo", foco e anúncio na troca de página.
- Mapa: rótulos em português, nomes acessíveis de marcadores e grupos.

> O jsdom não calcula layout, então `color-contrast` fica fora do axe dos testes: o contraste é coberto pelos tokens (acima) e pelo axe no navegador real (abaixo).

## Auditoria no navegador real (axe com contraste)

Executada no build de produção, em **8 rotas × 2 temas**: **0 violações** (WCAG 2.2 AA + boas práticas). O que o axe marca como "incompleto" (contraste sobre o gradiente do hero, elementos sobrepostos, atribuição do mapa) está coberto pela auditoria de tokens.

Para repetir:

```powershell
npm run build
# em dois terminais:
cd dist\minas-explorer\browser; python -m http.server 4400
mkdir $env:TEMP\axe; Copy-Item node_modules\axe-core\axe.min.js $env:TEMP\axe\; cd $env:TEMP\axe; python -m http.server 4500
```

No console de `http://localhost:4400`, injete `<script src="http://localhost:4500/axe.min.js">` e rode `await axe.run()`.

## Problemas encontrados e corrigidos

- Link "Ir para o conteúdo" navegava para outra rota (com hash routing, `href="#conteudo"` vira rota).
- Troca de página não movia o foco nem era anunciada: agora o foco vai ao conteúdo e o título é anunciado (`LiveAnnouncer`); a rolagem volta ao topo.
- Páginas sem `<h1>` (roteiros, favoritos, guia de estilo, "não encontrada"/erro) e saltos de nível de título.
- Chips de filtro sem papel `listbox` (`mat-chip-listbox`); ícones de avatar com `role="img"` sem texto (todo `me-icon` é `aria-hidden`).
- Controles do mapa em inglês ("Zoom in", "Close popup"): agora "Aproximar", "Afastar", "Fechar".
- Marcadores e grupos do mapa sem nome acessível (os grupos têm texto visualmente oculto "N destinos agrupados").
- Alvos de toque pequenos (botões do Material de 40 px → 44 px; links de ação de 21 px → 32 px).
- Animações do mapa ignoravam `prefers-reduced-motion`.
- Contraste da categoria "Turismo rural" (4,02:1 → 5,22:1), achado pela auditoria de tokens (Etapa 12).

## Teclado e leitor de tela

Ordem de foco verificada no navegador: link de pular → marca → busca → navegação → tema → filtros → mapa/lista. O mapa tem alternativa completa em lista (todas as ações do mapa existem na lista). Marcadores e controles do Leaflet são focáveis. Foco visível em todo o app (`:focus-visible`).

## Responsividade

Sem rolagem horizontal nem elementos fora da tela em **320, 375, 768, 1024 e 1440 px**, em todas as rotas.

## Desempenho

| Item | Antes | Depois |
|---|---|---|
| Bundle inicial (bruto / transferido) | 565,7 kB / 122,2 kB | 506,2 kB / 121,5 kB |
| Ícones | `@lucide/angular`: 87 kB no bundle inicial (sem tree-shaking) | registro único com `lucide` (SVG puro), só os ícones usados |
| Miniaturas de cards | arquivo de 960 px (cerca de 100 kB) para 88 px exibidos | `srcset` com versão de 480 px (cerca de 30 kB) |
| Fontes | sem `font-display` | `display=swap` (texto aparece logo) |

Outras medidas já existentes: rotas e mapa em chunks lazy (Leaflet só carrega na página inicial), imagens em WebP e `loading="lazy"`.

**Orçamento:** aviso em 600 kB (inicial bruto), erro em 1 MB.

## SEO e compartilhamento

- Título e `meta description` por página (`PageMetaService`), `lang="pt-BR"`, favicon da marca (SVG + PNG), `apple-touch-icon`, `theme-color` por esquema, Open Graph/Twitter básicos.
- **Limitação:** o app usa hash routing e é uma SPA; buscadores indexam principalmente a página inicial, e as páginas de cidade e atração (`/#/cidades/...`) não são rastreadas como páginas separadas. Isso é inerente à hospedagem estática com hash routing; avaliar pré-renderização na Etapa 11.
- `og:image`, `og:url`, `robots.txt` e `sitemap.xml` dependem da URL final de publicação e ficam para a **Etapa 11**, para não publicar URLs que não existem.

## Limitações conhecidas

- Fontes (Fraunces, Inter) vêm do Google Fonts: uma dependência externa e um pequeno custo de privacidade. Alternativa: hospedá-las localmente.
- A atribuição do mapa e os tiles vêm do OpenStreetMap (servidor público, sem SLA).
- Descrições do catálogo são editoriais e carecem de revisão por fonte local (ver [catalogo.md](catalogo.md)).
- Não há teste automatizado de ponta a ponta em navegador; a verificação no navegador real foi manual.
