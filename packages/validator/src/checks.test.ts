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
import type { Corpus, ElementFile, ItemFile } from './corpus.ts';
import { runAllChecks } from './checks.ts';
import { validatorFor } from './schema.ts';

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
            { id: 'CM-01-001', title: 'First', kind: 'knowledge', levelCeiling: 3, status: 'draft' },
            { id: 'CM-01-002', title: 'Second', kind: 'skill', levelCeiling: 2, status: 'draft' },
          ],
        },
      ],
    },
  ],
};

const roles = {
  schemaVersion: 1,
  roles: [
    { id: 'test-technician', title: 'Test Technician', roleType: 'occupational', family: 'technician', summary: LONG },
    { id: 'test-engineer', title: 'Test Engineer', roleType: 'occupational', family: 'engineering', summary: LONG },
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
        blockedPendingCounsel: false,
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
      quotation: { permitted: false, blockedPendingCounsel: false },
      termsBasis: 'No reproduction licence held for the purposes of this test fixture.',
      termsReviewedOn: '2026-08-08',
    },
  ],
};

function element(overrides: Record<string, unknown> = {}): ElementFile {
  return {
    path: `content/competence/elements/CM-01/${(overrides.id as string) ?? 'CM-01-001'}.md`,
    body: 'Body prose.',
    data: {
      id: 'CM-01-001',
      title: 'First',
      domain: 'CM-01',
      competencyArea: 'CM-01-A01',
      kind: 'knowledge',
      status: 'draft',
      summary: LONG,
      levelCeiling: 3,
      anchors: { '1': LONG, '2': LONG, '3': LONG },
      roleTargets: { 'test-technician': 2, 'test-engineer': 3 },
      citations: [{ source: 'OPEN-SOURCE-1', clause: '5.1.2' }],
      currency: { authorityStatus: 'normative', volatility: 'controlled' },
      knowledgeRefs: [{ article: 'BOK-0001', section: 's01' }],
      ...overrides,
    },
  };
}

/**
 * A BOK article. Every element must reach one, so the baseline corpus carries
 * this whether the test is about the BOK or not.
 */
function article(overrides: Record<string, unknown> = {}, body?: string): ElementFile {
  return {
    path: 'content/bok/CM-01/test-article.md',
    body: body ?? 'Prose.\n\n## First {#s01}\n\nMore prose.\n',
    data: {
      id: 'BOK-0001',
      title: 'Test article',
      subjects: ['CM-01'],
      status: 'draft',
      summary: LONG,
      sections: [{ id: 's01', heading: 'First' }],
      citations: [{ source: 'OPEN-SOURCE-1', clause: '5.1.2' }],
      ...overrides,
    },
  };
}

/**
 * The item bank. CM-01-001 is `knowledge` with a ceiling of 3; CM-01-002 is
 * `skill` with a ceiling of 2. Several tests below turn on that difference.
 */
function archetypeFile(overrides: Record<string, unknown> = {}): ItemFile {
  return {
    path: `content/competence/items/archetypes/${(overrides.id as string) ?? 'ARC-0001'}.yaml`,
    data: {
      id: 'ARC-0001',
      title: 'Test archetype',
      itemType: 'parameterized-worked-problem',
      kinds: ['knowledge'],
      levels: [1, 2, 3],
      status: 'draft',
      prompt: 'Given a standard uncertainty of {{u_a}}, determine the combined value.',
      parameters: [{ name: 'u_a', type: 'real' }],
      scoring: { method: 'deterministic' },
      lookupResistance: LONG,
      ...overrides,
    },
  };
}

function bindingFile(binding: Record<string, unknown> = {}, element = 'CM-01-001'): ItemFile {
  return {
    path: `content/competence/items/bindings/CM-01/${element}.yaml`,
    data: {
      schemaVersion: 1,
      element,
      bindings: [
        {
          level: 2,
          archetype: 'ARC-0001',
          status: 'draft',
          justification: LONG,
          ...binding,
        },
      ],
    },
  };
}

function corpus(
  elements: ElementFile[],
  lockedIds?: string[] | null,
  items: {
    archetypes?: ItemFile[];
    bindings?: ItemFile[];
    bok?: ElementFile[];
    modules?: ItemFile[];
  } = {},
): Corpus {
  return {
    taxonomy,
    taxonomyFiles: [{ path: 'content/competence/taxonomy/domains/CM-01.yaml', data: taxonomy }],
    proficiency: null,
    roles,
    sources,
    // Not convened, which is the shipped state and the one that refuses every
    // bootstrap signature.
    bootstrapCohort: { schemaVersion: 1, members: [] },
    trustRegistry: { schemaVersion: 1, issuedOn: '2026-08-11', sequence: 0, didMethods: ['did:key'], issuers: [] },
    elements,
    bok: items.bok ?? [article()],
    modules: items.modules ?? [],
    archetypes: items.archetypes ?? [],
    bindings: items.bindings ?? [],
    // BOK article IDs share the append-only registry with taxonomy IDs, so the
    // baseline lock has to carry the fixture article. Archetype and module IDs
    // do too, but only the corpora that supply them lock them — a locked ID
    // absent from the corpus is itself an error.
    lockedIds:
      lockedIds === undefined
        ? ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001']
        : lockedIds,
  };
}

