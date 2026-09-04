#!/usr/bin/env node
/**
 * Build the read-only taxonomy viewer: one index page and one page per domain.
 *
 * WHY IT IS SPLIT. The viewer was a single self-contained file, and that is the
 * property worth protecting: it opens from a file share or any static intranet
 * host with no server, so reviewers in air-gapped environments get the same
 * artifact as everyone else, and rule 5 forbids fetching anything at runtime.
 *
 * Self-contained plus no server means everything ships in the file, which means
 * size grows with the corpus. Measured: 96% of the page was data, a stub costs
 * ~100 bytes and an AUTHORED element costs ~3.4 KB — a 34x multiplier applied to
 * every element that gets written. At 5,400 elements a fully authored single
 * file projects to roughly 18 MB.
 *
 * Lazy-loading fragments is the obvious fix and is ruled out, not by taste but
 * by the promise: fetch() against file:// is blocked by CORS in every current
 * browser, so a lazy viewer works on the published site and silently breaks the
 * moment somebody copies it to a USB stick — which is the distribution this
 * design exists to serve.
 *
 * So the split is per DOMAIN, and every page stays whole:
 *
 *   index.html      the 64 domains, with counts. Loads nothing else.
 *   <DOMAIN>.html   one domain entire — areas, elements, authored detail.
 *
 * The cost is that search and filter are per-domain rather than corpus-wide.
 * That is a real loss and it was weighed: a reader goes to the discipline they
 * work in and digs from there, and searching 5,400 elements at once was never
 * the way anybody used this.
 *
 * Usage:  node tools/build-viewer.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains');
const ELEMENTS_DIR = join(REPO_ROOT, 'content', 'competence', 'elements');
const VIEWER_DIR = join(REPO_ROOT, 'apps', 'viewer');

/**
 * Authored element definitions, keyed by ID.
 *
 * The taxonomy gives every element the same four facts, which makes the
 * skeleton scannable and says nothing about what the competence IS. The anchors
 * are the only place that does. Attached so a row expands into the real
 * definition; elements without one are simply not expandable, which is an
 * honest signal at 2 authored of 5,400.
 */
function loadAuthoredElements(): Map<string, Record<string, unknown>> {
  const found = new Map<string, Record<string, unknown>>();
  if (!existsSync(ELEMENTS_DIR)) return found;

  const walk = (dir: string): string[] =>
    readdirSync(dir).sort().flatMap((entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : full.endsWith('.md') ? [full] : [];
    });

  for (const file of walk(ELEMENTS_DIR)) {
    const raw = readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
    if (!raw.startsWith('---\n')) continue;
    const end = raw.indexOf('\n---', 3);
    if (end === -1) continue;

    const data = parseYaml(raw.slice(4, end + 1)) as Record<string, any>;
    if (!data?.id) continue;

    found.set(data.id, {
      s: data.summary ?? '',
      st: data.status ?? '',
      dm: Array.isArray(data.demonstration) ? data.demonstration : [data.demonstration ?? 'desk'],
      a: data.anchors ?? {},
      r: data.roleTargets ?? {},
      ci: (data.citations ?? []).map((c: Record<string, any>) => ({ s: c.source, c: c.clause, r: c.relevance ?? '' })),
      kr: (data.knowledgeRefs ?? []).map((k: Record<string, any>) => ({ a: k.article, s: k.section, r: k.relevance ?? '' })),
      pre: data.prerequisites ?? [],
      rel: data.relatedElements ?? [],
    });
  }
  return found;
}

const authored = loadAuthoredElements();

const domains = readdirSync(DOMAINS_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .sort()
  .flatMap((f) => (parseYaml(readFileSync(join(DOMAINS_DIR, f), 'utf8')) as Record<string, any>).domains ?? [])
  .map((d: Record<string, any>) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    summary: (d.summary ?? '').trim().replace(/\s+/g, ' '),
    areas: (d.competencyAreas ?? []).map((a: Record<string, any>) => ({
      id: a.id,
      title: a.title,
      summary: (a.summary ?? '').trim().replace(/\s+/g, ' '),
      elements: (a.elements ?? []).map((e: Record<string, any>) => ({
        id: e.id,
        title: e.title,
        c: e.levelCeiling,
        k: String(e.kind ?? '').charAt(0),
        ...(authored.has(e.id) ? { d: authored.get(e.id) } : {}),
      })),
    })),
  }));

