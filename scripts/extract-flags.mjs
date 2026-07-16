// Extrai as bandeiras (SVG) do pacote us-state-flags para arquivos
// standalone em public/assets/flags/XX.svg e gera o mapa nome->sigla.
// Rode com: node scripts/extract-flags.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const flagsSrc = join(root, 'node_modules/us-state-flags/src/components/flags');
const outDir = join(root, 'public/assets/flags');
mkdirSync(outDir, { recursive: true });

const files = readdirSync(flagsSrc).filter(
  (f) => /^Flag[A-Z]{2}\.js$/.test(f),
);

let count = 0;
for (const file of files) {
  const abbr = file.slice(4, 6); // FlagCA.js -> CA
  const src = readFileSync(join(flagsSrc, file), 'utf8');

  const vb = src.match(/viewBox:\s*'([^']+)'/);
  const html = src.match(/__html:\s*`([\s\S]*?)`\s*}/);
  if (!vb || !html) {
    console.warn('skip (sem viewBox/__html):', file);
    continue;
  }
  const viewBox = vb[1];
  const inner = html[1].trim();

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    `<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>` +
    `${inner}</svg>`;

  writeFileSync(join(outDir, `${abbr}.svg`), svg);
  count++;
}

// Mapa nome -> sigla, a partir do states.json do pacote.
const states = JSON.parse(
  readFileSync(
    join(root, 'node_modules/us-state-flags/src/data/states.json'),
    'utf8',
  ),
);
const nameToAbbr = {};
for (const s of states) nameToAbbr[s.name] = s.abbreviation;

const tsOut =
  '// GERADO por scripts/extract-flags.mjs — não editar à mão.\n' +
  '// Mapa nome do estado (us-atlas) -> sigla (arquivo da bandeira).\n' +
  'export const STATE_ABBR: Record<string, string> = ' +
  JSON.stringify(nameToAbbr, null, 2) +
  ';\n';
writeFileSync(join(root, 'src/data/usStateAbbr.ts'), tsOut);

console.log(`Extraídas ${count} bandeiras para public/assets/flags/`);
console.log(`Mapa nome->sigla: src/data/usStateAbbr.ts (${states.length} entradas)`);
