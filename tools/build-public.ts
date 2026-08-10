/**
 * Build the public distribution.
 *
 * The BOK is meant to be published, cited and redistributed. Parts of the item
 * bank are not: a rubric that names the defect classes injected into a budget
 * tells a candidate exactly what to look for, and `defect_class` is a generator
 * parameter precisely because showing it destroys the item.
 *
 * WHAT RESTRICTION IS NOT. This is not proctoring by another name, and it is
 * not secrecy from collaborators. Assessment stays open-resource: a candidate
 * may use references, the internet and an AI assistant, and an item defeated by
 * knowing the general design was already defective. Reviewers, stewards and
 * anyone evaluating the methodology get the whole repository. What is withheld
 * is the operational content of a live item bank from the published artifact —
 * the answer key, not the design.
 *
 * WHY PER-FIELD AND NOT PER-FILE. A credential records the archetypes an
 * assessment was served from. Verification is offline, against a distributed
 * file, so `ARC-0002` has to resolve to something for a reader who holds only
 * the public distribution. Withholding archetypes wholesale would break
 * verification to protect content that is not sensitive. So identity and shape
 * are published; prompt, parameters, scoring and rationale are not.
 *
 * WHY AN ALLOWLIST. Fields are published only if named here. When somebody adds
 * a field to the archetype schema next year and forgets this file exists, it
 * defaults to RESTRICTED. A denylist would default it to published, and the
 * failure would be silent and one-way — you cannot unpublish.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { ARCHETYPE_PUBLIC, BINDING_PUBLIC } from './public-projection.ts';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const CONTENT = join(REPO_ROOT, 'content');
const OUT = join(REPO_ROOT, 'dist', 'public');

function copyTree(from: string, to: string): number {
  if (!existsSync(from)) return 0;
  let count = 0;
  mkdirSync(to, { recursive: true });

  for (const entry of readdirSync(from).sort()) {
    const src = join(from, entry);
    const dst = join(to, entry);
    if (statSync(src).isDirectory()) {
      count += copyTree(src, dst);
    } else {
      writeFileSync(dst, readFileSync(src));
      count += 1;
    }
  }
  return count;
}

function pick(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function yamlFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yamlFiles(full, out);
    else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) out.push(full);
  }
  return out;
}

const NOTICE =
  '# Public distribution. Item internals — prompts, parameters, scoring,\n' +
  '# rubrics and binding rationale — are withheld deliberately. See\n' +
  '# tools/build-public.ts for what is published and why.\n';

function main(): number {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  // -- Published verbatim ---------------------------------------------------
  // The BOK is the point of publishing. The taxonomy, proficiency ladder and
  // roles are published too: a person must be able to see what competence
  // MEANS and what they will be assessed against. Anchors are not secrets —
  // hiding them would gate entry, which is the one thing this project refuses
  // to do.
  const bok = copyTree(join(CONTENT, 'bok'), join(OUT, 'bok'));
  const taxonomy = copyTree(join(CONTENT, 'competence', 'taxonomy'), join(OUT, 'competence', 'taxonomy'));
  const roles = copyTree(join(CONTENT, 'competence', 'roles'), join(OUT, 'competence', 'roles'));
  const elements = copyTree(join(CONTENT, 'competence', 'elements'), join(OUT, 'competence', 'elements'));
  const sources = copyTree(join(CONTENT, 'sources'), join(OUT, 'sources'));

  // -- Published as a projection -------------------------------------------
  const archetypeDir = join(OUT, 'competence', 'items', 'archetypes');
  mkdirSync(archetypeDir, { recursive: true });
  let archetypes = 0;

  for (const file of yamlFiles(join(CONTENT, 'competence', 'items', 'archetypes'))) {
    const data = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (!data?.id) continue;
    writeFileSync(
      join(archetypeDir, `${data.id}.yaml`),
      NOTICE + stringifyYaml(pick(data, ARCHETYPE_PUBLIC)),
      'utf8',
    );
    archetypes += 1;
  }

  let bindings = 0;
  for (const file of yamlFiles(join(CONTENT, 'competence', 'items', 'bindings'))) {
    const data = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (!data?.element) continue;

    const projected = {
      schemaVersion: data.schemaVersion,
      element: data.element,
      bindings: ((data.bindings ?? []) as Array<Record<string, unknown>>).map((b) => pick(b, BINDING_PUBLIC)),
    };

    const rel = relative(join(CONTENT, 'competence', 'items', 'bindings'), file).split(sep).join('/');
    const dst = join(OUT, 'competence', 'items', 'bindings', rel);
    mkdirSync(join(dst, '..'), { recursive: true });
    writeFileSync(dst, NOTICE + stringifyYaml(projected), 'utf8');
    bindings += 1;
  }

  // Rubrics are not projected. There is no public form of a scoring key.

  console.log('PUBLIC DISTRIBUTION');
  console.log('='.repeat(60));
  console.log(`  BOK articles            ${bok}`);
  console.log(`  Taxonomy files          ${taxonomy}`);
  console.log(`  Role registries         ${roles}`);
  console.log(`  Element files           ${elements}`);
  console.log(`  Source register         ${sources}`);
  console.log(`  Archetypes (projected)  ${archetypes}`);
  console.log(`  Bindings  (projected)   ${bindings}`);
  console.log(`  Rubrics                 0  — withheld entirely`);
  console.log('');
  console.log(`Written to ${relative(REPO_ROOT, OUT).split(sep).join('/')}/`);
  console.log('Run `npm run check:leak` before distributing.');

  return 0;
}

process.exit(main());
