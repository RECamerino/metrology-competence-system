/**
 * One entry point, and a verdict that cannot be read as more than it checked.
 *
 * External review findings A-19 and A-21. The validator had seventeen exported
 * entry points and no authoritative one; six were never composed by anything, so
 * validating a credential meant remembering to call the no-retake rule, the
 * drift check, the trust verdict and three others by hand.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { type VerificationLayer, verifyCredential } from './verify.ts';
import type { TrustRegistry } from './trust.ts';

const HASH = `sha256:${'a'.repeat(64)}`;
const SUBJECT = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const SIGNER = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

const credential = {
  schemaVersion: 1,
  id: 'urn:uuid:4d5e6f70-1111-4111-8111-111111111111',
  subject: SUBJECT,
  element: 'CM-03-053',
  level: 1,
  kind: 'skill',
  assessedAtScope: 'element',
  attainedOn: '2028-01-01',
  provenanceTier: 'self-study',
  assessment: { modality: ['open-resource-parameterized'] },
  definitionRef: HASH,
  assessmentPolicyRef: HASH,
  knowledgeSnapshot: [{ article: 'BOK-0001', section: 's01', sectionRef: HASH }],
  custody: [{ custodian: SUBJECT, role: 'holder', since: '2028-01-01' }],
  signers: [{ did: SIGNER, heldLevel: null }],
  issuer: { did: SIGNER },
  portable: true,
  proof: {
    type: 'DataIntegrityProof',
    cryptosuite: 'ecdsa-jcs-2019',
    proofPurpose: 'assertionMethod',
    verificationMethod: `${SIGNER}#key-1`,
    proofValue: `z${'2'.repeat(87)}`,
  },
} as unknown as Parameters<typeof verifyCredential>[0];

/*
 * An entirely ordinary registry: cut AFTER the credential was attained, which is
 * true of every current snapshot for every credential already in a wallet. That
 * is the shape finding R-04 turns on.
 */
const registry: TrustRegistry = {
  schemaVersion: 1,
  issuedOn: '2028-06-01',
  sequence: 12,
  nextExpectedUpdate: '2028-07-01',
  didMethods: ['did:key'],
  issuers: [
    {
      entry: 'northfield',
      did: SIGNER,
      name: 'Northfield Calibration',
      admittedOn: '2026-01-01',
      keys: [{ id: `${SIGNER}#key-1`, validFrom: '2026-01-01', status: 'active' }],
    },
  ],
};

const layersIn = (state: string, verdict: ReturnType<typeof verifyCredential>) =>
  (Object.keys(verdict.layers) as VerificationLayer[]).filter((l) => verdict.layers[l] === state);

test('A BARE CALL CHECKS ONE LAYER AND SAYS SO IN THE OTHER SEVEN', () => {
  // The defect: a caller who ran `checkCredential` and nothing else got findings
  // that looked like a complete answer. Now the verdict names what it skipped.
  const verdict = verifyCredential(credential);

  assert.equal(verdict.layers['credential-rules'], 'checked');
  assert.equal(layersIn('not-supplied', verdict).length, 7);
  assert.match(verdict.statement, /^Checked 1 of 8 layers/);
  assert.match(verdict.statement, /A credential is not verified by the checks nobody ran\./);
});

test('every unchecked layer is a FINDING as well as a state', () => {
  // Said twice deliberately. A renderer that shows findings and ignores the
  // layer states must still be unable to present this as verified, and one that
  // reads the states and drops findings must still see it — which is exactly the
  // shape that let a verdict open with the word "Verified".
  const verdict = verifyCredential(credential);
  const unchecked = verdict.findings.filter((f) => f.message.includes('was NOT checked'));
  assert.equal(unchecked.length, 7);
  assert.ok(unchecked.every((f) => f.level === 'warn'));
});

test('THE NO-RETAKE RULE RUNS WITHOUT THE CALLER REMEMBERING IT', () => {
  // `verifyCredentialAttempt` and `checkChallengeProvenance` were never composed
  // by anything. Supplying a ledger is now the whole of what a caller does.
  const ledger = {
    schemaVersion: 1,
    subject: SUBJECT,
    entries: [],
  } as unknown as NonNullable<Parameters<typeof verifyCredential>[1]>['ledger'];

  const verdict = verifyCredential(credential, { ledger });
  assert.equal(verdict.layers['attempt-chain'], 'checked');
  assert.deepEqual(
    verdict.findings.filter((f) => f.message.includes('attempt ledger') && f.message.includes('NOT checked')),
    [],
  );
});

test('a layer the caller supplies stops being reported as unchecked', () => {
  const bare = verifyCredential(credential);
  const withWallet = verifyCredential(credential, { wallet: [credential] });

  assert.equal(bare.layers['experience-across-wallet'], 'not-supplied');
  assert.equal(withWallet.layers['experience-across-wallet'], 'checked');
  assert.ok(
    withWallet.findings.filter((f) => f.message.includes('was NOT checked')).length <
      bare.findings.filter((f) => f.message.includes('was NOT checked')).length,
  );
});

/* -- The date the question is asked, and the age of the answer ------------- */

/*
 * External review finding R-04. This composed `verifyAgainstRegistry` with
 * `inputs.asOf ?? credential.attainedOn ?? ''`, and dropped `TrustBasis`
 * entirely from the verdict it returned.
 */

