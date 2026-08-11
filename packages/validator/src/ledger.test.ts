/**
 * Attempt ledger guardrails.
 *
 * Two of these tests document a LIMITATION rather than a protection, and they
 * are the most important ones here. A holder who controls the machine can
 * truncate their own chain, and no local mechanism prevents it. The tests below
 * pin down exactly where that stops mattering — the point at which somebody
 * else holds a copy — so that a future change cannot quietly widen the gap
 * while all the tests still pass.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatorFor } from './schema.ts';
import {
  type Ledger,
  appendAttempt,
  canAttempt,
  checkChallengeProvenance,
  danglingAnchors,
  exposureCount,
  head,
  trustHorizon,
  verifyCredentialAttempt,
  verifyLedger,
} from './ledger.ts';

const HOLDER = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const REVIEWER = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

const empty: Ledger = { schemaVersion: 1, subject: HOLDER, entries: [] };

function build(): Ledger {
  let ledger = appendAttempt(empty, {
    element: 'CM-03-036',
    level: 2,
    mode: 'assessment',
    archetype: 'ARC-0001',
    servedOn: '2026-03-01',
    outcome: 'failed',
  });
  ledger = appendAttempt(ledger, {
    element: 'CM-03-036',
    level: 2,
    mode: 'assessment',
    archetype: 'ARC-0001',
    servedOn: '2026-04-01',
    outcome: 'passed',
  });
  ledger = appendAttempt(ledger, {
    element: 'CM-03-046',
    level: 4,
    mode: 'challenge-exam',
    archetype: 'ARC-0002',
    servedOn: '2026-05-01',
    outcome: 'failed',
  });
  return ledger;
}

const errorsOf = (findings: { level: string; message: string }[]): string[] =>
  findings.filter((f) => f.level === 'error').map((f) => f.message);

/* -- Shape and chain ------------------------------------------------------ */

test('a built ledger validates against the schema', () => {
  const validate = validatorFor('attempt-ledger');
  assert.ok(validate(build()), JSON.stringify(validate.errors, null, 2));
});

test('an untampered chain verifies clean', () => {
  assert.deepEqual(errorsOf(verifyLedger(build())), []);
});

test('altering an entry is detected', () => {
  const ledger = build();
  ledger.entries[0]!.outcome = 'passed';
  assert.ok(
    errorsOf(verifyLedger(ledger)).some((e) => e.includes('has been altered')),
    'expected an altered-entry error',
  );
});

test('removing an entry from the middle breaks the chain', () => {
  const ledger = build();
  ledger.entries.splice(1, 1);
  const errors = errorsOf(verifyLedger(ledger));
  assert.ok(
    errors.some((e) => e.includes('does not link')) || errors.some((e) => e.includes('sequence')),
    `expected a broken-link error, got: ${JSON.stringify(errors)}`,
  );
});

/* -- The no-retake rule ---------------------------------------------------- */

test('a second challenge-exam attempt on the same unit is refused', () => {
  const decision = canAttempt(build(), 'CM-03-046', 4, 'challenge-exam');
  assert.equal(decision.allowed, false);
  assert.ok(decision.reason?.includes('no retake'));
});

test('failing the challenge exam leaves the ordinary route open', () => {
  assert.equal(canAttempt(build(), 'CM-03-046', 4, 'assessment').allowed, true);
});

test('an abandoned challenge exam still spends the attempt', () => {
  // Otherwise a candidate reads the paper, walks away, and returns prepared.
  const ledger = appendAttempt(empty, {
    element: 'CM-03-019',
    level: 4,
    mode: 'challenge-exam',
    servedOn: '2026-06-01',
    outcome: 'abandoned',
  });
  assert.equal(canAttempt(ledger, 'CM-03-019', 4, 'challenge-exam').allowed, false);
});

