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
  checkCredential,
  checkReciprocity,
  isBootstrapSigned,
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
    candidateOrganization: 'Northfield Calibration',
    experienceHours: 260,
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
      organization: 'Northfield Calibration',
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
      organization: 'Ardleigh Metrology',
      authority: [
        { basis: 'held-level', credentialId: 'urn:uuid:33333333-3333-4333-8333-333333333333', credentialRef: HASH },
        { basis: 'reviewer-authority', credentialId: 'urn:uuid:44444444-4444-4444-8444-444444444444', credentialRef: HASH },
      ],
    },
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

/* -- Bootstrapping the ladder ---------------------------------------------- */

const FOUNDER = {
  did: 'did:key:z6MkfrQabcTHRVNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsd',
  heldLevel: null,
  credentialedReviewer: true,
  organization: 'National Physical Standards',
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
      signers: credential.signers.map((s) => ({ ...s, organization: 'Ardleigh Metrology' })),
    },
    L5_POLICY,
  );
  assert.deepEqual(findings.filter((f) => f.level === 'error'), []);
});

test('signers drawn only from the candidate organization are rejected', () => {
  const findings = checkCredential(
    {
      ...credential,
      signers: credential.signers.map((s) => ({ ...s, organization: 'Northfield Calibration' })),
    },
    L5_POLICY,
  );
  assert.ok(
    findings.some((f) => f.message.includes("outside the candidate's organization")),
    `expected a closed-group error, got: ${JSON.stringify(findings)}`,
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
        candidateOrganization: 'Northfield Calibration',
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

test('L1 sets no cost requirements, so none are imposed', () => {
  // The checks must not fire where the ladder does not ask for them: L1 is
  // witnessed observation with no hours, no waiting period and no artifacts.
  const findings = checkCredential(
    {
      ...credential,
      level: 1,
      assessment: { modality: ['open-resource-parameterized'] },
      evidence: [],
      signers: [{ did: REVIEWER_A, heldLevel: null }],
    },
    signoffPolicyFor(levelEntry(1)),
  );
  assert.deepEqual(findings, []);
});
