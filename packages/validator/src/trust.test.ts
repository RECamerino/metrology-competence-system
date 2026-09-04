/**
 * Offline verification guardrails.
 *
 * The scenario these exist for, from an adversarial review: a hiring manager on
 * an air-gapped network receives a wallet and last month's registry on a USB
 * stick. The issuer's key was compromised last week. The signature verifies
 * perfectly and the credential is accepted.
 *
 * That case is NOT fixed here, because it cannot be — an air-gapped verifier
 * cannot learn what happened after their snapshot was cut. What is fixed is
 * that the verdict now says how old the snapshot was and what that age leaves
 * unknowable, instead of returning a bare "verified" that reads as current.
 *
 * The most important test in this file is the one asserting a clean
 * verification still carries its own age.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatorFor } from './schema.ts';
import {
  type TrustRegistry,
  type VerifiableCredential,
  checkRegistryReplacement,
  verifyAgainstRegistry,
} from './trust.ts';

const ISSUER_DID = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
const HOLDER = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const KEY = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1';

const registry: TrustRegistry = {
  schemaVersion: 1,
  issuedOn: '2028-06-01',
  sequence: 12,
  nextExpectedUpdate: '2028-07-01',
  didMethods: ['did:key'],
  issuers: [
    {
      entry: 'northfield-cal-2026',
      did: ISSUER_DID,
      name: 'Northfield Calibration',
      admittedOn: '2026-01-01',
      keys: [{ id: KEY, validFrom: '2026-01-01', status: 'active' }],
    },
  ],
};

const credential: VerifiableCredential = {
  id: 'urn:uuid:3f2b8c1a-5d4e-4f6a-9b2c-7e1d0a3f5b8c',
  subject: HOLDER,
  attainedOn: '2028-05-01',
  issuer: { did: ISSUER_DID, name: 'Northfield Calibration', trustRegistryEntry: 'northfield-cal-2026' },
  proof: { cryptosuite: 'ecdsa-jcs-2019', verificationMethod: KEY },
};

const errorsOf = (findings: { level: string; message: string }[]): string[] =>
  findings.filter((f) => f.level === 'error').map((f) => f.message);

/* -- The shipped registry -------------------------------------------------- */

test('the trust registry schema accepts the shipped, empty snapshot', () => {
  const validate = validatorFor('trust-registry');
  const shipped = { schemaVersion: 1, issuedOn: '2026-08-11', sequence: 0, didMethods: ['did:key'], issuers: [] };
  assert.ok(validate(shipped), JSON.stringify(validate.errors, null, 2));
});

test('a compromised key with no compromise date is rejected by the schema', () => {
  // Without a date there is no way to tell the signatures that predate the
  // breach from the ones that followed it, which is the entire distinction.
  const validate = validatorFor('trust-registry');
  assert.equal(
    validate({
      ...registry,
      issuers: [{ ...registry.issuers[0]!, keys: [{ id: KEY, validFrom: '2026-01-01', status: 'compromised' }] }],
    }),
    false,
  );
});

/* -- Staleness is reported, always ----------------------------------------- */

test('A CLEAN VERIFICATION STILL SAYS WHAT IT WAS DECIDED AGAINST', () => {
  // The actual defect. "Verified" alone presents a month-old answer as a
  // current one and puts the whole weight of the gap on a reader who has not
  // been told there is one.
  const verdict = verifyAgainstRegistry(credential, registry, '2028-06-15');
  assert.deepEqual(verdict.findings, []);
  assert.equal(verdict.basis.registryAgeDays, 14);
  assert.equal(verdict.basis.overdue, false);
  assert.match(verdict.basis.statement, /14 day\(s\) old/);
  assert.match(verdict.basis.statement, /does not appear here/);
});

test('the pathological case: a stale snapshot verifies, and says how stale', () => {
  // The hiring manager with last month's USB. The credential is accepted —
  // correctly, on the evidence available — and the verdict names the window.
  const verdict = verifyAgainstRegistry(credential, registry, '2028-07-05');
  assert.deepEqual(errorsOf(verdict.findings), []);
  assert.equal(verdict.basis.overdue, true);
  assert.ok(verdict.findings.some((f) => f.level === 'warn' && f.message.includes('past its own expected update')));
  assert.match(verdict.basis.statement, /4 day\(s\) past the update/);
});

test('an overdue registry does not refuse to verify', () => {
  // Refusing would strand exactly the air-gapped deployments this design is
  // for. An old registry is still the best available truth there.
  const verdict = verifyAgainstRegistry(credential, registry, '2029-01-01');
  assert.deepEqual(errorsOf(verdict.findings), []);
});

/* -- Key rotation and compromise, which are not the same thing ------------- */

