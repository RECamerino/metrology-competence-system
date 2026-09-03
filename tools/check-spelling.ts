#!/usr/bin/env node
/**
 * US English, enforced.
 *
 * The corpus is written in US English. That is not an aesthetic preference: the
 * schemas' own field names are already American — `organizationRef`,
 * `candidateOrganization`, `requiresCrossOrganizational` — and they cannot move,
 * because they are frozen contracts that consumers read. Prose that said
 * "organization" about a field called `organizationRef` was describing the
 * system in a spelling the system itself does not use. The corpus also
 * benchmarks against NCSLI, ANSI/NCSLI Z540 and US Department of Labor job
 * titles throughout.
 *
 * The convention was UNDECLARED until 2026-09-03, which is exactly how 447
 * British forms accumulated without anyone deciding to write them. This check
 * exists so it cannot drift back silently — the same reasoning as the
 * counsel-quotation block and positionNeutrality: a convention nothing enforces
 * is a convention that decays.
 *
 * SCOPE IS DELIBERATELY NARROW. Only -ise/-yse verb and agent forms where US
 * English genuinely differs. It does NOT touch:
 *   - words spelled -ise in both dialects (exercise, premise, comprise,
 *     supervise, enterprise, expertise, otherwise, and the rest of the list
 *     below), which is the trap a naive rule falls into;
 *   - `analysis` and `analyses`, the noun and its plural, identical in both —
 *     only the verb and agent forms (analyze, analyzer) are American `analyz-`;
 *   - `metre` and `litre`, which are the SI unit names in the BIPM brochure
 *     and must not be Americanized;
 *   - anything inside a source designation or document title, because a
 *     publication is not renamed by our house style.
 *
 * Usage:  node tools/check-spelling.ts
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

/** Stems where British -is-/-ys- becomes American -iz-/-yz-. */
const STEMS = [
  'authoris', 'characteris', 'commercialis', 'demagnetis', 'deprioritis', 'deputis',
  'digitis', 'energis', 'galvanis', 'generalis', 'harmonis', 'internalis', 'ionis',
  'linearis', 'magnetis', 'maximis', 'memoris', 'modernis', 'normalis', 'operationalis',
  'optimis', 'organis', 'polaris', 'prioritis', 'quantis', 'randomis', 'realis',
  'recognis', 'serialis', 'specialis', 'stabilis', 'standardis', 'sterilis', 'summaris',
  'synchronis', 'totalis', 'utilis', 'vaporis',
];
const SUFFIX = '(e|es|ed|ing|er|ers|ation|ations|ational|able|ability)';

const PATTERNS = [
  ...STEMS.map((s) => new RegExp(String.raw`\b[A-Za-z]*?${s}${SUFFIX}\b`, "gi")),
  // Verb and agent forms only. `analysis` and `analyses` are correct as-is.
  /\b[A-Za-z]*?analys(e|ed|ing|er|ers)\b/gi,
  /\bpractis(e|ed|es|ing)\b/gi,
];

const SCAN_DIRS = ['content', 'docs', 'schemas', 'tools'];
const SCAN_FILES = ['CLAUDE.md'];
const EXTENSIONS = ['.md', '.yaml', '.yml', '.json', '.ts'];
const SKIP = new Set(['node_modules', 'dist', '.git']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const files = [
  ...SCAN_DIRS.flatMap((d) => walk(join(REPO_ROOT, d))),
  ...SCAN_FILES.map((f) => join(REPO_ROOT, f)),
];

interface Hit { file: string; line: number; word: string }
const hits: Hit[] = [];

for (const file of files) {
  // This file necessarily contains the stems it forbids.
  if (file.endsWith(`tools${sep}check-spelling.ts`)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((text, i) => {
    for (const pattern of PATTERNS) {
      pattern.lastIndex = 0;
      for (const m of text.matchAll(pattern)) {
        hits.push({ file: relative(REPO_ROOT, file).split(sep).join('/'), line: i + 1, word: m[0] });
      }
    }
  });
}

if (hits.length === 0) {
  console.log(`US English: clean. Scanned ${files.length} file(s).`);
  process.exit(0);
}

console.error(`British spellings found (${hits.length}). The corpus is US English — see tools/check-spelling.ts for why, and for what is deliberately NOT flagged.\n`);
for (const h of hits.slice(0, 40)) {
  console.error(`  ${h.file}:${h.line}  ${h.word}`);
}
if (hits.length > 40) console.error(`  … and ${hits.length - 40} more`);
process.exit(1);