test('a voided attempt does not spend it', () => {
  const ledger = appendAttempt(empty, {
    element: 'CM-03-019',
    level: 4,
    mode: 'challenge-exam',
    servedOn: '2026-06-01',
    outcome: 'voided',
    voidReason: 'Defective item withdrawn after review.',
  });
  assert.equal(canAttempt(ledger, 'CM-03-019', 4, 'challenge-exam').allowed, true);
});

test('a void with no reason is rejected', () => {
  const ledger = appendAttempt(empty, {
    element: 'CM-03-019',
    level: 4,
    mode: 'challenge-exam',
    servedOn: '2026-06-01',
    outcome: 'voided',
  });
  assert.ok(errorsOf(verifyLedger(ledger)).some((e) => e.includes('no reason given')));
});

test('two challenge attempts smuggled into the record are caught on verification', () => {
  let ledger = build();
  ledger = appendAttempt(ledger, {
    element: 'CM-03-046',
    level: 4,
    mode: 'challenge-exam',
    servedOn: '2026-07-01',
    outcome: 'passed',
  });
  assert.ok(
    errorsOf(verifyLedger(ledger)).some((e) => e.includes('one per element and level')),
    'expected the duplicate challenge attempt to be caught',
  );
});

test('practice is unlimited, because rationing learning punishes the wrong people', () => {
  let ledger = build();
  for (let i = 0; i < 5; i++) {
    ledger = appendAttempt(ledger, {
      element: 'CM-03-046',
      level: 4,
      mode: 'practice',
      servedOn: '2026-07-01',
      outcome: 'failed',
    });
  }
  assert.equal(canAttempt(ledger, 'CM-03-046', 4, 'practice').allowed, true);
  assert.deepEqual(errorsOf(verifyLedger(ledger)), []);
});

/* -- Exposure control ------------------------------------------------------ */

test('an exposure group counts as one shape however many bindings served it', () => {
  let ledger = empty;
  for (const element of ['CM-03-036', 'CM-03-038', 'CM-03-041']) {
    ledger = appendAttempt(ledger, {
      element,
      level: 3,
      mode: 'assessment',
      archetype: 'ARC-0001',
      exposureGroup: 'type-b-assignment',
      servedOn: '2026-03-01',
      outcome: 'passed',
    });
  }
  assert.equal(exposureCount(ledger, 'ARC-0001'), 1);
});

test('practice attempts do not consume exposure', () => {
  const ledger = appendAttempt(empty, {
    element: 'CM-03-036',
    level: 2,
    mode: 'practice',
    archetype: 'ARC-0001',
    servedOn: '2026-03-01',
    outcome: 'failed',
  });
  assert.equal(exposureCount(ledger, 'ARC-0001'), 0);
});

/* -- Where the trust actually comes from ----------------------------------- */

test('an unanchored tail is reported as self-asserted rather than passing silently', () => {
  const findings = verifyLedger(build());
  assert.ok(
    findings.some((f) => f.level === 'warn' && f.message.includes('self-asserted')),
    `expected an unanchored warning, got: ${JSON.stringify(findings)}`,
  );
});

test('a holder cannot anchor their own history', () => {
  const ledger = build();
  ledger.anchors = [{ head: head(ledger)!, attestedBy: HOLDER, attestedOn: '2026-05-02' }];
  assert.equal(trustHorizon(ledger), -1);
  assert.ok(errorsOf(verifyLedger(ledger)).some((e) => e.includes('anchors nothing')));
});

test('an external anchor fixes history up to that point', () => {
  const ledger = build();
  ledger.anchors = [
    {
      head: ledger.entries[1]!.hash,
      attestedBy: REVIEWER,
      attestedOn: '2026-04-02',
      context: 'signoff',
      signature: 'z3MqUZ8kExampleSignatureOverTheHead',
    },
  ];
  assert.equal(trustHorizon(ledger), 1);
  assert.deepEqual(errorsOf(verifyLedger(ledger)), []);
});

