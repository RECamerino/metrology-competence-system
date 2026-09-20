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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { validatorFor } from './schema.ts';
import {
  type ExperienceActivity,
  checkExperienceAcrossCredentials,
  type Authorization,
  type Credential,
  checkAttestableStatus,
  checkBootstrapAuthority,
  checkCredential,
  checkEvidenceSufficiency,
  checkCustody,
  checkProvenanceTier,
  checkReciprocity,
  highestSupportedTier,
  isBootstrapSigned,
  isIdentifyingOrganization,
  normalizeOrganization,
  organizationKey,
  signoffPolicyFor,
  walletExport,
} from './credentials.ts';

/* -- Worked examples ------------------------------------------------------ */

const HOLDER = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const REVIEWER_A = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
const REVIEWER_B = 'did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVJG';
const HASH = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

const SUFFICIENCY = {
  decidedBy: REVIEWER_B,
  decidedOn: '2026-08-01',
  rationale:
    'Retained the contribution the template drops, showed what it did to the combined figure, and defended the inclusion when pressed on whether it had been chosen to reach a wanted result.',
};

/**
 * A worked experience claim: four pieces of work totalling 260 hours, credited
 * to CM-03-046 at L4.
 *
 * `demonstrates` is the field open decision 19 exists for. The same four
 * activities appear on every credential they credit, under the same ids, and
 * only this line differs — an activity that genuinely exercised two elements
 * and was claimed against seventeen produces fifteen of these that a reviewer
 * can read and find thin.
 */
const ACTIVITIES = [
  {
    id: 'ilc-2026-mass-round',
    hours: 90,
    account:
      'Prepared and analysed this laboratory submission to a regional mass comparison at 1 kg and 100 g, including the budget, the loop closure and the response to the pilot report.',
    demonstrates:
      'The comparison result disagreed with the budget, which is the L4 case: a repeatability line and a carried specification both covered the same short-term variation, and the overlap was removed and defended against the pilot.',
  },
  {
    id: 'proc-rev-torque-2026',
    hours: 70,
    account:
      'Reviewed and rewrote the torque transducer calibration procedure after a scope extension, working from the previous budgets and the standards certificates rather than from the earlier procedure text.',
    demonstrates:
      'Two lines drawn from documents written to different conventions turned out to name one physical effect. Retaining or removing either was defensible and the decision had to be argued from the records.',
  },
  {
    id: 'cust-dispute-2025-11',
    hours: 60,
    account:
      'Investigated a customer challenge to a reported uncertainty on a pressure calibration, working from the as-found data, the standards history and the method as actually performed.',
    demonstrates:
      'The customer was right that a term was double counted and wrong about which one. Reaching that required establishing what the observations had actually varied before comparing it against what each specification claimed.',
  },
  {
    id: 'newstarter-budgets-2026',
    hours: 40,
    account:
      'Worked through four of the laboratory budgets with a new starter over six weeks, rebuilding each from the raw records rather than explaining the finished tables.',
    demonstrates:
      'Explaining why a Type A line and a carried specification may not coexist, to somebody who had not met the distinction, exposed two budgets of our own where they did.',
  },
];

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
    // The candidate's own laboratory. Recorded so the cross-organizational
    // rule is applied as written rather than approximated.
    candidateOrganization: { name: 'Northfield Calibration', id: 'northfield-cal-2026' },
    // FOUR PIECES OF WORK, NOT TWO INTEGERS. Each says what it was and what it
    // showed about THIS element — the part that differs between the several
    // credentials one activity legitimately credits.
    activities: ACTIVITIES,
    // L4 is doubleScored, and nothing else on the credential could show it —
    // signer count cannot stand in, because scoring is not signing.
    scorerCount: 2,
    // L4 requires 180 days since L3. Recorded here so a verifier holding this
    // credential and nothing else can check the waiting period offline.
    previousLevelAttainedOn: '2025-11-14',
  },
  // What this element MEANT on the day it was issued. Append-only IDs keep
  // 'CM-03-046' resolving; only this keeps it meaning the same thing.
  definitionRef: 'sha256:60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
  // What the LEVEL meant — signer counts, hours, waiting period, reviewer
  // requirements. definitionRef pins the element; this pins the bar.
  assessmentPolicyRef: 'sha256:2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
  knowledgeSnapshot: [
    {
      article: 'BOK-0001',
      section: 's03',
      sectionRef: 'sha256:fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
    },
  ],
  // Both copies, recorded. The laboratory needs a record it can produce at
  // audit under §6.2; the holder needs one they can carry anywhere.
  custody: [
    { custodian: HOLDER, role: 'holder', since: '2026-08-09' },
    {
      custodian: 'Northfield Calibration',
      role: 'issuing-organization',
      since: '2026-08-09',
      retentionUntil: '2036-08-09',
      retentionBasis: 'ISO/IEC 17025:2017 §8.4.2',
    },
  ],
  // Sufficiency is decided by a SIGNER: a judgement from anybody else is not
  // part of the attestation, however plausible it reads on the page.
  // L4 requires a capstone AND a real archived deliverable. The two are not the
  // same artifact: a capstone is assessment work, a work product is the job.
  evidence: [
    { type: 'capstone', ref: HASH, archivedOn: '2026-07-30', sufficiency: SUFFICIENCY },
    { type: 'work-product', ref: HASH, archivedOn: '2026-06-18', sufficiency: SUFFICIENCY },
  ],
  signers: [
    {
      did: REVIEWER_A,
      heldLevel: 5,
      credentialedReviewer: true,
      organization: { name: 'Northfield Calibration', id: 'northfield-cal-2026' },
      // Without these the signer's own standing is an assertion, which is the
      // "trust me" this system exists to eliminate, one level up.
      authority: [
        { basis: 'held-level', credentialId: 'urn:uuid:11111111-1111-4111-8111-111111111111', credentialRef: HASH, element: 'CM-03-046', level: 5 },
        { basis: 'reviewer-authority', credentialId: 'urn:uuid:22222222-2222-4222-8222-222222222222', credentialRef: HASH, element: 'CM-20-001', level: 4 },
      ],
    },
    {
      did: REVIEWER_B,
      heldLevel: 5,
      credentialedReviewer: true,
      organization: { name: 'Ardleigh Metrology', id: 'ardleigh-met-2025' },
      authority: [
        { basis: 'held-level', credentialId: 'urn:uuid:33333333-3333-4333-8333-333333333333', credentialRef: HASH, element: 'CM-03-046', level: 5 },
        { basis: 'reviewer-authority', credentialId: 'urn:uuid:44444444-4444-4444-8444-444444444444', credentialRef: HASH, element: 'CM-20-001', level: 4 },
      ],
    },
  ],
  issuer: { did: REVIEWER_A, name: 'Northfield Calibration', trustRegistryEntry: 'northfield-cal-2026' },
  portable: true,
  proof: {
    type: 'DataIntegrityProof',
    cryptosuite: 'ecdsa-jcs-2019',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1',
    // Shape, not a real signature — nothing here can make one yet, and the
    // contract has to be able to hold one before there is one to hold.
    proofValue: `z${'2'.repeat(87)}`,
  },
};

/*
 * The signers' own credentials.
 *
 * Every test below that asks whether a signoff satisfies its policy now has to
 * supply these, because an asserted `heldLevel` no longer satisfies a
 * requirement that asks for competence to be HELD. That is the whole of the
 * fix: before it, seven tests passed while proving nothing about the signers.
 */
const backingFor = (subject: string, id: string, element: string, level: number) =>
  ({
    ...credential,
    id,
    subject,
    element,
    level,
  }) as unknown as Parameters<typeof checkCredential>[4] extends (infer T)[] ? T : never;

const SIGNER_A = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
const SIGNER_B = 'did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVJG';

const BACKING = [
  backingFor(SIGNER_A, 'urn:uuid:11111111-1111-4111-8111-111111111111', 'CM-03-046', 5),
  backingFor(SIGNER_A, 'urn:uuid:22222222-2222-4222-8222-222222222222', 'CM-20-001', 4),
  backingFor(SIGNER_B, 'urn:uuid:33333333-3333-4333-8333-333333333333', 'CM-03-046', 5),
  backingFor(SIGNER_B, 'urn:uuid:44444444-4444-4444-8444-444444444444', 'CM-20-001', 4),
];

/** A signoff check with the signers' standing actually resolvable. */
const checkProven = (
  c: Parameters<typeof checkCredential>[0],
  policy: Parameters<typeof checkCredential>[1],
) => checkCredential(c, policy, undefined, undefined, BACKING);

