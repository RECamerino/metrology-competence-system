#!/usr/bin/env node
/**
 * The numbers in CLAUDE.md are true, and it is checked.
 *
 * CLAUDE.md is the session startup file: it is read first, every session, and
 * it is where a cold reader calibrates on the size and state of the project.
 * Every number in its Status table is derivable from the corpus, and none of
 * them was derived — they were typed by whoever last changed something, which
 * is how the file came to say 262 tests against 406, 45 bindings against 46,
 * and 4556 of 5407 elements against a corpus of 5459.
 *
 * WHY THIS IS THE DEFECT WORTH A CHECK RATHER THAN A CORRECTION. Prose
 * describing a state the files no longer hold is the single most repeated
 * failure in this project's record. It is `blockedPendingCounsel` sitting in a
 * note no code read. It is `CM-03-052`'s closing note claiming a knowledgeRef
 * that was never added. It is the coverage claim that outran the check behind
 * it. Correcting the numbers fixes today; this fixes the class, on exactly the
 * argument `check:docs` already rests on — a generated view that can go stale
 * silently is one that will.
 *
 * SCOPE IS DELIBERATELY NARROW, and narrow for the reason the spelling check
 * is. Only claims that appear in a STRUCTURED position with one unambiguous
 * reading: the Status table's rows, the two test counts, and the schema count
 * where it appears as a figure and as a word. Prose elsewhere in the file
 * carries numbers too — 443 foundational elements, 2732 EC elements, per-domain
 * counts in the decision record — and those are arguments rather than fields.
 * A regular expression that went looking for them would eventually fail on a
 * sentence that was right, and a check that cries wolf teaches a reader to
 * ignore it.
 *
 * THE TEST COUNT IS COUNTED, NOT RUN. Every test in this repository is a
 * top-level `test(` in a `*.test.ts` file, so counting those lines is exact and
 * costs nothing. If that ever stops being true — a nested suite, a generated
 * case — this check will disagree with the runner, and the right response is to
 * teach it the new shape rather than to loosen it.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = join(import.meta.dirname, '..');
const read = (...parts: string[]): string => readFileSync(join(ROOT, ...parts), 'utf8');

const NUMBER_WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-one', 'Twenty-two',
  'Twenty-three', 'Twenty-four', 'Twenty-five',
];

function filesUnder(dir: string, ext: string): string[] {
  const out: string[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(ext)) out.push(full);
    }
  };
  walk(join(ROOT, dir));
  return out;
}

/* -- What the corpus actually says about itself ---------------------------- */

let domains = 0;
let areas = 0;
let elements = 0;
let units = 0;
const ceilings = new Map<number, number>();
const kinds = new Map<string, number>();

for (const file of readdirSync(join(ROOT, 'content/competence/taxonomy/domains'))) {
  if (!file.endsWith('.yaml')) continue;
  const data = parseYaml(read('content/competence/taxonomy/domains', file)) as Record<string, any>;
  for (const domain of data.domains ?? []) {
    domains += 1;
    for (const area of domain.competencyAreas ?? []) {
      areas += 1;
      for (const element of area.elements ?? []) {
        elements += 1;
        const ceiling: number = element.levelCeiling ?? 0;
        units += ceiling;
        ceilings.set(ceiling, (ceilings.get(ceiling) ?? 0) + 1);
        kinds.set(element.kind, (kinds.get(element.kind) ?? 0) + 1);
      }
    }
  }
}

const pct = (n: number): string => ((n / elements) * 100).toFixed(1);
const authored = filesUnder('content/competence/elements', '.md').length;
const articles = filesUnder('content/bok', '.md').length;
const modules = filesUnder('content/competence/modules', '.yaml').length;
const archetypes = filesUnder('content/competence/items/archetypes', '.yaml').length;
const schemas = readdirSync(join(ROOT, 'schemas')).filter((f) => f.endsWith('.json')).length;

let bindings = 0;
const boundUnits = new Set<string>();
for (const path of filesUnder('content/competence/items/bindings', '.yaml')) {
  const data = parseYaml(readFileSync(path, 'utf8')) as Record<string, any>;
  for (const binding of data.bindings ?? []) {
    bindings += 1;
    boundUnits.add(`${data.element}@${binding.level}`);
  }
}

const tests = filesUnder('packages', '.test.ts')
  .map((path) => (readFileSync(path, 'utf8').match(/^test\(/gm) ?? []).length)
  .reduce((a, b) => a + b, 0);

/* -- What CLAUDE.md claims ------------------------------------------------- */

const claude = read('CLAUDE.md');
const problems: string[] = [];

const expect = (label: string, needle: string): void => {
  if (!claude.includes(needle)) problems.push(`${label}\n    expected: ${needle}`);
};

expect(
  'Status table — domains / areas / elements',
  `| Domains / areas / elements | ${domains} / ${areas} / **${elements}**`,
);
expect('Status table — assessable units', `| Assessable units | ${units} |`);
expect(
  'Status table — ceiling distribution',
  `| Ceilings — L2 / L3 / L4 / L5 | ${[2, 3, 4, 5].map((l) => `${pct(ceilings.get(l) ?? 0)}%`).join(' / ')} |`,
);
expect(
  'Status table — kind distribution',
  `| Kinds — knowledge / skill / judgment | ${['knowledge', 'skill', 'judgment']
    .map((k) => `${pct(kinds.get(k) ?? 0)}%`)
    .join(' / ')} |`,
);
expect(
  'Status table — content authored',
  `| Content authored | **${authored} elements** · **${articles} BOK articles** · **${modules} modules**`,
);
expect(
  'Status table — item bank',
  `| Item bank | ${archetypes} archetypes · ${bindings} bindings across ${boundUnits.size} units`,
);
expect('Status table — test count', `· ${tests}/${tests} tests ·`);
expect('Commands — test count', `npm test                  # ${tests} guardrail tests`);
expect('Layout — schema count', `schemas/                          ${schemas} JSON Schemas.`);
expect('Schema table — schema count spelled out', `${NUMBER_WORDS[schemas]} schemas,`);

if (problems.length > 0) {
  console.error('CLAUDE.md disagrees with the corpus:\n');
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    `Derived from the files: ${domains}/${areas}/${elements} taxonomy, ${units} units, ` +
      `${authored} authored elements, ${articles} articles, ${modules} modules, ` +
      `${archetypes} archetypes, ${bindings} bindings across ${boundUnits.size} units, ` +
      `${schemas} schemas, ${tests} tests.\n`,
  );
  process.exit(1);
}

console.log(
  `CLAUDE.md is current: ${elements} elements, ${units} units, ${bindings} bindings ` +
    `across ${boundUnits.size} units, ${schemas} schemas, ${tests} tests.`,
);
