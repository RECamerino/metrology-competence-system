/**
 * Guardrail tests.
 *
 * These are not tests of the validator so much as tests of the PROMISES the
 * validator makes to the project: that an ID can never silently disappear,
 * that no element ships without a citation, and that a quotation cannot exceed
 * what its source's licence permits. Each of those failing silently would do
 * real damage — to a credential holder, to the corpus's auditability, or to
 * the project's ability to be redistributed at all.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Corpus, ElementFile } from './corpus.ts';
import { runAllChecks } from './checks.ts';

/* -- Fixtures ------------------------------------------------------------ */

const LONG = 'A deliberately long enough string to satisfy the schema minimum length constraints.';

const taxonomy = {
  schemaVersion: 1,
  domains: [
    {
      id: 'CM-01',
      title: 'Test Domain',
      kind: 'core',
      status: 'draft',
      competencyAreas: [
        {
          id: 'CM-01-A01',
          title: 'Test Area',
          status: 'draft',
          elements: [
            { id: 'CM-01-001', title: 'First', levelCeiling: 3, status: 'draft' },
            { id: 'CM-01-002', title: 'Second', levelCeiling: 2, status: 'draft' },
          ],
        },
      ],
    },
  ],
};

const roles = {
  schemaVersion: 1,
  roles: [
    { id: 'test-technician', title: 'Test Technician', family: 'technician', summary: LONG },
    { id: 'test-engineer', title: 'Test Engineer', family: 'engineering', summary: LONG },
  ],
};

const sources = {
  schemaVersion: 1,
  sources: [
    {
      id: 'OPEN-SOURCE-1',
      designation: 'Open Doc 1',
      title: 'An openly licensed document',
      publisher: 'Test Publisher',
      edition: '2020',
      tier: 1,
      quotation: {
        permitted: true,
        maxWordsPerQuote: 10,
        maxQuotesPerElement: 1,
        requiresCommentary: false,
      },
      termsBasis: 'Public domain for the purposes of this test fixture.',
      termsReviewedOn: '2026-08-08',
    },
    {
      id: 'CLOSED-SOURCE-1',
      designation: 'Closed Doc 1',
      title: 'A restricted document',
      publisher: 'Test Publisher',
      edition: '2020',
      tier: 3,
      quotation: { permitted: false },
      termsBasis: 'No reproduction licence held for the purposes of this test fixture.',
      termsReviewedOn: '2026-08-08',
    },
  ],
};

function element(overrides: Record<string, unknown> = {}): ElementFile {
  return {
    path: `content/elements/CM-01/${(overrides.id as string) ?? 'CM-01-001'}.md`,
    body: 'Body prose.',
    data: {
      id: 'CM-01-001',
      title: 'First',
      domain: 'CM-01',
      competencyArea: 'CM-01-A01',
      status: 'draft',
      summary: LONG,
      levelCeiling: 3,
      anchors: { '1': LONG, '2': LONG, '3': LONG },
      roleTargets: { 'test-technician': 2, 'test-engineer': 3 },
      citations: [{ source: 'OPEN-SOURCE-1', clause: '5.1.2' }],
      ...overrides,
    },
  };
}

function corpus(elements: ElementFile[], lockedIds?: string[] | null): Corpus {
  return {
    taxonomy,
    proficiency: null,
    roles,
    sources,
    elements,
    lockedIds: lockedIds === undefined ? ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002'] : lockedIds,
  };
}

const errorsOf = (c: Corpus): string[] =>
  runAllChecks(c)
    .filter((f) => f.level === 'error')
    .map((f) => f.message);

/* -- The baseline must be clean ------------------------------------------ */

test('a well-formed element produces no errors', () => {
  assert.deepEqual(errorsOf(corpus([element()])), []);
});

/* -- ID registry immutability -------------------------------------------- */

test('an ID that disappears from the skeleton is an error', () => {
  const errors = errorsOf(corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'CM-01-999']));
  assert.ok(
    errors.some((e) => e.includes("'CM-01-999'") && e.includes('append-only')),
    `expected a removed-ID error, got: ${JSON.stringify(errors)}`,
  );
});