const authorization: Authorization = {
  schemaVersion: 1,
  id: 'urn:uuid:8c4d1e7f-2a6b-4c3d-8e5f-1b9a7c2d4e6f',
  subject: HOLDER,
  grantedBy: {
    organization: 'Northfield Calibration',
    grantedByPerson: REVIEWER_A,
    accreditationRecognition: 'Schedule of Accreditation 1234, dimensional',
  },
  // Every dimension is compared, not read. This fixture used to hold
  // 'Signing accredited calibration certificates' and '0.5 mm to 100 mm',
  // which is exactly the prose the scope-matching engine could not evaluate.
  scope: {
    activities: ['sign-accredited-certificate'],
    measurement: { includes: { areas: ['CM-03-A04'] } },
    methods: [{ identifier: 'Gauge block comparison' }],
    ranges: [{ quantity: 'length', unit: 'mm', min: 0.5, max: 100 }],
    locations: [{ id: 'northfield-main', name: 'Northfield site' }],
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
    signers: [{ did: HOLDER, heldLevel: 5, credentialedReviewer: true, organization: { name: 'Northfield Calibration' } }],
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

/** Errors only. An unresolved authority chain is a warning, not a defect. */
const errorsOf = (findings: Array<{ level: string; message: string }>) =>
  findings.filter((f) => f.level === 'error');

test('a well-formed L5 signoff passes its policy', () => {
  // Errors, not findings. Every authority entry on this credential names a
  // backing credential that was not supplied, and saying so is the point of
  // F-05 — silence on an unresolved chain is what used to be available.
  assert.deepEqual(errorsOf(checkProven(credential, L5_POLICY)), []);
});

test('single-organization signing is rejected at a level requiring cross-organizational', () => {
  const findings = checkCredential(
    {
      ...credential,
      signers: credential.signers.map((s) => ({ ...s, organization: { name: 'Northfield Calibration', id: 'northfield-cal-2026' } })),
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

/* -- Bootstrapping the ladder ---------------------------------------------- */

const FOUNDER = {
  did: 'did:key:z6MkfrQabcTHRVNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsd',
  heldLevel: null,
  credentialedReviewer: true,
  organization: { name: 'National Physical Standards', id: 'nps-2024' },
  bootstrapAuthority: {
    basis: 'Primary standards laboratory appointment and UKAS technical assessor for dimensional scope.',
    cohort: 'founding-2026',
    admittedOn: '2026-09-01',
  },
};

test('with no holders, an ordinary L5 signoff is impossible — this is the deadlock', () => {
  // L3 needs L4, L4 needs L5, L5 needs L5. At launch nobody holds anything, so
  // without a bootstrap rule only L1 and L2 are ever reachable.
  const findings = checkCredential(
    { ...credential, signers: credential.signers.map((s) => ({ ...s, heldLevel: null })) },
    L5_POLICY,
  );
  assert.ok(findings.some((f) => f.level === 'error' && f.message.includes('level 5 or above')));
});

test('a founding-cohort signer breaks the deadlock', () => {
  const findings = checkCredential(
    { ...credential, signers: [FOUNDER, { ...credential.signers[1]!, heldLevel: null }] },
    L5_POLICY,
  );
  assert.equal(findings.filter((f) => f.level === 'error').length, 0);
});

test('but a bootstrap-signed credential is never silent about it', () => {
  // A bootstrap-signed L5 is a weaker claim than a peer-signed one, and a
  // reader who cannot tell them apart has been misled.
  const findings = checkCredential(
    { ...credential, signers: [FOUNDER, { ...credential.signers[1]!, heldLevel: null }] },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('founding-cohort authority')),
    `expected a bootstrap warning, got: ${JSON.stringify(findings)}`,
  );
});

test('bootstrap authority is visible from the credential without parsing policy', () => {
  assert.equal(isBootstrapSigned(credential), false);
  assert.equal(isBootstrapSigned({ ...credential, signers: [FOUNDER] }), true);
});

/* -- Dual custody, as a record rather than a sentence ---------------------- */

test('the worked credential records both copies', () => {
  assert.deepEqual(checkCustody(credential), []);
});

test('a credential recording no custody at all is rejected by the schema', () => {
  const validate = validatorFor('credential');
  const { custody, ...without } = credential as Record<string, unknown>;
  assert.equal(validate(without), false);
  assert.equal(validate({ ...credential, custody: [] }), false);
});

test('AN ORGANIZATION CANNOT ISSUE A CREDENTIAL THE SUBJECT NEVER RECEIVES', () => {
  // The half of dual custody that protects the person. A laboratory keeping an
  // audit record while the individual holds nothing inverts what this object
  // is for: they cannot prove a competence formally attested about them.
  const undelivered = {
    ...credential,
    custody: credential.custody!.filter((c) => c.role !== 'holder'),
  };
  const findings = checkCustody(undelivered);
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('records no holder custody')),
    `expected an undelivered-credential error, got: ${JSON.stringify(findings)}`,
  );
});

test('a holder entry naming somebody other than the subject is rejected', () => {
  const findings = checkCustody({
    ...credential,
    custody: [{ custodian: REVIEWER_A, role: 'holder', since: '2026-08-09' }],
  });
  assert.ok(findings.some((f) => f.message.includes('who is not the subject')));
});

test('AN ORGANIZATION MUST KEEP A RECORD IT CAN PRODUCE AT AUDIT', () => {
  // The other half. If the only copy leaves with the person, the laboratory
  // cannot answer §6.2 — which is the reason dual custody was decided on.
  const holderOnly = {
    ...credential,
    custody: credential.custody!.filter((c) => c.role === 'holder'),
  };
  const findings = checkCustody(holderOnly);
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('§6.2')),
    `expected a missing-organization-custody error, got: ${JSON.stringify(findings)}`,
  );
});

test('single custody is correct below the organization tier, not a defect', () => {
  // A self-study credential has no laboratory behind it, so there is nobody to
  // retain anything and nothing to require. Demanding a second custodian here
  // would be demanding an employer, which is the barrier the project refuses.
  assert.deepEqual(checkCustody(selfStudy), []);
});

test('an organization custodian with no retention period is flagged', () => {
  const findings = checkCustody({
    ...credential,
    custody: [
      credential.custody![0]!,
      { custodian: 'Northfield Calibration', role: 'issuing-organization', since: '2026-08-09' },
    ],
  });
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('§8.4')),
    `expected a retention-period warning, got: ${JSON.stringify(findings)}`,
  );
});

test('a retention period ending before the credential existed is an error', () => {
  const findings = checkCustody({
    ...credential,
    custody: [
      credential.custody![0]!,
      { custodian: 'Northfield Calibration', role: 'issuing-organization', since: '2026-08-09', retentionUntil: '2020-01-01' },
    ],
  });
  assert.ok(findings.some((f) => f.message.includes('not a retention schedule')));
});

test('custody travels in the wallet, because the holder benefits from knowing', () => {
  // Unlike an authorization, this is not something to strip: a verifier
  // reading the holder's copy learns who else should have one, which is what
  // makes a later purge nameable rather than silent.
  const wallet = walletExport([credential]);
  assert.ok(wallet.credentials[0]!.custody!.some((c) => c.role === 'issuing-organization'));
});

test('the custody check runs from inside checkCredential', () => {
  const findings = checkCredential({ ...credential, custody: [credential.custody![1]!] });
  assert.ok(findings.some((f) => f.message.includes('records no holder custody')));
});

/* -- The cohort as a roster, not an adjective ------------------------------ */

const FOUNDER_BASIS = FOUNDER.bootstrapAuthority.basis;

const COHORT = {
  schemaVersion: 1 as const,
  convenedOn: '2026-09-01',
  closesOn: '2028-09-01',
  members: [
    {
      did: FOUNDER.did,
      name: 'A. Founder',
      admittedOn: '2026-09-01',
      basis: FOUNDER_BASIS,
      // Admitted for dimensional standing. NOT all 43 domains.
      scope: ['CM-03'],
    },
  ],
};

const bootstrapSigned = (overrides: Record<string, unknown> = {}): Credential => ({
  ...credential,
  attainedOn: '2027-03-01',
  signers: [FOUNDER, { ...credential.signers[1]!, heldLevel: null }],
  ...overrides,
});

test('the shipped roster convenes no cohort, so no bootstrap signature is valid', () => {
  // The correct state today: appointing stewards is blocked on people, and a
  // roster that permitted bootstrap signing before anybody was appointed would
  // reverse the rule that issuance does not proceed.
  const findings = checkBootstrapAuthority(bootstrapSigned(), { schemaVersion: 1, members: [] });
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('no cohort has been convened')),
    `expected a not-convened refusal, got: ${JSON.stringify(findings)}`,
  );
});

