#!/usr/bin/env node
/**
 * One-off level-ceiling recalibration.
 *
 * The first taxonomy pass set 54 percent of elements at ceiling 5, against a
 * stated intent that most would sit at 3. That inflation is not free: every L5
 * element generates three per-element assessable units, each needing training
 * content, an item bank deep enough to resist memorisation, and a rubric. It
 * also devalues Level 5, which is supposed to mean something rare.
 *
 * This applies `tools/ceiling-plan.json` — a per-competency-area default with
 * named per-element overrides — to the domain files. Expressing it as a plan
 * rather than editing 2104 lines by hand means the judgement is reviewable in
 * one place and the change is reversible.
 *
 * The rule the plan encodes:
 *
 *   L3  Competent. Knowledge, vocabulary, institutional structure, conventions,
 *       straightforward technique. The reader can apply it correctly.
 *   L4  Proficient. Independent practice, non-routine cases, judging the
 *       quality of someone else's routine work. Most technique elements.
 *   L5  Expert. Reserved for elements where a person could plausibly spend a
 *       career and still be learning, AND where a defensible capstone with
 *       cross-organizational review is actually writable. If you cannot
 *       describe that capstone, the element is not L5.
 *
 * Usage:  node tools/apply-ceilings.ts [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'taxonomy', 'domains');
const PLAN_PATH = join(REPO_ROOT, 'tools', 'ceiling-plan.json');

interface AreaPlan {
  default: number;
  overrides?: Record<string, number>;
}
interface Plan {
  areas: Record<string, AreaPlan>;
}

const dryRun = process.argv.includes('--dry-run');
const plan = JSON.parse(readFileSync(PLAN_PATH, 'utf8')) as Plan;

const AREA_LINE = /^\s*-\s+id:\s+((?:CM|DP)-\d{2}-A\d{2})\s*$/;
const ELEMENT_LINE = /^(\s*-\s*\{\s*id:\s*)((?:CM|DP)-\d{2}-\d{3})(\s*,.*levelCeiling:\s*)(\d)(.*)$/;

let changed = 0;
let unchanged = 0;
const distribution = new Map<number, number>();
const missingAreas = new Set<string>();
const unknownOverrides: string[] = [];

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

    const elementMatch = ELEMENT_LINE.exec(line);
    if (!elementMatch || !currentArea) continue;

    const areaPlan = plan.areas[currentArea];
    if (!areaPlan) continue;

    const [, prefix, id, middle, existing, suffix] = elementMatch;
    const target = areaPlan.overrides?.[id!] ?? areaPlan.default;

    distribution.set(target, (distribution.get(target) ?? 0) + 1);

    if (String(target) === existing) {
      unchanged++;
    } else {
      lines[i] = `${prefix}${id}${middle}${target}${suffix}`;
      fileChanged = true;
      changed++;
    }
  }

  // Flag overrides naming an element that is not in the area we think it is —
  // usually a typo, and silently ignoring it would leave a ceiling unset.
  for (const [area, areaPlan] of Object.entries(plan.areas)) {
    if (!area.startsWith(file.replace('.yaml', ''))) continue;
    for (const id of Object.keys(areaPlan.overrides ?? {})) {
      if (!lines.some((l) => l.includes(`id: ${id},`))) {
        unknownOverrides.push(`${area} -> ${id}`);
      }
    }
  }

  if (fileChanged && !dryRun) writeFileSync(path, lines.join('\n'), 'utf8');
}

const total = [...distribution.values()].reduce((a, b) => a + b, 0);

console.log(dryRun ? 'DRY RUN — no files written' : 'Ceilings applied');
console.log('');
console.log(`  changed:   ${changed}`);
console.log(`  unchanged: ${unchanged}`);
console.log(`  total:     ${total}`);
console.log('');
console.log('  RESULTING DISTRIBUTION');
for (let level = 1; level <= 5; level++) {
  const count = distribution.get(level) ?? 0;
  const percent = total > 0 ? (count / total) * 100 : 0;
  console.log(`    L${level}  ${String(count).padStart(5)}  ${percent.toFixed(1).padStart(5)}%  ${'#'.repeat(Math.round(percent / 2))}`);
}

let exitCode = 0;
if (missingAreas.size > 0) {
  console.error('');
  console.error(`Competency areas with no plan entry (${missingAreas.size}) — their ceilings were left untouched:`);
  for (const area of [...missingAreas].sort()) console.error(`  ${area}`);
  exitCode = 1;
}
if (unknownOverrides.length > 0) {
  console.error('');
  console.error(`Overrides naming an element not found in that area (${unknownOverrides.length}):`);
  for (const entry of unknownOverrides) console.error(`  ${entry}`);
  exitCode = 1;
}

process.exit(exitCode);
