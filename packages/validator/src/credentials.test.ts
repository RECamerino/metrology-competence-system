/**
 * Credential and authorization guardrails.
 *
 * The worked examples below are deliberately realistic rather than minimal.
 * Authoring the first real item archetypes found a design flaw that fixtures
 * had hidden for an entire phase, so these are full instances: a real L4
 * judgment credential, and the approved-signatory authorization that an
 * organization might grant on the strength of it.
 *
 * The two together are the project's central claim expressed as data — the
 * same person, the same element, one object that travels and one that cannot.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatorFor } from './schema.ts';
import {
  type Authorization,
  type Credential,
  checkCredential,
  checkReciprocity,
  walletExport,
} from './credentials.ts';

/* -- Worked examples ------------------------------------------------------ */

const HOLDER = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const REVIEWER_A = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
const REVIEWER_B = 'did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVJG';
const HASH = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

const credential: Credential = {
  schemaVersion: 1,
  id: 'urn:uuid:3f2b8c1a-5d4e-4f6a-9b2c-7e1d0a3f5b8c',
  subject: HOLDER,
  element: 'CM-03-046',
  level: 4,
  kind: 'judgment',
  assessedAtScope: 'element',
  attainedOn: '2026-08-09',
  expiresOn: '2030-08-09',
  provenanceTier: 'peer-reviewed',
  assessment: {
    modality: ['reviewer-conducted-defense', 'capstone-with-review'],
    archetypes: ['ARC-0002'],
    experienceHours: 260,
  },
  // What this element MEANT on the day it was issued. Append-only IDs keep
  // 'CM-03-046' resolving; only this keeps it meaning the same thing.
  definitionRef: 'sha256:60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
  knowledgeSnapshot: [
    {
      article: 'BOK-0001',
      section: 's03',
      sectionRef: 'sha256:fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
    },
  ],
  evidence: [{ type: 'capstone', ref: HASH, archivedOn: '2026-07-30' }],
  signers: [
    { did: REVIEWER_A, heldLevel: 5, credentialedReviewer: true, organization: 'Northfield Calibration' },
    { did: REVIEWER_B, heldLevel: 5, credentialedReviewer: true, organization: 'Ardleigh Metrology' },
  ],
  issuer: { did: REVIEWER_A, name: 'Northfield Calibration', trustRegistryEntry: 'northfield-cal-2026' },
  portable: true,
  proof: { cryptosuite: 'ecdsa-rdfc-2019-p256' },
};

const authorization: Authorization = {
  schemaVersion: 1,
  id: 'urn:uuid:8c4d1e7f-2a6b-4c3d-8e5f-1b9a7c2d4e6f',
  subject: HOLDER,
  grantedBy: {
    organization: 'Northfield Calibration',
    grantedByPerson: REVIEWER_A,
    accreditationRecognition: 'Schedule of Accreditation 1234, dimensional',
  },
  scope: {
    activities: ['Signing accredited calibration certificates'],
    methods: ['Gauge block comparison'],
    ranges: ['0.5 mm to 100 mm'],
    locations: ['Northfield site'],
  },
  grantedOn: '2026-08-09',
  basis: [{ element: 'CM-03-046', level: 4, credentialId: credential.id }],
  portable: false,
  walletExportable: false,
  revocation: {
    revocable: true,
    unilateral: true,
    appealableOnCompetence: false,
    endsOn: ['departure', 'scope-change'],
  },
};

const L5_POLICY = {
  signerCount: 2,
  witnessMustHoldLevel: 5,
  requiresCredentialedReviewer: true,
  requiresCrossOrganizational: true,
};

/* -- The worked examples must validate ------------------------------------ */

test('the worked competency credential validates', () => {
  const validate = validatorFor('credential');
  assert.ok(validate(credential), JSON.stringify(validate.errors, null, 2));
});

