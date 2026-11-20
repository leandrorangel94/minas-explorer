#!/usr/bin/env node
/**
 * Valida e consolida o catálogo.
 *
 *   public/data/cities/*.json        (1 cidade por arquivo)
 *   public/data/attractions/*.json   (1 atração por arquivo)
 *   public/data/categories.json
 *   public/data/municipalities.json  (índice IBGE; ver prepare-geo-data.mjs)
 *   public/data/regions.json
 *   →  public/data/catalog.json      (gerado; é o que o app lê)
 *
 * Falha (exit 1) se houver qualquer erro de validação. Ver docs/catalogo.md.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const data = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const readJson = async (...p) => JSON.parse(await readFile(join(data, ...p), 'utf8'));
const readDir = async (dir) => {
  const files = (await readdir(join(data, dir))).filter((f) => f.endsWith('.json')).sort();
  return Promise.all(files.map(async (f) => ({ file: `${dir}/${f}`, value: await readJson(dir, f) })));
};

// Retângulo do contorno oficial (IBGE) com pequena folga; barra coordenadas claramente fora de MG.
const BOUNDS = { south: -22.93, north: -14.24, west: -51.05, east: -39.85 };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isUrl = (v) => { try { return ['http:', 'https:'].includes(new URL(v).protocol); } catch { return false; } };

function checkSource(where, s) {
  if (!s || !isStr(s.name) || !isUrl(s.url)) err(where, 'fonte inválida (name e url http(s) obrigatórios)');
}
function checkCoordinates(where, c) {
  if (!c || typeof c.latitude !== 'number' || typeof c.longitude !== 'number') return err(where, 'coordinates inválidas');
  if (c.latitude < BOUNDS.south || c.latitude > BOUNDS.north || c.longitude < BOUNDS.west || c.longitude > BOUNDS.east)
    err(where, `coordenadas fora de Minas Gerais (${c.latitude}, ${c.longitude})`);
}
function checkImage(where, img) {
  if (!isUrl(img?.url) || !isStr(img?.alt)) return err(where, 'imagem precisa de url http(s) e alt');
  for (const k of ['author', 'license', 'sourceUrl', 'attribution'])
    if (!isStr(img[k])) err(where, `imagem sem "${k}" (procedência obrigatória)`);
}
function checkCommon(where, e, ids) {
  if (!isStr(e.id)) err(where, 'id obrigatório');
  else if (ids.has(e.id)) err(where, `id duplicado "${e.id}"`);
  else ids.add(e.id);
  if (!isStr(e.name)) err(where, 'name obrigatório');
  if (!SLUG.test(e.slug ?? '')) err(where, 'slug inválido (minúsculas, números e hífens)');
  if (!isStr(e.description)) err(where, 'description obrigatória');
  if (!DATE.test(e.lastVerifiedAt ?? '')) err(where, 'lastVerifiedAt deve ser AAAA-MM-DD');
  checkCoordinates(where, e.coordinates);
  checkSource(`${where}.coordinatesSource`, e.coordinatesSource);
  if (!Array.isArray(e.sources) || e.sources.length === 0) err(where, 'sources obrigatório (ao menos uma)');
  else e.sources.forEach((s, i) => checkSource(`${where}.sources[${i}]`, s));
}

const [categories, municipalities, regions, cityFiles, attractionFiles] = await Promise.all([
  readJson('categories.json'), readJson('municipalities.json'), readJson('regions.json'),
  readDir('cities'), readDir('attractions'),
]);
const municipalityById = new Map(municipalities.map((m) => [m.id, m]));
const regionIds = new Set(regions.map((r) => r.id));
const categoryIds = new Set();
categories.forEach((c, i) => {
  const w = `categories.json[${i}]`;
  if (!isStr(c.id) || categoryIds.has(c.id)) err(w, 'id ausente ou duplicado'); else categoryIds.add(c.id);
  for (const k of ['name', 'slug', 'description', 'icon', 'color']) if (!isStr(c[k])) err(w, `"${k}" obrigatório`);
});

const cityIds = new Set();
const citySlugs = new Set();
const cities = cityFiles.map(({ file, value: c }) => {
  checkCommon(file, c, cityIds);
  const m = municipalityById.get(c.id);
  if (!m) err(file, `id "${c.id}" não existe em municipalities.json (use o código IBGE)`);
  else {
    if (m.name !== c.name) err(file, `name "${c.name}" difere do município IBGE "${m.name}"`);
    if (m.regionId !== c.regionId) err(file, `regionId "${c.regionId}" difere do IBGE "${m.regionId}"`);
  }
  if (!regionIds.has(c.regionId)) err(file, `regionId "${c.regionId}" inexistente`);
  if (citySlugs.has(c.slug)) err(file, `slug duplicado "${c.slug}"`); else citySlugs.add(c.slug);
  if (c.coverImage) checkImage(`${file}.coverImage`, c.coverImage);
  return c;
});

const attractionIds = new Set();
const attractionSlugs = new Set();
const attractions = attractionFiles.map(({ file, value: a }) => {
  checkCommon(file, a, attractionIds);
  if (!cityIds.has(a.cityId)) err(file, `cityId "${a.cityId}" não existe em cities/`);
  if (!categoryIds.has(a.categoryId)) err(file, `categoryId "${a.categoryId}" não existe em categories.json`);
  if (typeof a.featured !== 'boolean') err(file, 'featured deve ser boolean');
  if (!Array.isArray(a.tags)) err(file, 'tags deve ser array');
  if (!Array.isArray(a.images)) err(file, 'images deve ser array (pode ser vazio)');
  else a.images.forEach((img, i) => checkImage(`${file}.images[${i}]`, img));
  const key = `${a.cityId}/${a.slug}`;
  if (attractionSlugs.has(key)) err(file, `slug duplicado na cidade "${key}"`); else attractionSlugs.add(key);
  if (a.practicalInfo) {
    checkSource(`${file}.practicalInfo.source`, a.practicalInfo.source);
    if (!DATE.test(a.practicalInfo.verifiedAt ?? '')) err(file, 'practicalInfo.verifiedAt deve ser AAAA-MM-DD');
  }
  return a;
});

if (errors.length) {
  console.error(`Catálogo inválido (${errors.length} erro(s)):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR');
await writeFile(join(data, 'catalog.json'),
  JSON.stringify({ cities: cities.sort(byName), attractions: attractions.sort(byName) }, null, 2) + '\n');
console.log(`OK: ${cities.length} cidades, ${attractions.length} atrações, ${categories.length} categorias.`);