test('LIMITATION: truncating the tail of a self-held ledger is not locally detectable', () => {
  // Documented deliberately. The holder owns the machine and every key, so a
  // truncated chain is internally consistent and verifies clean. Nothing local
  // can change this, which is why an unanchored ledger supports only
  // self-study claims.
  const ledger = build();
  const truncated: Ledger = { ...ledger, entries: ledger.entries.slice(0, 2) };
  assert.deepEqual(errorsOf(verifyLedger(truncated)), []);
});

test('but truncation is caught the moment somebody else holds a reference', () => {
  // The credential carries assessment.attemptRef, signed by a reviewer who is
  // not the holder. The protection lives in the counterparty's copy.
  const ledger = build();
  const challengeAttempt = ledger.entries[2]!.hash;
  const truncated: Ledger = { ...ledger, entries: ledger.entries.slice(0, 2) };

  assert.deepEqual(verifyCredentialAttempt(ledger, challengeAttempt), []);
  assert.ok(
    errorsOf(verifyCredentialAttempt(truncated, challengeAttempt)).some((e) =>
      e.includes('truncated'),
    ),
  );
});

test('an unsigned anchor fixes nothing, because the holder controls the file', () => {
  const ledger = build();
  ledger.anchors = [
    { head: ledger.entries[1]!.hash, attestedBy: REVIEWER, attestedOn: '2026-04-02' },
  ];
  assert.equal(trustHorizon(ledger), -1, 'an unsigned anchor must not move the horizon');
  assert.ok(errorsOf(verifyLedger(ledger)).some((e) => e.includes('no signature')));
});

/* -- Truncation, where it does leave a mark -------------------------------- */

const SIGNED_ANCHOR = (h: string) => ({
  head: h,
  attestedBy: REVIEWER,
  attestedOn: '2026-04-02',
  context: 'signoff' as const,
  signature: 'z3MqUZ8kExampleSignatureOverTheHead',
});

test('an anchor naming a head the chain no longer contains is truncation evidence', () => {
  // The limitation above stands: a chain truncated below EVERY anchor verifies
  // clean. But truncating below an anchor the holder already has leaves a
  // signed statement by somebody else that an entry existed which is now gone,
  // and that was being discarded in silence.
  const ledger = build();
  const anchored: Ledger = { ...ledger, anchors: [SIGNED_ANCHOR(ledger.entries[2]!.hash)] };
  assert.deepEqual(errorsOf(verifyLedger(anchored)), []);

  const truncated: Ledger = { ...anchored, entries: anchored.entries.slice(0, 2) };
  assert.equal(danglingAnchors(truncated).length, 1);
  assert.ok(
    errorsOf(verifyLedger(truncated)).some((e) => e.includes('rewritten below an anchored point')),
    `expected a dangling-anchor error, got: ${JSON.stringify(verifyLedger(truncated))}`,
  );
});

test('the holder must now delete BOTH the entry and the anchor', () => {
  // Which is the point. The anchor is the copy a counterparty also holds, so
  // removing it is the move that becomes visible to somebody else.
  const ledger = build();
  const scrubbed: Ledger = { ...ledger, entries: ledger.entries.slice(0, 2), anchors: [] };
  assert.deepEqual(errorsOf(verifyLedger(scrubbed)), [], 'still not locally detectable, as documented');
});

/* -- What the no-retake answer is actually worth --------------------------- */

test('a first-attempt allowance on an unanchored ledger is flagged as self-asserted', () => {
  // The specific hole: a FAILED challenge produces no credential, therefore no
  // anchor, so the one entry worth removing is the one nothing else holds.
  const decision = canAttempt(empty, 'CM-03-046', 4, 'challenge-exam');
  assert.equal(decision.allowed, true);
  assert.equal(decision.guarantee, 'self-asserted');
  assert.ok(decision.caveat?.includes('produces no credential'));
});