/** Standard element set plus an item bank, for the item-bank tests. */
const withItems = (archetypes: ItemFile[], bindings: ItemFile[]): Corpus =>
  corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001', 'ARC-0001'], {
    archetypes,
    bindings,
  });

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

test('a quotation is rejected while the source awaits legal review, even within its limits', () => {
  const pendingCounsel = structuredClone(sources);
  pendingCounsel.sources[0]!.quotation.blockedPendingCounsel = true;

  const c = corpus([element({ quotes: [{ source: 'OPEN-SOURCE-1', clause: '5.1', text: 'short quote' }] })]);
  c.sources = pendingCounsel;

  assert.ok(
    errorsOf(c).some((e) => e.includes('blockedPendingCounsel')),
    'a source whose terms counsel has not confirmed must reject quotation regardless of its recorded limits',
  );
});

test('a source awaiting legal review may still be cited', () => {
  const pendingCounsel = structuredClone(sources);
  pendingCounsel.sources[0]!.quotation.blockedPendingCounsel = true;

  const c = corpus([element({ citations: [{ source: 'OPEN-SOURCE-1', clause: '5.1', relevance: 'Defines the term.' }] })]);
  c.sources = pendingCounsel;

  assert.ok(
    !errorsOf(c).some((e) => e.includes('blockedPendingCounsel')),
    'the block is on quotation only — citations are never restricted, and rule 2 requires them everywhere',
  );
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

test('an element whose kind disagrees with the skeleton is rejected', () => {
  // Kind decides what evidence proves attainment, so a mismatch means the
  // anchors and the assessment would be describing different things.
  const errors = errorsOf(corpus([element({ kind: 'judgment' })]));
  assert.ok(
    errors.some((e) => e.includes("kind 'judgment'") && e.includes("skeleton's 'knowledge'")),
    `expected a kind mismatch error, got: ${JSON.stringify(errors)}`,
  );
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
    kind: 'skill',
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

test('a role cannot need an element whose prerequisite is null for that role', () => {
  const foundation = element({
    id: 'CM-01-002',
    kind: 'skill',
    levelCeiling: 2,
    anchors: { '1': LONG, '2': LONG },
    roleTargets: { 'test-technician': null, 'test-engineer': 2 },
  });
  const dependent = element({ id: 'CM-01-001', prerequisites: ['CM-01-002'] });

  const errors = errorsOf(corpus([foundation, dependent]));
  assert.ok(
    errors.some((e) => e.includes('test-technician') && e.includes('CM-01-002') && e.includes('never that role')),
    `expected a roleTarget/prerequisite coherence error, got: ${JSON.stringify(errors)}`,
  );
  assert.ok(
    !errors.some((e) => e.includes('test-engineer')),
    'the engineer holds a target on both elements and must not be reported',
  );
});

test('an unauthored prerequisite has no roleTargets to contradict', () => {
  // CM-01-002 is in the taxonomy skeleton but has no element file, so there is
  // nothing to disagree with. Without this the check would fire across most of
  // the corpus, where prerequisites routinely point at unauthored elements.
  const errors = errorsOf(corpus([element({ id: 'CM-01-001', prerequisites: ['CM-01-002'] })]));
  assert.ok(
    !errors.some((e) => e.includes('never that role')),
    `an unauthored prerequisite must not trigger the coherence check, got: ${JSON.stringify(errors)}`,
  );
});

test('duplicate element IDs across files are rejected', () => {
  const errors = errorsOf(corpus([element(), { ...element(), path: 'content/competence/elements/CM-01/dup.md' }]));
  assert.ok(errors.some((e) => e.includes('also defined in')));
});

/* -- Contested knowledge and scoring neutrality --------------------------- */

/** An article whose only section is disputed, with everything else well-formed. */
function contestedArticle(overrides: Record<string, unknown> = {}): ElementFile {
  return article({
    sections: [
      {
        id: 's01',
        heading: 'First',
        consensus: 'contested',
        contestedBasis: 'source-silent',
        alternativeViews: [{ position: LONG, basis: LONG }],
        ...overrides,
      },
    ],
  });
}

test('a contested section must say where the disagreement lives', () => {
  const noBasis = contestedArticle({ contestedBasis: undefined });
  const errors = errorsOf(corpus([element()], undefined, { bok: [noBasis] }));
  assert.ok(
    errors.some((e) => e.includes('contestedBasis')),
    `expected a contestedBasis error, got: ${JSON.stringify(errors)}`,
  );
});

test('a contested section with a basis is accepted', () => {
  assert.deepEqual(errorsOf(corpus([element()], undefined, { bok: [contestedArticle()] })), []);
});

test('an item bound to disputed knowledge must declare what it does not score', () => {
  // The element's knowledgeRef reaches s01, which is contested — so a rubric
  // here could credit agreement with its author and nothing would show it.
  const c = corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001', 'ARC-0001'], {
    archetypes: [archetypeFile()],
    bindings: [bindingFile()],
    bok: [contestedArticle()],
  });

  assert.ok(
    errorsOf(c).some((e) => e.includes('positionNeutrality')),
    `expected a positionNeutrality error, got: ${JSON.stringify(errorsOf(c))}`,
  );
});

test('declaring it discharges the obligation, including to say it does not apply', () => {
  const c = corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001', 'ARC-0001'], {
    archetypes: [archetypeFile()],
    bindings: [bindingFile({ positionNeutrality: 'This level supplies both values and does not reach the disputed question.' })],
    bok: [contestedArticle()],
  });

  assert.ok(!errorsOf(c).some((e) => e.includes('positionNeutrality')));
});

