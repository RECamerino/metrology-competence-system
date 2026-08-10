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

function credential(overrides: Record<string, unknown> = {}) {
  const pins = pinDefinition(element, 4, REFS, [article]);
  return {
    id: 'urn:uuid:3f2b8c1a-5d4e-4f6a-9b2c-7e1d0a3f5b8c',
    element: 'CM-03-014',
    level: 4,
    ...pins,
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
  assert.equal(sectionHash(article.body, 's99'), null);
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