test('a signer claiming founding authority who is not on the roster is rejected', () => {
  // Otherwise the cohort is open to anybody willing to write a basis string,
  // and a closed cohort anybody can join is not closed.
  const stranger = {
    ...FOUNDER,
    did: 'did:key:z6MkimposterAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  };
  const findings = checkBootstrapAuthority(
    bootstrapSigned({ signers: [stranger] }),
    COHORT,
    { elementDomain: 'CM-03' },
  );
  assert.ok(findings.some((f) => f.message.includes('is not on the roster')));
});

test('a well-formed bootstrap signature inside scope and inside the window passes', () => {
  assert.deepEqual(
    checkBootstrapAuthority(bootstrapSigned(), COHORT, { elementDomain: 'CM-03' }),
    [],
  );
});

test('SCOPE: a founder may not bootstrap-sign outside the field they were admitted for', () => {
  // The control that stops three people minting the whole ladder, and the
  // project's first principle as code: no single person holds all of it.
  const findings = checkBootstrapAuthority(bootstrapSigned(), COHORT, { elementDomain: 'DP-07' });
  assert.ok(
    findings.some((f) => f.message.includes('outside the scope they were admitted for')),
    `expected a scope error, got: ${JSON.stringify(findings)}`,
  );
});

test('NO SELF-DEALING: a cohort member cannot be the subject of a bootstrap-signed credential', () => {
  // Three founders signing each other to L5 in a weekend is the reciprocal
  // pattern decision 43 rejected when it chose this mechanism over a mutual
  // peer cohort. They are admitted on external standing and need no
  // bootstrap-signed credential.
  const findings = checkBootstrapAuthority(
    bootstrapSigned({ subject: FOUNDER.did, signers: [{ ...FOUNDER, did: credential.signers[1]!.did, bootstrapAuthority: FOUNDER.bootstrapAuthority }] }),
    { ...COHORT, members: [...COHORT.members, { ...COHORT.members[0]!, did: credential.signers[1]!.did }] },
    { elementDomain: 'CM-03' },
  );
  assert.ok(
    findings.some((f) => f.message.includes('may not be the subject of a bootstrap-signed credential')),
    `expected a self-dealing error, got: ${JSON.stringify(findings)}`,
  );
});

test('TIME: a signature after the cohort closes is rejected', () => {
  const findings = checkBootstrapAuthority(
    bootstrapSigned({ attainedOn: '2028-09-02' }),
    COHORT,
    { elementDomain: 'CM-03' },
  );
  assert.ok(findings.some((f) => f.message.includes('after the founding cohort closed')));
});

test('TIME: a signature predating the signer\'s own admission is backdating', () => {
  const findings = checkBootstrapAuthority(
    bootstrapSigned({ attainedOn: '2026-08-01' }),
    COHORT,
    { elementDomain: 'CM-03' },
  );
  assert.ok(findings.some((f) => f.message.includes('backdating')));
});

test('credentials signed while the cohort was open stay valid after it closes', () => {
  // Closing ends new bootstrap signing; it does not un-happen what was signed.
  const closed = { ...COHORT, closesOn: '2027-06-01' };
  assert.deepEqual(
    checkBootstrapAuthority(bootstrapSigned({ attainedOn: '2027-03-01' }), closed, { elementDomain: 'CM-03' }),
    [],
  );
});

test('VOLUME: a ceiling is enforced when a steward sets one', () => {
  const capped = { ...COHORT, members: [{ ...COHORT.members[0]!, maxCredentials: 25 }] };
  const findings = checkBootstrapAuthority(bootstrapSigned(), capped, {
    elementDomain: 'CM-03',
    signedAlready: { [FOUNDER.did]: 25 },
  });
  assert.ok(findings.some((f) => f.message.includes('reaching the ceiling of 25')));
});

test('a basis disagreeing with the roster is surfaced', () => {
  const findings = checkBootstrapAuthority(
    bootstrapSigned({
      signers: [{ ...FOUNDER, bootstrapAuthority: { ...FOUNDER.bootstrapAuthority, basis: 'A different account of standing, long enough to satisfy the schema minimum.' } }],
    }),
    COHORT,
    { elementDomain: 'CM-03' },
  );
  assert.ok(findings.some((f) => f.message.includes('does not match the roster')));
});

test('an unsupplied element domain is reported rather than assumed', () => {
  // The domain must be the element's `domain` field. The ID prefix is
  // historical and would silently check the wrong domain for anything
  // reorganised — rule 1.
  const findings = checkBootstrapAuthority(bootstrapSigned(), COHORT);
  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('could not be checked')));
});

test('a credential with no bootstrap signer is not troubled by any of this', () => {
  assert.deepEqual(checkBootstrapAuthority(credential, COHORT, { elementDomain: 'CM-03' }), []);
  assert.deepEqual(checkBootstrapAuthority(credential, undefined), []);
});

test('the cohort check runs from inside checkCredential, not only when remembered', () => {
  const findings = checkCredential(bootstrapSigned(), L5_POLICY);
  assert.ok(findings.some((f) => f.message.includes('no cohort roster was presented')));
});

test('bootstrap authority with no stated basis is rejected by the schema', () => {
  const validate = validatorFor('credential');
  assert.equal(
    validate({
      ...credential,
      signers: [{ ...FOUNDER, bootstrapAuthority: { cohort: 'founding-2026' } }],
    }),
    false,
  );
});

/* -- Draft elements -------------------------------------------------------- */

test('L3 and above cannot be attested against a draft element', () => {
  const findings = checkAttestableStatus({ id: 'urn:x', element: 'CM-03-046', level: 4 }, 'draft');
  assert.ok(findings.some((f) => f.message.includes("may only be attested against a 'stable' element")));
});

test('L2 may rest on a draft element, because it is witnessed observation', () => {
  assert.deepEqual(checkAttestableStatus({ id: 'urn:x', element: 'CM-03-046', level: 2 }, 'draft'), []);
});

test('a stable element is attestable at any level', () => {
  assert.deepEqual(checkAttestableStatus({ id: 'urn:x', element: 'CM-03-046', level: 5 }, 'stable'), []);
});

test('a deprecated element cannot be newly attested at all', () => {
  const findings = checkAttestableStatus({ id: 'urn:x', element: 'CM-03-046', level: 4 }, 'deprecated');
  assert.ok(findings.some((f) => f.message.includes('issue against its successor')));
});

test('a signer whose own standing is unbacked is flagged as asserted, not proven', () => {
  const findings = checkCredential(
    {
      ...credential,
      signers: credential.signers.map(({ authority, ...rest }) => rest),
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('Asserted, not proven')),
    `expected an unbacked-signer warning, got: ${JSON.stringify(findings)}`,
  );
});

test('a founding-cohort signer is not expected to carry a held-level credential', () => {
  // They hold none by definition; that is what bootstrapAuthority records.
  const findings = checkCredential(
    { ...credential, signers: [FOUNDER, credential.signers[1]!] },
    L5_POLICY,
  );
  assert.ok(!findings.some((f) => f.message.includes('Asserted, not proven')));
});

/* -- Resolving the signer's authority chain -------------------------------- */

/*
 * Review finding F-05. The entry carried an id and a hash and nothing a reader
 * without the backing credential could read — so "a verifier can establish a
 * chain offline" was true only once that document had arrived by a route the
 * system did not define, and the field description ended "Nothing in that
 * requires contacting anybody".
 *
 * The obvious repair, exporting the signers' credentials in the holder's
 * wallet, is refused: a signer's competence record is the SIGNER'S record, and
 * conscripting a third party's credential into somebody else's wallet is the
 * disclosure this project built a schema to prevent.
 */

const BACKING_ID = 'urn:uuid:11111111-1111-4111-8111-111111111111';

const backingCredential = (overrides: Record<string, unknown> = {}) => ({
  ...credential,
  id: BACKING_ID,
  subject: (credential.signers[0] as { did: string }).did,
  element: 'CM-03-046',
  level: 5,
  ...overrides,
});

/* -- Standing has to have been in force on the day it was used ------------- */

/*
 * External review finding A-13. The authority chain checked subject, element
 * and level, and no dates at all — so a signoff dated 2028 could rest on a
 * credential its signer did not attain until 2030.
 *
 * Harmless while an asserted `heldLevel` satisfied the rung anyway. The moment
 * `proven` became the only thing that counts, an unchecked date became the
 * obvious way to manufacture one.
 */