test('an element on settled ground needs no neutrality statement', () => {
  // Otherwise the requirement would fire across the whole bank and be ignored.
  assert.deepEqual(errorsOf(withItems([archetypeFile()], [bindingFile()])), []);
});

/* -- Item bank ------------------------------------------------------------ */

test('a well-formed archetype and binding produce no errors', () => {
  assert.deepEqual(errorsOf(withItems([archetypeFile()], [bindingFile()])), []);
});

test('binding a knowledge archetype to a skill element is rejected', () => {
  // CM-01-002 is `skill`; ARC-0001 serves `knowledge`. The candidate would be
  // asked to explain the task rather than perform it, which is the commonest
  // way an assessment ends up measuring the wrong thing.
  const errors = errorsOf(
    withItems([archetypeFile()], [bindingFile({ level: 2 }, 'CM-01-002')]),
  );
  assert.ok(
    errors.some((e) => e.includes("binds a 'skill' element") && e.includes('ARC-0001')),
    `expected a kind-mismatch error, got: ${JSON.stringify(errors)}`,
  );
});

test('a binding above the element ceiling is rejected, because no such unit exists', () => {
  const errors = errorsOf(withItems([archetypeFile()], [bindingFile({ level: 3 }, 'CM-01-002')]));
  assert.ok(
    errors.some((e) => e.includes("exceeds the element's ceiling of 2")),
    `expected a ceiling error, got: ${JSON.stringify(errors)}`,
  );
});

test('a binding at a level the archetype does not serve is rejected', () => {
  const errors = errorsOf(
    withItems([archetypeFile({ levels: [4, 5] })], [bindingFile()]),
  );
  assert.ok(errors.some((e) => e.includes('declares levels 4, 5')));
});

test('a binding naming an unknown archetype is rejected', () => {
  const errors = errorsOf(withItems([archetypeFile()], [bindingFile({ archetype: 'ARC-9999' })]));
  assert.ok(errors.some((e) => e.includes("unknown archetype 'ARC-9999'")));
});

test('a binding setting a parameter the archetype does not declare is rejected', () => {
  const errors = errorsOf(
    withItems([archetypeFile()], [bindingFile({ parameterRanges: [{ name: 'u_b', min: 1, max: 2 }] })]),
  );
  assert.ok(errors.some((e) => e.includes("sets parameter 'u_b'")));
});

test('an undeclared prompt placeholder is rejected, since it renders literally', () => {
  const errors = errorsOf(
    withItems([archetypeFile({ prompt: 'Given {{u_a}} and {{k_factor}}, determine the result.' })], []),
  );
  assert.ok(errors.some((e) => e.includes('{{k_factor}}')));
});

test('a declared but unused parameter is rejected, since it varies nothing', () => {
  const errors = errorsOf(
    withItems(
      [archetypeFile({ parameters: [{ name: 'u_a', type: 'real' }, { name: 'unused', type: 'real' }] })],
      [],
    ),
  );
  assert.ok(errors.some((e) => e.includes("parameter 'unused'")));
});

test('a rubric-scored archetype with no rubric is rejected', () => {
  const errors = errorsOf(withItems([archetypeFile({ scoring: { method: 'rubric' } })], []));
  assert.ok(
    errors.some((e) => e.includes('no rubricRef')),
    `expected a missing-rubric error, got: ${JSON.stringify(errors)}`,
  );
});

