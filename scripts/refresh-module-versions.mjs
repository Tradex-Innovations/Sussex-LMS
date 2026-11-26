import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = (await readdir(root)).filter(file => file.endsWith('.js')).sort();
const digest = createHash('sha256');
for (const file of [...files, 'styles.css']) digest.update(file).update(await readFile(new URL(file, root)));
const version = digest.digest('hex').slice(0, 12);
const imports = Object.fromEntries(files.map(file => ['./' + file, './' + file + '?v=' + version]));
const block = '<!-- prototype-module-map:start -->\n  <script type="importmap">' + JSON.stringify({ imports }) + '</script>\n  <!-- prototype-module-map:end -->';
const url = new URL('index.html', root), previous = await readFile(url, 'utf8');
let next = previous.includes('<!-- prototype-module-map:start -->')
  ? previous.replace(/<!-- prototype-module-map:start -->[\s\S]*?<!-- prototype-module-map:end -->/, block)
  : previous.replace('  <script type="module"', '  ' + block + '\n  <script type="module"');
next = next.replace(/src="\.\/app\.js(?:\?v=[^"]*)?"/, 'src="./app.js?v=' + version + '"').replace(/href="\.\/styles\.css(?:\?v=[^"]*)?"/, 'href="./styles.css?v=' + version + '"');
if (process.argv.includes('--check')) {
  if (next !== previous) { console.error('Prototype module versions are stale. Run node scripts/refresh-module-versions.mjs'); process.exitCode = 1; }
} else await writeFile(url, next);
