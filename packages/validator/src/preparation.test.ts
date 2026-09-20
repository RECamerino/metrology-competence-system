/**
 * Many routes reach one assessment, and none of them is required.
 *
 * The principle was stated in four prose descriptions and enforced nowhere, and
 * the schema admitted exactly one route. These tests hold both halves: that the
 * other routes can be written down at all, and that the honest position a
 * learner most needs — "the knowledge is done, the bench time is not" — is
 * reachable without ever opening a module.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { type ElementLike } from './definitions.ts';
import { type PreparationRecord, checkPreparationRecord } from './preparation.ts';
import { validatorFor } from './schema.ts';

const SUBJECT = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';

const ACCOUNT =
  'Worked through BOK-0001 sections s01 to s04 over six weeks, building a budget for a gauge block stack at each stage and checking the covariance term against the worked example.';

const bench: ElementLike = {
  id: 'EC-01-030',
  kind: 'skill',
  levelCeiling: 4,
  anchors: {},
  demonstration: ['equipment'],
};

const desk: ElementLike = {
  id: 'CM-03-052',
  kind: 'skill',
  levelCeiling: 4,
  anchors: {},
  demonstration: ['desk'],
};

const either: ElementLike = {
  id: 'CM-03-051',
  kind: 'skill',
  levelCeiling: 4,
  anchors: {},
  demonstration: ['desk', 'equipment'],
};

const ELEMENTS = [bench, desk, either];

function record(overrides: Partial<PreparationRecord> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: 'urn:uuid:7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
    subject: SUBJECT,
    route: 'self-study',
    account: ACCOUNT,
    completedOn: '2027-03-04',
    attestsCompetence: false,
    ...overrides,
  };
}

const errorsOf = (findings: ReturnType<typeof checkPreparationRecord>): string[] =>
  findings.filter((f) => f.level === 'error').map((f) => f.message);

/* -- The schema admits every route ----------------------------------------- */

test('a self-study record needs no module, which is the whole point', () => {
  const validate = validatorFor('training-record');
  assert.ok(validate(record()), JSON.stringify(validate.errors, null, 2));
});

test('a module record still requires the module and its content pin', () => {
  const validate = validatorFor('training-record');
  const full = record({ route: 'module', account: undefined, module: 'MOD-0001', moduleRef: `sha256:${'a'.repeat(64)}` });
  delete full.account;
  assert.ok(validate(full), JSON.stringify(validate.errors, null, 2));

  const { moduleRef, ...unpinned } = full as Record<string, unknown>;
  assert.equal(validate(unpinned), false);
});

test('a non-module record may not carry a module, and a module record needs no account', () => {
  // One fact, one place. A self-study record naming a module is claiming two
  // different things about how somebody prepared.
  const validate = validatorFor('training-record');
  assert.equal(validate(record({ module: 'MOD-0001', moduleRef: `sha256:${'a'.repeat(64)}` })), false);
});

test('a non-module record with no account is refused', () => {
  // "self-study, 2027-03-04" is a date attached to a word. The account is what
  // makes it something a reader can weigh.
  const validate = validatorFor('training-record');
  const bare = record();
  delete bare.account;
  assert.equal(validate(bare), false);
});

test('a provider may be named on a course and nowhere else', () => {
  // The holder's statement about their own record. It confers nothing, and
  // refusing them somewhere to write it would be the corpus imposing its
  // vendor-neutrality on somebody else's history.
  const validate = validatorFor('training-record');
  assert.ok(validate(record({ route: 'course', provider: 'A two-day course run by an instrument manufacturer.' })));
  assert.equal(validate(record({ route: 'self-study', provider: 'Nobody' })), false);
});

test('the free route is the one this project can pin', () => {
  // The corpus is the only material the project owns, so it is the only
  // preparation whose content a reader can check years later. No commercial
  // course can offer that and this project cannot offer it on their behalf.
  const validate = validatorFor('training-record');
  assert.ok(
    validate(
      record({
        knowledgeCovered: [{ article: 'BOK-0001', section: 's03', sectionRef: `sha256:${'b'.repeat(64)}` }],
      }),
    ),
    JSON.stringify(validate.errors, null, 2),
  );
});