test('duplicate archetype IDs are rejected', () => {
  const errors = errorsOf(
    withItems([archetypeFile(), { ...archetypeFile(), path: 'content/competence/items/archetypes/dup.yaml' }], []),
  );
  assert.ok(errors.some((e) => e.includes('also defined in')));
});

test('a generator parameter rendered into the prompt is rejected, since it gives the answer away', () => {
  // The failure this catches is silent: an archetype whose prompt announces
  // which defect was injected looks perfectly well-formed.
  const errors = errorsOf(
    withItems(
      [
        archetypeFile({
          prompt: 'Given {{u_a}}, find the {{defect_class}} in the attached budget.',
          parameters: [
            { name: 'u_a', type: 'real' },
            { name: 'defect_class', type: 'choice', visibility: 'generator' },
          ],
        }),
      ],
      [],
    ),
  );
  assert.ok(
    errors.some((e) => e.includes('generator parameter') && e.includes('destroys the item')),
    `expected a leaked-generator error, got: ${JSON.stringify(errors)}`,
  );
});

test('a generator parameter absent from the prompt is accepted', () => {
  const errors = errorsOf(
    withItems(
      [
        archetypeFile({
          parameters: [
            { name: 'u_a', type: 'real' },
            { name: 'defect_class', type: 'choice', visibility: 'generator' },
          ],
        }),
      ],
      [],
    ),
  );
  assert.deepEqual(errors, []);
});

test('a rubricRef pointing at a nonexistent file is rejected', () => {
  const errors = errorsOf(
    withItems(
      [archetypeFile({ scoring: { method: 'rubric', rubricRef: 'content/competence/items/rubrics/NOPE.md' } })],
      [],
    ),
  );
  assert.ok(errors.some((e) => e.includes('does not exist')));
});

/* -- The BOK, and the link from a claim to the knowledge behind it --------- */

test('an element pointing at a nonexistent article is rejected', () => {
  const errors = errorsOf(
    corpus([element({ knowledgeRefs: [{ article: 'BOK-9999', section: 's01' }] })]),
  );
  assert.ok(errors.some((e) => e.includes("unknown article 'BOK-9999'")));
});

test('an element pointing at a section the article does not declare is rejected', () => {
  // The refresher path for someone who has forgotten one detail. Broken, it
  // fails silently for exactly the person who most needs it.
  const errors = errorsOf(
    corpus([element({ knowledgeRefs: [{ article: 'BOK-0001', section: 's07' }] })]),
  );
  assert.ok(
    errors.some((e) => e.includes('BOK-0001#s07') && e.includes('fails silently')),
    `expected a dangling section error, got: ${JSON.stringify(errors)}`,
  );
});

test('an element with no knowledgeRefs is rejected', () => {
  const errors = errorsOf(corpus([element({ knowledgeRefs: [] })]));
  assert.ok(errors.some((e) => e.includes('knowledgeRefs')));
});

test('a declared section with no anchor in the body is rejected', () => {
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [
        article(
          { sections: [{ id: 's01', heading: 'First' }, { id: 's02', heading: 'Second' }] },
          'Prose.\n\n## First {#s01}\n',
        ),
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("section 's02' is declared")));
});

test('an anchor in the body that no section declares is rejected', () => {
  // Undeclared anchors get renamed by people who cannot see anything depends
  // on them.
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [article({}, 'Prose.\n\n## First {#s01}\n\n## Stray {#s09}\n')],
    }),
  );
  assert.ok(errors.some((e) => e.includes("'{#s09}'")));
});

test('a deprecated section with no forward pointer is rejected', () => {
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [article({ sections: [{ id: 's01', heading: 'First', deprecated: true }] })],
    }),
  );
  assert.ok(errors.some((e) => e.includes('supersededBy')));
});

test('duplicate article IDs are rejected', () => {
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [article(), { ...article(), path: 'content/bok/CM-01/dup.md' }],
    }),
  );
  assert.ok(errors.some((e) => e.includes('also defined in')));
});

test('an article no element references warns rather than fails', () => {
  // The BOK is allowed to exceed the taxonomy. An encyclopedia constrained to
  // exactly what is examinable is not one.
  const findings = runAllChecks(
    corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001', 'BOK-0002'], {
      bok: [article(), { ...article({ id: 'BOK-0002' }), path: 'content/bok/CM-01/other.md' }],
    }),
  );
  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('BOK-0002')));
  assert.ok(!findings.some((f) => f.level === 'error' && f.message.includes('BOK-0002')));
});

/* -- BOK review provenance and disagreement -------------------------------- */

const REVIEWED_BODY = 'Prose.\n\n## First {#s01}\n\nMore prose.\n';

