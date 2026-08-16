#!/usr/bin/env node
/**
 * Which foundational areas has a person actually judged?
 *
 * Rule 13 makes the foundational area the part of a domain most people will
 * ever touch, and for many it is the whole of it. Its ceilings therefore matter
 * more per element than anywhere else in the corpus: an L3 ceiling asserts that
 * Competent is genuinely attainable, and invokes the full L3 signoff cost — a
 * signer holding L4, a work product, forty hours — for every element carrying
 * it.
 *
 * The problem this report exists for is that `{"default": 3, "overrides": {}}`
 * is ambiguous. It reads identically whether a person examined the area and
 * found it uniform, or whether a bulk generation pass wrote a default nobody
 * has looked at since. Twenty-one of thirty-one foundational areas are in that
 * state, and they are not twenty-one decisions — they are one artefact.
 *
 * So this reports three states, not two:
 *
 *   REVIEWED     — reviewedBy/reviewedOn present. A person stands behind it.
 *   UNATTRIBUTED — overrides exist, but nobody is recorded. Judgement was
 *                  probably applied; nothing says whose or when.
 *   UNGRADED     — no overrides and no reviewer. Assume not yet examined.
 *
 * It also flags two shapes that a bare count hides. An area with no L4 has
 * probably not been asked where expertise genuinely exists — foundational is
 * not shallow, and the one hand-graded area pushed three elements UP. And an
 * area with almost no `skill` elements teaches vocabulary and assesses nobody's
 * hands.
 *
 * Usage:  node tools/report-foundational.ts
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains');
const PLAN_PATH = join(REPO_ROOT, 'tools', 'ceiling-plan.json');

interface AreaPlan {
  default: number;
  overrides?: Record<string, number>;
  reviewedBy?: string;
  reviewedOn?: string;
}

const plan = JSON.parse(readFileSync(PLAN_PATH, 'utf8')) as { areas: Record<string, AreaPlan> };

interface Row {
  id: string;
  domain: string;
  domainTitle: string;
  elements: number;
  overrides: number;
  reviewedBy?: string;
  reviewedOn?: string;
  kinds: { knowledge: number; skill: number; judgment: number };
  ceilings: Map<number, number>;
}

const rows: Row[] = [];

for (const file of readdirSync(DOMAINS_DIR).filter((f) => f.endsWith('.yaml')).sort()) {
  const doc = parseYaml(readFileSync(join(DOMAINS_DIR, file), 'utf8')) as Record<string, any>;
  for (const domain of doc.domains ?? []) {
    for (const area of domain.competencyAreas ?? []) {
      // Rule 13 requires this exact title prefix, without exception, so that a
      // reader can find the section by searching the words they were told to
      // expect. That makes it a reliable selector here.
      if (!/^Foundational Knowledge/.test(String(area.title ?? ''))) continue;

      const entry = plan.areas[area.id] ?? { default: 3 };
      const kinds = { knowledge: 0, skill: 0, judgment: 0 };
      const ceilings = new Map<number, number>();

      for (const element of area.elements ?? []) {
        if (element.kind in kinds) kinds[element.kind as keyof typeof kinds]++;
        ceilings.set(element.levelCeiling, (ceilings.get(element.levelCeiling) ?? 0) + 1);
      }

      rows.push({
        id: area.id,
        domain: domain.id,
        domainTitle: String(domain.title ?? ''),
        elements: (area.elements ?? []).length,
        overrides: Object.keys(entry.overrides ?? {}).length,
        reviewedBy: entry.reviewedBy,
        reviewedOn: entry.reviewedOn,
        kinds,
        ceilings,
      });
    }
  }
}

const state = (r: Row): 'REVIEWED' | 'UNATTRIBUTED' | 'UNGRADED' =>
  r.reviewedBy ? 'REVIEWED' : r.overrides > 0 ? 'UNATTRIBUTED' : 'UNGRADED';

const spread = (r: Row): string =>
  [...r.ceilings.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, n]) => `L${level}:${n}`)
    .join(' ');

const lines: string[] = [];
const push = (s = ''): number => lines.push(s);

push('FOUNDATIONAL AREA CEILINGS — WHO HAS ACTUALLY JUDGED THESE');
push('='.repeat(78));
push();
push('An L3 ceiling is a claim that Competent is genuinely attainable, and it');
push('carries the full L3 signoff cost. A bare default is not that claim — it is');
push('the absence of one. This separates them.');
push();

for (const wanted of ['UNGRADED', 'UNATTRIBUTED', 'REVIEWED'] as const) {
  const group = rows.filter((r) => state(r) === wanted).sort((a, b) => b.elements - a.elements);
  if (group.length === 0) continue;

  const total = group.reduce((n, r) => n + r.elements, 0);
  push(`${wanted} — ${group.length} area(s), ${total} element(s)`);
  push('-'.repeat(78));

  for (const r of group) {
    const noL4 = !r.ceilings.has(4) && !r.ceilings.has(5);
    const thinSkill = r.elements > 0 && r.kinds.skill / r.elements < 0.2;
    const flags = [noL4 ? 'no-L4' : '', thinSkill ? 'thin-skill' : ''].filter(Boolean).join(' ');

    push(
      `  ${r.id.padEnd(11)} ${String(r.elements).padStart(3)} els  ` +
        `k${r.kinds.knowledge}/s${r.kinds.skill}/j${r.kinds.judgment}`.padEnd(12) +
        `${spread(r).padEnd(22)}${flags}`,
    );
    if (r.reviewedBy) push(`${' '.repeat(14)}reviewed by ${r.reviewedBy} on ${r.reviewedOn ?? 'an unrecorded date'}`);
    push(`${' '.repeat(14)}${r.domain} — ${r.domainTitle}`);
  }
  push();
}

const noL4 = rows.filter((r) => !r.ceilings.has(4) && !r.ceilings.has(5));
const thinSkill = rows.filter((r) => r.elements > 0 && r.kinds.skill / r.elements < 0.2);

push('WHAT TO LOOK AT');
push('-'.repeat(78));
push(`  no-L4      ${noL4.length}/${rows.length} areas have no element above L3.`);
push('             Foundational is not shallow. The one hand-graded area pushed');
push('             three elements UP to L4. An area with none has probably not');
push('             been asked the question.');
push(`             ${noL4.map((r) => r.id).join(', ') || 'none'}`);
push();
push(`  thin-skill ${thinSkill.length}/${rows.length} areas are under 20 percent \`skill\`.`);
push('             A foundational area with almost no skill elements teaches');
push('             vocabulary and assesses nobody\'s hands.');
push(`             ${thinSkill.map((r) => `${r.id} (s${r.kinds.skill}/${r.elements})`).join(', ') || 'none'}`);
push();

console.log(lines.join('\n'));
