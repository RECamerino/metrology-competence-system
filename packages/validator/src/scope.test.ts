/**
 * Gap analysis guardrails.
 *
 * These pin the definition of `roleTarget` clause by clause, because it was
 * undefined until now and 26,784 of them will be authored against it:
 *
 *   - a scoped MINIMUM requirement, normative rather than descriptive;
 *   - it does not imply applicability;
 *   - deployment scope determines applicability, roleTarget the level;
 *   - an element outside scope cannot produce a gap;
 *   - scope is machine-resolvable from taxonomy data.
 *
 * The fourth is the one that stops the dashboard becoming noise, and it is the
 * one most likely to be quietly relaxed by somebody implementing Phase 10 who
 * wants a fuller-looking report.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatorFor } from './schema.ts';
import type { Corpus } from './corpus.ts';
import { type DeploymentScope, checkScope, computeGaps, inScope } from './scope.ts';

const HOLDER = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const LONG = 'A deliberately long enough string to satisfy the schema minimum length constraints.';

/** Two elements in CM-03, one in DP-21 — the domain nobody's scope covers. */
const elements = [
  {
    id: 'CM-03-053',
    domain: 'CM-03',
    competencyArea: 'CM-03-A05',
    roleTargets: { 'calibration-engineer': 4, 'metrology-technician-i': null },
  },
  {
    id: 'CM-03-036',
    domain: 'CM-03',
    competencyArea: 'CM-03-A04',
    roleTargets: { 'calibration-engineer': 3, 'metrology-technician-i': null },
  },
  {
    id: 'DP-21-004',
    domain: 'DP-21',
    competencyArea: 'DP-21-A05',
    roleTargets: { 'calibration-engineer': 4, 'metrology-technician-i': null },
  },
];

const scope: DeploymentScope = {
  schemaVersion: 1,
  subject: HOLDER,
  role: 'calibration-engineer',
  includes: { domains: ['CM-03'] },
};

/* -- Applicability -------------------------------------------------------- */

test('the worked deployment scope validates', () => {
  const validate = validatorFor('deployment-scope');
  assert.ok(validate(scope), JSON.stringify(validate.errors, null, 2));
});

test('AN ELEMENT OUTSIDE SCOPE CANNOT PRODUCE A GAP', () => {
  // The rule the whole model rests on. DP-21 rates calibration-engineer at 4,
  // and this engineer holds nothing in it — and that is not a deficiency,
  // because relativistic geodesy is not their job.
  const gaps = computeGaps(elements, scope, {});
  assert.ok(!gaps.some((g) => g.element === 'DP-21-004'));
});

test('a roleTarget does not imply applicability', () => {
  // Same element, same rating, different scope: the rating did not change, the
  // applicability did.
  const geodesyScope: DeploymentScope = { ...scope, includes: { domains: ['DP-21'] } };
  assert.equal(inScope(elements[2]!, scope), false);
  assert.equal(inScope(elements[2]!, geodesyScope), true);
});

/* -- The requirement, once applicable ------------------------------------- */

test('an in-scope shortfall is a gap, reported against the required level', () => {
  const gaps = computeGaps(elements, scope, { 'CM-03-053': 2 });
  const gap = gaps.find((g) => g.element === 'CM-03-053');
  assert.deepEqual(gap, {
    element: 'CM-03-053',
    role: 'calibration-engineer',
    required: 4,
    held: 2,
    basis: 'occupational',
  });
});

test('holding nothing is a gap of the full requirement, not missing information', () => {
  const gaps = computeGaps(elements, scope, {});
  assert.equal(gaps.find((g) => g.element === 'CM-03-036')?.held, null);
});

test('meeting or exceeding the minimum is not a gap', () => {
  const gaps = computeGaps(elements, scope, { 'CM-03-053': 4, 'CM-03-036': 5 });
  assert.deepEqual(gaps, []);
});

test('null is not a gap at any scope, because the element is never that role\'s work', () => {
  const technicianScope: DeploymentScope = { ...scope, role: 'metrology-technician-i' };
  assert.deepEqual(computeGaps(elements, technicianScope, {}), []);
});

/* -- Competence is not authorization, in the role model too ---------------- */

const ROLES = {
  schemaVersion: 1,
  roles: [
    { id: 'calibration-engineer', title: 'Calibration Engineer', roleType: 'occupational', family: 'engineering', summary: LONG },
    { id: 'metrology-technician-i', title: 'Metrology Technician I', roleType: 'occupational', family: 'technician', summary: LONG },
    { id: 'approved-signatory', title: 'Approved Signatory', roleType: 'authority-overlay', family: 'quality', summary: LONG },
  ],
};

