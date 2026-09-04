/**
 * Semantic pinning guardrails.
 *
 * The scenario these exist for: a person demonstrates CM-03-014 at L4 in 2027.
 * In 2030 the anchor is rewritten because practice moved. Both credentials say
 * the same words. Without a pin, a reader in 2031 applies the 2030 meaning to
 * the 2027 credential and gets it wrong, in whichever direction happens to be
 * unfair.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  type ArticleLike,
  type ElementLike,
  assessmentPolicyHash,
  checkDefinitionDrift,
  elementDefinitionHash,
  extractSection,
  pinDefinition,
  sectionHash,
} from './definitions.ts';

const element: ElementLike = {
  id: 'CM-03-014',
  kind: 'knowledge',
  levelCeiling: 4,
  anchors: {
    '1': 'Recognises that a definitional limit exists.',
    '4': 'Judges when definitional uncertainty dominates and defends the boundary drawn.',
  },
};

const article: ArticleLike = {
  id: 'BOK-0001',
  body: [
    'Intro prose.',
    '',
    '## Why inputs become correlated {#s01}',
    '',
    'Shared reference standards are the commonest cause.',
    '',
    '## The covariance term {#s03}',
    '',
    'The combined variance gains a cross term.',
    '',
  ].join('\n'),
};

const REFS = [{ article: 'BOK-0001', section: 's03' }];

/** One level entry, as it appears in proficiency.yaml. */
const LEVEL_4_POLICY = {
  level: 4,
  name: 'Proficient',
  descriptor: 'Handles the non-routine case and defends the adaptation.',
  assessment: { modality: ['reviewer-conducted-defense'], requiresCapstone: true, minExperienceHours: 200 },
  signoff: { signerCount: 2, witnessMustHoldLevel: 5 },
};
const PROFICIENCY = { schemaVersion: 1, levels: [LEVEL_4_POLICY] };

function credential(overrides: Record<string, unknown> = {}) {
  const { definitionRef, knowledgeSnapshot } = pinDefinition(element, 4, REFS, [article]);
  return {
    id: 'urn:uuid:3f2b8c1a-5d4e-4f6a-9b2c-7e1d0a3f5b8c',
    element: 'CM-03-014',
    level: 4,
    assessmentPolicyRef: assessmentPolicyHash(LEVEL_4_POLICY),
    definitionRef,
    knowledgeSnapshot,
    ...overrides,
  };
}

/* -- Section extraction ---------------------------------------------------- */

test('a section is extracted from its anchor to the next heading', () => {
  const text = extractSection(article.body, 's01');
  assert.ok(text?.includes('Shared reference standards'));
  assert.ok(!text?.includes('cross term'), 'must not bleed into the following section');
});

test('an absent section extracts as null rather than throwing', () => {
  assert.equal(extractSection(article.body, 's99'), null);
  assert.equal(sectionHash(article, 's99'), null);
});

/* -- What the definition hash covers, and what it deliberately ignores ----- */

test('rewriting the attested level anchor changes the definition hash', () => {
  const rewritten: ElementLike = {
    ...element,
    anchors: { ...element.anchors, '4': 'Something materially different.' },
  };
  assert.notEqual(elementDefinitionHash(element, 4), elementDefinitionHash(rewritten, 4));
});

test('rewriting an anchor at a DIFFERENT level does not disturb this credential', () => {
  // A credential attests one level. Editing L1 must not make every L4 holder
  // appear to have drifted.
  const rewritten: ElementLike = {
    ...element,
    anchors: { ...element.anchors, '1': 'Reworded entirely.' },
  };
  assert.equal(elementDefinitionHash(element, 4), elementDefinitionHash(rewritten, 4));
});

test('editorial fields are excluded, so a typo fix is not drift', () => {
  // If cosmetic edits produced drift warnings the signal would become noise and
  // reviewers would learn to ignore it.
  const edited: ElementLike = { ...element, summary: 'Reworded summary.', title: 'New title' };
  assert.equal(elementDefinitionHash(element, 4), elementDefinitionHash(edited, 4));
});

test('changing kind changes the hash, because it changes what proves attainment', () => {
  assert.notEqual(
    elementDefinitionHash(element, 4),
    elementDefinitionHash({ ...element, kind: 'skill' }, 4),
  );
});

