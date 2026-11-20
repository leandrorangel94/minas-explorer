#!/usr/bin/env node
/**
 * Serve o build de publicação (`npm run build:pages`) em /minas-explorer/, como no GitHub Pages,
 * para testar base href, caminhos de assets e links diretos antes de publicar.
 *
 *   npm run build:pages
 *   npm run preview:pages        # abre http://localhost:4600/minas-explorer/
 *
 * Sem dependências: servidor estático mínimo em Node.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const BASE = '/minas-explorer/';
const PORT = Number(process.env.PORT ?? 4600);
const ROOT = resolve('dist/minas-explorer/browser');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error('Build não encontrado. Rode antes: npm run build:pages');
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  // Como no GitHub Pages: tudo fora de /minas-explorer/ é 404 e usa o 404.html do site.
  const inside = url.pathname.startsWith(BASE);
  let file = inside ? normalize(join(ROOT, decodeURIComponent(url.pathname.slice(BASE.length)))) : '';
  if (inside && (!file.startsWith(ROOT) || (existsSync(file) && statSync(file).isDirectory()))) file = join(file, 'index.html');
  const found = inside && file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile();
  const target = found ? file : join(ROOT, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(res);
}).listen(PORT, () => console.log(`Servindo ${ROOT}\n→ http://localhost:${PORT}${BASE}`));
