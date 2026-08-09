/**
 * Reports.
 *
 * `coverage` answers "where is the corpus thin" — the report that drives every
 * authoring checkpoint. `quotes` produces the complete legal-review manifest:
 * every quotation in the corpus, not a sample.
 */

import { type Corpus, indexSources, indexStubs, roleIds } from './corpus.ts';

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width);
}

function padLeft(value: string | number, width: number): string {
  return String(value).padStart(width);
}

/* ------------------------------------------------------------------------ */

export function coverageReport(corpus: Corpus): string {
  const lines: string[] = [];
  const stubs = indexStubs(corpus.taxonomy);
  const roles = roleIds(corpus.roles);
  const authored = new Map(
    corpus.elements
      .filter((e) => (e.data as Record<string, any>).id)
      .map((e) => [(e.data as Record<string, any>).id as string, e]),
  );

  const domains = (corpus.taxonomy?.domains ?? []) as Array<Record<string, any>>;

  lines.push('CORPUS COVERAGE');
  lines.push('='.repeat(78));
  lines.push('');

  if (domains.length === 0) {
    lines.push('No taxonomy skeleton yet. Phase 1 has not produced content/taxonomy/skeleton.yaml.');
    return lines.join('\n');
  }

  lines.push(
    `${pad('DOMAIN', 10)}${pad('KIND', 12)}${padLeft('AREAS', 6)}${padLeft('ELEMS', 7)}${padLeft('WRITTEN', 9)}${padLeft('STABLE', 8)}  TITLE`,
  );
  lines.push('-'.repeat(78));

  let totalElements = 0;
  let totalWritten = 0;
  let totalStable = 0;
  let assessableUnits = 0;

  for (const domain of domains) {
    const areas = (domain.competencyAreas ?? []) as Array<Record<string, any>>;
    const stubList = areas.flatMap((a) => (a.elements ?? []) as Array<Record<string, any>>);

    const written = stubList.filter((s) => authored.has(s.id)).length;
    const stable = stubList.filter(
      (s) => (authored.get(s.id)?.data as Record<string, any> | undefined)?.status === 'stable',
    ).length;

    // L1 and L2 are assessed once per competency area; L3 and above per element.
    assessableUnits += areas.length * 2;
    for (const stub of stubList) {
      assessableUnits += Math.max(0, (stub.levelCeiling ?? 0) - 2);
    }

    totalElements += stubList.length;
    totalWritten += written;
    totalStable += stable;

    lines.push(
      `${pad(domain.id, 10)}${pad(domain.kind ?? '', 12)}${padLeft(areas.length, 6)}${padLeft(stubList.length, 7)}${padLeft(written, 9)}${padLeft(stable, 8)}  ${domain.title ?? ''}`,
    );
  }

  lines.push('-'.repeat(78));
  lines.push(
    `${pad('TOTAL', 22)}${padLeft(domains.reduce((n, d) => n + (d.competencyAreas?.length ?? 0), 0), 6)}${padLeft(totalElements, 7)}${padLeft(totalWritten, 9)}${padLeft(totalStable, 8)}`,
  );
  lines.push('');
  lines.push(`Assessable units (element × level, L1–L2 bundled per area): ${assessableUnits}`);
  lines.push('');

  /* -- Level ceiling distribution ---------------------------------------- */
  // The honesty check on the taxonomy. Inflated ceilings manufacture depth
  // that isn't there and create assessable units nobody can write real items
  // for. A distribution skewed toward 5 means someone was being generous.

  const ceilings = new Map<number, number>();
  for (const stub of stubs.values()) {
    ceilings.set(stub.levelCeiling, (ceilings.get(stub.levelCeiling) ?? 0) + 1);
  }

  const totalStubs = stubs.size || 1;
  lines.push('LEVEL CEILING DISTRIBUTION');
  lines.push('-'.repeat(78));
  for (let level = 1; level <= 5; level++) {
    const count = ceilings.get(level) ?? 0;
    const percent = (count / totalStubs) * 100;
    const bar = '#'.repeat(Math.round(percent / 2));
    lines.push(
      `  L${level}  ${padLeft(count, 5)}  ${padLeft(percent.toFixed(1), 5)}%  ${bar}`,
    );
  }
  lines.push('');

  /* -- Gaps worth acting on ---------------------------------------------- */

  const orphans = [...authored.keys()].filter((id) => !stubs.has(id));
  if (orphans.length > 0) {
    lines.push(`Element files with no skeleton entry (${orphans.length}): ${orphans.join(', ')}`);
    lines.push('');
  }

  const missingAnchors: string[] = [];
  const incompleteRoles: string[] = [];

  for (const [id, file] of authored) {
    const d = file.data as Record<string, any>;
    const ceiling: number = d.levelCeiling ?? 0;
    const anchors = (d.anchors ?? {}) as Record<string, string>;

    const gaps: number[] = [];
    for (let level = 1; level <= ceiling; level++) {
      if (!anchors[String(level)]) gaps.push(level);
    }
    if (gaps.length > 0) missingAnchors.push(`${id} (L${gaps.join(', L')})`);

    const targets = (d.roleTargets ?? {}) as Record<string, unknown>;
    const absent = roles.filter((r) => !(r in targets));
    if (absent.length > 0) incompleteRoles.push(`${id} (${absent.length} unrated)`);
  }

  if (missingAnchors.length > 0) {
    lines.push(`Elements missing observable anchors (${missingAnchors.length}):`);
    for (const entry of missingAnchors.slice(0, 25)) lines.push(`  ${entry}`);
    if (missingAnchors.length > 25) lines.push(`  … and ${missingAnchors.length - 25} more`);
    lines.push('');
  }

  if (incompleteRoles.length > 0) {
    lines.push(`Elements with incomplete role ratings (${incompleteRoles.length}):`);
    for (const entry of incompleteRoles.slice(0, 25)) lines.push(`  ${entry}`);
    if (incompleteRoles.length > 25) lines.push(`  … and ${incompleteRoles.length - 25} more`);
    lines.push('');
  }

  return lines.join('\n');
}