/** Minimal corpus — checkScope reads only the taxonomy and the roles. */
function corpusWith(roles: unknown): Corpus {
  return {
    taxonomy: {
      schemaVersion: 1,
      domains: [
        {
          id: 'CM-03', title: 'T', kind: 'core', status: 'draft',
          competencyAreas: [
            {
              id: 'CM-03-A05', title: 'A', status: 'draft',
              elements: [{ id: 'CM-03-053', title: 'E', kind: 'skill', levelCeiling: 5, status: 'draft' }],
            },
          ],
        },
      ],
    },
    taxonomyFiles: [],
    proficiency: null,
    roles: roles as Record<string, unknown>,
    sources: null,
    bootstrapCohort: null,
    trustRegistry: null,
    elements: [],
    bok: [],
    modules: [],
    archetypes: [],
    bindings: [],
    lockedIds: null,
  } as unknown as Corpus;
}

const signatoryScope: DeploymentScope = {
  schemaVersion: 1,
  subject: HOLDER,
  role: 'approved-signatory',
  includes: { domains: ['CM-03'] },
};

test('a scope whose ROLE is an authority overlay is rejected', () => {
  // The pathological case: a dashboard reporting "short of L3 for
  // approved-signatory" as a competence deficiency, so an organization reads
  // closing those gaps as the route to signatory status. It is granted, not
  // earned, and it ends when the person leaves.
  const findings = checkScope(signatoryScope, corpusWith(ROLES));
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('authority overlay rather than an occupation')),
    `expected an overlay-as-role error, got: ${JSON.stringify(findings)}`,
  );
});

test('the same overlay is fine in `overlays`, alongside an occupation', () => {
  // A person is Calibration Engineer AND Approved Signatory.
  const both: DeploymentScope = {
    ...signatoryScope,
    role: 'calibration-engineer',
    overlays: ['approved-signatory'],
  };
  assert.deepEqual(checkScope(both, corpusWith(ROLES)), []);
});

test('an occupational role stacked as an overlay is rejected too', () => {
  // It has a competence profile of its own and belongs in a scope of its own,
  // not stacked on another as though it were a permission.
  const wrong: DeploymentScope = { ...scope, overlays: ['metrology-technician-i'] };
  const findings = checkScope(wrong, corpusWith(ROLES));
  assert.ok(findings.some((f) => f.message.includes('classifies it as an occupation')));
});

test('a role the registry does not contain is caught', () => {
  const findings = checkScope({ ...scope, role: 'chief-vibes-officer' }, corpusWith(ROLES));
  assert.ok(findings.some((f) => f.message.includes('the role registry does not contain')));
});

test('overlay gaps are real, and are tagged as a different question', () => {
  // "Could this person be granted this?" — never "have they earned it?".
  const withOverlay: DeploymentScope = { ...scope, overlays: ['approved-signatory'] };
  const signatoryElements = elements.map((e) => ({
    ...e,
    roleTargets: { ...e.roleTargets, 'approved-signatory': 3 },
  }));

  const gaps = computeGaps(signatoryElements, withOverlay, {});
  const overlay = gaps.filter((g) => g.basis === 'authority-overlay');
  const occupational = gaps.filter((g) => g.basis === 'occupational');

  assert.ok(overlay.length > 0, 'the overlay must still produce gaps — the competence it presupposes is real');
  assert.ok(occupational.length > 0);
  assert.ok(
    overlay.every((g) => g.role === 'approved-signatory'),
    'and they must be attributable to the overlay rather than blended into the job',
  );
});

test('an element outside scope produces no overlay gap either', () => {
  // The rule holds for both bases. DP-21 is not this person's work, whatever
  // authority they carry.
  const withOverlay: DeploymentScope = { ...scope, overlays: ['approved-signatory'] };
  const signatoryElements = elements.map((e) => ({
    ...e,
    roleTargets: { ...e.roleTargets, 'approved-signatory': 3 },
  }));
  const gaps = computeGaps(signatoryElements, withOverlay, {});
  assert.ok(!gaps.some((g) => g.element === 'DP-21-004'));
});

/* -- Scope resolution ------------------------------------------------------ */

test('excludes are removed after includes are unioned', () => {
  const narrowed: DeploymentScope = {
    ...scope,
    includes: { domains: ['CM-03'] },
    excludes: { areas: ['CM-03-A04'] },
  };
  const gaps = computeGaps(elements, narrowed, {});
  assert.ok(gaps.some((g) => g.element === 'CM-03-053'));
  assert.ok(!gaps.some((g) => g.element === 'CM-03-036'), 'the excluded area must not produce a gap');
});

test('an individually named element brings it into scope across a taxonomy boundary', () => {
  const crossing: DeploymentScope = {
    ...scope,
    includes: { domains: ['CM-03'], elements: ['DP-21-004'] },
  };
  assert.equal(inScope(elements[2]!, crossing), true);
});

test('a scope that includes nothing is rejected by the schema', () => {
  // An empty scope produces no gaps for anything, which reads as full
  // competence rather than as an unset scope.
  const validate = validatorFor('deployment-scope');
  assert.equal(validate({ ...scope, includes: {} }), false);
});