/** BACKING, with one held-level credential bent in time. */
const backingWith = (overrides: Record<string, unknown>) =>
  // BOTH signers' held-level credentials. Bending only one leaves the other
  // proving the rung, which is correct behaviour and not what these test.
  BACKING.map((c) =>
    (c as Record<string, unknown>).element === 'CM-03-046'
      ? ({ ...(c as object), ...overrides } as typeof c)
      : c,
  );

const messagesFor = (backing: typeof BACKING) =>
  checkCredential(credential, L5_POLICY, undefined, undefined, backing).map((f) => f.message);

test('A SIGNOFF CANNOT REST ON STANDING THE SIGNER DID NOT YET HAVE', () => {
  const later = String((credential as Record<string, unknown>).attainedOn).replace(/^\d{4}/, (y) => String(Number(y) + 2));
  const messages = messagesFor(backingWith({ attainedOn: later }));
  assert.ok(
    messages.some((m) => m.includes('was not attained until') && m.includes('did not yet have')),
    `expected the future standing to be refused, got: ${JSON.stringify(messages)}`,
  );
});

test('...and it does not count toward the rung either', () => {
  // The state and the finding have to agree: a contradicted standing is not a
  // proven one, so the requirement is unmet rather than merely commented on.
  const later = String((credential as Record<string, unknown>).attainedOn).replace(/^\d{4}/, (y) => String(Number(y) + 2));
  const errors = errorsOf(
    checkCredential(credential, L5_POLICY, undefined, undefined, backingWith({ attainedOn: later })),
  ).map((f) => f.message);
  assert.ok(errors.some((m) => m.includes('no signer is PROVEN to hold level 5')));
});

test('standing that had expired before the signoff is not standing', () => {
  const messages = messagesFor(backingWith({ expiresOn: '2020-01-01' }));
  assert.ok(messages.some((m) => m.includes('expired on 2020-01-01')));
});

test('A REVOCATION BEFORE THE SIGNOFF IS AN ERROR', () => {
  const messages = messagesFor(
    backingWith({ status: { revoked: true, revokedOn: '2020-01-01', reason: 'fraud' } }),
  );
  assert.ok(
    messages.some((m) => m.includes('on or before this signoff') && m.includes('not competent at the time')),
    `expected the revoked standing to be refused, got: ${JSON.stringify(messages)}`,
  );
});

test('...and a revocation AFTER it is reported rather than silently invalidating', () => {
  // Deliberately NOT the key-compromise rule. A signature made before a key was
  // compromised stands because the key was sound until the breach; a competence
  // credential is revoked for fraud or assessment defect, both of which say the
  // attestation should never have existed. Nothing here adjudicates that, so it
  // is surfaced for a reader to weigh — the counter-statement treatment.
  const findings = checkCredential(
    credential,
    L5_POLICY,
    undefined,
    undefined,
    backingWith({ status: { revoked: true, revokedOn: '2099-01-01', reason: 'fraud' } }),
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('after this signoff') && f.message.includes('Unlike a compromised key')),
    `expected the later revocation to be weighed, got: ${JSON.stringify(findings.map((f) => f.message))}`,
  );
  assert.deepEqual(
    errorsOf(findings).filter((f) => f.message.includes('revoked')),
    [],
  );
});

test('a sufficiency decided AFTER issuance is not the judgement the credential rests on', () => {
  const evidence = (credential.evidence as Array<Record<string, any>>).map((e, n) =>
    n === 0 ? { ...e, sufficiency: { ...e.sufficiency, decidedOn: '2099-01-01' } } : e,
  );
  const errors = errorsOf(
    checkCredential({ ...credential, evidence } as typeof credential, L5_POLICY, undefined, undefined, BACKING),
  ).map((f) => f.message);
  assert.ok(
    errors.some((m) => m.includes('after the credential was attained')),
    `expected the late judgement to be refused, got: ${JSON.stringify(errors)}`,
  );
});

test('a custody interval that ends before it begins is refused', () => {
  const custody = [
    { custodian: credential.subject, role: 'holder', since: '2030-01-01', retentionUntil: '2029-01-01' },
  ];
  const errors = errorsOf(
    checkCredential({ ...credential, custody } as unknown as typeof credential, undefined, undefined, undefined, BACKING),
  ).map((f) => f.message);
  assert.ok(errors.some((m) => m.includes('ends before it begins')));
});

test('nobody held the credential before it existed', () => {
  const custody = (credential.custody as unknown as Array<Record<string, unknown>>).map((c) => ({ ...c, since: '2000-01-01' }));
  const errors = errorsOf(
    checkCredential({ ...credential, custody } as unknown as typeof credential, undefined, undefined, undefined, BACKING),
  ).map((f) => f.message);
  assert.ok(errors.some((m) => m.includes('before the credential was attained')));
});

/* -- Asserted is not proven ------------------------------------------------ */

/*
 * The sharpest finding of an external adversarial review, and the attack it
 * described, run here so it cannot come back.
 *
 * `witnessMustHoldLevel` asks for a signer holding that level IN THIS ELEMENT.
 * The check read `heldLevel >= required` — a number the issuer typed — two
 * lines after the same function had said of the same signer "Asserted, not
 * proven." The validator knew the claim was unsupported and let it satisfy the
 * requirement.
 */

const unbackedSigner = (did: string, organization: Record<string, string>) => ({
  did,
  heldLevel: 5,
  credentialedReviewer: true,
  organization,
});

const allClaim = {
  ...credential,
  signers: [
    unbackedSigner(SIGNER_A, { name: 'Northfield Calibration', id: 'northfield-cal-2026' }),
    unbackedSigner(SIGNER_B, { name: 'Ardleigh Metrology', id: 'ardleigh-met-2025' }),
  ],
} as unknown as Parameters<typeof checkCredential>[0];

test('A SIGNER WHO MERELY CLAIMS L5 NO LONGER SATISFIES THE L5 RUNG', () => {
  const errors = errorsOf(checkCredential(allClaim, L5_POLICY)).map((f) => f.message);
  assert.ok(
    errors.some((m) => m.includes('no signer is PROVEN to hold level 5') && m.includes('backed by no credential at all')),
    `expected the assertion to be refused, got: ${JSON.stringify(errors)}`,
  );
});

test('...and `credentialedReviewer: true` no longer satisfies reviewer authority', () => {
  // The identical hole beside the first one. The review filed them separately;
  // they are one defect in one loop.
  const errors = errorsOf(checkCredential(allClaim, L5_POLICY)).map((f) => f.message);
  assert.ok(
    errors.some((m) => m.includes('no signer is PROVEN to hold reviewer authority')),
    `expected the reviewer claim to be refused, got: ${JSON.stringify(errors)}`,
  );
});

test('THE ATTACK THAT USED TO PRODUCE ZERO ERRORS: an L5 at self-study', () => {
  // The tier cap was never the whole defence. `highestSupportedTier` correctly
  // held this to `self-study`, so the review's stated attack — manufacturing a
  // HIGH-tier credential — did not work. Declaring `self-study` was honest
  // about the witness and left the rung asserting an L5 nobody proved.
  const errors = errorsOf(
    checkCredential({ ...allClaim, provenanceTier: 'self-study' }, L5_POLICY),
  );
  assert.notDeepEqual(errors, [], 'an L5 signed on assertions must not pass at any tier');
});

test('a founding-cohort signer still satisfies both, because the ladder cannot otherwise start', () => {
  // The designed escape hatch, and the reason this can be a hard error at all.
  const findings = checkCredential(
    {
      ...allClaim,
      signers: (allClaim.signers as unknown as Array<Record<string, unknown>>).map((sg) => ({
        ...sg,
        bootstrapAuthority: { cohort: 'founding', admittedOn: '2026-01-01' },
      })),
    } as unknown as Parameters<typeof checkCredential>[0],
    L5_POLICY,
  );
  assert.deepEqual(
    errorsOf(findings).filter((f) => f.message.includes('PROVEN')),
    [],
  );
});

test('a PROVEN standing below the required level does not satisfy it either', () => {
  // Resolving the chain is not the same as clearing the bar.
  const tooLow = BACKING.map((c) =>
    (c as Record<string, unknown>).element === 'CM-03-046' ? { ...(c as object), level: 3 } : c,
  ) as typeof BACKING;
  const errors = errorsOf(
    checkCredential(credential, L5_POLICY, undefined, undefined, tooLow),
  ).map((f) => f.message);
  assert.ok(errors.some((m) => m.includes('no signer is PROVEN to hold level 5')));
});

