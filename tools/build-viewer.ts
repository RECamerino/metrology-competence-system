#!/usr/bin/env node
/**
 * Build the read-only taxonomy viewer.
 *
 * Injects the merged taxonomy into apps/viewer/template.html and writes two
 * outputs:
 *
 *   apps/viewer/index.html   Standalone page. Fully self-contained — no CDN,
 *                            no fetch, no external font. Opens from a file
 *                            share or any static intranet host with no server,
 *                            which is the point: reviewers in air-gapped
 *                            environments get the same artifact as everyone else.
 *
 *   apps/viewer/fragment.html  Body-only, for publishing to a hosting surface
 *                              that supplies its own document skeleton.
 *
 * The data comes from the same per-domain files the validator reads, so the
 * viewer cannot drift from what CI checks.
 *
 * Usage:  node tools/build-viewer.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains');
const VIEWER_DIR = join(REPO_ROOT, 'apps', 'viewer');

const domains = readdirSync(DOMAINS_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .sort()
  .flatMap((f) => {
    const doc = parseYaml(readFileSync(join(DOMAINS_DIR, f), 'utf8')) as Record<string, any>;
    return (doc.domains ?? []) as Array<Record<string, any>>;
  })
  .map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    summary: d.summary ?? '',
    areas: (d.competencyAreas ?? []).map((a: Record<string, any>) => ({
      id: a.id,
      title: a.title,
      summary: a.summary ?? '',
      elements: (a.elements ?? []).map((e: Record<string, any>) => ({
        id: e.id,
        title: e.title,
        c: e.levelCeiling,
        // knowledge | skill | judgment, abbreviated to keep the payload small.
        k: String(e.kind ?? '').charAt(0),
      })),
    })),
  }));

const areaCount = domains.reduce((n: number, d) => n + d.areas.length, 0);
const elementCount = domains.reduce(
  (n: number, d) => n + d.areas.reduce((m: number, a: { elements: unknown[] }) => m + a.elements.length, 0),
  0,
);

// `</script>` inside a string literal would close the host script tag early.
const payload = JSON.stringify({ domains }).replace(/<\//g, '<\\/');

const fragment = readFileSync(join(VIEWER_DIR, 'template.html'), 'utf8').replace(
  '__TAXONOMY__',
  () => payload,
);

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Metrology Competence System — Taxonomy</title>
<meta name="description" content="Every domain, competency area and element in the Metrology Competence System body of knowledge, with attainable level ceilings and competence kinds.">
<meta property="og:title" content="Metrology Competence System — Taxonomy">
<meta property="og:description" content="${domains.length} domains, ${areaCount} competency areas and ${elementCount} elements, searchable and filterable by level and competence kind.">
<meta property="og:type" content="website">
<style>*{margin:0}</style>
</head>
<body>
${fragment}
</body>
</html>
`;

writeFileSync(join(VIEWER_DIR, 'index.html'), standalone, 'utf8');
writeFileSync(join(VIEWER_DIR, 'fragment.html'), fragment, 'utf8');

console.log('Viewer built');
console.log(`  domains:  ${domains.length}`);
console.log(`  areas:    ${areaCount}`);
console.log(`  elements: ${elementCount}`);
console.log(`  index.html    ${(standalone.length / 1024).toFixed(0)} KB`);
console.log(`  fragment.html ${(fragment.length / 1024).toFixed(0)} KB`);