test('a review covering a section the article does not declare is rejected', () => {
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [
        article({
          reviews: [
            {
              reviewer: { name: 'A Reviewer' },
              reviewType: 'technical',
              reviewedOn: '2026-11-01',
              disposition: 'accepted',
              covers: [{ section: 's09', sectionRef: `sha256:${'a'.repeat(64)}` }],
            },
          ],
        }),
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("covers section 's09'")));
});

test('a review stops vouching for prose that has been rewritten since', () => {
  // Otherwise a named practitioner's endorsement silently transfers to words
  // they never read.
  const findings = runAllChecks(
    corpus([element()], undefined, {
      bok: [
        article(
          {
            reviews: [
              {
                reviewer: { name: 'A Reviewer' },
                reviewType: 'technical',
                reviewedOn: '2026-11-01',
                disposition: 'accepted',
                covers: [{ section: 's01', sectionRef: `sha256:${'b'.repeat(64)}` }],
              },
            ],
          },
          REVIEWED_BODY,
        ),
      ],
    }),
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('rewritten since A Reviewer')),
    `expected a stale-review warning, got: ${JSON.stringify(findings.map((f) => f.message))}`,
  );
});

test('a contested section with no alternative view is rejected', () => {
  // Flagging controversy without describing it leaves a reader knowing not to
  // trust the passage and still unable to act.
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [article({ sections: [{ id: 's01', heading: 'First', consensus: 'contested' }] })],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes('records no alternativeViews')),
    `expected a contested-without-alternatives error, got: ${JSON.stringify(errors)}`,
  );
});

test('a contested section that records the other position is accepted', () => {
  const errors = errorsOf(
    corpus([element()], undefined, {
      bok: [
        article({
          sections: [
            {
              id: 's01',
              heading: 'First',
              consensus: 'contested',
              contestedBasis: 'source-silent',
              alternativeViews: [
                {
                  position: 'The opposing reading, stated in its strongest form.',
                  basis: 'Why competent practitioners hold it.',
                },
              ],
            },
          ],
        }),
      ],
    }),
  );
  assert.deepEqual(errors, []);
});

test('an established section needs no alternatives', () => {
  assert.deepEqual(errorsOf(corpus([element()], undefined, { bok: [article()] })), []);
});

/* -- Training modules ------------------------------------------------------ */

function moduleFile(overrides: Record<string, unknown> = {}): ItemFile {
  return {
    path: 'content/competence/modules/CM-01/test-module.yaml',
    data: {
      id: 'MOD-0001',
      title: 'Test module',
      status: 'draft',
      format: 'procedural-simulation',
      summary: LONG,
      knowledgeRefs: [{ article: 'BOK-0001', section: 's01' }],
      cannotConvey: LONG,
      ...overrides,
    },
  };
}

const LOCK_WITH_MODULE = ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001', 'MOD-0001'];

test('a well-formed module produces no errors', () => {
  assert.deepEqual(errorsOf(corpus([element()], LOCK_WITH_MODULE, { modules: [moduleFile()] })), []);
});

test('a module preparing for an EQUIPMENT skill element must declare the bench requirement', () => {
  // CM-01-002 is `skill`. Training toward it leaves it pending demonstration,
  // never complete — a simulation does not substitute for witnessed work.
  const bench = element({ id: 'CM-01-002', kind: 'skill', levelCeiling: 2, demonstration: ['equipment'], anchors: { '1': LONG, '2': LONG }, roleTargets: { 'test-technician': 2, 'test-engineer': 2 } });
  const errors = errorsOf(
    corpus([bench], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-002', level: 2 }] })],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes('by the equipment route') && e.includes('CM-01-002')),
    `expected a skill-demonstration error, got: ${JSON.stringify(errors)}`,
  );
});

test('declaring the physical demonstration makes it acceptable', () => {
  const bench = element({ id: 'CM-01-002', kind: 'skill', levelCeiling: 2, demonstration: ['equipment'], anchors: { '1': LONG, '2': LONG }, roleTargets: { 'test-technician': 2, 'test-engineer': 2 } });
  const errors = errorsOf(
    corpus([bench], LOCK_WITH_MODULE, {
      modules: [
        moduleFile({
          preparesFor: [{ element: 'CM-01-002', level: 2 }],
          requiresPhysicalDemonstration: ['CM-01-002'],
        }),
      ],
    }),
  );
  assert.deepEqual(errors, []);
});

test('a knowledge element needs no physical demonstration', () => {
  const errors = errorsOf(
    corpus([element()], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-001', level: 2 }] })],
    }),
  );
  assert.deepEqual(errors, []);
});