test('AN UNRESOLVED CHAIN IS A CLAIM, AND THE VERDICT SAYS WHICH', () => {
  const findings = checkCredential(credential, L5_POLICY);
  assert.ok(
    findings.some(
      (f) => f.level === 'warn' && f.message.includes('claimed to attest CM-03-046 @ L5') && f.message.includes('not supplied'),
    ),
    `expected the claim to be legible and named unresolved, got: ${JSON.stringify(findings.map((f) => f.message))}`,
  );
});

test('...AND AN UNRESOLVED CHAIN DOES NOT SATISFY THE POLICY', () => {
  // The fix. This assertion used to be `errorsOf(findings) === []`: the chain
  // was unresolved, the verdict said so, and the requirement was satisfied
  // anyway. A caller who did not look has not established anything.
  const errors = errorsOf(checkCredential(credential, L5_POLICY)).map((f) => f.message);
  assert.ok(
    errors.some((m) => m.includes('no signer is PROVEN to hold level 5') && m.includes('not supplied')),
    `expected the unmet requirement to name the cause, got: ${JSON.stringify(errors)}`,
  );
});

test('...and supplying the backing credentials resolves it', () => {
  const findings = checkProven(credential, L5_POLICY);
  assert.deepEqual(
    findings.filter((f) => f.message.includes(BACKING_ID) && f.message.includes('not supplied')),
    [],
  );
  assert.deepEqual(errorsOf(findings), []);
});

test('NOBODY BACKS THEIR OWN STANDING WITH SOMEBODY ELSE\'S CREDENTIAL', () => {
  const findings = checkCredential(credential, L5_POLICY, undefined, undefined, [
    backingCredential({ subject: 'did:key:z6MksomebodyElseEntirely00000000000000000000' }) as unknown as Parameters<typeof checkCredential>[0],
  ]);
  assert.ok(
    errorsOf(findings).some((f) => f.message.includes('A credential earned by somebody else')),
    `expected the substitution to be refused, got: ${JSON.stringify(findings.map((f) => f.message))}`,
  );
});

test('a claim that disagrees with the document it names is an error', () => {
  // The hash pins the document, so this is a claim anybody holding it can read.
  const findings = checkCredential(credential, L5_POLICY, undefined, undefined, [
    backingCredential({ level: 3 }) as unknown as Parameters<typeof checkCredential>[0],
  ]);
  assert.ok(errorsOf(findings).some((f) => f.message.includes('attests L3')));
});

test('a held level in a DIFFERENT element is not evidence here', () => {
  // Signer standing is scoped to the element — the rule the signoff policy
  // states and the chain could not previously be asked about.
  const findings = checkCredential(credential, L5_POLICY, undefined, undefined, [
    backingCredential({ element: 'CM-15-046' }) as unknown as Parameters<typeof checkCredential>[0],
  ]);
  assert.ok(errorsOf(findings).some((f) => f.message.includes('Signer standing is scoped to the element')));
});

test("A WALLET NEVER CARRIES THE SIGNERS' CREDENTIALS, AND THAT IS THE LIMIT", () => {
  // The reason the chain cannot be made to resolve from the holder's wallet.
  // Rule 6b is not a rule about one person: a signer's record is theirs, and a
  // narrower derived proof would need selective disclosure this suite has not.
  const signerCredential = backingCredential() as unknown as Parameters<typeof walletExport>[0][number];
  const wallet = walletExport([credential as Parameters<typeof walletExport>[0][number], signerCredential]);

  // Both are portable credentials, so the export carries both — as the HOLDER'S
  // own, which is the only basis on which anything is in a wallet. Nothing
  // reaches in and adds a signer's record on the holder's behalf.
  assert.equal(wallet.credentials.length, 2);
  assert.deepEqual(wallet.authorizations, []);
});

/* -- Cross-organizational signing, as written rather than approximated ----- */

test('a signer outside the candidate organization satisfies the rule', () => {
  // Northfield is the candidate's own lab; Ardleigh is not.
  assert.deepEqual(errorsOf(checkProven(credential, L5_POLICY)), []);
});

test('two signers from one EXTERNAL organization also satisfy it', () => {
  // The old check counted distinct signer organizations, which wrongly rejected
  // this: both signers are outside the candidate's organization, which is
  // exactly what the rule asks for.
  const findings = checkProven(
    {
      ...credential,
      signers: credential.signers.map((s) => ({ ...s, organization: { name: 'Ardleigh Metrology', id: 'ardleigh-met-2025' } })),
    },
    L5_POLICY,
  );
  assert.deepEqual(findings.filter((f) => f.level === 'error'), []);
});

test('signers drawn only from the candidate organization are rejected', () => {
  const findings = checkCredential(
    {
      ...credential,
      signers: credential.signers.map((s) => ({ ...s, organization: { name: 'Northfield Calibration', id: 'northfield-cal-2026' } })),
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.message.includes("outside the candidate's organization")),
    `expected a closed-group error, got: ${JSON.stringify(findings)}`,
  );
});

/* -- Organization identity, which the rule actually rests on --------------- */

test('THE EXPLOIT: one laboratory spelled two ways is one laboratory', () => {
  // The residual defect. Two colleagues at Northfield writing "Northfield
  // Calibration" and "Northfield Calibration Ltd" satisfied a rule that exists
  // so a closed group cannot certify its own experts. It looks like a
  // formatting difference and works like an evasion.
  const { candidateOrganization, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential(
    {
      ...credential,
      assessment,
      signers: [
        { ...credential.signers[0]!, organization: { name: 'Northfield Calibration' } },
        { ...credential.signers[1]!, organization: { name: 'northfield calibration, ltd.' } },
      ],
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('every signer is from one organization')),
    `expected the two spellings to collapse, got: ${JSON.stringify(findings)}`,
  );
});

test('normalisation collapses case, punctuation and trailing legal suffixes', () => {
  assert.equal(normalizeOrganization('Northfield Calibration Ltd.'), 'northfield calibration');
  assert.equal(normalizeOrganization('  NORTHFIELD  CALIBRATION,  LLC '), 'northfield calibration');
  assert.equal(normalizeOrganization('Ardleigh Metrology GmbH'), 'ardleigh metrology');
});

test('a leading token that looks like a suffix is not stripped', () => {
  // "Co-ordinate" must survive; only TRAILING corporate form is removed.
  assert.equal(normalizeOrganization('Co-ordinate Metrology Services Ltd'), 'co ordinate metrology services');
});

test('an identifier beats a name, in both directions', () => {
  // Same id, different names — a rename, which normalisation cannot catch.
  assert.equal(
    organizationKey({ name: 'Northfield Calibration', id: 'nc-1' }),
    organizationKey({ name: 'Northfield Metrology Group', id: 'nc-1' }),
  );
  // Same name, different ids — two genuinely distinct organizations that
  // happen to share a name.
  assert.notEqual(
    organizationKey({ name: 'Precision Labs', id: 'pl-uk' }),
    organizationKey({ name: 'Precision Labs', id: 'pl-us' }),
  );
});

test('TWO UNAFFILIATED PEOPLE ARE NOT TWO ORGANIZATIONS', () => {
  // "Independent" and "Self-employed" are distinct strings and identify
  // nobody. Counting them as two organizations satisfied the rule while
  // proving nothing whatever about separation.
  assert.equal(isIdentifyingOrganization({ name: 'Independent' }), false);
  assert.equal(isIdentifyingOrganization({ name: 'self-employed' }), false);
  assert.equal(isIdentifyingOrganization({ name: 'Northfield Calibration' }), true);

  const { candidateOrganization, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential(
    {
      ...credential,
      assessment,
      signers: [
        { ...credential.signers[0]!, organization: { name: 'Independent' } },
        { ...credential.signers[1]!, organization: { name: 'Self-employed' } },
      ],
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('identifies nobody')),
    `expected unaffiliated signers not to count as two organizations, got: ${JSON.stringify(findings)}`,
  );
});

test('an unaffiliated signer IS outside a named candidate organization', () => {
  // The rule asks for a signer outside the candidate's organization, and a
  // consultant at no organization plainly is. Rejecting this would gate L5
  // behind employment, which is the barrier the project refuses.
  const findings = checkProven(
    {
      ...credential,
      signers: [
        { ...credential.signers[0]!, organization: { name: 'Northfield Calibration', id: 'northfield-cal-2026' } },
        { ...credential.signers[1]!, organization: { name: 'Independent' } },
      ],
    },
    L5_POLICY,
  );
  assert.deepEqual(findings.filter((f) => f.level === 'error'), []);
});

test('a name-only comparison says so, at the level where it matters', () => {
  const findings = checkCredential(
    {
      ...credential,
      assessment: { ...credential.assessment as object, candidateOrganization: { name: 'Northfield Calibration' } },
      signers: [
        { ...credential.signers[0]!, organization: { name: 'Northfield Calibration' } },
        { ...credential.signers[1]!, organization: { name: 'Ardleigh Metrology' } },
      ],
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('comparing organization NAMES')),
    `expected a nominal-comparison warning, got: ${JSON.stringify(findings)}`,
  );
});

test('identifiers everywhere means no such warning', () => {
  assert.deepEqual(
    checkProven(credential, L5_POLICY).filter((f) => f.message.includes('organization NAMES')),
    [],
  );
});

test('without the candidate organization the check says it approximated', () => {
  const { candidateOrganization, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential({ ...credential, assessment }, L5_POLICY);
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('stricter than the rule')),
    `expected an approximation warning, got: ${JSON.stringify(findings)}`,
  );
});

test('a credential with no knowledgeSnapshot is rejected by the schema', () => {
  // An element must carry knowledgeRefs, so a credential against one has a
  // knowledge basis by construction. Omitting it loses what the claim rested on.
  const validate = validatorFor('credential');
  const { knowledgeSnapshot, ...without } = credential as Record<string, unknown>;
  assert.equal(validate(without), false);
});

test('an EMPTY knowledgeSnapshot is rejected too, not merely a missing one', () => {
  // The requirement was shape-only until it carried a floor: `[]` satisfied
  // "pin the knowledge" while pinning none of it, and the drift check iterated
  // an empty array and reported nothing.
  const validate = validatorFor('credential');
  assert.equal(validate({ ...credential, knowledgeSnapshot: [] }), false);
});

/* -- What the level had to COST -------------------------------------------- */

/**
 * Built from the shipped proficiency.yaml rather than a fixture, deliberately.
 * These requirements were stated there, hashed into assessmentPolicyRef, and
 * enforced by nothing; a hand-written fixture could drift back out of agreement
 * with the file and nobody would learn about it.
 */
const PROFICIENCY = parseYaml(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'content', 'competence', 'taxonomy', 'proficiency.yaml'),
    'utf8',
  ),
) as { levels: Array<Record<string, unknown>> };