test('the same allowance on a fully anchored ledger carries the stronger word', () => {
  const ledger = build();
  const anchored: Ledger = { ...ledger, anchors: [SIGNED_ANCHOR(ledger.entries[2]!.hash)] };
  const decision = canAttempt(anchored, 'CM-03-019', 3, 'challenge-exam');
  assert.equal(decision.allowed, true);
  assert.equal(decision.guarantee, 'anchored');
  assert.equal(decision.caveat, undefined);
});

test('practice carries no guarantee claim at all, because no rule applies', () => {
  assert.equal(canAttempt(empty, 'CM-03-046', 4, 'practice').guarantee, 'not-applicable');
});

/* -- A challenge credential may not launder an unanchored attempt ---------- */

function challengeCredential(overrides: Record<string, unknown> = {}) {
  const ledger = build();
  return {
    credential: {
      id: 'urn:uuid:3f2b8c1a-5d4e-4f6a-9b2c-7e1d0a3f5b8c',
      element: 'CM-03-046',
      level: 4,
      provenanceTier: 'peer-reviewed',
      assessment: { modality: ['challenge-exam'], attemptRef: ledger.entries[2]!.hash },
      ...overrides,
    },
    ledger,
  };
}

test('THE LAUNDERING PATH: a peer-reviewed challenge credential on an unanchored attempt is rejected', () => {
  // Fail, truncate, retake, pass, get a signoff — and the signoff anchors the
  // chain as it stands, which is after the contradicting entry was removed. The
  // signer cannot see it. What they CAN establish is that the attempt was never
  // fixed independently of the signoff that used it.
  const { credential, ledger } = challengeCredential();
  const findings = checkChallengeProvenance(credential, ledger);
  assert.ok(
    findings.some((f) => f.level === 'error' && f.message.includes('nobody did')),
    `expected an unanchored-challenge error, got: ${JSON.stringify(findings)}`,
  );
});

test('the same credential at self-study is a warning, because that tier claims no more', () => {
  const { credential, ledger } = challengeCredential({ provenanceTier: 'self-study' });
  const findings = checkChallengeProvenance(credential, ledger);
  assert.deepEqual(errorsOf(findings), []);
  assert.ok(findings.some((f) => f.level === 'warn' && f.message.includes('Consistent with the self-study tier')));
});

test('an independently anchored challenge attempt passes', () => {
  const { credential, ledger } = challengeCredential();
  const anchored: Ledger = { ...ledger, anchors: [SIGNED_ANCHOR(ledger.entries[2]!.hash)] };
  assert.deepEqual(checkChallengeProvenance(credential, anchored), []);
});

test('a challenge credential with no attemptRef is rejected outright', () => {
  const { credential, ledger } = challengeCredential({
    assessment: { modality: ['challenge-exam'] },
  });
  const findings = checkChallengeProvenance(credential, ledger);
  assert.ok(findings.some((f) => f.message.includes('unfalsifiable')));
});

test('an attemptRef pointing at an ordinary assessment is rejected', () => {
  const ledger = build();
  const { credential } = challengeCredential({
    assessment: { modality: ['challenge-exam'], attemptRef: ledger.entries[1]!.hash },
  });
  const findings = checkChallengeProvenance(credential, ledger);
  assert.ok(findings.some((f) => f.message.includes("points at a 'assessment' attempt")));
});

test('an attemptRef for a different unit is rejected', () => {
  const ledger = build();
  const anchored: Ledger = { ...ledger, anchors: [SIGNED_ANCHOR(ledger.entries[2]!.hash)] };
  const { credential } = challengeCredential({ element: 'CM-03-019' });
  const findings = checkChallengeProvenance(credential, anchored);
  assert.ok(findings.some((f) => f.message.includes('but attests CM-03-019')));
});

test('the ordinary assessment route is untouched by any of this', () => {
  // Nothing here narrows the route that does not carry a no-retake promise.
  const { ledger } = challengeCredential();
  const ordinary = { ...challengeCredential().credential, assessment: { modality: ['open-resource-parameterized'] } };
  assert.deepEqual(checkChallengeProvenance(ordinary, ledger), []);
});
