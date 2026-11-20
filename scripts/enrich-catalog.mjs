#!/usr/bin/env node
/**
 * Enriquecimento OFFLINE do catálogo com fontes abertas e gratuitas (sem chave de API):
 *   - Wikipedia (pt) → descrição e curiosidades (CC BY-SA 4.0, com atribuição)
 *   - OpenStreetMap via Overpass → horário, ingresso, acessibilidade, contato e hospedagens próximas (ODbL)
 * Resultado: public/data/enrichment.json (lido pelo app em tempo de execução).
 *
 * Uso:  node scripts/enrich-catalog.mjs [--only=<id>] [--force]
 * Sem --force, itens já presentes no arquivo são preservados (script retomável).
 * Faz uma requisição por vez, com pausa, e envia só um User-Agent genérico.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'public', 'data');
const OUT = join(DATA, 'enrichment.json');
const UA = 'minas-explorer-enrichment/1.0 (projeto open source de guia turístico)';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const force = args.includes('--force');
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const loadDir = (d) => readdirSync(join(DATA, d)).filter((f) => f.endsWith('.json')).flatMap((f) => {
  const j = readJson(join(DATA, d, f));
  return Array.isArray(j) ? j : [j];
});
const cities = loadDir('cities');
const attractions = loadDir('attractions');
const cityById = new Map(cities.map((c) => [c.id, c]));

async function getJson(url, init = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers ?? {}) } });
      if (res.status === 429 || res.status >= 500) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { await sleep(3000 * (i + 1)); }
  }
  return null;
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const haversine = (a, b, c, d) => {
  const R = 6371000, rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const words = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2 && !['de', 'do', 'da', 'dos', 'das'].includes(w)));
const similar = (a, b) => {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return false;
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / Math.min(A.size, B.size) >= 0.75;
};

// ---------- Wikipedia ----------
async function wikipedia(name, cityName, lat, lon) {
  // Candidatos: páginas com coordenadas próximas (geosearch) e busca textual como reserva.
  const geo = await getJson(`https://pt.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lon}&gsradius=${cityName ? 3000 : 8000}&gslimit=30&format=json`);
  await sleep(400);
  const text = await getJson(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srlimit=4&format=json&srsearch=${encodeURIComponent(`${name} ${cityName ?? ''} Minas Gerais`.trim())}`);
  await sleep(400);
  const candidates = [
    ...(geo?.query?.geosearch ?? []).filter((g) => similar(g.title, name)).map((g) => ({ key: g.title.replace(/ /g, '_') })),
    ...(text?.query?.search ?? []).map((r) => ({ key: r.title.replace(/ /g, '_') })),
  ];
  for (const page of candidates) {
    const sum = await getJson(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`);
    await sleep(400);
    if (!sum || sum.type !== 'standard' || !sum.extract) continue;
    // Guarda de segurança: só aceita se as coordenadas da página estiverem a ≤ 40 km do destino
    // ou, sem coordenadas, se o título for parecido com o nome.
    const c = sum.coordinates;
    const near = c ? haversine(lat, lon, c.lat, c.lon) <= 40000 : similar(sum.title, name);
    if (!near || (c && !similar(sum.title, name) && !similar(sum.title, cityName ?? ''))) continue;
    const full = await getJson(`https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&format=json&titles=${encodeURIComponent(sum.title)}`);
    const extract = Object.values(full?.query?.pages ?? {})[0]?.extract ?? sum.extract;
    const sentences = extract.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).map((s) => s.trim()).filter((s) => s.length >= 40 && s.length <= 260);
    const description = sentences.slice(0, 2).join(' ');
    const curiosities = sentences.slice(2, 5);
    if (!description) continue;
    return {
      description, curiosities,
      source: { name: `Wikipédia: ${sum.title}`, url: sum.content_urls?.desktop?.page ?? `https://pt.wikipedia.org/wiki/${encodeURIComponent(page.key)}`, license: 'CC BY-SA 4.0', retrievedAt: today },
    };
  }
  return null;
}

// ---------- Overpass ----------
async function overpass(query) {
  return getJson(OVERPASS, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}` });
}
const osmUrl = (e) => `https://www.openstreetmap.org/${e.type}/${e.id}`;
const pt = (e) => e.tags?.['name:pt'] ?? e.tags?.name ?? '';

async function osmPractical(name, lat, lon) {
  const j = await overpass(`[out:json][timeout:25];nwr(around:400,${lat},${lon})["name"];out tags center 60;`);
  const hit = (j?.elements ?? []).find((e) => pt(e) && similar(pt(e), name) && (e.tags.opening_hours || e.tags.fee || e.tags.wheelchair || e.tags.phone || e.tags['contact:phone'] || e.tags.website || e.tags['contact:website']));
  if (!hit) return null;
  const t = hit.tags;
  const out = {
    openingHours: t.opening_hours, fee: t.fee, wheelchair: t.wheelchair,
    phone: t.phone ?? t['contact:phone'], website: t.website ?? t['contact:website'],
    source: { name: 'OpenStreetMap', url: osmUrl(hit), license: 'ODbL 1.0', retrievedAt: today },
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

const LODGING = 'hotel|guest_house|hostel|motel|chalet|apartment|camp_site';
const LODGING_LABEL = { hotel: 'Hotel', guest_house: 'Pousada / casa de hóspedes', hostel: 'Hostel', motel: 'Motel', chalet: 'Chalé', apartment: 'Apartamentos', camp_site: 'Camping' };

async function osmLodging(lat, lon) {
  for (const radius of [3000, 10000, 25000]) {
    const j = await overpass(`[out:json][timeout:30];nwr(around:${radius},${lat},${lon})["tourism"~"^(${LODGING})$"]["name"];out tags center 80;`);
    await sleep(1500);
    const list = (j?.elements ?? [])
      .map((e) => {
        const c = e.center ?? e;
        if (c.lat == null) return null;
        return {
          name: e.tags.name, type: LODGING_LABEL[e.tags.tourism] ?? 'Hospedagem', distanceMeters: Math.round(haversine(lat, lon, c.lat, c.lon)),
          website: e.tags.website ?? e.tags['contact:website'], phone: e.tags.phone ?? e.tags['contact:phone'], osmUrl: osmUrl(e),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
    const seen = new Set(), top = [];
    for (const l of list) { const k = norm(l.name); if (!seen.has(k)) { seen.add(k); top.push(l); } if (top.length === 3) break; }
    if (top.length === 3 || radius === 25000) {
      return top.length ? { items: top.map((l) => Object.fromEntries(Object.entries(l).filter(([, v]) => v !== undefined))), source: { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright', license: 'ODbL 1.0', retrievedAt: today } } : null;
    }
  }
  return null;
}

// ---------- principal ----------
const result = existsSync(OUT) ? readJson(OUT) : { generatedAt: today, items: {} };
const targets = [
  ...cities.map((c) => ({ id: c.id, name: c.name, cityName: null, ...c.coordinates, kind: 'city' })),
  ...attractions.map((a) => ({ id: a.id, name: a.name, cityName: cityById.get(a.cityId)?.name, ...a.coordinates, kind: 'attraction' })),
].filter((t) => (only ? t.id === only : true));

let n = 0;
for (const t of targets) {
  n++;
  if (result.items[t.id] && !force) continue;
  process.stdout.write(`[${n}/${targets.length}] ${t.name}… `);
  const item = {};
  const wiki = await wikipedia(t.name, t.cityName, t.latitude, t.longitude); await sleep(800);
  if (wiki) item.about = wiki;
  if (t.kind === 'attraction') { const p = await osmPractical(t.name, t.latitude, t.longitude); await sleep(1500); if (p) item.practical = p; }
  const l = await osmLodging(t.latitude, t.longitude); await sleep(1500);
  if (l) item.lodging = l;
  result.items[t.id] = item;
  result.generatedAt = today;
  writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n');
  console.log(`${item.about ? 'sobre ' : ''}${item.practical ? 'prático ' : ''}${item.lodging ? `pousadas(${item.lodging.items.length})` : ''}` || 'nada encontrado');
}
console.log(`Concluído: ${Object.keys(result.items).length} itens em ${OUT}`);