test('ROTATION: a retired key keeps everything it signed before retirement', () => {
  // The whole point of rotating rather than revoking.
  const rotated: TrustRegistry = {
    ...registry,
    issuers: [{
      ...registry.issuers[0]!,
      keys: [{ id: KEY, validFrom: '2026-01-01', status: 'retired', retiredOn: '2028-05-15' }],
    }],
  };
  assert.deepEqual(errorsOf(verifyAgainstRegistry(credential, rotated, '2028-06-15').findings), []);
});

test('ROTATION: a signature dated after retirement is not accepted', () => {
  const rotated: TrustRegistry = {
    ...registry,
    issuers: [{
      ...registry.issuers[0]!,
      keys: [{ id: KEY, validFrom: '2026-01-01', status: 'retired', retiredOn: '2028-04-01' }],
    }],
  };
  const findings = verifyAgainstRegistry(credential, rotated, '2028-06-15').findings;
  assert.ok(errorsOf(findings).some((m) => m.includes('after its signing key was retired')));
});

test('COMPROMISE: a signature made after the breach cannot be trusted', () => {
  const breached: TrustRegistry = {
    ...registry,
    issuers: [{
      ...registry.issuers[0]!,
      keys: [{ id: KEY, validFrom: '2026-01-01', status: 'compromised', compromisedFrom: '2028-04-01' }],
    }],
  };
  const findings = verifyAgainstRegistry(credential, breached, '2028-06-15').findings;
  assert.ok(
    errorsOf(findings).some((m) => m.includes('verifies and proves nothing')),
    `expected a post-compromise rejection, got: ${JSON.stringify(findings)}`,
  );
});

test('COMPROMISE: a signature made BEFORE the breach still stands', () => {
  // Open item 8's explicit requirement — deleting a compromised key must not
  // invalidate credentials legitimately signed with it earlier. Invalidating
  // this one would punish the holder for a breach that happened after they
  // earned it.
  const breached: TrustRegistry = {
    ...registry,
    issuers: [{
      ...registry.issuers[0]!,
      keys: [{ id: KEY, validFrom: '2026-01-01', status: 'compromised', compromisedFrom: '2028-05-20' }],
    }],
  };
  const findings = verifyAgainstRegistry(credential, breached, '2028-06-15').findings;
  assert.deepEqual(errorsOf(findings), []);
  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('predates that and stands')));
});

test('a key never registered is not the same as one since removed', () => {
  // Keys are append-only precisely so this message can be true.
  const findings = verifyAgainstRegistry(
    { ...credential, proof: { ...credential.proof, verificationMethod: `${KEY}-other` } },
    registry,
    '2028-06-15',
  ).findings;
  assert.ok(errorsOf(findings).some((m) => m.includes('append-only')));
});

test('a credential naming no verification method cannot be key-checked', () => {
  const findings = verifyAgainstRegistry({ ...credential, proof: { cryptosuite: 'x' } }, registry, '2028-06-15').findings;
  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('which of the issuer')));
});

/* -- The DID method profile (open item 18) --------------------------------- */

test('a DID method outside the profile is rejected, not silently unverifiable', () => {
  // The credential schema permits any method; this deployment can resolve one.
  // Left unchecked, the offline promise fails at the moment somebody relies on
  // it rather than when the credential was made.
  const findings = verifyAgainstRegistry(
    { ...credential, subject: 'did:ion:EiClaimsToBeResolvable' },
    registry,
    '2028-06-15',
  ).findings;
  assert.ok(
    errorsOf(findings).some((m) => m.includes("DID method 'did:ion'")),
    `expected a profile rejection, got: ${JSON.stringify(findings)}`,
  );
});

/* -- Issuer lifecycle ------------------------------------------------------ */

test('removal stops new issuance and does not unmake old credentials', () => {
  const departed: TrustRegistry = {
    ...registry,
    issuers: [{ ...registry.issuers[0]!, removedOn: '2028-05-15' }],
  };
  assert.deepEqual(errorsOf(verifyAgainstRegistry(credential, departed, '2028-06-15').findings), []);

  const later = { ...credential, attainedOn: '2028-05-20' };
  assert.ok(
    errorsOf(verifyAgainstRegistry(later, departed, '2028-06-15').findings).some((m) => m.includes('after')),
  );
});

test('an unknown issuer says the snapshot age is what distinguishes the two cases', () => {
  const findings = verifyAgainstRegistry(credential, { ...registry, issuers: [] }, '2028-06-15').findings;
  assert.ok(errorsOf(findings).some((m) => m.includes('predates their admission')));
});

/* -- Revocation, distributed with the registry ----------------------------- */