/* ------------------------------------------------------------------------ */

export function quoteManifest(corpus: Corpus): string {
  const lines: string[] = [];
  const sources = indexSources(corpus.sources);

  lines.push('QUOTATION MANIFEST — FOR LEGAL REVIEW');
  lines.push('='.repeat(78));
  lines.push('');
  lines.push('Every quotation in the corpus. This is the complete set, not a sample.');
  lines.push('Citations are not listed here — a citation is a reference, not a reproduction,');
  lines.push('and requires no permission.');
  lines.push('');

  interface Row {
    element: string;
    path: string;
    source: string;
    designation: string;
    tier: number;
    clause: string;
    words: number;
    stripped: boolean;
    text: string;
  }

  const rows: Row[] = [];

  for (const file of corpus.elements) {
    const d = file.data as Record<string, any>;
    for (const quote of (d.quotes ?? []) as Array<Record<string, any>>) {
      const source = sources.get(quote.source);
      rows.push({
        element: d.id ?? '(unknown)',
        path: file.path,
        source: quote.source,
        designation: source?.designation ?? '(UNREGISTERED)',
        tier: source?.tier ?? 0,
        clause: quote.clause ?? '',
        words: String(quote.text ?? '').trim().split(/\s+/).filter(Boolean).length,
        stripped: source?.quotation?.strippedInRedistributable === true,
        text: String(quote.text ?? ''),
      });
    }
  }

  if (rows.length === 0) {
    lines.push('No quotations in the corpus.');
    return lines.join('\n');
  }

  /* -- Totals by source -------------------------------------------------- */

  const bySource = new Map<string, { rows: Row[]; tier: number; designation: string }>();
  for (const row of rows) {
    const bucket = bySource.get(row.source) ?? { rows: [], tier: row.tier, designation: row.designation };
    bucket.rows.push(row);
    bySource.set(row.source, bucket);
  }

  lines.push('SUMMARY BY SOURCE');
  lines.push('-'.repeat(78));
  lines.push(`${pad('SOURCE', 26)}${padLeft('TIER', 5)}${padLeft('QUOTES', 8)}${padLeft('WORDS', 7)}${padLeft('MAX', 5)}  STRIPPED`);
  for (const [id, bucket] of [...bySource.entries()].sort()) {
    const words = bucket.rows.reduce((n, r) => n + r.words, 0);
    const max = Math.max(...bucket.rows.map((r) => r.words));
    const stripped = bucket.rows.some((r) => r.stripped) ? 'yes' : 'no';
    lines.push(
      `${pad(id, 26)}${padLeft(bucket.tier, 5)}${padLeft(bucket.rows.length, 8)}${padLeft(words, 7)}${padLeft(max, 5)}  ${stripped}`,
    );
  }
  lines.push('-'.repeat(78));
  lines.push(
    `${pad('TOTAL', 26)}${padLeft('', 5)}${padLeft(rows.length, 8)}${padLeft(rows.reduce((n, r) => n + r.words, 0), 7)}`,
  );
  lines.push('');

  /* -- Full detail ------------------------------------------------------- */

  lines.push('EVERY QUOTATION');
  lines.push('-'.repeat(78));
  for (const row of rows.sort((a, b) => a.source.localeCompare(b.source) || a.element.localeCompare(b.element))) {
    lines.push('');
    lines.push(`  Element    ${row.element}  (${row.path})`);
    lines.push(`  Source     ${row.designation}  [Tier ${row.tier}]  §${row.clause}`);
    lines.push(`  Words      ${row.words}${row.stripped ? '   — removed by --strip-tier2' : ''}`);
    lines.push(`  Text       "${row.text}"`);
  }

  return lines.join('\n');
}
