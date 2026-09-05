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
import {
  type DeploymentScope,
  type Disclosure,
  checkDisclosure,
  checkScope,
  computeGaps,
  deploymentScopeHash,
  gapsFromDisclosure,
  inScope,
} from './scope.ts';

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


/* -- Disclosure: a view of somebody's record is not a read ------------------ */

/*
 * `computeGaps` took what a person holds as a plain map, with no record of
 * where it came from or what they agreed to share. Left there, the workforce
 * dashboard would have been built assuming an employer may see everything a
 * person holds — including credentials earned elsewhere, before this job, in
 * domains this job never touches.
 *
 * Decision 34 decided a consented, scoped, audit-logged model for accreditation
 * assessors. It was a row in a decision table: no schema and no code, so there
 * was nothing here to copy. These cover the first one.
 */

const ORG = { name: 'Northfield Calibration', id: 'northfield-cal-2026' };

const disclosure = (overrides: Partial<Disclosure> = {}): Disclosure => ({
  schemaVersion: 1,
  id: 'urn:uuid:0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  subject: HOLDER,
  organization: ORG,
  purpose: 'workforce-gap-analysis',
  scopeRef: deploymentScopeHash(scope),
  grantedOn: '2026-09-01',
  expiresOn: '2027-09-01',
  entries: [{ element: 'CM-03-053', level: 2 }],
  ...overrides,
});

test('the worked disclosure validates', () => {
  const validate = validatorFor('disclosure');
  assert.ok(validate(disclosure()), JSON.stringify(validate.errors, null, 2));
});

test('a disclosure may not carry a credential from outside the scope', () => {
  // The rule that makes a disclosure bounded rather than a formality wrapped
  // around a full record. DP-21 is not this engineer's job, so a credential in
  // it tells the employer nothing they need and something they have no
  // business knowing.
  const findings = checkDisclosure(
    disclosure({ entries: [{ element: 'CM-03-053', level: 2 }, { element: 'DP-21-004', level: 3 }] }),
    scope,
    elements,
  );
  assert.ok(
    findings.some((f) => f.message.includes('DP-21-004') && f.message.includes('outside this deployment scope')),
    `expected an out-of-scope disclosure to be refused, got: ${JSON.stringify(findings)}`,
  );
});

test('widening the job description does not widen the consent', () => {
  // The organization OWNS the deployment scope, so a disclosure bounded by a
  // scope it can edit is bounded by nothing. The person consented to a scope,
  // not to a role name.
  const widened: DeploymentScope = { ...scope, includes: { domains: ['CM-03', 'DP-21'] } };
  const findings = checkDisclosure(disclosure(), widened, elements);
  assert.ok(
    findings.some((f) => f.message.includes('has since changed')),
    `expected a widened scope to invalidate the disclosure, got: ${JSON.stringify(findings)}`,
  );
});

test('reordering the selectors is not widening', () => {
  // The order somebody listed two domains in is not a fact about scope, and a
  // re-consent prompt triggered by a cosmetic edit teaches people to click
  // through re-consent prompts.
  const a: DeploymentScope = { ...scope, includes: { domains: ['CM-03', 'DP-21'] } };
  const b: DeploymentScope = { ...scope, includes: { domains: ['DP-21', 'CM-03'] } };
  assert.equal(deploymentScopeHash(a), deploymentScopeHash(b));
});

test('an administrative edit does not invalidate consent', () => {
  // `notes` and the effective dates do not determine what is visible. If they
  // invalidated a disclosure, re-consent would become routine and stop meaning
  // anything — the same reasoning that keeps editorial fields out of a
  // credential's definitionRef.
  const annotated: DeploymentScope = { ...scope, notes: LONG, effectiveTo: '2029-01-01' };
  assert.equal(deploymentScopeHash(scope), deploymentScopeHash(annotated));
});

test("one person's consent does not bound another person's record", () => {
  const findings = checkDisclosure(
    disclosure({ subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK' }),
    scope,
    elements,
  );
  assert.ok(findings.some((f) => f.message.includes('does not bound')));
});

test('an expired or withdrawn disclosure permits nothing', () => {
  const expired = checkDisclosure(disclosure(), scope, elements, '2028-01-01');
  assert.ok(expired.some((f) => f.message.includes('expired on 2027-09-01')));

  const withdrawn = checkDisclosure(disclosure({ revokedOn: '2026-10-01' }), scope, elements);
  assert.ok(withdrawn.some((f) => f.message.includes('withdrawn by its subject')));
});

test('a refusal is null, not an empty gap list', () => {
  // An empty array would read as "no gaps found", which is the most dangerous
  // possible rendering of "you were not permitted to look".
  const { gaps, findings } = gapsFromDisclosure(
    elements,
    scope,
    disclosure({ revokedOn: '2026-10-01' }),
  );
  assert.equal(gaps, null);
  assert.ok(findings.some((f) => f.level === 'error'));
});

test('one out-of-scope entry refuses the whole view rather than trimming it', () => {
  // Silently dropping the offending entry would teach an integrator that
  // over-disclosing is free and gets corrected downstream.
  const { gaps } = gapsFromDisclosure(
    elements,
    scope,
    disclosure({ entries: [{ element: 'CM-03-053', level: 2 }, { element: 'DP-21-004', level: 3 }] }),
  );
  assert.equal(gaps, null);
});

test('a sound disclosure computes exactly the gaps the scope allows', () => {
  const { gaps, findings } = gapsFromDisclosure(
    elements,
    scope,
    disclosure({ entries: [{ element: 'CM-03-053', level: 2 }, { element: 'CM-03-036', level: 3 }] }),
    '2026-11-01',
  );
  assert.deepEqual(findings, []);
  // CM-03-053 needs 4 and shows 2; CM-03-036 needs 3 and shows 3; DP-21 is out
  // of scope and cannot produce a gap however little is disclosed about it.
  assert.deepEqual(gaps, [
    { element: 'CM-03-053', role: 'calibration-engineer', required: 4, held: 2, basis: 'occupational' },
  ]);
});

test('a person reading their own gaps needs no disclosure', () => {
  // That is a read, of their own record, by its owner. computeGaps stays
  // available unguarded for exactly this, and always will.
  assert.deepEqual(computeGaps(elements, scope, { 'CM-03-053': 4, 'CM-03-036': 3 }), []);
});