test('flipping the demonstration mode changes the hash, with the anchor untouched', () => {
  // The pathological case this closes: change `desk` to `equipment`, leave the
  // anchor alone, and the pin still matched. A verifier read "definition
  // unchanged" while what counts as valid evidence for the claim had inverted.
  const desk: ElementLike = { ...element, kind: 'skill', demonstration: ['desk'] };
  const bench: ElementLike = { ...element, kind: 'skill', demonstration: ['equipment'] };

  assert.equal(desk.anchors['4'], bench.anchors['4'], 'the anchor must be identical for this to test anything');
  assert.notEqual(elementDefinitionHash(desk, 4), elementDefinitionHash(bench, 4));
});

test('stating the default explicitly is not drift, because it changes nothing', () => {
  // `demonstration` defaults to `desk`. An author who later writes it out has
  // altered no meaning, and must not make every credential look drifted.
  const implicit: ElementLike = { ...element, kind: 'skill' };
  const explicit: ElementLike = { ...element, kind: 'skill', demonstration: ['desk'] };
  assert.equal(elementDefinitionHash(implicit, 4), elementDefinitionHash(explicit, 4));
});

test('route ORDER is not meaning, so reordering is not drift', () => {
  // `demonstration` is a set. Which order an author happened to write the
  // routes in says nothing about the competence, and a pin reporting it would
  // be exactly the noise this projection exists to keep out — reviewers who
  // see spurious drift learn to ignore real drift.
  const ab: ElementLike = { ...element, kind: 'skill', demonstration: ['desk', 'equipment'] };
  const ba: ElementLike = { ...element, kind: 'skill', demonstration: ['equipment', 'desk'] };
  assert.equal(elementDefinitionHash(ab, 4), elementDefinitionHash(ba, 4));
});

test('a scalar and its one-element array are the same definition', () => {
  // The field was a scalar before it was a set. `desk` and `['desk']` are the
  // same statement, and hashing them apart would manufacture drift out of a
  // change in notation rather than a change in meaning.
  const scalar: ElementLike = { ...element, kind: 'skill', demonstration: 'desk' };
  const array: ElementLike = { ...element, kind: 'skill', demonstration: ['desk'] };
  assert.equal(elementDefinitionHash(scalar, 4), elementDefinitionHash(array, 4));
});

test('ADDING a route is drift, because admissible evidence widened', () => {
  // Reordering is notation; adding is meaning. An element that admitted only
  // desk work and now admits bench work has changed what evidence backs the
  // claim, and a reader of the older credential must be told the definition
  // moved — which is the whole reason `demonstration` sits inside the pin.
  const desk: ElementLike = { ...element, kind: 'skill', demonstration: ['desk'] };
  const both: ElementLike = { ...element, kind: 'skill', demonstration: ['desk', 'equipment'] };
  assert.notEqual(elementDefinitionHash(desk, 4), elementDefinitionHash(both, 4));
});

test('drift in the demonstration mode is reported to the reader', () => {
  const desk: ElementLike = { ...element, kind: 'skill', demonstration: ['desk'] };
  const { definitionRef } = pinDefinition(desk, 4, REFS, [article]);
  const bench: ElementLike = { ...desk, demonstration: ['equipment'] };

  const findings = checkDefinitionDrift(credential({ definitionRef }), bench, [article]);
  assert.ok(
    findings.some((f) => f.message.includes('has changed since this credential was issued')),
    `expected definition drift, got: ${JSON.stringify(findings)}`,
  );
  // Still not invalidity: the credential remains true of the definition that
  // was in force, which was desk work.
  assert.equal(findings.filter((f) => f.level === 'error').length, 0);
});

test('status, roleTargets and prerequisites stay OUT of the pin', () => {
  // Each is meaning-bearing somewhere, and none of them is part of what THIS
  // credential asserts about THIS person. Pinning status would make a routine
  // draft-to-stable promotion — or a deprecation — read as drift on every
  // credential below it, which punishes the holder for somebody else's edit.
  const moved: ElementLike = {
    ...element,
    status: 'deprecated',
    roleTargets: { 'calibration-engineer': 5 },
    prerequisites: ['CM-03-048'],
  };
  assert.equal(elementDefinitionHash(element, 4), elementDefinitionHash(moved, 4));
});

/* -- Drift detection ------------------------------------------------------- */

test('an unchanged corpus produces no findings', () => {
  assert.deepEqual(checkDefinitionDrift(credential(), element, [article]), []);
});