const countOf = (d: (typeof domains)[number]) => {
  const elements = d.areas.reduce((n: number, a: { elements: unknown[] }) => n + a.elements.length, 0);
  const units = d.areas.reduce(
    (n: number, a: { elements: Array<{ c: number }> }) => n + a.elements.reduce((m, e) => m + e.c, 0),
    0,
  );
  return { areas: d.areas.length, elements, units };
};

/** `</script>` inside a string literal would close the host script tag early. */
const embed = (value: unknown) => JSON.stringify(value).replace(/<\//g, '<\\/');

const page = (title: string, description: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<style>*{margin:0}</style>
</head>
<body>
${body}
</body>
</html>
`;

// Remove pages from a previous build so a deleted domain cannot linger.
// Allowlist the templates by exact name: an endsWith('-template.html') guard
// looks right and deletes `template.html`, which has no hyphen. It did.
const TEMPLATES = new Set(['template.html', 'index-template.html']);
for (const file of readdirSync(VIEWER_DIR)) {
  if (file.endsWith('.html') && !TEMPLATES.has(file)) rmSync(join(VIEWER_DIR, file));
}

const domainTemplate = readFileSync(join(VIEWER_DIR, 'template.html'), 'utf8');
const indexTemplate = readFileSync(join(VIEWER_DIR, 'index-template.html'), 'utf8');
const style = /^[\s\S]*?<\/style>/.exec(domainTemplate)![0];

const KIND_LABEL: Record<string, string> = {
  core: 'Cross-cutting core',
  discipline: 'Discipline pack',
  equipment: 'Equipment-calibration pack',
};

/* -- One page per domain -------------------------------------------------- */

let largest = { id: '', bytes: 0 };
let domainBytes = 0;

for (const d of domains) {
  const body = domainTemplate
    .replace('__TAXONOMY__', () => embed({ domains: [d] }))
    .replace('__EYEBROW__', () => KIND_LABEL[d.kind] ?? d.kind)
    .replace('__DOMAIN_ID__', () => d.id)
    .replace('__DOMAIN_TITLE__', () => d.title)
    .replace('__DOMAIN_SUMMARY__', () => d.summary);

  const html = page(
    `${d.id} ${d.title} — Metrology Competence System`,
    `${countOf(d).elements} elements across ${countOf(d).areas} competency areas.`,
    body,
  );
  writeFileSync(join(VIEWER_DIR, `${d.id}.html`), html, 'utf8');
  const bytes = Buffer.byteLength(html);
  domainBytes += bytes;
  if (bytes > largest.bytes) largest = { id: d.id, bytes };
}

/* -- The index ------------------------------------------------------------ */

const ceilings: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
let areas = 0;
let elements = 0;
let units = 0;
for (const d of domains) {
  const c = countOf(d);
  areas += c.areas;
  elements += c.elements;
  units += c.units;
  for (const a of d.areas) for (const e of a.elements) ceilings[e.c] = (ceilings[e.c] ?? 0) + 1;
}

const indexBody = indexTemplate
  .replace('__STYLE__', () => style)
  .replace('__INDEX__', () =>
    embed({
      domains: domains.map((d) => ({ id: d.id, title: d.title, kind: d.kind, summary: d.summary, ...countOf(d) })),
      totals: { areas, elements, units, ceilings },
    }),
  );

const indexHtml = page(
  'Metrology Competence System — Taxonomy',
  `${domains.length} domains, ${areas} competency areas and ${elements} elements. Each domain opens as its own self-contained page.`,
  indexBody,
);
writeFileSync(join(VIEWER_DIR, 'index.html'), indexHtml, 'utf8');

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
console.log('Viewer built');
console.log(`  domains:  ${domains.length}`);
console.log(`  areas:    ${areas}`);
console.log(`  elements: ${elements}`);
console.log(`  authored: ${authored.size}  (expandable to the full definition)`);
console.log('');
console.log(`  index.html      ${kb(Buffer.byteLength(indexHtml))}`);
console.log(`  largest domain  ${kb(largest.bytes)}  (${largest.id})`);
console.log(`  mean domain     ${kb(domainBytes / domains.length)}`);
console.log(`  whole set       ${kb(domainBytes + Buffer.byteLength(indexHtml))} across ${domains.length + 1} files`);