const levelEntry = (level: number) => PROFICIENCY.levels.find((l) => l.level === level)!;



/* -- What "nothing gates entry" currently reaches --------------------------- */

test('THE LADDER STOPS AN UNNETWORKED HOLDER AT L2, AND THE DECLARATION SAYS SO', () => {
  /*
   * Adversarial review finding F-03. A person with no employer and no
   * professional network is witnessed to L2 by whoever is available; every rung
   * above needs a specific person they have to find — somebody holding that
   * level IN THAT ELEMENT who also holds reviewer authority.
   *
   * That is declared in proficiency.yaml, in the first principle in CLAUDE.md,
   * and in docs/00-context.md. A declaration is prose, and prose describing a
   * state the files no longer hold is this project's most repeated defect — so
   * this pins the four numbers the declaration rests on. A steward lowering the
   * L3 requirement, or setting one at L2, should find this test rather than a
   * document that has quietly become wrong.
   */
  const signoff = (level: number) => (levelEntry(level).signoff ?? {}) as Record<string, unknown>;

  // Reachable alone: a witness with no standing is enough.
  for (const level of [1, 2]) {
    assert.equal(signoff(level).witnessMustHoldLevel ?? null, null, `L${level} requires no held level`);
    assert.notEqual(signoff(level).requiresCredentialedReviewer, true, `L${level} requires no reviewer authority`);
  }

  // Where it stops, and the two gates that stop it.
  assert.equal(signoff(3).witnessMustHoldLevel, 4);
  assert.equal(signoff(3).requiresCredentialedReviewer, true);
  assert.equal(signoff(4).witnessMustHoldLevel, 5);
  assert.equal(signoff(5).witnessMustHoldLevel, 5);

  // The one the reviewer programme will not lift: two unaffiliated signers are
  // two individuals, not two organizations.
  assert.equal(signoff(5).requiresCrossOrganizational, true);
  assert.notEqual(signoff(4).requiresCrossOrganizational, true);
});

test('...and two unaffiliated signers cannot satisfy L5, which is the residue', () => {
  // Correct, and permanent. The rule exists so a closed group cannot certify
  // its own experts, and three unaffiliated people are as closed a group as one
  // laboratory. It means an unaffiliated holder's L5 rests on finding signers
  // who are themselves affiliated.
  const { candidateOrganization, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential(
    {
      ...credential,
      level: 5,
      assessment,
      signers: credential.signers.map((signer) => ({ ...signer, organization: { name: 'Independent' } })),
    },
    REAL_L5,
  );

  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('identifies nobody')),
    `expected two unaffiliated signers to be refused, got: ${JSON.stringify(findings.map((f) => f.message))}`,
  );
});

const REAL_L4 = signoffPolicyFor(levelEntry(4));
const REAL_L5 = signoffPolicyFor(levelEntry(5));

test('the policy is flattened from BOTH blocks, not just signoff', () => {
  // The cost side lives in `assessment` and the signer side in `signoff`. A
  // caller assembling this by hand reaches for the second and forgets the
  // first, which is how these requirements came to be unenforced.
  assert.equal(REAL_L5.signerCount, 2);
  assert.equal(REAL_L5.minExperienceHours, 1000);
  assert.equal(REAL_L5.minDaysSincePreviousLevel, 365);
  assert.equal(REAL_L5.requiresMentoring, true);
  assert.equal(REAL_L5.doubleScored, true);
});

test('the worked L4 credential satisfies the real L4 policy', () => {
  assert.deepEqual(errorsOf(checkProven({ ...credential, level: 4 }, REAL_L4)), []);
});

test('THE HEADLINE CASE: L5 the day after L4, no hours, no work product, no mentoring', () => {
  // Everything in this credential except the signers was previously ignored, so
  // this passed. The ladder's cost was documentation.
  const findings = checkCredential(
    {
      ...credential,
      level: 5,
      attainedOn: '2026-08-10',
      assessment: {
        modality: ['reviewer-conducted-defense'],
        candidateOrganization: { name: 'Northfield Calibration', id: 'northfield-cal-2026' },
        activities: [],
        scorerCount: 1,
        previousLevelAttainedOn: '2026-08-09',
      },
      evidence: [],
    },
    REAL_L5,
  );

  const errors = findings.filter((f) => f.level === 'error').map((f) => f.message);
  for (const expected of ['work-product', 'capstone', 'mentoring-record', '1000', 'double-scored', '365']) {
    assert.ok(
      errors.some((m) => m.includes(expected)),
      `expected an error mentioning '${expected}', got: ${JSON.stringify(errors, null, 2)}`,
    );
  }
});

test('the worked experience claim validates against the schema', () => {
  const validate = validatorFor('credential');
  assert.ok(validate(credential), JSON.stringify(validate.errors, null, 2));
});