test('a module teaching outside the BOK is rejected', () => {
  // Teaching material that exists only inside a module is knowledge the corpus
  // has lost — unreachable by anyone who did not take the module.
  const errors = errorsOf(
    corpus([element()], LOCK_WITH_MODULE, {
      modules: [moduleFile({ knowledgeRefs: [{ article: 'BOK-0001', section: 's44' }] })],
    }),
  );
  assert.ok(errors.some((e) => e.includes('BOK-0001#s44')));
});

test('a module preparing above an element ceiling is rejected', () => {
  const errors = errorsOf(
    corpus([element()], LOCK_WITH_MODULE, {
      modules: [
        moduleFile({
          preparesFor: [{ element: 'CM-01-002', level: 4 }],
          requiresPhysicalDemonstration: ['CM-01-002'],
        }),
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes('above its ceiling of 2')));
});

test('a training record cannot be made to attest competence', () => {
  const validate = validatorFor('training-record');
  const record = {
    schemaVersion: 1,
    id: 'urn:uuid:7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
    subject: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
    module: 'MOD-0001',
    moduleRef: `sha256:${'a'.repeat(64)}`,
    completedOn: '2026-08-10',
    attestsCompetence: false,
  };
  assert.ok(validate(record), JSON.stringify(validate.errors, null, 2));
  assert.equal(validate({ ...record, attestsCompetence: true }), false);
});

test('a training record can carry pending-demonstration for a skill element', () => {
  // The state that turns "I have no employer" into a specific request.
  const validate = validatorFor('training-record');
  assert.ok(
    validate({
      schemaVersion: 1,
      id: 'urn:uuid:7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
      subject: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
      module: 'MOD-0001',
      moduleRef: `sha256:${'a'.repeat(64)}`,
      completedOn: '2026-08-10',
      attestsCompetence: false,
      preparedFor: [{ element: 'CM-01-002', level: 2, state: 'pending-demonstration' }],
    }),
  );
});

/* -- Anchors must describe something observable ---------------------------- */

test('an anchor that says "understands" is rejected', () => {
  // The failure the playbook has always named, now mechanical: nobody can
  // observe understanding, and no item can test it.
  const errors = errorsOf(
    corpus([element({ anchors: { '1': 'Understands why input correlation matters in a budget.', '2': LONG, '3': LONG } })]),
  );
  assert.ok(
    errors.some((e) => e.includes("says 'understands'") && e.includes('nobody can observe')),
    `expected an unobservable-anchor error, got: ${JSON.stringify(errors)}`,
  );
});

test('"familiar with" and "aware of" are rejected too', () => {
  const errors = errorsOf(
    corpus([element({ anchors: { '1': 'Is familiar with the GUM framework and its scope.', '2': 'Is aware of the correlation problem in shared standards.', '3': LONG } })]),
  );
  assert.ok(errors.some((e) => e.includes("says 'familiar with'")));
  assert.ok(errors.some((e) => e.includes("says 'aware of'")));
});

test('an anchor restating the level name instead of a behaviour is rejected', () => {
  // "Expert in X" says where on the ladder they sit, not what they do there.
  const errors = errorsOf(
    corpus([element({ anchors: { '1': LONG, '2': LONG, '3': 'Is expert in constructing correlated uncertainty budgets.' } })]),
  );
  assert.ok(errors.some((e) => e.includes("says 'expert in'")));
});

test('an observable anchor passes', () => {
  const errors = errorsOf(
    corpus([
      element({
        anchors: {
          '1': 'Flags a correlated pair in a supplied budget when told what to look for.',
          '2': 'Adds a covariance term using a coefficient they have been given and shows its effect.',
          '3': 'Constructs a budget containing a covariance term and records the basis for the coefficient.',
        },
      }),
    ]),
  );
  assert.deepEqual(errors, []);
});

test('an archetype ID missing from the lock is an error, like any other identifier', () => {
  // A credential records the archetype it was served from. Retiring or
  // renumbering one breaks the provenance of every assessment citing it, which
  // is the same harm as renaming an element.
  const errors = errorsOf(
    corpus([element()], ['CM-01', 'CM-01-A01', 'CM-01-001', 'CM-01-002', 'BOK-0001'], {
      archetypes: [archetypeFile()],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes('ARC-0001') && e.includes('registry:sync')),
    `expected an unlocked archetype error, got: ${JSON.stringify(errors)}`,
  );
});

test('an equipment element must be declared, a desk element must not', () => {
  // `skill` says the evidence is performance; it does not say the performance
  // happens at a bench. Constructing a budget is a skill and is desk work, and
  // claiming a bench blocker for it invents a barrier the learner never had.
  const equipmentElement = element({ id: 'CM-01-002', kind: 'skill', levelCeiling: 2, demonstration: ['equipment'], anchors: { '1': LONG, '2': LONG }, roleTargets: { 'test-technician': 2, 'test-engineer': 2 } });
  const deskElement = element({ id: 'CM-01-002', kind: 'skill', levelCeiling: 2, demonstration: ['desk'], anchors: { '1': LONG, '2': LONG }, roleTargets: { 'test-technician': 2, 'test-engineer': 2 } });
  const prepares = { preparesFor: [{ element: 'CM-01-002', level: 2 }] };

  const missing = errorsOf(
    corpus([equipmentElement], LOCK_WITH_MODULE, { modules: [moduleFile(prepares)] }),
  );
  assert.ok(
    missing.some((e) => e.includes('by the equipment route')),
    `expected an undeclared-equipment error, got: ${JSON.stringify(missing)}`,
  );

  const invented = errorsOf(
    corpus([deskElement], LOCK_WITH_MODULE, {
      modules: [moduleFile({ ...prepares, requiresPhysicalDemonstration: ['CM-01-002'] })],
    }),
  );
  assert.ok(
    invented.some((e) => e.includes('no equipment is needed')),
    `expected an invented-barrier error, got: ${JSON.stringify(invented)}`,
  );
});

/*
 * The multi-route case.
 *
 * `demonstration` is a SET because some competences have two genuine routes:
 * the competence is the same in both, and which one is available is a property
 * of the LABORATORY rather than of the element. Numerical estimation of a
 * sensitivity coefficient is the worked case — perturb a correction routine
 * (desk) or perturb the instrument itself (bench), and JCGM 100 contemplates
 * both.
 *
 * Forcing one value was wrong in both directions. What replaces it must not
 * quietly reintroduce either error, so both are tested from both sides.
 */

const bothRoutes = () =>
  element({
    id: 'CM-01-002',
    kind: 'skill',
    levelCeiling: 2,
    demonstration: ['desk', 'equipment'],
    anchors: { '1': LONG, '2': LONG },
    roleTargets: { 'test-technician': 2, 'test-engineer': 2 },
  });

test('a multi-route element makes the module say which route it prepares', () => {
  // Both routes are admissible for the element, so omission cannot be read as
  // either one. Read as desk work — the only way a validator could read it —
  // it would leave a learner bound for the bench with no warning that access
  // is coming, while the module validated perfectly cleanly. The choice may
  // not be made by silence, which is the whole reason `route` exists.
  const errors = errorsOf(
    corpus([bothRoutes()], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-002', level: 2 }] })],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes('without stating which one in the route field')),
    `expected a missing-route error, got: ${JSON.stringify(errors)}`,
  );
});

test('preparing a multi-route element by the equipment route must be declared', () => {
  const undeclared = errorsOf(
    corpus([bothRoutes()], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-002', level: 2, route: 'equipment' }] })],
    }),
  );
  assert.ok(
    undeclared.some((e) => e.includes('by the equipment route')),
    `expected an undeclared-equipment error, got: ${JSON.stringify(undeclared)}`,
  );

  const declared = errorsOf(
    corpus([bothRoutes()], LOCK_WITH_MODULE, {
      modules: [
        moduleFile({
          preparesFor: [{ element: 'CM-01-002', level: 2, route: 'equipment' }],
          requiresPhysicalDemonstration: ['CM-01-002'],
        }),
      ],
    }),
  );
  assert.deepEqual(declared, []);
});

test('the same element reaches `prepared` through its desk route', () => {
  // Not a hidden barrier: this module prepares the route that does not have
  // one. Listing it would invent for THIS learner the barrier the bench-route
  // module legitimately declares for its own — the same element, two honest
  // modules, two different states on the training record.
  const desk = errorsOf(
    corpus([bothRoutes()], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-002', level: 2, route: 'desk' }] })],
    }),
  );
  assert.deepEqual(desk, []);

  const invented = errorsOf(
    corpus([bothRoutes()], LOCK_WITH_MODULE, {
      modules: [
        moduleFile({
          preparesFor: [{ element: 'CM-01-002', level: 2, route: 'desk' }],
          requiresPhysicalDemonstration: ['CM-01-002'],
        }),
      ],
    }),
  );
  assert.ok(
    invented.some((e) => e.includes('no equipment is needed')),
    `expected an invented-barrier error, got: ${JSON.stringify(invented)}`,
  );
});

test('a single-route element may not have its route restated by a module', () => {
  // One fact, one place. A copy beside the element can fall out of agreement
  // with it after an edit, and an author reading the two files would then be
  // told different things by each with nothing saying which the validator
  // believes. This is the shape decision 8b removed from `bootstrapAuthority`.
  const deskOnly = element({
    id: 'CM-01-002',
    kind: 'skill',
    levelCeiling: 2,
    demonstration: ['desk'],
    anchors: { '1': LONG, '2': LONG },
    roleTargets: { 'test-technician': 2, 'test-engineer': 2 },
  });
  const errors = errorsOf(
    corpus([deskOnly], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-002', level: 2, route: 'desk' }] })],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes('declares exactly one route')),
    `expected a restated-route error, got: ${JSON.stringify(errors)}`,
  );
});

test('on an UNAUTHORED skill element, declaring the bench requirement is permitted', () => {
  // CM-01-002 is a taxonomy stub with no authored definition, so its
  // demonstration mode is genuinely unknown. This check previously read
  // `mode !== 'equipment'`, which swept the unknown case in and rejected the
  // declaration with "its demonstration mode is 'undefined' — no equipment is
  // needed": an assertion that no equipment is needed, made immediately after
  // warning that the mode could not be determined.
  //
  // It left omission as the only permitted move, which is the direction that
  // HIDES a blocker — and refusing to default an unknown mode to `desk` exists
  // precisely to avoid that. With 2231 of 2232 elements unauthored, this is the
  // ordinary case for a module written before its elements are.
  const declared = corpus([element()], LOCK_WITH_MODULE, {
    modules: [
      moduleFile({
        preparesFor: [{ element: 'CM-01-002', level: 2 }],
        requiresPhysicalDemonstration: ['CM-01-002'],
      }),
    ],
  });

  assert.deepEqual(
    errorsOf(declared).filter((e) => e.includes('no equipment is needed')),
    [],
    'the cautious reading of an unknown mode must not be rejected',
  );

  const findings = runAllChecks(declared);
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('cautious reading')),
    `expected the declaration to be flagged for revisiting, got: ${JSON.stringify(findings.filter((f) => f.level === 'warn'))}`,
  );
});

test('an unauthored skill element left undeclared is still warned about', () => {
  // The other direction of the same unknown: it may be a real bench blocker,
  // and nothing here can tell.
  const findings = runAllChecks(
    corpus([element()], LOCK_WITH_MODULE, {
      modules: [moduleFile({ preparesFor: [{ element: 'CM-01-002', level: 2 }] })],
    }),
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('cannot be checked')),
    `expected an unknown-mode warning, got: ${JSON.stringify(findings.filter((f) => f.level === 'warn'))}`,
  );
});