test('a credential with no definitionRef is an error', () => {
  const findings = checkDefinitionDrift(
    { ...credential(), definitionRef: undefined },
    element,
    [article],
  );
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('no definitionRef')),
    `expected a missing-pin error, got: ${JSON.stringify(findings)}`,
  );
});

test('DRIFT IS NOT INVALIDITY: a rewritten anchor warns, it does not fail', () => {
  const rewritten: ElementLike = {
    ...element,
    anchors: { ...element.anchors, '4': 'Practice moved and this was rewritten in 2030.' },
  };
  const findings = checkDefinitionDrift(credential(), rewritten, [article]);

  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('has changed since')));
  assert.equal(findings.filter((f) => f.level === 'error').length, 0);
});

test('a rewritten BOK section is reported, because the claim rested on it', () => {
  const revised: ArticleLike = {
    ...article,
    body: article.body.replace('The combined variance gains a cross term.', 'Rewritten after a standard revision.'),
  };
  const findings = checkDefinitionDrift(credential(), element, [revised]);
  assert.ok(
    findings.some((f) => f.message.includes('has been rewritten')),
    `expected a section-drift warning, got: ${JSON.stringify(findings)}`,
  );
});

test('a section that has been removed outright is reported as a broken refresher path', () => {
  const gutted: ArticleLike = { ...article, body: 'Intro prose.\n\n## Only this {#s01}\n\nText.\n' };
  const findings = checkDefinitionDrift(credential(), element, [gutted]);
  assert.ok(findings.some((f) => f.message.includes('no longer exists')));
});

test('a corpus that does not contain the element warns without calling the credential false', () => {
  const findings = checkDefinitionDrift(credential(), undefined, [article]);
  assert.ok(findings.some((f) => f.message.includes('not thereby false')));
  assert.equal(findings.filter((f) => f.level === 'error').length, 0);
});

/* -- What the LEVEL meant, not just what the element meant ----------------- */

test('a credential with no assessmentPolicyRef is an error', () => {
  const findings = checkDefinitionDrift(
    { ...credential(), assessmentPolicyRef: undefined },
    element,
    [article],
    PROFICIENCY,
  );
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('no assessmentPolicyRef')),
    `expected a missing-policy error, got: ${JSON.stringify(findings)}`,
  );
});

test('raising the bar for a level is drift the credential can detect', () => {
  // The failure decision 39 half-fixed: the element does not move, the bar
  // does, and definitionRef still matches.
  const tougher = {
    ...PROFICIENCY,
    levels: [
      {
        ...LEVEL_4_POLICY,
        assessment: { ...LEVEL_4_POLICY.assessment, minExperienceHours: 500 },
        signoff: { signerCount: 3, witnessMustHoldLevel: 5 },
      },
    ],
  };
  const findings = checkDefinitionDrift(credential(), element, [article], tougher);

  assert.ok(
    findings.some((f) => f.message.includes('assessment policy for L4 has changed')),
    `expected policy drift, got: ${JSON.stringify(findings)}`,
  );
  // Still not invalidity — it was earned under the rules of its time.
  assert.equal(findings.filter((f) => f.level === 'error').length, 0);
});

test('an unchanged policy produces no findings', () => {
  assert.deepEqual(checkDefinitionDrift(credential(), element, [article], PROFICIENCY), []);
});

/* -- A pin that pins nothing ----------------------------------------------- */

test('pinning a fully resolvable ref produces no findings', () => {
  const pins = pinDefinition(element, 4, REFS, [article]);
  assert.equal(pins.knowledgeSnapshot.length, 1);
  assert.deepEqual(pins.findings, []);
});

test('a knowledgeRef whose article was not supplied is reported, not skipped', () => {
  // The silent version of this could hand back an empty knowledgeSnapshot while
  // looking like it had worked, and the drift check would then iterate nothing
  // and find nothing wrong.
  const pins = pinDefinition(element, 4, REFS, []);
  assert.deepEqual(pins.knowledgeSnapshot, []);
  assert.ok(pins.findings.some((f) => f.message.includes('was not supplied')));
});

test('a knowledgeRef pointing at a section the article does not declare is reported', () => {
  const pins = pinDefinition(element, 4, [{ article: 'BOK-0001', section: 's09' }], [article]);
  assert.ok(pins.findings.some((f) => f.message.includes('declares no such section')));
});

