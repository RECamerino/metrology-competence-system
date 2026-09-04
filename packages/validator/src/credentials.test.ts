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
  type Authorization,
  type Credential,
  checkAttestableStatus,
  checkBootstrapAuthority,
  checkCredential,
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
    experienceHours: 260,
    distinctActivities: 4,
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
  // L4 requires a capstone AND a real archived deliverable. The two are not the
  // same artifact: a capstone is assessment work, a work product is the job.
  evidence: [
    { type: 'capstone', ref: HASH, archivedOn: '2026-07-30' },
    { type: 'work-product', ref: HASH, archivedOn: '2026-06-18' },
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
        { basis: 'held-level', credentialId: 'urn:uuid:11111111-1111-4111-8111-111111111111', credentialRef: HASH },
        { basis: 'reviewer-authority', credentialId: 'urn:uuid:22222222-2222-4222-8222-222222222222', credentialRef: HASH },
      ],
    },
    {
      did: REVIEWER_B,
      heldLevel: 5,
      credentialedReviewer: true,
      organization: { name: 'Ardleigh Metrology', id: 'ardleigh-met-2025' },
      authority: [
        { basis: 'held-level', credentialId: 'urn:uuid:33333333-3333-4333-8333-333333333333', credentialRef: HASH },
        { basis: 'reviewer-authority', credentialId: 'urn:uuid:44444444-4444-4444-8444-444444444444', credentialRef: HASH },
      ],
    },
  ],
  issuer: { did: REVIEWER_A, name: 'Northfield Calibration', trustRegistryEntry: 'northfield-cal-2026' },
  portable: true,
  proof: { cryptosuite: 'ecdsa-jcs-2019' },
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

test('a well-formed L5 signoff passes its policy', () => {
  assert.deepEqual(checkCredential(credential, L5_POLICY), []);
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

/* -- Cross-organizational signing, as written rather than approximated ----- */

test('a signer outside the candidate organization satisfies the rule', () => {
  // Northfield is the candidate's own lab; Ardleigh is not.
  assert.deepEqual(checkCredential(credential, L5_POLICY), []);
});

test('two signers from one EXTERNAL organization also satisfy it', () => {
  // The old check counted distinct signer organizations, which wrongly rejected
  // this: both signers are outside the candidate's organization, which is
  // exactly what the rule asks for.
  const findings = checkCredential(
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
  const findings = checkCredential(
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
  assert.deepEqual(checkCredential(credential, L5_POLICY), []);
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
  assert.deepEqual(checkCredential({ ...credential, level: 4 }, REAL_L4), []);
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
        experienceHours: 0,
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

test('unrecorded experience hours fail rather than pass unnoticed', () => {
  const { experienceHours, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential({ ...credential, assessment }, REAL_L4);
  assert.ok(findings.some((f) => f.message.includes('records none')));
});

test('hours below the threshold are rejected', () => {
  const findings = checkCredential(
    { ...credential, assessment: { ...credential.assessment as object, experienceHours: 199 } },
    REAL_L4,
  );
  assert.ok(findings.some((f) => f.message.includes('records 199 experience hours')));
});

test('unrecorded breadth fails rather than passes unnoticed', () => {
  // Hours alone cannot show range, and L4 asks for both.
  const { distinctActivities, ...assessment } = credential.assessment as Record<string, unknown>;
  const findings = checkCredential({ ...credential, assessment }, REAL_L4);
  assert.ok(findings.some((f) => f.message.includes('distinct activities') && f.message.includes('records none')));
});

test('sufficient hours across too few activities are rejected', () => {
  // The point of the threshold: 1000 hours on one repetitive task clears an
  // hours bar and does not show the range the level actually claims.
  const findings = checkCredential(
    { ...credential, assessment: { ...credential.assessment as object, experienceHours: 5000, distinctActivities: 1 } },
    REAL_L4,
  );
  assert.ok(findings.some((f) => f.message.includes('records 1 distinct activity')));
  assert.ok(!findings.some((f) => f.message.includes('experience hours')));
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
    { ...credential, evidence: [{ type: 'capstone', ref: HASH, archivedOn: '2026-07-30' }] },
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
