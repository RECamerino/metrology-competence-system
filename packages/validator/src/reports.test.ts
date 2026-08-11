/**
 * Coverage report guardrails.
 *
 * The aggregate percentage was the only thing this report said about the item
 * bank, and "0.1% covered" is not actionable. What harms somebody is an element
 * attainable at L4 with items only to L2 — it looks credentialable and is not,
 * and the candidate is the one who finds out.
 *
 * These tests pin the three gap categories, including the inverse defect: an
 * item bound to an element whose definition nobody has written, where the
 * binding claims to test a competence that has no anchors to test against.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Corpus, ElementFile, ItemFile } from './corpus.ts';
import { coverageReport } from './reports.ts';

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

function element(id: string, levelCeiling: number): ElementFile {
  return {
    path: `content/competence/elements/CM-01/${id}.md`,
    body: 'Notes.',
    data: {
      id,
      title: 'An element',
      domain: 'CM-01',
      competencyArea: 'CM-01-A01',
      kind: 'knowledge',
      status: 'draft',
      summary: LONG,
      levelCeiling,
      anchors: { '1': LONG },
      roleTargets: {},
      citations: [{ source: 'OPEN-SOURCE-1', clause: '1' }],
      knowledgeRefs: [{ article: 'BOK-0001', section: 's01' }],
    },
  };
}

function bindings(elementId: string, levels: number[]): ItemFile {
  return {
    path: `content/competence/items/bindings/CM-01/${elementId}.yaml`,
    data: {
      schemaVersion: 1,
      element: elementId,
      bindings: levels.map((level) => ({
        level,
        archetype: 'ARC-0001',
        status: 'draft',
        justification: LONG,
      })),
    },
  };
}

function corpus(elements: ElementFile[], binds: ItemFile[]): Corpus {
  return {
    taxonomy,
    taxonomyFiles: [{ path: 'content/competence/taxonomy/domains/CM-01.yaml', data: taxonomy }],
    proficiency: null,
    roles: { schemaVersion: 1, roles: [] },
    sources: { schemaVersion: 1, sources: [] },
    elements,
    bok: [],
    modules: [],
    archetypes: [],
    bindings: binds,
    lockedIds: null,
  };
}

/* ------------------------------------------------------------------------ */

test('an authored element with no items at all is named', () => {
  const report = coverageReport(corpus([element('CM-01-001', 3)], []));
  assert.match(report, /Authored but no items at any level \(1\)/);
  assert.match(report, /CM-01-001 \(ceiling L3\)/);
});

test('an authored element missing items at some attainable levels names those levels', () => {
  // The dangerous case: it looks covered and is not.
  const report = coverageReport(corpus([element('CM-01-001', 3)], [bindings('CM-01-001', [1])]));
  assert.match(report, /Attainable levels with no item \(1\)/);
  assert.match(report, /CM-01-001 — no items at L2, L3/);
});

test('a fully bound authored element raises no ITEM GAP', () => {
  // Scoped to the item-gap section deliberately: the fixture element also has
  // incomplete anchors and role targets, which are real gaps reported
  // elsewhere. Asserting on the whole report would pass or fail for reasons
  // that have nothing to do with items.
  const report = coverageReport(corpus([element('CM-01-001', 3)], [bindings('CM-01-001', [1, 2, 3])]));
  assert.doesNotMatch(report, /ITEM GAPS/);
});

test('items bound to an element with no authored definition are reported', () => {
  // The binding's justification claims it tests that element, but there are no
  // anchors to test against, so the claim cannot be reviewed.
  const report = coverageReport(corpus([], [bindings('CM-01-002', [1, 2])]));
  assert.match(report, /Items bound to an element with no authored definition \(1\)/);
  assert.match(report, /CM-01-002/);
});

test('the gap section is absent entirely when there is nothing to report', () => {
  assert.doesNotMatch(coverageReport(corpus([], [])), /ITEM GAPS/);
});

test('a level above the ceiling is not counted as a missing item', () => {
  // CM-01-002 has a ceiling of 2, so there is no L3 unit to be missing.
  const report = coverageReport(corpus([element('CM-01-002', 2)], [bindings('CM-01-002', [1, 2])]));
  assert.doesNotMatch(report, /CM-01-002 — no items/);
});

test('partial coverage is reported even when the element is not authored', () => {
  // Items exist, so somebody intends this to be assessable. The levels without
  // one cannot be credentialed, and that is true whether or not the definition
  // has been written yet.
  const report = coverageReport(corpus([], [bindings('CM-01-001', [3])]));
  assert.match(report, /CM-01-001 — no items at L1, L2/);
});

test('per-archetype reuse is printed, not only the mean', () => {
  // The mean averages a shape built to span a family with narrow ones, and
  // decision 36's 20-50 target was never about an average.
  const report = coverageReport(corpus([], [bindings('CM-01-001', [1, 2, 3])]));
  assert.match(report, /Units per archetype:/);
  assert.match(report, /ARC-0001\s+3/);
});
