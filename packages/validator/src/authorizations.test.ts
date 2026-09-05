/**
 * Does this authorization cover this work?
 *
 * The scope was four arrays of free prose, so the question an accreditation
 * body actually asks could only be answered by somebody reading strings.
 * "Signing certificates", "certificate signing" and "sign accredited certs"
 * are three spellings of one activity, and "0.5 mm to 100 mm" compares against
 * nothing at all.
 *
 * The test that matters most is the unit one. Everything else here is bounds
 * checking; that one is the failure that would look like sound arithmetic.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatorFor } from './schema.ts';
import { type AuthorizationLike, type WorkItem, authorizationCovers } from './authorizations.ts';
import type { ElementStubLike } from './scope.ts';

const IN_SCOPE: ElementStubLike = {
  id: 'CM-03-046',
  domain: 'CM-03',
  competencyArea: 'CM-03-A04',
};

const OUT_OF_SCOPE: ElementStubLike = {
  id: 'DP-21-004',
  domain: 'DP-21',
  competencyArea: 'DP-21-A05',
};

const authorization: AuthorizationLike = {
  id: 'urn:uuid:8c4d1e7f-2a6b-4c3d-8e5f-1b9a7c2d4e6f',
  scope: {
    activities: ['sign-accredited-certificate'],
    measurement: { includes: { areas: ['CM-03-A04'] } },
    methods: [{ identifier: 'Gauge block comparison' }],
    ranges: [{ quantity: 'length', unit: 'mm', min: 0.5, max: 100 }],
    locations: [{ id: 'northfield-main' }],
  },
  expiresOn: '2027-08-09',
};

const work = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  activity: 'sign-accredited-certificate',
  element: IN_SCOPE,
  method: { identifier: 'Gauge block comparison' },
  measurement: { quantity: 'length', unit: 'mm', value: 50 },
  location: 'northfield-main',
  ...overrides,
});

test('the worked authorization validates against the schema', () => {
  const validate = validatorFor('authorization');
  const full = {
    schemaVersion: 1,
    id: authorization.id,
    subject: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
    grantedBy: { organization: 'Northfield Calibration' },
    scope: authorization.scope,
    grantedOn: '2026-08-09',
    basis: [{ element: 'CM-03-046', level: 4 }],
    portable: false,
    walletExportable: false,
    revocation: { revocable: true, unilateral: true, appealableOnCompetence: false },
  };
  assert.ok(validate(full), JSON.stringify(validate.errors, null, 2));
});

test('work inside every dimension is covered', () => {
  const { coverage, findings } = authorizationCovers(authorization, work(), '2026-11-01');
  assert.equal(coverage, 'covered');
  assert.deepEqual(findings, []);
});

/* -- The one this module exists to get right ------------------------------- */

test('THE SAME VALUE IN A DIFFERENT UNIT IS UNDECIDABLE, NEVER COVERED', () => {
  // 0.5 m is 500 mm — five times outside a grant of 0.5 to 100 mm. Ignore the
  // unit and the arithmetic reads 0.5 < 100 and authorizes signing an
  // accredited certificate. This module does not convert units, because a
  // conversion table that is half right fails silently and in the direction of
  // permitting more.
  const { coverage, findings } = authorizationCovers(
    authorization,
    work({ measurement: { quantity: 'length', unit: 'm', value: 0.5 } }),
  );
  assert.equal(coverage, 'undecidable');
  assert.ok(
    findings.some((f) => f.message.includes('never converted')),
    `expected the unit refusal to be explained, got: ${JSON.stringify(findings)}`,
  );
});

test('the same figure inside the granted unit is simply covered', () => {
  // Guards against "fix" the wrong way: the number is not the problem.
  const { coverage } = authorizationCovers(
    authorization,
    work({ measurement: { quantity: 'length', unit: 'mm', value: 0.5 } }),
  );
  assert.equal(coverage, 'covered');
});

/* -- Definite answers ------------------------------------------------------ */

