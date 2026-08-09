#!/usr/bin/env node
/**
 * Corpus validator CLI.
 *
 *   node packages/validator/src/cli.ts validate       schema + integrity checks
 *   node packages/validator/src/cli.ts coverage       where the corpus is thin
 *   node packages/validator/src/cli.ts quotes         legal-review manifest
 *   node packages/validator/src/cli.ts registry-sync  append new IDs to the lock
 *
 * Exits non-zero on any error-level finding so CI fails loudly.
 */

import { writeFileSync } from 'node:fs';
import { PATHS, allTaxonomyIds, loadCorpus } from './corpus.ts';
import { runAllChecks, type Finding } from './checks.ts';
import { coverageReport, quoteManifest } from './reports.ts';

const COMMANDS = ['validate', 'coverage', 'quotes', 'registry-sync'] as const;
type Command = (typeof COMMANDS)[number];

function report(findings: Finding[]): number {
  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warn');

  for (const finding of warnings) console.warn(`  warn   ${finding.message}`);
  for (const finding of errors) console.error(`  ERROR  ${finding.message}`);

  console.log('');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Corpus valid — no findings.');
  } else {
    console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
  }

  return errors.length > 0 ? 1 : 0;
}

function main(): number {
  const command = (process.argv[2] ?? 'validate') as Command;

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command '${command}'. Expected one of: ${COMMANDS.join(', ')}`);
    return 2;
  }

  const { corpus, parseErrors } = loadCorpus();

  // A file that will not parse cannot be meaningfully checked, so stop here
  // rather than emitting a cascade of confusing downstream errors.
  if (parseErrors.length > 0) {
    for (const message of parseErrors) console.error(`  ERROR  ${message}`);
    console.log('');
    console.log(`${parseErrors.length} file(s) could not be parsed. Fix these first.`);
    return 1;
  }

  switch (command) {
    case 'validate':
      return report(runAllChecks(corpus));

    case 'coverage':
      console.log(coverageReport(corpus));
      return 0;

    case 'quotes':
      console.log(quoteManifest(corpus));
      return 0;

    case 'registry-sync': {
      if (!corpus.taxonomy) {
        console.error('No taxonomy files in content/taxonomy/domains/ — nothing to sync.');
        return 1;
      }

      const current = allTaxonomyIds(corpus.taxonomy);
      const existing = new Set(corpus.lockedIds ?? []);

      // Union, never difference: an ID that has left the taxonomy stays in the
      // lock so that `validate` keeps flagging its disappearance. Sync adds; it
      // never forgets.
      const merged = [...new Set([...existing, ...current])].sort();
      const added = current.filter((id) => !existing.has(id));

      writeFileSync(
        PATHS.idLock,
        [
          '# ID registry lock — APPEND-ONLY.',
          '#',
          '# Every identifier ever issued by this corpus. `npm run validate` fails if any',
          '# of these disappears from content/taxonomy/domains/*.yaml, because a credential',
          '# attesting an ID must resolve to the same element forever. Deprecate and',
          '# supersede elements; never rename or delete them.',
          '#',
          '# Regenerate with: npm run registry:sync',
          '',
          ...merged,
          '',
        ].join('\n'),
        'utf8',
      );

      console.log(`Lock file updated: ${merged.length} ID(s) recorded, ${added.length} newly added.`);
      if (added.length > 0) {
        for (const id of added.slice(0, 20)) console.log(`  + ${id}`);
        if (added.length > 20) console.log(`  … and ${added.length - 20} more`);
        console.log('');
        console.log('Commit the lock file alongside the taxonomy change so the addition is visible in review.');
      }
      return 0;
    }
  }
}

process.exit(main());