test('a revoked credential is caught from the registry, with no call to the issuer', () => {
  const withRevocation: TrustRegistry = {
    ...registry,
    revocations: [{ credential: credential.id, revokedOn: '2028-05-20', reason: 'fraud' }],
  };
  const findings = verifyAgainstRegistry(credential, withRevocation, '2028-06-15').findings;
  assert.ok(errorsOf(findings).some((m) => m.includes('was revoked on 2028-05-20')));
});

/* -- Rollback needs no forgery --------------------------------------------- */

test('an older snapshot may not replace a newer one', () => {
  // A courier or a mirror handing over yesterday's registry discards every
  // revocation and compromise recorded since, and breaks no signature doing it.
  const older: TrustRegistry = { ...registry, sequence: 11, issuedOn: '2028-05-01' };
  const findings = checkRegistryReplacement(registry, older);
  assert.ok(findings.some((f) => f.message.includes('only a helpful courier')));
});

test('a newer snapshot replaces freely', () => {
  const newer: TrustRegistry = { ...registry, sequence: 13, issuedOn: '2028-07-01' };
  assert.deepEqual(checkRegistryReplacement(registry, newer), []);
});

test('two different files claiming one sequence number is an error', () => {
  const forked: TrustRegistry = { ...registry, issuedOn: '2028-06-02' };
  assert.ok(checkRegistryReplacement(registry, forked).some((f) => f.message.includes('not what it says')));
});

/* -- The curve, which the suite identifier cannot state --------------------- */

/*
 * `ecdsa-jcs-2019` names ECDSA and not a curve: the curve is read from the
 * verification method's Multikey. So the P-256 requirement the FIPS argument
 * rests on is enforced by the shape of `publicKeyMultibase` or it is enforced
 * nowhere — and until now it was neither. It was asserted in a `-p256` suffix
 * bolted onto a cryptosuite identifier that no implementation recognises,
 * which is a constraint written where nothing would ever read it.
 *
 * The prefix is RECOMPUTED below rather than pasted from a specification,
 * because it is a claim about the outside world and those are the ones this
 * project has repeatedly found to be wrong.
 */

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const multikey = (header: number[], point: number[]): string => {
  let n = 0n;
  for (const b of [...header, ...point]) n = (n << 8n) | BigInt(b);
  let out = '';
  while (n > 0n) {
    out = BASE58.charAt(Number(n % 58n)) + out;
    n /= 58n;
  }
  return `z${out}`;
};

// multicodec 0x1200 -> varint 0x8024, then a 33-byte compressed point.
const p256 = (tag: number, fill: number) => multikey([0x80, 0x24], [tag, ...Array<number>(32).fill(fill)]);
// multicodec 0x1201 -> varint 0x8124, then a 49-byte compressed point.
const p384 = (tag: number, fill: number) => multikey([0x81, 0x24], [tag, ...Array<number>(48).fill(fill)]);

const registryWithKey = (publicKeyMultibase: string): unknown => ({
  ...registry,
  issuers: [
    {
      entry: 'northfield-cal-2026',
      did: ISSUER_DID,
      name: 'Northfield Calibration',
      admittedOn: '2026-01-01',
      keys: [{ id: KEY, validFrom: '2026-01-01', status: 'active', publicKeyMultibase }],
    },
  ],
});

test('every P-256 multikey is admitted, and the bound is computed not assumed', () => {
  const validate = validatorFor('trust-registry');

  // base58 is order-preserving at a fixed length, so every valid P-256
  // encoding lies between these two extremes. Admitting both ends admits
  // everything in between — which is what makes a prefix check sound rather
  // than a guess that happens to have worked on the examples to hand.
  const lowest = p256(0x02, 0x00);
  const highest = p256(0x03, 0xff);
  // The published example from the ECDSA cryptosuite specification.
  const spec = 'zDnaembgSGUhZULN2Caob4HLJPaxBh92N7rtH21TErzqf8HQo';

  for (const key of [lowest, highest, spec]) {
    assert.equal(key.length, 49, `expected a 49-character P-256 multikey, got ${key}`);
    assert.ok(key.startsWith('zDnae'), `expected the P-256 prefix, got ${key}`);
    assert.ok(validate(registryWithKey(key)), `expected a P-256 multikey to be admitted: ${key}`);
  }
});

test('a key on any other curve is refused, not silently admitted', () => {
  // P-384 is a perfectly good curve and simply is not the one the FIPS
  // argument was made about. Ed25519 is the ecosystem default this project
  // deliberately did not take. Admitting either would make the curve choice
  // documentation rather than a rule, which is what it was until now.
  const validate = validatorFor('trust-registry');
  const ed25519 = 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

  for (const key of [p384(0x02, 0x00), p384(0x03, 0xff), ed25519]) {
    assert.equal(
      validate(registryWithKey(key)),
      false,
      `expected a non-P-256 multikey to be refused: ${key}`,
    );
  }
});