test('a value outside the granted range is not covered', () => {
  const { coverage } = authorizationCovers(
    authorization,
    work({ measurement: { quantity: 'length', unit: 'mm', value: 500 } }),
  );
  assert.equal(coverage, 'not-covered');
});

test('an activity outside the grant is not covered', () => {
  const { coverage } = authorizationCovers(authorization, work({ activity: 'approve-method' }));
  assert.equal(coverage, 'not-covered');
});

test('an element outside the measurement scope is not covered', () => {
  const { coverage } = authorizationCovers(authorization, work({ element: OUT_OF_SCOPE }));
  assert.equal(coverage, 'not-covered');
});

test('a quantity the grant says nothing about is not covered', () => {
  const { coverage } = authorizationCovers(
    authorization,
    work({ measurement: { quantity: 'torque', unit: 'N.m', value: 5 } }),
  );
  assert.equal(coverage, 'not-covered');
});

test('an ended or expired authorization covers nothing', () => {
  const ended = authorizationCovers(
    { ...authorization, status: { active: false, endedOn: '2026-10-01' } },
    work(),
  );
  assert.equal(ended.coverage, 'not-covered');

  const expired = authorizationCovers(authorization, work(), '2028-01-01');
  assert.equal(expired.coverage, 'not-covered');
});

/* -- Undecidable, and why it is not the same as no ------------------------- */

test('a question that names no element cannot be decided', () => {
  // Measurement scope is required on every authorization, so this leaves the
  // grant's principal bound untested. That is a missing term, not a pass.
  const { coverage } = authorizationCovers(authorization, work({ element: undefined }));
  assert.equal(coverage, 'undecidable');
});

test('a revision-specific grant cannot be compared against an unversioned question', () => {
  const versioned: AuthorizationLike = {
    ...authorization,
    scope: { ...authorization.scope, methods: [{ identifier: 'ISO 6789-2', revision: '2017' }] },
  };
  const vague = authorizationCovers(versioned, work({ method: { identifier: 'ISO 6789-2' } }));
  assert.equal(vague.coverage, 'undecidable');

  const wrong = authorizationCovers(
    versioned,
    work({ method: { identifier: 'ISO 6789-2', revision: '2003' } }),
  );
  assert.equal(wrong.coverage, 'not-covered');

  const right = authorizationCovers(
    versioned,
    work({ method: { identifier: 'ISO 6789-2', revision: '2017' } }),
  );
  assert.equal(right.coverage, 'covered');
});

test('A DEFINITE NO OUTWEIGHS AN UNKNOWN', () => {
  // An activity outside the grant settles the question, and a range nobody can
  // compare does not un-settle it. The alternative reports "cannot tell" for
  // work that is plainly not permitted.
  const { coverage } = authorizationCovers(
    authorization,
    work({ activity: 'approve-method', measurement: { quantity: 'length', unit: 'm', value: 0.5 } }),
  );
  assert.equal(coverage, 'not-covered');
});

/* -- What silence means, which differs by dimension ------------------------ */

test('a dimension the grant does not bound is unbounded, not undecidable', () => {
  // An authorization listing no methods and no sites is a real and common
  // grant rather than an incomplete one.
  const broad: AuthorizationLike = {
    ...authorization,
    scope: {
      activities: ['sign-accredited-certificate'],
      measurement: { includes: { areas: ['CM-03-A04'] } },
    },
  };
  const { coverage } = authorizationCovers(
    broad,
    work({ method: { identifier: 'Something nobody wrote down' }, location: 'anywhere-at-all' }),
  );
  assert.equal(coverage, 'covered');
});

test('but a bounded dimension the QUESTION leaves out is undecidable', () => {
  const { coverage } = authorizationCovers(authorization, work({ location: undefined }));
  assert.equal(coverage, 'undecidable');
});

test('an excluded area is removed after the includes are unioned', () => {
  const narrowed: AuthorizationLike = {
    ...authorization,
    scope: {
      ...authorization.scope,
      measurement: { includes: { domains: ['CM-03'] }, excludes: { areas: ['CM-03-A04'] } },
    },
  };
  assert.equal(authorizationCovers(narrowed, work()).coverage, 'not-covered');
});