test('A REGISTRY WITH NO DATE TO READ IT AT IS NOT A CHECKED ISSUER LAYER', () => {
  const verdict = verifyCredential(credential, { registry });
  assert.equal(verdict.layers['issuer-trust'], 'not-supplied');
  assert.equal(verdict.basis, undefined);
});

test('...and the reason names the date, because the caller DID supply a registry', () => {
  // The generic sentence says the caller "supplied nothing to check it
  // against", which would send them looking for the thing they already have.
  const verdict = verifyCredential(credential, { registry });
  const finding = verdict.findings.find((f) => f.message.includes('the issuer against a trust registry'));
  assert.ok(finding, 'the layer should still produce a finding, not only a state');
  assert.match(finding.message, /supplied a registry snapshot but not `asOf`/);
  assert.doesNotMatch(finding.message, /supplied nothing to check it against/);
});

test('THE OLD DEFAULT WOULD HAVE REPORTED A NEGATIVE AGE ON AN ORDINARY CALL', () => {
  // `attainedOn` is the date of the answer being questioned, not the date of
  // the question. Substituting it put the registry 152 days in the future.
  const verdict = verifyCredential(credential, { registry, asOf: '2028-06-15' });
  assert.equal(verdict.layers['issuer-trust'], 'checked');
  assert.equal(verdict.basis?.registryAgeDays, 14);
  assert.equal(verdict.basis?.fromTheFuture, false);
});

test('the verdict CARRIES the age, which rule 8c says a verdict may never drop', () => {
  const verdict = verifyCredential(credential, { registry, asOf: '2028-06-15' });
  assert.match(verdict.statement, /14 day\(s\) old/);
  assert.equal(verdict.basis?.registryIssuedOn, '2028-06-01');
});

test('a verdict with no registry claims no age at all', () => {
  const verdict = verifyCredential(credential);
  assert.equal(verdict.basis, undefined);
  assert.doesNotMatch(verdict.statement, /day\(s\) old/);
});

/* -- Revoked on its face, and expired -------------------------------------- */

/*
 * External review finding A-12. Nothing read the credential's OWN `expiresOn`
 * or `status` — only the trust registry's revocation list — so a holder
 * presenting a credential that says on its face that it is revoked, to a
 * verifier with no registry, got a clean answer. `inForce()` had existed for
 * days and was applied to a signer's BACKING credential and never to this one.
 */

const asOf = '2030-01-01';

test('A CREDENTIAL REVOKED ON ITS OWN FACE IS REFUSED WITHOUT ANY REGISTRY', () => {
  const revoked = {
    ...(credential as Record<string, unknown>),
    status: { revoked: true, revokedOn: '2029-01-01', reason: 'fraud' },
  } as typeof credential;

  const verdict = verifyCredential(revoked, { asOf });
  assert.equal(verdict.layers.lifecycle, 'checked');
  assert.ok(
    verdict.findings.some((f) => f.level === 'error' && f.message.includes('on its own face')),
    `expected the revocation to be refused, got: ${JSON.stringify(verdict.findings.map((f) => f.message))}`,
  );
});

test('AN EXPIRED CREDENTIAL IS NOT A FALSE ONE, AND THE FINDING SAYS SO', () => {
  // The schema settles the severity and this follows it rather than deciding
  // again: "An expired credential is not a false one ... verifiers decide what
  // weight to give currency." So it reports, and does not rule.
  const expiring = { ...(credential as Record<string, unknown>), expiresOn: '2029-06-01' } as typeof credential;

  const verdict = verifyCredential(expiring, { asOf });
  const expiry = verdict.findings.filter((f) => f.message.includes('expired on 2029-06-01'));

  assert.equal(expiry.length, 1);
  assert.equal(expiry[0]!.level, 'warn', 'expiry is not invalidity');
  assert.match(expiry[0]!.message, /NOT A FALSE CREDENTIAL/);
  assert.match(expiry[0]!.message, /must not be rendered as current/);
});

test('a caller who does not say WHEN they are asking has not asked', () => {
  // Currency is a question asked at a time. No date, no answer — and the
  // absence is a state and a finding rather than a quiet pass.
  const revoked = {
    ...(credential as Record<string, unknown>),
    status: { revoked: true, revokedOn: '2029-01-01', reason: 'fraud' },
  } as typeof credential;

  const verdict = verifyCredential(revoked);
  assert.equal(verdict.layers.lifecycle, 'not-supplied');
  assert.ok(verdict.findings.some((f) => f.message.includes('revoked or its currency has lapsed') && f.message.includes('NOT checked')));
});

test('a credential current at the reading date reports nothing', () => {
  const live = { ...(credential as Record<string, unknown>), expiresOn: '2031-01-01' } as typeof credential;
  const verdict = verifyCredential(live, { asOf });
  assert.deepEqual(
    verdict.findings.filter((f) => f.message.includes('expired') || f.message.includes('on its own face')),
    [],
  );
});

test('NOT-SUPPLIED IS NEVER SILENTLY A PASS', () => {
  // The single lesson of every fix made against this review, asserted directly:
  // no layer may be absent from the verdict, and none may be absent quietly.
  const verdict = verifyCredential(credential);
  for (const layer of Object.keys(verdict.layers) as VerificationLayer[]) {
    assert.notEqual(verdict.layers[layer], undefined, `${layer} must have a state`);
    if (verdict.layers[layer] === 'not-supplied') {
      assert.ok(
        verdict.findings.some((f) => f.message.includes('NOT checked')),
        `${layer} is not-supplied and must also be a finding`,
      );
    }
  }
});