test('no route may attest competence', () => {
  const validate = validatorFor('training-record');
  assert.equal(validate(record({ attestsCompetence: true })), false);
  assert.ok(
    errorsOf(checkPreparationRecord({ ...record(), attestsCompetence: true } as PreparationRecord, ELEMENTS)).some((m) =>
      m.includes('Preparing is not attaining'),
    ),
  );
});

/* -- pending-demonstration, reachable without a module --------------------- */

test('A SELF-TAUGHT LEARNER CAN SAY THEY OWE BENCH TIME', () => {
  // The state that turns "I have no employer" into a specific request used to
  // be derived from a module's requiresPhysicalDemonstration, so it was
  // reachable only by completing one. That is precisely backwards: the person
  // with no employer is who the Personal edition exists for.
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'EC-01-030', level: 2, state: 'pending-demonstration' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.deepEqual(errorsOf(findings), []);
});

test('...and may not record equipment work as simply prepared', () => {
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'EC-01-030', level: 2, state: 'prepared' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.ok(
    errorsOf(findings).some((m) => m.includes('pending-demonstration')),
    `expected the bench obligation to stand, got: ${JSON.stringify(findings)}`,
  );
});

test('desk work is prepared, and calling it pending invents a barrier', () => {
  // As wrong as hiding a real one, and in the direction that discourages
  // somebody who could sit the assessment tomorrow.
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'CM-03-052', level: 3, state: 'pending-demonstration' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.ok(errorsOf(findings).some((m) => m.includes('invents a barrier')));
});

test('THE ROUTE SOMEBODY TOOK CHANGES NOTHING ABOUT WHAT IS OWED', () => {
  // If a check here ever starts treating self-study as weaker than a module,
  // the principle has been lost in the implementation rather than the schema.
  const prepared = [{ element: 'EC-01-030', level: 2, state: 'pending-demonstration' as const }];
  const routes: Array<PreparationRecord['route']> = [
    'module',
    'self-study',
    'mentoring',
    'course',
    'workplace-practice',
  ];
  const results = routes.map((route) =>
    checkPreparationRecord({ ...record(), route, preparedFor: prepared } as PreparationRecord, ELEMENTS),
  );
  for (const findings of results) assert.deepEqual(findings, results[0]);
});

/* -- The multi-route element, on a record that travels alone --------------- */

test('an element admitting both routes must say which one this reached', () => {
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'CM-03-051', level: 3, state: 'prepared' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.ok(errorsOf(findings).some((m) => m.includes('without saying which route')));
});

test('...and stating one is enough to decide what it owes', () => {
  const findings = checkPreparationRecord(
    {
      ...record(),
      preparedFor: [{ element: 'CM-03-051', level: 3, route: 'equipment', state: 'pending-demonstration' }],
    } as PreparationRecord,
    ELEMENTS,
  );
  assert.deepEqual(errorsOf(findings), []);
});

test('an element declaring one route may not have it restated', () => {
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'CM-03-052', level: 3, route: 'desk', state: 'prepared' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.ok(errorsOf(findings).some((m) => m.includes('The element has answered')));
});

test('preparing a level above the ceiling is refused', () => {
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'CM-03-052', level: 5, state: 'prepared' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.ok(errorsOf(findings).some((m) => m.includes('above its ceiling')));
});

test('an element nobody supplied is a warning, not an assumption of desk work', () => {
  // Defaulting an unknown to desk would hide a real bench obligation, which is
  // the direction that harms a learner.
  const findings = checkPreparationRecord(
    { ...record(), preparedFor: [{ element: 'DP-08-999', level: 1, state: 'prepared' }] } as PreparationRecord,
    ELEMENTS,
  );
  assert.deepEqual(errorsOf(findings), []);
  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('cannot be decided')));
});