test('two elements sharing a title are flagged, without being called an error', () => {
  // An ID is what a credential names, so two identically titled elements are
  // still distinct competences — but a human handed one cannot tell which. This
  // was found twice by ad-hoc script during a generated build-out before it
  // became a standing check.
  const clash = {
    ...taxonomy,
    domains: [{
      ...taxonomy.domains[0]!,
      competencyAreas: [{
        ...taxonomy.domains[0]!.competencyAreas[0]!,
        elements: [
          { id: 'CM-01-001', title: 'Immersion depth', kind: 'knowledge', levelCeiling: 3, status: 'draft' },
          { id: 'CM-01-002', title: 'immersion  DEPTH ', kind: 'knowledge', levelCeiling: 3, status: 'draft' },
        ],
      }],
    }],
  };
  const findings = runAllChecks({ ...corpus([]), taxonomy: clash });
  const dup = findings.filter((f) => f.message.includes('share an element title'));
  assert.equal(dup.length, 1, `expected one duplicate-title finding, got ${JSON.stringify(dup)}`);
  assert.equal(dup[0]!.level, 'warn');
  assert.ok(dup[0]!.message.includes('CM-01-001') && dup[0]!.message.includes('CM-01-002'));
});

test('distinct titles raise nothing', () => {
  const findings = runAllChecks(corpus([]));
  assert.deepEqual(findings.filter((f) => f.message.includes('share an element title')), []);
});

/* -- Proficiency policy --------------------------------------------------- */

const ladder = (level: number, modality: string[]) => ({
  schemaVersion: 1,
  levels: [{ level, name: 'Test', assessment: { modality, requiresCapstone: false } }],
});

test('a proficiency-test result cannot stand at L1 or L2', () => {
  // The strongest objective evidence recorded against the weakest claim reads
  // as a promotion to anyone comparing two credentials.
  for (const level of [1, 2]) {
    const c = corpus([element()]);
    c.proficiency = ladder(level, ['open-resource-parameterized', 'witnessed-proficiency-test']);
    assert.ok(
      errorsOf(c).some((e) => e.includes('witnessed-proficiency-test')),
      `expected L${level} to reject the modality`,
    );
  }
});

test('a proficiency-test result is admissible from L3 upward', () => {
  for (const level of [3, 4, 5]) {
    const c = corpus([element()]);
    c.proficiency = ladder(level, ['witnessed-proficiency-test']);
    assert.ok(
      !errorsOf(c).some((e) => e.includes('witnessed-proficiency-test')),
      `expected L${level} to accept the modality`,
    );
  }
});
