#!/usr/bin/env node
/**
 * Aplica a URL pública do site nos arquivos do build (dist/minas-explorer/browser):
 * substitui o marcador `%SITE_URL%` em index.html (canonical, og:url, og:image, twitter:image),
 * robots.txt e sitemap.xml.
 *
 * A URL vem, nesta ordem, de:
 *   1. SITE_URL                          (definida manualmente, ex.: domínio próprio)
 *   2. VERCEL_PROJECT_PRODUCTION_URL     (a Vercel define sozinha em todo build; sem "https://")
 *   3. https://minas-explorer.vercel.app (padrão, usado em build local)
 *
 * Roda automaticamente ao final de `npm run build`. Ver docs/publicacao.md.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DIST = resolve(process.argv[2] ?? 'dist/minas-explorer/browser');
const FILES = ['index.html', 'robots.txt', 'sitemap.xml'];
const TOKEN = '%SITE_URL%';
const FALLBACK = 'https://minas-explorer.vercel.app';

export function resolveSiteUrl(env = process.env) {
  const raw = env.SITE_URL?.trim() || env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || FALLBACK;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol); // lança erro se inválida
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`; // sem barra final
}

const siteUrl = resolveSiteUrl();
const source = process.env.SITE_URL ? 'SITE_URL' : process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'VERCEL_PROJECT_PRODUCTION_URL' : 'padrão';

for (const name of FILES) {
  const file = join(DIST, name);
  const text = await readFile(file, 'utf8');
  if (!text.includes(TOKEN)) throw new Error(`${name}: marcador ${TOKEN} não encontrado (build já processado ou arquivo errado)`);
  const out = text.split(TOKEN).join(siteUrl);
  if (out.includes(TOKEN)) throw new Error(`${name}: ainda há marcadores ${TOKEN}`);
  await writeFile(file, out);
}
console.log(`URL do site aplicada (${source}): ${siteUrl}`);