test('unrecorded experience fails rather than passes unnoticed', () => {
  const { activities, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential({ ...credential, assessment }, REAL_L4);
  assert.ok(findings.some((f) => f.message.includes('records no activities')));
});

test('hours below the threshold are rejected, and the total is DERIVED', () => {
  // Nothing on the credential declares 260. Two copies of one fact drift after
  // an edit, and it is the copy a reader trusts that would be wrong.
  const findings = checkCredential(
    { ...credential, assessment: { ...(credential.assessment as object), activities: ACTIVITIES.slice(0, 2) } },
    REAL_L4,
  );
  assert.ok(
    findings.some((f) => f.message.includes('total 160 hours')),
    `expected the summed total, got: ${JSON.stringify(findings.map((f) => f.message))}`,
  );
});

test('sufficient hours across too few activities are rejected', () => {
  // The point of the threshold: 1000 hours on one repetitive task clears an
  // hours bar and does not show the range the level actually claims.
  const findings = checkCredential(
    {
      ...credential,
      assessment: {
        ...(credential.assessment as object),
        activities: [{ ...ACTIVITIES[0], hours: 5000 }],
      },
    },
    REAL_L4,
  );
  assert.ok(findings.some((f) => f.message.includes('span 1 distinct piece')));
  assert.ok(!findings.some((f) => f.message.includes('total')));
});

test('ONE PIECE OF WORK IS ONE ACTIVITY, however many entries describe it', () => {
  // The inflation a breadth threshold exists to stop, and the thing a declared
  // integer could never have caught: three entries, one id, one job.
  const first = ACTIVITIES[0]!;
  const twice = [
    first,
    { ...ACTIVITIES[1]!, id: first.id },
    { ...ACTIVITIES[2]!, id: first.id },
    ACTIVITIES[3]!,
  ];
  const findings = checkCredential(
    { ...credential, assessment: { ...(credential.assessment as object), activities: twice } },
    REAL_L4,
  );
  assert.ok(findings.some((f) => f.message.includes("lists activity 'ilc-2026-mass-round' 3 times")));
  assert.ok(findings.some((f) => f.message.includes('span 2 distinct piece')));
});

test('an activity that does not say what it demonstrated is refused by the schema', () => {
  // The whole of open decision 19. Hours and an account say what was done; only
  // this says what it showed about THIS element.
  const validate = validatorFor('credential');
  const { demonstrates, ...silent } = ACTIVITIES[0] as Record<string, unknown>;
  assert.equal(
    validate({
      ...credential,
      assessment: { ...(credential.assessment as object), activities: [silent, ...ACTIVITIES.slice(1)] },
    }),
    false,
  );
});

test('two signers who scored once between them do not satisfy double scoring', () => {
  // Scoring is not signing, and the credential must say so in its own field.
  const findings = checkCredential(
    { ...credential, assessment: { ...credential.assessment as object, scorerCount: 1 } },
    REAL_L4,
  );
  assert.ok(
    findings.some((f) => f.message.includes('Scoring is not signing')),
    `expected a double-scoring error, got: ${JSON.stringify(findings)}`,
  );
});

test('a capstone does not stand in for a work product', () => {
  const findings = checkCredential(
    { ...credential, evidence: [{ type: 'capstone', ref: HASH, archivedOn: '2026-07-30', sufficiency: SUFFICIENCY }] },
    REAL_L4,
  );
  assert.ok(findings.some((f) => f.message.includes("type 'work-product'")));
});

test('the waiting period is measured, not assumed', () => {
  const findings = checkCredential(
    {
      ...credential,
      attainedOn: '2026-08-09',
      assessment: { ...credential.assessment as object, previousLevelAttainedOn: '2026-06-09' },
    },
    REAL_L4,
  );
  assert.ok(
    findings.some((f) => f.message.includes('61 day(s) after the previous level')),
    `expected a waiting-period error, got: ${JSON.stringify(findings)}`,
  );
});

/* -- Provenance: who actually stood behind this ---------------------------- */

/**
 * A self-study credential, built to settle the question directly.
 *
 * An external review read `self-study` against "no self-signoff, ever" and
 * concluded the tier could not be honestly issued at all. It can. The witness
 * is real, is not the subject, and has no standing — which is precisely what
 * the tier says. `heldLevel: null` is already legitimate at this level.
 */
const selfStudy: Credential = {
  ...credential,
  level: 1,
  provenanceTier: 'self-study',
  assessment: { modality: ['open-resource-parameterized'] },
  // Single custody, and that is the honest arrangement rather than a defect:
  // there is no laboratory here, so nobody owes §6.2 a retention schedule.
  custody: [{ custodian: HOLDER, role: 'holder', since: '2026-08-09' }],
  evidence: [],
  // A former supervisor who agreed to watch. No credential, no reviewer
  // authority, no organization standing behind them.
  signers: [{ did: REVIEWER_A, heldLevel: null }],
  issuer: { did: REVIEWER_A },
};

test('A SELF-STUDY CREDENTIAL IS ISSUABLE, and the tier is about the witness\'s standing', () => {
  // The claimed structural impossibility. The person with no employer and no
  // professional network earns and holds something real; the tier records that
  // nobody with standing stood behind it. That is the entry-barrier principle
  // working, not a hole in it.
  const validate = validatorFor('credential');
  assert.ok(validate(selfStudy), JSON.stringify(validate.errors, null, 2));
  assert.deepEqual(checkCredential(selfStudy, signoffPolicyFor(levelEntry(1))), []);
  assert.equal(highestSupportedTier(selfStudy), 'self-study');
});

test('a self-study credential still may not be signed by its own subject', () => {
  // The tier changes who must have standing. It changes nothing about the one
  // rule that has no exception.
  const findings = checkCredential({ ...selfStudy, signers: [{ did: HOLDER, heldLevel: null }] });
  assert.ok(findings.some((f) => f.message.includes('No self-signoff')));
});

test('an unbacked signer claim does not lift the tier above self-study', () => {
  // This is what gives the "Asserted, not proven" warning consequences. Saying
  // you are an L5 credentialed reviewer is not evidence that you are one.
  const asserted: Credential = {
    ...selfStudy,
    signers: [{ did: REVIEWER_A, heldLevel: 5, credentialedReviewer: true }],
  };
  assert.equal(highestSupportedTier(asserted), 'self-study');

  const findings = checkProvenanceTier({ ...asserted, provenanceTier: 'peer-reviewed' });
  assert.ok(
    findings.some((f) => f.message.includes('asserted rather than backed')),
    `expected an overstatement error, got: ${JSON.stringify(findings)}`,
  );
});

test('an evidenced authority chain reaches peer-reviewed', () => {
  const backed: Credential = { ...selfStudy, signers: [credential.signers[0]!], issuer: { did: REVIEWER_A } };
  assert.equal(highestSupportedTier(backed), 'peer-reviewed');
});

test('a founding-cohort basis also counts as evidenced standing', () => {
  // They hold no credential by definition; the bootstrap basis is the evidence,
  // and it is stated per signer so a reader can weigh it.
  const bootstrapped: Credential = { ...selfStudy, signers: [FOUNDER], issuer: { did: REVIEWER_A } };
  assert.equal(highestSupportedTier(bootstrapped), 'peer-reviewed');
});

test('a registered issuer is what separates organization from peer-reviewed', () => {
  const peer: Credential = { ...credential, issuer: { did: REVIEWER_A } };
  assert.equal(highestSupportedTier(peer), 'peer-reviewed');
  assert.equal(highestSupportedTier(credential), 'organization');

  const findings = checkProvenanceTier({ ...peer, provenanceTier: 'organization' });
  assert.ok(findings.some((f) => f.message.includes('registered entity')));
});

test('accredited-body requires the issuer to record its OWN accreditation', () => {
  assert.equal(
    highestSupportedTier({
      ...credential,
      issuer: { ...credential.issuer!, accreditationRecognition: 'Schedule of Accreditation 1234, dimensional' },
    }),
    'accredited-body',
  );

  const findings = checkProvenanceTier({ ...credential, provenanceTier: 'accredited-body' });
  assert.ok(findings.some((f) => f.message.includes('no accreditation of its own')));
});

test('the authority tier cannot be claimed by anybody, because no such issuer exists', () => {
  const findings = checkProvenanceTier({ ...credential, provenanceTier: 'authority' });
  assert.ok(
    findings.some((f) => f.message.includes('open decision 4')),
    `expected an authority-tier refusal, got: ${JSON.stringify(findings)}`,
  );
});

test('understating the tier is permitted and silent', () => {
  // Claiming less than you can prove misleads nobody, and an organization with
  // house rules about when it puts its name to something is not this
  // validator's business.
  assert.equal(highestSupportedTier(credential), 'organization');
  assert.deepEqual(checkProvenanceTier({ ...credential, provenanceTier: 'self-study' }), []);
});

test('the tier check runs from inside checkCredential, not only when remembered', () => {
  // provenanceTier was read by nothing at all. A check that depends on a caller
  // remembering it is how that happens.
  const findings = checkCredential({ ...credential, provenanceTier: 'accredited-body' });
  assert.ok(findings.some((f) => f.message.includes("claims the 'accredited-body' provenance tier")));
});

test('L1 sets no cost requirements, so none are imposed', () => {
  // The checks must not fire where the ladder does not ask for them: L1 is
  // witnessed observation with no hours, no waiting period and no artifacts.
  const findings = checkCredential(
    {
      ...credential,
      level: 1,
      // Corrected when the tier check landed: this fixture carried
      // `peer-reviewed` from the base credential while dropping to a single
      // witness with no standing, which the tier check rightly rejects.
      provenanceTier: 'self-study',
      assessment: { modality: ['open-resource-parameterized'] },
      evidence: [],
      signers: [{ did: REVIEWER_A, heldLevel: null }],
    },
    signoffPolicyFor(levelEntry(1)),
  );
  assert.deepEqual(findings, []);
});


/* -- Why the evidence was enough ------------------------------------------- */

/*
 * Hashing proves an artifact has not changed. It says nothing about why it was
 * SUFFICIENT. The archive exists so a credential can be independently
 * re-reviewed years later — including by somebody challenging it — and a
 * re-reviewer handed a hash and a date can confirm the artifact is the one
 * submitted while having no way to discover what the reviewer thought it
 * demonstrated. There is nothing there to disagree with.
 */

test('a hashed artifact with no sufficiency decision is refused', () => {
  const findings = checkCredential(
    { ...credential, evidence: [{ type: 'work-product', ref: HASH, archivedOn: '2026-06-18' }] },
    REAL_L5,
  );
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('no sufficiency decision')),
    `expected an unexplained artifact to be refused, got: ${JSON.stringify(findings)}`,
  );
});

