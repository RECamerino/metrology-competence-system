/**
 * Scan the public distribution for content that must not be in it.
 *
 * Independent of the builder on purpose. `build-public.ts` decides what to
 * publish by allowlist; this decides what must be absent, by reading the
 * artifact that would actually be distributed. If the projection is edited
 * wrongly — a field added to the allowlist without thinking, a rubric copied in
 * by a well-meaning script — the builder will not notice, because it is doing
 * what it was told. This will.
 *
 * Publication is one-way. A leaked scoring key cannot be recalled from anyone
 * who has already downloaded it, so the check is deliberately blunt and errs
 * toward false positives.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RESTRICTED_KEYS } from './public-projection.ts';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(REPO_ROOT, 'dist', 'public');

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function main(): number {
  if (!existsSync(OUT)) {
    console.error('No public distribution found. Run `npm run build:public` first.');
    return 1;
  }

  const findings: string[] = [];
  const files = walk(OUT);

  for (const file of files) {
    const rel = relative(OUT, file).split(sep).join('/');

    // No rubric has a public form. Its whole content is a scoring key.
    if (rel.includes('items/rubrics/')) {
      findings.push(`${rel}: rubrics must never appear in the public distribution`);
      continue;
    }

    // Everything published under items/ is a projected YAML file. Prose there
    // is a rubric, or something equally unpublishable, that has been moved or
    // renamed — and a path-based rubric rule would miss exactly that. Checking
    // the shape of what is present catches the case the specific rule cannot.
    if (rel.includes('items/') && !/\.ya?ml$/.test(rel)) {
      findings.push(`${rel}: only projected YAML is published under items/. Prose here is a scoring key by another name.`);
      continue;
    }

    const text = readFileSync(file, 'utf8');

    // Only item files can leak item internals. A BOK article legitimately
    // discusses scoring or parameters as subject matter, and flagging that
    // would train people to ignore this check.
    if (!rel.includes('items/')) continue;

    for (const key of RESTRICTED_KEYS) {
      // Match the YAML key position, not the word in prose.
      if (new RegExp(`^\\s*-?\\s*${key}\\s*:`, 'm').test(text)) {
        findings.push(`${rel}: contains restricted field '${key}'`);
      }
    }
  }

  console.log(`Scanned ${files.length} file(s) in dist/public/.`);

  if (findings.length > 0) {
    console.log('');
    for (const finding of findings) console.error(`  LEAK   ${finding}`);
    console.log('');
    console.error(`${findings.length} leak(s). Do not distribute this build.`);
    return 1;
  }

  console.log('No restricted content found.');
  return 0;
}

process.exit(main());
