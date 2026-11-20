#!/usr/bin/env node
/**
 * Prepara os dados geográficos de Minas Gerais a partir da API pública do IBGE.
 *
 * Uso:
 *   node scripts/prepare-geo-data.mjs               # baixa da API do IBGE
 *   node scripts/prepare-geo-data.mjs --from <dir>  # usa arquivos já baixados (nomes abaixo)
 *
 * Arquivos de origem (nomes usados em --from):
 *   mg-intermediaria.geojson, regioes-intermediarias.json, municipios.json, mg-municipios.geojson
 *
 * Saídas (em public/data):
 *   geo/minas-gerais.geo.json, geo/municipios.geo.json (divisas municipais), regions.json, municipalities.json
 *
 * Documentação da fonte e do tratamento: docs/dados-geograficos.md
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://servicodados.ibge.gov.br/api';
const SOURCES = {
  'mg-intermediaria.geojson': `${API}/v3/malhas/estados/31?formato=application/vnd.geo%2Bjson&qualidade=intermediaria`,
  'regioes-intermediarias.json': `${API}/v1/localidades/estados/31/regioes-intermediarias`,
  'municipios.json': `${API}/v1/localidades/estados/31/municipios`,
  'mg-municipios.geojson': `${API}/v3/malhas/estados/31?intrarregiao=municipio&formato=application/vnd.geo%2Bjson&qualidade=minima`,
};

/** Correções de grafia sobre o texto retornado pela API (documentadas em docs/dados-geograficos.md). */
const NAME_FIXES = { 'Juíz de Fora': 'Juiz de Fora' };

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => join(root, 'public', 'data', ...p);

const fromIdx = process.argv.indexOf('--from');
const fromDir = fromIdx > -1 ? process.argv[fromIdx + 1] : null;

async function load(name) {
  if (fromDir) return JSON.parse(await readFile(join(fromDir, name), 'utf8'));
  const res = await fetch(SOURCES[name]);
  if (!res.ok) throw new Error(`Falha ao baixar ${name}: HTTP ${res.status}`);
  return res.json();
}

const fixName = (n) => NAME_FIXES[n] ?? n;
const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function assert(cond, msg) {
  if (!cond) throw new Error(`Validação falhou: ${msg}`);
}

const [geo, rawRegions, rawMunicipalities, muniMesh] = await Promise.all(Object.keys(SOURCES).map(load));

// --- Contorno estadual -------------------------------------------------------
assert(geo.type === 'FeatureCollection' && geo.features.length === 1, 'contorno deve ter 1 feature');
assert(geo.features[0].properties.codarea === '31', 'codarea do contorno deve ser 31 (MG)');

// --- Divisas municipais ---------------------------------------------------------
assert(muniMesh.type === 'FeatureCollection' && muniMesh.features.length === 853, 'malha municipal deve ter 853 features');

// --- Regiões -----------------------------------------------------------------
const regions = rawRegions
  .map((r) => ({ id: String(r.id), ibgeCode: r.id, name: fixName(r.nome), slug: slugify(fixName(r.nome)), municipalityIds: [] }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const regionById = new Map(regions.map((r) => [r.id, r]));
assert(regions.length === 13, `esperadas 13 regiões, recebidas ${regions.length}`);

// --- Municípios --------------------------------------------------------------
const municipalities = rawMunicipalities
  .map((m) => {
    const regionId = String(m['regiao-imediata']['regiao-intermediaria'].id);
    return { id: String(m.id), name: m.nome, slug: slugify(m.nome), regionId };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

assert(municipalities.length === 853, `esperados 853 municípios, recebidos ${municipalities.length}`);
assert(new Set(municipalities.map((m) => m.id)).size === 853, 'ids de município duplicados');
assert(new Set(municipalities.map((m) => m.slug)).size === 853, 'slugs de município duplicados');
for (const m of municipalities) {
  const region = regionById.get(m.regionId);
  assert(region, `município ${m.name} aponta para região inexistente ${m.regionId}`);
  region.municipalityIds.push(m.id);
}

await mkdir(out('geo'), { recursive: true });
await writeFile(out('geo', 'minas-gerais.geo.json'), JSON.stringify(geo));
await writeFile(out('geo', 'municipios.geo.json'), JSON.stringify({
  type: 'FeatureCollection',
  features: muniMesh.features.map((f) => ({ type: 'Feature', properties: { id: f.properties.codarea }, geometry: f.geometry })),
}));
await writeFile(out('regions.json'), JSON.stringify(regions, null, 2) + '\n');
await writeFile(out('municipalities.json'), JSON.stringify(municipalities) + '\n');
console.log(`OK: contorno (1 feature), malha de 853 municípios, ${regions.length} regiões, ${municipalities.length} municípios.`);
