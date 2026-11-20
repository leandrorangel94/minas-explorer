#!/usr/bin/env node
/**
 * Lista CANDIDATOS a novos destinos em Minas Gerais a partir do Wikidata (+ licença das fotos no
 * Wikimedia Commons). NÃO altera o catálogo: gera `candidates/candidates.json` e
 * `candidates/candidates.md` para revisão humana. Depois de aprovar, o item vira um JSON em
 * `public/data/attractions/` (com foto local) e passa por `npm run catalog`.
 *
 * Uso:  node scripts/find-candidates.mjs [--category=waterfall] [--limit=300] [--no-licenses]
 * Fontes: Wikidata (CC0) e Wikimedia Commons. Uma consulta por vez, com pausa e User-Agent genérico.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'public', 'data');
const OUT_DIR = join(ROOT, 'candidates');
const UA = 'minas-explorer-candidates/1.0 (projeto open source de guia turístico)';
const args = process.argv.slice(2);
const argv = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const onlyCategory = argv('category');
const LIMIT = Number(argv('limit') ?? 300);
const checkLicenses = !args.includes('--no-licenses');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALLOWED = /^(Domínio público|Public domain|CC0( 1\.0)?|CC BY( \d\.\d)?( [a-zA-Z]{2})?|CC BY-SA( \d\.\d)?( [a-zA-Z]{2})?)$/;

/**
 * Categoria do app → classes do Wikidata (inclui subclasses via P279*).
 * Revise/ajuste: classes muito amplas trazem ruído; muito estreitas perdem itens.
 */
const CATEGORIES = {
  waterfall: { classes: ['Q34038'], note: 'cachoeira' },
  museum: { classes: ['Q33506'], note: 'museu' },
  church: { classes: ['Q16970', 'Q2977', 'Q108325'], note: 'igreja, catedral, capela' },
  park: { classes: ['Q46169', 'Q473972', 'Q22698', 'Q3591464'], note: 'parque nacional/estadual, área protegida, parque' },
  mountain: { classes: ['Q8502', 'Q46831', 'Q1070990'], note: 'montanha, serra, mirante' },
  water: { classes: ['Q23397', 'Q150784', 'Q4022', 'Q131681'], note: 'lago, cânion, rio, represa' },
  'historic-heritage': { classes: ['Q839954', 'Q4989906', 'Q41176', 'Q1081138'], note: 'sítio arqueológico, monumento, edifício histórico', heritage: true },
  rural: { classes: ['Q820477', 'Q131596'], note: 'mina, fazenda' },
  other: { classes: ['Q35509', 'Q1107656'], note: 'caverna, jardim' },
};

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const loadDir = (d) => readdirSync(join(DATA, d)).filter((f) => f.endsWith('.json')).flatMap((f) => {
  const j = readJson(join(DATA, d, f));
  return Array.isArray(j) ? j : [j];
});

// Já presentes no catálogo (por QID citado nas fontes) → não são candidatos.
const known = new Set();
for (const f of [...readdirSync(join(DATA, 'attractions')).map((f) => join(DATA, 'attractions', f)), ...readdirSync(join(DATA, 'cities')).map((f) => join(DATA, 'cities', f))])
  for (const m of readFileSync(f, 'utf8').matchAll(/Q\d{3,}/g)) known.add(m[0]);
const knownNames = new Set(loadDir('attractions').map((a) => a.name.toLowerCase()));
const municipalities = readJson(join(DATA, 'municipalities.json'));
const muniByIbge = new Map(municipalities.map((m) => [m.id, m]));
const catalogCityIds = new Set(loadDir('cities').map((c) => c.id));

async function sparql(query) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
      if (res.status === 429 || res.status >= 500) { await sleep(8000 * (i + 1)); continue; }
      if (!res.ok) return null;
      return (await res.json()).results.bindings;
    } catch { await sleep(4000 * (i + 1)); }
  }
  return null;
}

const queryFor = (cat, cfg) => `
SELECT ?item ?itemLabel ?coord ?image ?ibge ?heritage WHERE {
  VALUES ?class { ${cfg.classes.map((q) => `wd:${q}`).join(' ')} }
  ?item wdt:P31/wdt:P279* ?class .
  ?item wdt:P131 ?city .
  ?city wdt:P1585 ?ibge .
  FILTER(STRSTARTS(?ibge, "31"))
  ?item wdt:P625 ?coord .
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P1435 ?heritage }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
} LIMIT ${LIMIT * 3}`;

