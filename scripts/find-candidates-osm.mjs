#!/usr/bin/env node
/**
 * Pesquisa por TEMA em Minas Gerais no OpenStreetMap (Overpass) e sugere fotos livres no
 * Wikimedia Commons por proximidade. Não altera o catálogo nem baixa imagens: gera
 * `candidates/osm-<tema>.json` e `.md` para revisão/aprovação.
 *
 * Uso:  node scripts/find-candidates-osm.mjs <waterfall|cave|park|historic> [--limit=40]
 * Fontes: OpenStreetMap (ODbL) e Wikimedia Commons. Uma requisição por vez, com pausa.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'public', 'data');
const OUT = join(ROOT, 'candidates');
const UA = 'minas-explorer-candidates/1.0 (projeto open source de guia turístico)';
const theme = process.argv[2];
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.slice(8) ?? 40);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALLOWED = /^(Domínio público|Public domain|CC0( 1\.0)?|CC BY( \d\.\d)?( [a-zA-Z]{2})?|CC BY-SA( \d\.\d)?( [a-zA-Z]{2})?)$/;

const THEMES = {
  waterfall: { categoryId: 'waterfall', filter: '["waterway"="waterfall"]', radius: 1500 },
  cave: { categoryId: 'other', filter: '["natural"="cave_entrance"]', radius: 1500 },
  park: { categoryId: 'park', filter: '["boundary"~"^(national_park|protected_area)$"]["name"~"^(Parque|Reserva|Estação|Monumento|Floresta|Refúgio|Área de Proteção)"]', radius: 3000 },
  historic: { categoryId: 'historic-heritage', filter: '["historic"~"^(monument|memorial|building|castle|ruins|archaeological_site|manor|church)$"]["heritage"]', radius: 600 },
};
const cfg = THEMES[theme];
if (!cfg) { console.error(`Tema inválido. Use: ${Object.keys(THEMES).join(', ')}`); process.exit(1); }

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const catalog = readJson(join(DATA, 'catalog.json'));
const knownNames = new Set(catalog.attractions.map((a) => norm(a.name)));
const cityByIbge = new Map(readJson(join(DATA, 'municipalities.json')).map((m) => [m.id, m]));
const catalogCityIds = new Set(catalog.cities.map((c) => c.id));
const mesh = readJson(join(DATA, 'geo', 'municipios.geo.json'));

function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

function inRing(x, y, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function municipalityOf(lon, lat) {
  for (const f of mesh.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    if (polys.some((p) => inRing(lon, lat, p[0]))) return f.properties.id;
  }
  return null;
}

async function getJson(url, init = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init.headers ?? {}) } });
      if (res.status === 429 || res.status >= 500) { await sleep(8000 * (i + 1)); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { await sleep(4000 * (i + 1)); }
  }
  return null;
}

console.log(`Overpass: ${theme}…`);
const query = `[out:json][timeout:120];area["ISO3166-2"="BR-MG"]->.a;nwr${cfg.filter}["name"](area.a);out center tags 1500;`;
const op = await getJson('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}` });
if (!op) { console.error('Overpass falhou'); process.exit(1); }

const seen = new Set();
let items = [];
for (const e of op.elements) {
  const c = e.center ?? e;
  if (c.lat == null) continue;
  const name = e.tags.name?.trim();
  if (!name || seen.has(norm(name)) || knownNames.has(norm(name))) continue;
  seen.add(norm(name));
  const ibge = municipalityOf(c.lon, c.lat);
  if (!ibge) continue;
  items.push({
    name, categoryId: cfg.categoryId, cityId: ibge, cityName: cityByIbge.get(ibge)?.name, inCatalogCity: catalogCityIds.has(ibge),
    coordinates: { latitude: Number(c.lat.toFixed(6)), longitude: Number(c.lon.toFixed(6)) },
    osm: `https://www.openstreetmap.org/${e.type}/${e.id}`, wikidata: e.tags.wikidata, wikipedia: e.tags.wikipedia,
    heritage: !!(e.tags.heritage || e.tags['heritage:operator']),
  });
}
console.log(`${items.length} itens com nome em municípios de MG (antes das fotos).`);

// Fotos: Commons por proximidade; prefere arquivos cujo título lembra o nome.
// Palavras genéricas não provam que a foto é do lugar (ex.: toda "gruta" casaria com qualquer gruta).
const GENERIC = new Set(['gruta', 'grutas', 'caverna', 'lapa', 'cachoeira', 'cachoeiras', 'parque', 'estadual', 'nacional', 'municipal', 'igreja', 'matriz', 'capela', 'santa', 'santo', 'senhora', 'nossa', 'minas', 'gerais', 'brasil', 'view', 'panoramio', 'entrada', 'vista', 'parcial', 'area', 'protecao', 'ambiental', 'reserva', 'serra', 'morro', 'pedra', 'mina', 'buraco', 'poco', 'trilha', 'mirante', 'river']);
const words = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3 && !GENERIC.has(w)));
for (const it of items) {
  const g = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gsnamespace=6&gscoord=${it.coordinates.latitude}%7C${it.coordinates.longitude}&gsradius=${cfg.radius}&gslimit=15&format=json`);
  await sleep(350);
  const files = (g?.query?.geosearch ?? []).map((x) => x.title.replace(/^File:/, '')).filter((n) => /\.(jpe?g|png|webp)$/i.test(n));
  const W = words(it.name);
  const scored = files.map((n) => ({ n, s: [...words(n)].filter((w) => W.has(w)).length }));
  const named = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  it.photoCandidates = (named.length ? named : []).slice(0, 3).map((x) => x.n);
  it.nearbyOnly = false; // só aceitamos foto cujo título cita o lugar (fotos apenas "próximas" são ignoradas)
}
// Licenças
const allFiles = [...new Set(items.flatMap((i) => i.photoCandidates))];
const lic = new Map();
for (let i = 0; i < allFiles.length; i += 40) {
  const batch = allFiles.slice(i, i + 40);
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata%7Curl%7Csize&format=json&titles=${encodeURIComponent(batch.map((n) => `File:${n}`).join('|'))}`);
  for (const p of Object.values(j?.query?.pages ?? {})) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    lic.set(p.title.replace(/^File:/, ''), {
      license: ii.extmetadata?.LicenseShortName?.value ?? '', author: (ii.extmetadata?.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(),
      width: ii.width, page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.title.replace(/^File:/, '').replace(/ /g, '_'))}`,
    });
  }
  await sleep(600);
}
for (const it of items) {
  it.photos = it.photoCandidates.map((n) => ({ file: n, ...(lic.get(n) ?? {}), ok: !!lic.get(n) && ALLOWED.test(lic.get(n).license) && (lic.get(n).width ?? 0) >= 800 })).filter((p) => p.ok);
  delete it.photoCandidates;
}
const score = (i) => (i.photos.length && !i.nearbyOnly ? 8 : i.photos.length ? 3 : 0) + (i.wikidata ? 2 : 0) + (i.inCatalogCity ? 1 : 0) + (i.heritage ? 1 : 0);
items = items.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'pt-BR'));

mkdirSync(OUT, { recursive: true });
const date = new Date().toISOString().slice(0, 10);
writeFileSync(join(OUT, `osm-${theme}.json`), JSON.stringify({ generatedAt: date, source: 'OpenStreetMap (ODbL) e Wikimedia Commons', items }, null, 2) + '\n');
const md = [`# Candidatos (OSM): ${theme}`, '', `Gerado em ${date}. ${items.length} itens; mostrando os ${Math.min(LIMIT, items.length)} primeiros.`, '',
  '| Nome | Município | No catálogo? | Foto (título cita o local?) | Licença | OSM |', '|---|---|---|---|---|---|',
  ...items.slice(0, LIMIT).map((i) => `| ${i.name} | ${i.cityName} | ${i.inCatalogCity ? 'cidade já cadastrada' : 'cidade nova'} | ${i.photos[0] ? (i.nearbyOnly ? 'próxima (conferir)' : 'sim') + ': ' + i.photos[0].file : 'sem foto'} | ${i.photos[0]?.license ?? ''} | [osm](${i.osm}) |`)];
writeFileSync(join(OUT, `osm-${theme}.md`), md.join('\n') + '\n');
console.log(`Pronto: candidates/osm-${theme}.md (${items.filter((i) => i.photos.length && !i.nearbyOnly).length} com foto que cita o local).`);
