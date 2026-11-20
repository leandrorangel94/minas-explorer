import categories from '../../../public/data/categories.json';
import { readFileSync } from 'node:fs';

// Lê o arquivo de tokens real (o teste roda em Node, com a raiz do projeto como diretório atual).
const tokensScss = readFileSync('src/styles/_tokens.scss', 'utf8');

/**
 * Auditoria de contraste (WCAG 2.x) calculada a partir dos próprios tokens de _tokens.scss.
 * Texto: mínimo 4,5:1 (AA). Elementos de interface e ícones: mínimo 3:1.
 */

type Tokens = Record<string, string>;

/** Extrai o corpo `{ ... }` que começa no marcador (com chaves balanceadas). */
function block(source: string, marker: string): string {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`bloco não encontrado: ${marker}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error('chaves desbalanceadas');
}

function parse(body: string): Tokens {
  const out: Tokens = {};
  for (const m of body.matchAll(/--me-([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const light = parse(block(tokensScss, '\n:root {'));
const dark = { ...light, ...parse(block(tokensScss, '@mixin dark-tokens')) };

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (hex: string) => { const [r, g, b] = rgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** color-mix(in srgb, cor (100% - p), white p) */
const lighten = (hex: string, percent: number) =>
  '#' + rgb(hex).map((c) => Math.round(c * (1 - percent / 100) + 255 * (percent / 100)).toString(16).padStart(2, '0')).join('');

for (const [name, t] of [['claro', light], ['escuro', dark]] as const) {
  describe(`Contraste AA: tema ${name}`, () => {
    const text: [string, string, string][] = [
      ['ink', 'offwhite', 'texto no fundo da página'],
      ['ink', 'surface', 'texto em cards'],
      ['ink', 'sage-light', 'texto em tags e chips'],
      ['muted', 'offwhite', 'texto secundário na página'],
      ['muted', 'surface', 'texto secundário em cards'],
      ['muted', 'sage-light', 'texto secundário no hero (início)'],
      ['muted', 'sand', 'texto secundário no hero (fim)'],
      ['heading', 'offwhite', 'títulos'],
      ['heading', 'surface', 'títulos em cards'],
      ['heading', 'sage-light', 'títulos em notas e hero'],
      ['forest', 'offwhite', 'links na página'],
      ['forest', 'surface', 'links em cards'],
      ['forest', 'sage-light', 'link/nav ativo sobre fundo suave'],
      ['forest', 'sand', 'eyebrow do hero (fim)'],
      ['on-primary', 'primary', 'texto de botão primário'],
      ['on-forest', 'primary', 'selo do contador e grupos do mapa'],
      ['footer-text', 'footer-bg', 'texto do rodapé'],
      ['on-footer', 'footer-bg', 'links do rodapé e link de pular'],
      ['warn-fg', 'warn-bg', 'avisos'],
    ];
    for (const [fg, bg, what] of text) {
      it(`${what}: ${fg} sobre ${bg} ≥ 4,5:1`, () => {
        expect(contrast(t[fg], t[bg]), `${t[fg]} sobre ${t[bg]}`).toBeGreaterThanOrEqual(4.5);
      });
    }

    const ui: [string, string, string][] = [
      ['focus', 'offwhite', 'anel de foco na página'],
      ['focus', 'surface', 'anel de foco em cards'],
      ['focus', 'sage-light', 'anel de foco em fundos suaves'],
      ['danger', 'surface', 'coração de favorito'],
      ['muted', 'sage-light', 'ícones em placeholders'],
    ];
    for (const [fg, bg, what] of ui) {
      it(`${what}: ${fg} sobre ${bg} ≥ 3:1`, () => {
        expect(contrast(t[fg], t[bg]), `${t[fg]} sobre ${t[bg]}`).toBeGreaterThanOrEqual(3);
      });
    }

    const lift = parseFloat(t['cat-lighten']);
    for (const cat of categories) {
      it(`categoria "${cat.name}": rótulo (texto) e marcador ≥ 4,5:1 sobre o card`, () => {
        const shown = lighten(cat.color, lift);
        expect(contrast(shown, t['surface']), `${shown} sobre ${t['surface']}`).toBeGreaterThanOrEqual(4.5);
      });
      it(`categoria "${cat.name}": ícone do marcador selecionado ≥ 4,5:1`, () => {
        expect(contrast(t['on-marker'], lighten(cat.color, lift))).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}

describe('tokens', () => {
  it('o tema escuro redefine todos os tokens de cor do claro (nenhum ficou para trás)', () => {
    const lightColors = Object.entries(light).filter(([, v]) => /^#[0-9a-f]{6}$/i.test(v)).map(([k]) => k);
    const darkOnly = parse(block(tokensScss, '@mixin dark-tokens'));
    // Tokens que podem ser iguais nos dois temas (cores fixas de marca/estado)
    const sameOk = new Set(['on-footer']);
    for (const k of lightColors) {
      if (sameOk.has(k)) continue;
      expect(k in darkOnly, `--me-${k} não tem valor no tema escuro`).toBe(true);
    }
  });
});
