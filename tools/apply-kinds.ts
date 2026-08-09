#!/usr/bin/env node
/**
 * Element kind classification.
 *
 * Inserts a `kind` field into every element stub, from
 * `tools/kind-plan.json` — a per-competency-area default with named
 * per-element overrides, the same shape as the ceiling plan.
 *
 *   knowledge  the person can explain, relate and analyse it.
 *              Evidence is explanation.
 *   skill      the person can perform it. Evidence is a witnessed work
 *              product; a written answer cannot substitute.
 *   judgment   the person can decide under ambiguity and defend it.
 *              Evidence is a defence, and there is often no single right
 *              answer.
 *
 * This exists because a uniform evidence ladder across all three tests the
 * wrong thing for at least two of them. An L3 knowledge element and an L3
 * skill element are not the same claim and cannot be assessed the same way,
 * so Phase 2 needs the classification before it designs the ladder.
 *
 * Authority is deliberately not a kind. Knowledge, skill and judgment are
 * earned and belong to a person; authority is granted and belongs to a
 * relationship between a person, an organization and a scope of work.
 *
 * Idempotent: re-running rewrites the kind to whatever the plan now says.
 *
 * Usage:  node tools/apply-kinds.ts [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains');
const PLAN_PATH = join(REPO_ROOT, 'tools', 'kind-plan.json');

type Kind = 'knowledge' | 'skill' | 'judgment';

interface AreaPlan {
  default: Kind;
  overrides?: Record<string, Kind>;
}
interface Plan {
  areas: Record<string, AreaPlan>;
}

const dryRun = process.argv.includes('--dry-run');
const plan = JSON.parse(readFileSync(PLAN_PATH, 'utf8')) as Plan;

const AREA_LINE = /^\s*-\s+id:\s+((?:CM|DP)-\d{2}-A\d{2})\s*$/;
// Captures: prefix .. id .. everything up to the title .. title .. rest.
// `kind` is inserted directly after the title so a reader sees what the
// element IS immediately after what it is called.
const ELEMENT_LINE =
  /^(\s*-\s*\{\s*id:\s*)((?:CM|DP)-\d{2}-\d{3})(\s*,\s*title:\s*"(?:[^"\\]|\\.)*")(\s*,\s*kind:\s*\w+)?(.*)$/;

let inserted = 0;
let rewritten = 0;
const distribution = new Map<Kind, number>();
const missingAreas = new Set<string>();
const unknownOverrides: string[] = [];

const planned = new Set<string>();

for (const file of readdirSync(DOMAINS_DIR).sort()) {
  if (!file.endsWith('.yaml')) continue;

  const path = join(DOMAINS_DIR, file);
  const lines = readFileSync(path, 'utf8').split('\n');
  let currentArea: string | null = null;
  let fileChanged = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const areaMatch = AREA_LINE.exec(line);
    if (areaMatch) {
      currentArea = areaMatch[1]!;
      if (!plan.areas[currentArea]) missingAreas.add(currentArea);
      continue;
    }

    const match = ELEMENT_LINE.exec(line);
    if (!match || !currentArea) continue;

    const areaPlan = plan.areas[currentArea];
    if (!areaPlan) continue;

    const [, prefix, id, titlePart, existingKind, rest] = match;
    const kind = areaPlan.overrides?.[id!] ?? areaPlan.default;

    planned.add(id!);
    distribution.set(kind, (distribution.get(kind) ?? 0) + 1);

    const replacement = `${prefix}${id}${titlePart}, kind: ${kind}${rest}`;
    if (line !== replacement) {
      lines[i] = replacement;
      fileChanged = true;
      existingKind ? rewritten++ : inserted++;
    }
  }

  if (fileChanged && !dryRun) writeFileSync(path, lines.join('\n'), 'utf8');
}

// An override naming an element that does not exist is almost always a typo,
// and silently ignoring it would leave that element on the area default.
for (const [area, areaPlan] of Object.entries(plan.areas)) {
  for (const id of Object.keys(areaPlan.overrides ?? {})) {
    if (!planned.has(id)) unknownOverrides.push(`${area} -> ${id}`);
  }
}

const total = [...distribution.values()].reduce((a, b) => a + b, 0);

console.log(dryRun ? 'DRY RUN — no files written' : 'Kinds applied');
console.log('');
console.log(`  inserted:  ${inserted}`);
console.log(`  rewritten: ${rewritten}`);
console.log(`  total:     ${total}`);
console.log('');
console.log('  DISTRIBUTION');
for (const kind of ['knowledge', 'skill', 'judgment'] as Kind[]) {
  const count = distribution.get(kind) ?? 0;
  const percent = total > 0 ? (count / total) * 100 : 0;
  console.log(
    `    ${kind.padEnd(10)} ${String(count).padStart(5)}  ${percent.toFixed(1).padStart(5)}%  ${'#'.repeat(Math.round(percent / 2))}`,
  );
}

let exitCode = 0;
if (missingAreas.size > 0) {
  console.error('');
  console.error(`Competency areas with no plan entry (${missingAreas.size}) — their elements were left unclassified:`);
  for (const area of [...missingAreas].sort()) console.error(`  ${area}`);
  exitCode = 1;
}
if (unknownOverrides.length > 0) {
  console.error('');
  console.error(`Overrides naming an element that does not exist (${unknownOverrides.length}):`);
  for (const entry of unknownOverrides) console.error(`  ${entry}`);
  exitCode = 1;
}

process.exit(exitCode);