test('pinning NOTHING is an error in its own right, not merely an empty result', () => {
  const pins = pinDefinition(element, 4, REFS, []);
  assert.ok(
    pins.findings.some((f) => f.level === 'error' && f.message.includes('pins the knowledge in shape only')),
    `expected an empty-pin error, got: ${JSON.stringify(pins.findings)}`,
  );
});

test('a partial pin still reports the ref it lost', () => {
  // The surviving pin must not make the lost one look acceptable.
  const pins = pinDefinition(
    element,
    4,
    [{ article: 'BOK-0001', section: 's03' }, { article: 'BOK-0004', section: 's01' }],
    [article],
  );
  assert.equal(pins.knowledgeSnapshot.length, 1);
  assert.equal(pins.findings.length, 1);
  assert.ok(pins.findings[0]!.message.includes('BOK-0004'));
});


/* -- What a SECTION pin covers, and what it deliberately ignores ----------- */

/*
 * It hashed the prose and nothing else, which left it pinning what a section
 * SAYS while ignoring what it CLAIMS ABOUT ITSELF. Flip `consensus` from
 * `established` to `contested` and not one byte of prose moves: the hash
 * matched, so a reviewer's attestation survived a change to how the passage
 * must be read, and a credential resting on it reported no drift while the
 * knowledge behind the claim went from settled to disputed.
 */

const sectioned = (section: Record<string, unknown>): ArticleLike => ({
  ...article,
  sections: [{ id: 's01', ...section }],
});

test('flipping a section from established to contested changes its pin', () => {
  const settled = sectioned({ consensus: 'established' });
  const disputed = sectioned({
    consensus: 'contested',
    contestedBasis: 'source-conflicting',
    alternativeViews: [{ position: 'The other reading, stated at its strongest.', basis: 'JCGM 100 §5.1.4' }],
  });
  assert.notEqual(sectionHash(settled, 's01'), sectionHash(disputed, 's01'));
});

test('an unstated consensus is the same pin as the default stated outright', () => {
  // `established` is the schema default, so writing it out changes nothing and
  // must not manufacture drift — the rule the definition pin already follows.
  assert.equal(sectionHash(sectioned({}), 's01'), sectionHash(sectioned({ consensus: 'established' }), 's01'));
  assert.equal(sectionHash(sectioned({}), 's01'), sectionHash({ ...article }, 's01'));
});

test('rewriting the alternative views changes the pin, with the prose untouched', () => {
  // The competing positions are substantive argument living OUTSIDE the body,
  // and they can be rewritten in full without a word of prose changing.
  const before = sectioned({
    consensus: 'contested',
    contestedBasis: 'source-silent',
    alternativeViews: [{ position: 'The first reading, stated at its strongest.', basis: 'A' }],
  });
  const after = sectioned({
    consensus: 'contested',
    contestedBasis: 'source-silent',
    alternativeViews: [{ position: 'A materially different reading altogether.', basis: 'A' }],
  });
  assert.notEqual(sectionHash(before, 's01'), sectionHash(after, 's01'));
});

test('where the disagreement lives is part of the claim', () => {
  // `source-silent` and `source-conflicting` call for different things from a
  // reader, and only one of them is settled by a revision.
  const views = [{ position: 'The other reading, stated at its strongest.', basis: 'A' }];
  const silent = sectioned({ consensus: 'contested', contestedBasis: 'source-silent', alternativeViews: views });
  const conflicting = sectioned({ consensus: 'contested', contestedBasis: 'source-conflicting', alternativeViews: views });
  assert.notEqual(sectionHash(silent, 's01'), sectionHash(conflicting, 's01'));
});

test('editorial and lifecycle fields stay outside the pin', () => {
  // `covers` and `contestedBasisNote` are editorial: a reworded note must not
  // make every credential resting on the section look like it drifted.
  // `deprecated` is lifecycle, excluded on the argument that keeps an
  // element's `status` out — superseding a section would otherwise light up
  // every credential ever issued against it, punishing a holder for an
  // editorial act years later.
  const plain = sectioned({});
  const dressed = sectioned({
    covers: 'A one-line orientation for somebody arriving cold.',
    contestedBasisNote: 'A sentence or two naming the clause that is silent, written later.',
    deprecated: true,
    supersededBy: 's04',
  });
  assert.equal(sectionHash(plain, 's01'), sectionHash(dressed, 's01'));
});