test('a sufficiency decision by somebody who did not sign is refused', () => {
  // It would sit on the credential reading as though it carried the weight of
  // the signature beside it, with nothing on the document saying otherwise.
  const outsider = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
  const findings = checkCredential(
    {
      ...credential,
      evidence: [
        { type: 'capstone', ref: HASH, archivedOn: '2026-07-30', sufficiency: SUFFICIENCY },
        {
          type: 'work-product',
          ref: HASH,
          archivedOn: '2026-06-18',
          sufficiency: { ...SUFFICIENCY, decidedBy: outsider },
        },
      ],
    },
    REAL_L5,
  );
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('is not among the signers')),
    `expected an outsider's judgement to be refused, got: ${JSON.stringify(findings)}`,
  );
});

test('an attempt pointer needs no sufficiency rationale', () => {
  // A ledger pointer records what happened rather than an artifact somebody
  // decided was enough. Requiring a rationale there would reliably produce a
  // sentence written to satisfy a validator, which is worse than silence.
  const findings = checkEvidenceSufficiency({
    ...credential,
    evidence: [{ type: 'attempt', ref: HASH, archivedOn: '2026-06-18' }],
  });
  assert.deepEqual(findings, []);
});


test("a wallet export carries the holder's own answers, and only for what it exports", () => {
  // The exact opposite of an authorization, from the same principle read the
  // same way: the organization's grant never travels, and the holder's account
  // of their own record always does. A wallet without them exports one in which
  // every revocation is the issuer's word and nothing else.
  const mine = { credential: credential.id, basis: 'disputes-facts' };
  const somebodyElses = { credential: 'urn:uuid:not-in-this-wallet', basis: 'disputes-facts' };

  const wallet = walletExport([credential], [], [mine, somebodyElses]);
  assert.deepEqual(wallet.counterStatements, [mine]);
  assert.deepEqual(wallet.authorizations, []);
});


/* -- One activity, described the same way everywhere it is claimed --------- */

/*
 * The payoff of giving an activity an id at all. Decision 37 is right that one
 * piece of work credits every element it genuinely exercised, so the same
 * activity legitimately appears on several credentials — and the failure it
 * opens lives BETWEEN them, where no single document looks wrong.
 */

const other = (activities: ExperienceActivity[]) => ({
  ...credential,
  id: 'urn:uuid:9c8b7a65-4321-4f6a-9b2c-7e1d0a3f5b8c',
  element: 'CM-03-052',
  assessment: { ...(credential.assessment as object), activities },
});

test('THE SAME WORK ON TWO CREDENTIALS IS NOT A FINDING — that is decision 37', () => {
  // What differs between them is `demonstrates`, and it is never compared.
  const elsewhere = ACTIVITIES.map((a) => ({
    ...a,
    demonstrates:
      'Building each budget from the raw records meant deriving every standard uncertainty from the certificates before anything could be combined, which is what this element asks for at L3 and above.',
  }));
  assert.deepEqual(checkExperienceAcrossCredentials([credential, other(elsewhere)]), []);
});

test('hours that grow to meet whichever threshold is in front of them are caught', () => {
  // Ninety hours on the credential that needed sixty, a hundred and forty on
  // the one that needed a hundred and twenty. Each clears its own bar.
  const inflated = ACTIVITIES.map((a, n) => (n === 0 ? { ...a, hours: 140 } : a));
  const findings = checkExperienceAcrossCredentials([credential, other(inflated)]);
  assert.ok(
    findings.some((f) => f.message.includes("activity 'ilc-2026-mass-round'") && f.message.includes('90 hours on one and 140')),
    `expected the inflation to be named, got: ${JSON.stringify(findings)}`,
  );
});

test('an account rewritten to suit the element it is credited to is caught', () => {
  const rewritten = ACTIVITIES.map((a, n) =>
    n === 0
      ? {
          ...a,
          account:
            'Ran the whole of the laboratory mass programme for the year, including the scope extension, the intermediate checks and the customer work across every range on the certificate.',
        }
      : a,
  );
  const findings = checkExperienceAcrossCredentials([credential, other(rewritten)]);
  assert.ok(findings.some((f) => f.message.includes('two different accounts of what the work was')));
});

/* -- What a holder is compelled to disclose -------------------------------- */

/*
 * A calibration laboratory's customer, method and results are the CUSTOMER'S
 * commercial information. `account` used to be required outright, so at L5's
 * five activities the schema compelled several hundred characters describing
 * somebody else's business, on a document built to be handed to a future
 * employer — often that customer's competitor. And nothing can be redacted
 * afterwards: `ecdsa-jcs-2019` canonicalizes the whole document, and the suite
 * that permits selective disclosure works over RDF, which rule 5 forbids.
 */

test('AN ACTIVITY MAY PIN THE RECORD INSTEAD OF DESCRIBING IT', () => {
  const validate = validatorFor('credential');
  const { account, ...pinned } = ACTIVITIES[0] as Record<string, unknown>;
  assert.ok(
    validate({
      ...credential,
      assessment: {
        ...(credential.assessment as object),
        activities: [{ ...pinned, ref: `sha256:${'c'.repeat(64)}` }, ...ACTIVITIES.slice(1)],
      },
    }),
    'an activity with a pinned record and no account should validate',
  );
});

test('...but not omit both, because then it asserts nothing anybody can examine', () => {
  // Which is what open decision 19 was about, and is not undone here.
  const validate = validatorFor('credential');
  const { account, ...bare } = ACTIVITIES[0] as Record<string, unknown>;
  assert.equal(
    validate({
      ...credential,
      assessment: { ...(credential.assessment as object), activities: [bare, ...ACTIVITIES.slice(1)] },
    }),
    false,
  );
});

test('...and `demonstrates` is required either way', () => {
  // The field decision 19 actually exists for. It is written against the
  // element's anchor in the corpus's own vocabulary, so it describes a
  // competence rather than a customer, and it always travels.
  const validate = validatorFor('credential');
  const { demonstrates, ...silent } = ACTIVITIES[0] as Record<string, unknown>;
  assert.equal(
    validate({
      ...credential,
      assessment: {
        ...(credential.assessment as object),
        activities: [{ ...silent, ref: `sha256:${'c'.repeat(64)}` }, ...ACTIVITIES.slice(1)],
      },
    }),
    false,
  );
});

test('RETICENCE ON ONE CREDENTIAL AND NOT ANOTHER IS NOT A CONTRADICTION', () => {
  // A holder at liberty to describe the work in one place and not in another is
  // not contradicting themselves, and reading an absence as a difference would
  // punish exactly the reticence the field was made optional to permit.
  const withAccount = ACTIVITIES;
  const withoutAccount = ACTIVITIES.map((a) => {
    const { account, ...rest } = a as Record<string, unknown>;
    return { ...rest, ref: `sha256:${'d'.repeat(64)}` };
  });
  assert.deepEqual(
    checkExperienceAcrossCredentials([credential, other(withoutAccount as ExperienceActivity[])]),
    [],
  );
  assert.deepEqual(checkExperienceAcrossCredentials([credential, other(withAccount)]), []);
});

test('two different pinned records under one id are two pieces of work', () => {
  // The half that cannot legitimately differ: one job produced one record, and
  // a hash that changes between credentials says the thing pointed at changed.
  const pinned = ACTIVITIES.map((a) => ({ ...a, ref: `sha256:${'e'.repeat(64)}` }));
  const repinned = ACTIVITIES.map((a, n) => ({
    ...a,
    ref: `sha256:${(n === 0 ? 'f' : 'e').repeat(64)}`,
  }));
  const findings = checkExperienceAcrossCredentials([
    { ...credential, assessment: { ...(credential.assessment as object), activities: pinned } },
    other(repinned),
  ]);
  assert.ok(findings.some((f) => f.message.includes('pinning two different records')));
});

test('different work under different ids is exactly what breadth looks like', () => {
  const distinct = ACTIVITIES.map((a) => ({ ...a, id: `${a.id}-b` }));
  assert.deepEqual(checkExperienceAcrossCredentials([credential, other(distinct)]), []);
});