test('the worked authorization validates', () => {
  const validate = validatorFor('authorization');
  assert.ok(validate(authorization), JSON.stringify(validate.errors, null, 2));
});

/* -- Authorization cannot be made to look portable ------------------------ */

test('an authorization claiming to be portable is structurally impossible', () => {
  const validate = validatorFor('authorization');
  assert.equal(validate({ ...authorization, portable: true }), false);
});

test('an authorization claiming to be wallet-exportable is structurally impossible', () => {
  const validate = validatorFor('authorization');
  assert.equal(validate({ ...authorization, walletExportable: true }), false);
});

test('an authorization cannot be made appealable on competence', () => {
  // The field that stops the two objects collapsing into one another.
  const validate = validatorFor('authorization');
  assert.equal(
    validate({
      ...authorization,
      revocation: { ...authorization.revocation as object, appealableOnCompetence: true },
    }),
    false,
  );
});

test('an authorization granted on no competence basis is rejected', () => {
  const validate = validatorFor('authorization');
  assert.equal(validate({ ...authorization, basis: [] }), false);
});

test('an authorization with no scoped activity is rejected', () => {
  // "Authorized" unqualified is the failure mode the object exists to prevent.
  const validate = validatorFor('authorization');
  assert.equal(validate({ ...authorization, scope: { activities: [] } }), false);
});

/* -- No self-signoff ------------------------------------------------------ */

test('a credential the subject signed is rejected', () => {
  const findings = checkCredential({
    ...credential,
    signers: [{ did: HOLDER, heldLevel: 5, credentialedReviewer: true, organization: 'Northfield Calibration' }],
  });
  assert.ok(
    findings.some((f) => f.message.includes('No self-signoff')),
    `expected a self-signoff error, got: ${JSON.stringify(findings)}`,
  );
});

test('the same signer counted twice is rejected', () => {
  const findings = checkCredential({
    ...credential,
    signers: [credential.signers[0]!, credential.signers[0]!],
  });
  assert.ok(findings.some((f) => f.message.includes('more than once')));
});

/* -- Level signoff policy -------------------------------------------------- */

test('a well-formed L5 signoff passes its policy', () => {
  assert.deepEqual(checkCredential(credential, L5_POLICY), []);
});

test('single-organization signing is rejected at a level requiring cross-organizational', () => {
  const findings = checkCredential(
    {
      ...credential,
      signers: credential.signers.map((s) => ({ ...s, organization: 'Northfield Calibration' })),
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.message.includes('closed group')),
    `expected a cross-organizational error, got: ${JSON.stringify(findings)}`,
  );
});

test('a signer below the required level is rejected', () => {
  const findings = checkCredential(
    { ...credential, signers: credential.signers.map((s) => ({ ...s, heldLevel: 3 })) },
    L5_POLICY,
  );
  assert.ok(findings.some((f) => f.message.includes('level 5 or above')));
});

/* -- The wallet boundary --------------------------------------------------- */

test('a wallet export never carries an authorization', () => {
  const wallet = walletExport([credential], [authorization]);
  assert.deepEqual(wallet.authorizations, []);
  assert.equal(wallet.credentials.length, 1);
});

test('a wallet export records that something was withheld, rather than omitting it silently', () => {
  // A reader of the export must be able to tell that authorizations exist and
  // were deliberately not included — silence would look like the person holds
  // none.
  const wallet = walletExport([credential], [authorization]);
  assert.equal(wallet.withheld.authorizations, 1);
  assert.ok(wallet.withheld.reason.includes('end on departure'));
});

/* -- Reciprocal review ----------------------------------------------------- */

test('reciprocal review inside the window is flagged, not silently allowed', () => {
  const findings = checkReciprocity(
    credential,
    [{ signer: HOLDER, subject: REVIEWER_A, on: '2026-05-01' }],
    365,
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('reciprocal review')),
    `expected a reciprocity warning, got: ${JSON.stringify(findings)}`,
  );
});
