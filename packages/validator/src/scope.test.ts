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
import { type DeploymentScope, computeGaps, inScope } from './scope.ts';

const HOLDER = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';

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
  assert.deepEqual(gap, { element: 'CM-03-053', role: 'calibration-engineer', required: 4, held: 2 });
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