const parseCoord = (wkt) => {
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(wkt ?? '');
  return m ? { latitude: Number(Number(m[2]).toFixed(6)), longitude: Number(Number(m[1]).toFixed(6)) } : null;
};

async function commonsLicense(fileNames) {
  const out = new Map();
  for (let i = 0; i < fileNames.length; i += 40) {
    const batch = fileNames.slice(i, i + 40);
    const titles = batch.map((n) => `File:${n}`).join('|');
    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&titles=${encodeURIComponent(titles)}`, { headers: { 'User-Agent': UA } });
      const j = await res.json();
      for (const p of Object.values(j.query?.pages ?? {})) {
        const md = p.imageinfo?.[0]?.extmetadata;
        if (!md) continue;
        const name = p.title.replace(/^File:/, '');
        out.set(name, { license: md.LicenseShortName?.value ?? '', author: (md.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim() });
      }
    } catch { /* mantém sem licença */ }
    await sleep(800);
  }
  return out;
}

const candidates = new Map();
for (const [cat, cfg] of Object.entries(CATEGORIES)) {
  if (onlyCategory && cat !== onlyCategory) continue;
  process.stdout.write(`${cat} (${cfg.note})… `);
  const rows = await sparql(queryFor(cat, cfg));
  await sleep(2500);
  if (!rows) { console.log('falhou'); continue; }
  let added = 0;
  for (const r of rows) {
    const qid = r.item.value.split('/').pop();
    if (known.has(qid)) continue;
    const name = r.itemLabel?.value;
    if (!name || /^Q\d+$/.test(name) || knownNames.has(name.toLowerCase())) continue;
    const coords = parseCoord(r.coord?.value);
    if (!coords) continue;
    const cur = candidates.get(qid) ?? { id: qid, name, categoryId: cat, coordinates: coords, wikidata: `https://www.wikidata.org/wiki/${qid}`, heritage: false };
    if (r.image && !cur.imageFile) cur.imageFile = decodeURIComponent(r.image.value.split('/Special:FilePath/').pop());
    if (r.heritage) cur.heritage = true;
    if (r.ibge && muniByIbge.has(r.ibge.value) && !cur.cityId) cur.cityId = r.ibge.value;
    if (!candidates.has(qid)) added++;
    candidates.set(qid, cur);
  }
  console.log(`${added} novos`);
}

let list = [...candidates.values()].filter((c) => c.cityId);
if (checkLicenses) {
  console.log('Verificando licenças das fotos no Commons…');
  const files = [...new Set(list.map((c) => c.imageFile).filter(Boolean))];
  const lic = await commonsLicense(files);
  for (const c of list) {
    const l = c.imageFile ? lic.get(c.imageFile) : undefined;
    if (l) { c.imageLicense = l.license; c.imageAuthor = l.author; c.imageOk = ALLOWED.test(l.license); }
    if (c.imageFile) c.imagePage = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.imageFile)}`;
  }
}
// Mais úteis primeiro: com foto liberada, tombados, cidade já no catálogo.
const score = (c) => (c.imageOk ? 4 : 0) + (c.heritage ? 2 : 0) + (catalogCityIds.has(c.cityId) ? 1 : 0);
list = list.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'pt-BR')).map((c) => ({ ...c, cityName: muniByIbge.get(c.cityId)?.name }));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'candidates.json'), JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source: 'Wikidata (CC0) e Wikimedia Commons', items: list }, null, 2) + '\n');
const md = ['# Candidatos a novos destinos', '', `Gerado em ${new Date().toISOString().slice(0, 10)}. Revise antes de cadastrar: ${list.length} itens.`, '',
  '| Nome | Município | Categoria | Foto liberada | Tombado | Wikidata |', '|---|---|---|---|---|---|',
  ...list.map((c) => `| ${c.name} | ${c.cityName} | ${c.categoryId} | ${c.imageOk ? 'sim (' + c.imageLicense + ')' : c.imageFile ? 'não (' + (c.imageLicense || '?') + ')' : 'sem foto'} | ${c.heritage ? 'sim' : ''} | [${c.id}](${c.wikidata}) |`)];
writeFileSync(join(OUT_DIR, 'candidates.md'), md.join('\n') + '\n');
console.log(`${list.length} candidatos (com município de MG) em candidates/. Itens sem município reconhecido foram descartados.`);
