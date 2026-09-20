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

const layersIn = (state: string, verdict: ReturnType<typeof verifyCredential>) =>
  (Object.keys(verdict.layers) as VerificationLayer[]).filter((l) => verdict.layers[l] === state);

test('A BARE CALL CHECKS ONE LAYER AND SAYS SO IN THE OTHER SIX', () => {
  // The defect: a caller who ran `checkCredential` and nothing else got findings
  // that looked like a complete answer. Now the verdict names what it skipped.
  const verdict = verifyCredential(credential);

  assert.equal(verdict.layers['credential-rules'], 'checked');
  assert.equal(layersIn('not-supplied', verdict).length, 6);
  assert.match(verdict.statement, /^Checked 1 of 7 layers/);
  assert.match(verdict.statement, /A credential is not verified by the checks nobody ran\./);
});

test('every unchecked layer is a FINDING as well as a state', () => {
  // Said twice deliberately. A renderer that shows findings and ignores the
  // layer states must still be unable to present this as verified, and one that
  // reads the states and drops findings must still see it — which is exactly the
  // shape that let a verdict open with the word "Verified".
  const verdict = verifyCredential(credential);
  const unchecked = verdict.findings.filter((f) => f.message.includes('was NOT checked'));
  assert.equal(unchecked.length, 6);
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
