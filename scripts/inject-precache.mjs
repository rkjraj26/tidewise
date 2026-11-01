// After `vite build`: inject the list of built files + a content hash into dist/sw.js.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const dist = 'dist';
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(dist, p).split('\\').join('/'));
  }
})(dist);

const precache = files.filter((f) => f !== 'sw.js' && !f.endsWith('.map')).sort();
const hash = createHash('sha256');
for (const f of precache) hash.update(f).update(readFileSync(join(dist, f)));
const version = hash.digest('hex').slice(0, 12);

const swPath = join(dist, 'sw.js');
let sw = readFileSync(swPath, 'utf8');
sw = sw.replace("'__VERSION__'", JSON.stringify(version)).replace('/*__PRECACHE__*/ []', JSON.stringify(precache.map((f) => `./${f}`)));
writeFileSync(swPath, sw);
console.log(`sw.js: ${precache.length} files precached, version ${version}`);