test('a new ID not yet in the lock is an error, so additions are visible in review', () => {
  const errors = errorsOf(corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001']));
  assert.ok(
    errors.some((e) => e.includes('CM-01-002') && e.includes('registry:sync')),
    `expected an unlocked-ID error, got: ${JSON.stringify(errors)}`,
  );
});

/* -- Referenceability ----------------------------------------------------- */

test('an element with no citations is rejected', () => {
  const errors = errorsOf(corpus([element({ citations: [] })]));
  assert.ok(errors.some((e) => e.includes('Referenceability is mandatory')));
});

test('citing an unregistered source is rejected', () => {
  const errors = errorsOf(corpus([element({ citations: [{ source: 'UNKNOWN-DOC', clause: '1' }] })]));
  assert.ok(errors.some((e) => e.includes('unregistered source')));
});

/* -- Quotation limits ----------------------------------------------------- */

test('quoting a reference-only source is rejected', () => {
  const errors = errorsOf(
    corpus([element({ quotes: [{ source: 'CLOSED-SOURCE-1', clause: '4.1', text: 'three short words' }] })]),
  );
  assert.ok(
    errors.some((e) => e.includes('Tier 3') && e.includes('reference only')),
    `expected a tier-3 quotation error, got: ${JSON.stringify(errors)}`,
  );
});

test('a quotation over the registered word limit is rejected', () => {
  const errors = errorsOf(
    corpus([
      element({
        quotes: [
          {
            source: 'OPEN-SOURCE-1',
            clause: '5.1',
            text: 'one two three four five six seven eight nine ten eleven twelve',
          },
        ],
      }),
    ]),
  );
  assert.ok(
    errors.some((e) => e.includes('12 words') && e.includes('allows 10')),
    `expected a word-limit error, got: ${JSON.stringify(errors)}`,
  );
});

test('exceeding the per-element quotation count for a source is rejected', () => {
  const errors = errorsOf(
    corpus([
      element({
        quotes: [
          { source: 'OPEN-SOURCE-1', clause: '5.1', text: 'short quote' },
          { source: 'OPEN-SOURCE-1', clause: '5.2', text: 'another short quote' },
        ],
      }),
    ]),
  );
  assert.ok(errors.some((e) => e.includes('allows 1 per element')));
});

test('a restricted quotation without commentary is rejected', () => {
  const withCommentaryRequired = structuredClone(sources);
  withCommentaryRequired.sources[0]!.quotation.requiresCommentary = true;

  const c = corpus([element({ quotes: [{ source: 'OPEN-SOURCE-1', clause: '5.1', text: 'short quote' }] })]);
  c.sources = withCommentaryRequired;

  assert.ok(errorsOf(c).some((e) => e.includes('no commentary')));
});

/* -- Proficiency and role completeness ----------------------------------- */

test('a missing observable anchor is rejected', () => {
  const errors = errorsOf(corpus([element({ anchors: { '1': LONG, '3': LONG } })]));
  assert.ok(errors.some((e) => e.includes('missing observable anchor for level 2')));
});

test('an anchor above the level ceiling is rejected', () => {
  const errors = errorsOf(
    corpus([element({ anchors: { '1': LONG, '2': LONG, '3': LONG, '4': LONG } })]),
  );
  assert.ok(errors.some((e) => e.includes('anchor for level 4')));
});

test('an unrated role is rejected — silence is not the same as not-applicable', () => {
  const errors = errorsOf(corpus([element({ roleTargets: { 'test-technician': 2 } })]));
  assert.ok(errors.some((e) => e.includes("missing 'test-engineer'")));
});

test('null is accepted as an explicit not-applicable rating', () => {
  const errors = errorsOf(
    corpus([element({ roleTargets: { 'test-technician': null, 'test-engineer': 3 } })]),
  );
  assert.deepEqual(errors, []);
});

test('a role target above the element ceiling is rejected', () => {
  const errors = errorsOf(
    corpus([element({ roleTargets: { 'test-technician': 5, 'test-engineer': 3 } })]),
  );
  assert.ok(errors.some((e) => e.includes('targets level 5') && e.includes('ceiling is 3')));
});

/* -- Skeleton correspondence --------------------------------------------- */

test('an element whose ceiling disagrees with the skeleton is rejected', () => {
  const errors = errorsOf(
    corpus([element({ levelCeiling: 2, anchors: { '1': LONG, '2': LONG } })]),
  );
  assert.ok(errors.some((e) => e.includes("disagrees with the skeleton's 3")));
});

test('an element file with no skeleton entry is rejected', () => {
  const errors = errorsOf(corpus([element({ id: 'CM-01-404' })]));
  assert.ok(errors.some((e) => e.includes('no entry in the taxonomy skeleton')));
});

/* -- Graph integrity ------------------------------------------------------ */

test('a prerequisite cycle is reported with the actual cycle', () => {
  const a = element({ id: 'CM-01-001', prerequisites: ['CM-01-002'] });
  const b = element({
    id: 'CM-01-002',
    levelCeiling: 2,
    anchors: { '1': LONG, '2': LONG },
    roleTargets: { 'test-technician': 2, 'test-engineer': 2 },
    prerequisites: ['CM-01-001'],
  });

  const errors = errorsOf(corpus([a, b]));
  assert.ok(
    errors.some((e) => e.includes('prerequisite cycle') && e.includes('CM-01-001')),
    `expected a cycle error, got: ${JSON.stringify(errors)}`,
  );
});

test('a prerequisite pointing at a nonexistent element is rejected', () => {
  const errors = errorsOf(corpus([element({ prerequisites: ['CM-01-404'] })]));
  assert.ok(errors.some((e) => e.includes('unknown element')));
});

test('duplicate element IDs across files are rejected', () => {
  const errors = errorsOf(corpus([element(), { ...element(), path: 'content/elements/CM-01/dup.md' }]));
  assert.ok(errors.some((e) => e.includes('also defined in')));
});
