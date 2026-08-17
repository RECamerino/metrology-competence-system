#!/usr/bin/env node
/**
 * Which declared ceilings can actually be reached by peer signature?
 *
 * `levelCeiling` is documented as the highest ATTAINABLE level for an element.
 * Attainability is not a property of the element alone: it depends on the
 * signoff policy, and the policy requires a signer who already holds a level in
 * THIS element —
 *
 *   L1, L2  witnessMustHoldLevel: null   no holder needed
 *   L3      witnessMustHoldLevel: 4      a signer holding L4 in this element
 *   L4      witnessMustHoldLevel: 5      a signer holding L5 in this element
 *   L5      witnessMustHoldLevel: 5      a signer holding L5 in this element
 *
 * `packages/validator/src/credentials.ts` scopes that to the element: "they
 * must be at least this competent in the same element". The only alternative
 * satisfaction path is `bootstrapAuthority`, which rule 8 makes transitional
 * and which the shipped roster grants to nobody.
 *
 * The consequence is arithmetic. An element ceilinged at 4 requires an L5
 * holder in that element to sign an L4 — and its own ceiling forbids anyone
 * from ever holding L5 in it. So its top level is reachable only by bootstrap
 * signature, permanently. The same argument applies to a ceiling of 3.
 *
 * Only a ceiling of 5 has a fully peer-reachable ladder, because L5 requires L5
 * and the founding cohort exists precisely to seed that one case.
 *
 * This is deliberately a REPORT and not a build failure. It is a design
 * question for the steward, not a content defect an author can fix by editing a
 * file, and an error on 84 percent of the corpus would be noise rather than
 * information. What the project cannot afford is for it to stay invisible.
 *
 * Usage:  node tools/report-reachability.ts
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains');
const PROFICIENCY = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'proficiency.yaml');

/** witnessMustHoldLevel per level, read from the policy rather than assumed. */
const policy = new Map<number, number | null>();
{
  const doc = parseYaml(readFileSync(PROFICIENCY, 'utf8')) as Record<string, any>;
  for (const entry of doc.levels ?? []) {
    policy.set(Number(entry.level), (entry.signoff?.witnessMustHoldLevel ?? null) as number | null);
  }
}

/** Highest level in this element a peer signature could ever reach. */
function peerReachableCeiling(declared: number): number {
  let best = 0;
  for (let level = 1; level <= declared; level++) {
    const required = policy.get(level);
    // A level needing no holder is always reachable. A level needing one is
    // reachable only if this element can produce that holder at all.
    if (required === null || required === undefined || required <= declared) best = level;
  }
  return best;
}

interface Row {
  domain: string;
  title: string;
  elements: number;
  capped: number;
  byCeiling: Map<number, number>;
  topL5: number;
}

const rows: Row[] = [];
let corpusElements = 0;
let corpusCapped = 0;
const cappedByCeiling = new Map<number, number>();

for (const file of readdirSync(DOMAINS_DIR).filter((f) => f.endsWith('.yaml')).sort()) {
  const doc = parseYaml(readFileSync(join(DOMAINS_DIR, file), 'utf8')) as Record<string, any>;
  for (const domain of doc.domains ?? []) {
    const row: Row = {
      domain: domain.id,
      title: String(domain.title ?? ''),
      elements: 0,
      capped: 0,
      byCeiling: new Map(),
      topL5: 0,
    };
    for (const area of domain.competencyAreas ?? []) {
      for (const element of area.elements ?? []) {
        if (element.status === 'deprecated') continue;
        const declared = Number(element.levelCeiling);
        row.elements++;
        row.byCeiling.set(declared, (row.byCeiling.get(declared) ?? 0) + 1);
        if (declared === 5) row.topL5++;
        if (peerReachableCeiling(declared) < declared) {
          row.capped++;
          cappedByCeiling.set(declared, (cappedByCeiling.get(declared) ?? 0) + 1);
        }
      }
    }
    corpusElements += row.elements;
    corpusCapped += row.capped;
    rows.push(row);
  }
}

const pct = (n: number, d: number): string => (d === 0 ? '  0.0%' : `${((n / d) * 100).toFixed(1).padStart(5)}%`);
const out: string[] = [];
const push = (s = ''): number => out.push(s);

push('CEILING REACHABILITY — WHICH DECLARED LEVELS A PEER SIGNATURE CAN REACH');
push('='.repeat(78));
push();
push('levelCeiling declares the highest ATTAINABLE level. Attainability also');
push('depends on the signoff policy, which requires a signer already holding a');
push('level IN THIS ELEMENT. Where the required holder level exceeds the');
push("element's own ceiling, that level can never be peer-signed — only");
push('bootstrap-signed, and the founding cohort is transitional by design.');
push();
push('POLICY AS READ FROM proficiency.yaml');
push('-'.repeat(78));
for (const level of [...policy.keys()].sort()) {
  const required = policy.get(level);
  const verdict =
    required === null || required === undefined
      ? 'no holder required — always reachable'
      : `needs a signer holding L${required} in the same element`;
  push(`  L${level}  ${verdict}`);
}
push();
push('CONSEQUENCE BY DECLARED CEILING');
push('-'.repeat(78));
for (const declared of [1, 2, 3, 4, 5]) {
  const reach = peerReachableCeiling(declared);
  const n = cappedByCeiling.get(declared) ?? 0;
  const verdict =
    reach < declared
      ? `top level L${declared} is BOOTSTRAP-ONLY (peer reaches L${reach})   ${n} element(s)`
      : 'fully peer-reachable';
  push(`  ceiling ${declared}  ${verdict}`);
}
push();
push(`  ${corpusCapped} of ${corpusElements} elements (${pct(corpusCapped, corpusElements).trim()}) cannot have their top`);
push('  declared level reached by peer signature.');
push();

push('PACKS WITH NO L5 ELEMENT AT ALL');
push('-'.repeat(78));
push('These cannot produce an L5 holder anywhere, so no element in them can ever');
push('be peer-signed at L4 either — the pack tops out at a peer-signed L3.');
push();
const noL5 = rows.filter((r) => r.topL5 === 0 && r.elements > 0).sort((a, b) => b.elements - a.elements);
for (const r of noL5) {
  push(`  ${r.domain.padEnd(7)} ${String(r.elements).padStart(4)} els, 0 at L5   ${r.title}`);
}
if (noL5.length === 0) push('  none');
push();

push('PER DOMAIN — elements whose top level is bootstrap-only');
push('-'.repeat(78));
for (const r of [...rows].sort((a, b) => b.capped / (b.elements || 1) - a.capped / (a.elements || 1))) {
  if (r.elements === 0) continue;
  push(`  ${r.domain.padEnd(7)} ${String(r.capped).padStart(4)}/${String(r.elements).padEnd(4)} ${pct(r.capped, r.elements)}  ${r.title}`);
}
push();
push('WHAT THIS IS NOT');
push('-'.repeat(78));
push('  Not a content defect. No author can fix it by editing an element, and it');
push('  is not evidence that any ceiling is wrong. It is the arithmetic of an');
push('  element-scoped signer rule meeting a per-element ceiling, and the choice');
push('  of what to do about it belongs to the steward: widen signer scope, lower');
push('  the required holder level at the top of the ladder, read a ceiling as');
push('  "the highest peer-signable level" and document that, or accept that the');
push('  top rung of most elements is a bootstrap artefact.');
push();

console.log(out.join('\n'));
