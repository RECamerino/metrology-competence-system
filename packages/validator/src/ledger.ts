/**
 * Attempt ledger mechanics.
 *
 * Three jobs: append entries so they chain, verify a chain has not been
 * rewritten, and answer whether a given attempt is permitted at all.
 *
 * The design constraint that shapes everything here is that in the Personal
 * edition the candidate owns the machine, the ledger and the signing key.
 * Hash-linking catches edits to the middle of the chain. It cannot catch a
 * holder truncating the tail and continuing from an earlier point, and no
 * amount of local cryptography will, because there is nobody else in the
 * transaction. What fixes history is an EXTERNAL anchor — a head countersigned
 * by someone who is not the holder — and `trustHorizon` reports exactly how
 * far that protection currently reaches.
 *
 * Stated plainly rather than engineered around: an unanchored ledger supports
 * self-study claims and nothing more, which is what the self-study provenance
 * tier already means.
 */

import { sha256Of } from './canonical.ts';
import type { Finding } from './checks.ts';

const err = (message: string): Finding => ({ level: 'error', message });
const warn = (message: string): Finding => ({ level: 'warn', message });

export type AttemptMode = 'practice' | 'assessment' | 'challenge-exam';
export type AttemptOutcome = 'passed' | 'failed' | 'abandoned' | 'voided';

export interface Attempt {
  sequence: number;
  element: string;
  level: number;
  mode: AttemptMode;
  archetype?: string;
  exposureGroup?: string;
  drawHash?: string;
  servedOn: string;
  outcome: AttemptOutcome;
  voidReason?: string;
  score?: number;
  prevHash: string | null;
  hash: string;
}

export interface Anchor {
  head: string;
  attestedBy: string;
  attestedOn: string;
  context?: string;
  signature?: string;
}

export interface Ledger {
  schemaVersion: 1;
  subject: string;
  entries: Attempt[];
  anchors?: Anchor[];
}

/** The hash covers the entry's content AND its prevHash, which is what links the chain. */
export function attemptHash(attempt: Omit<Attempt, 'hash'>): string {
  return sha256Of(attempt);
}

export function head(ledger: Ledger): string | null {
  return ledger.entries.length === 0 ? null : ledger.entries[ledger.entries.length - 1]!.hash;
}

/**
 * Append an attempt, computing its position and links.
 *
 * Returns a new ledger rather than mutating: an append that throws halfway
 * must not leave a half-written chain behind.
 */
export function appendAttempt(
  ledger: Ledger,
  attempt: Omit<Attempt, 'sequence' | 'prevHash' | 'hash'>,
): Ledger {
  const sequence = ledger.entries.length;
  const prevHash = head(ledger);
  const body = { ...attempt, sequence, prevHash };

  return {
    ...ledger,
    entries: [...ledger.entries, { ...body, hash: attemptHash(body) }],
  };
}

/* ------------------------------------------------------------------------ */

/**
 * How much weight the no-retake answer can carry.
 *
 * `anchored` — every entry is at or before a head somebody other than the
 * holder signed, so the absence of a prior attempt is a fact about the record
 * rather than a claim by its owner.
 *
 * `self-asserted` — the tail is beyond the last external anchor. The rule is
 * still applied to what is there; what cannot be established is that what is
 * there is everything.
 */
export type AttemptGuarantee = 'anchored' | 'self-asserted' | 'not-applicable';

export interface AttemptDecision {
  allowed: boolean;
  guarantee: AttemptGuarantee;
  reason?: string;
  /** Present when an allowance rests on an unanchored record. */
  caveat?: string;
}

/**
 * Whether an attempt may be served.
 *
 * The challenge exam is the strict case: one attempt per element and level,
 * ever. It exists so an experienced hire can skip content without pretending
 * they need it, and that offer is only credible if it cannot be farmed.
 * `practice` is deliberately unlimited — rationing learning would punish the
 * people the open-entry principle exists for.
 *
 * WHY THE ANSWER CARRIES ITS OWN PROVENANCE. This function reads the ledger in
 * front of it, and in the Personal edition that ledger is a file the candidate
 * owns. The gap is specific rather than general: a FAILED or ABANDONED
 * challenge produces no credential, therefore no signoff, therefore no anchor —
 * so the one entry a candidate has reason to remove is the one entry nothing
 * else in the system holds a copy of. Truncate it and this function will
 * cheerfully allow a second attempt at a rule that says there is only ever one.
 *
 * Nothing local fixes that, and pretending otherwise would be worse than the
 * hole. What is fixed here is the reporting: a bare `allowed: true` let a
 * caller print "this is your one attempt" over an answer that could not support
 * the sentence. `guarantee` makes the caller handle the distinction, and
 * `checkChallengeProvenance` stops a credential resting on the weak side of it
 * while claiming a tier above self-study.
 */
export function canAttempt(
  ledger: Ledger,
  element: string,
  level: number,
  mode: AttemptMode,
): AttemptDecision {
  if (mode === 'practice') return { allowed: true, guarantee: 'not-applicable' };

  const priorForUnit = ledger.entries.filter(
    (e) => e.element === element && e.level === level && e.outcome !== 'voided',
  );

  if (mode === 'challenge-exam') {
    // How much this answer is worth, whichever way it comes out. A 'yes' from
    // a self-asserted chain means "nothing in the record I was shown says
    // otherwise", which is a different sentence from "this is their first
    // attempt" — and the second is the one a caller will print if the first is
    // not handed to them.
    // `horizon >= 0` is load-bearing, not defensive. Without it an EMPTY ledger
    // reports as anchored — horizon and last index are both -1 — and an empty
    // ledger is the maximally truncated one. Nobody has fixed anything about a
    // history that contains nothing.
    const horizon = trustHorizon(ledger);
    const guarantee: AttemptGuarantee =
      horizon >= 0 && horizon >= ledger.entries.length - 1 ? 'anchored' : 'self-asserted';

    const spent = priorForUnit.find((e) => e.mode === 'challenge-exam');
    if (spent) {
      return {
        allowed: false,
        guarantee,
        reason: `The challenge exam for ${element} at L${level} was attempted on ${spent.servedOn} and the outcome was '${spent.outcome}'. There is one attempt per element and level, and no retake. The ordinary assessment route remains open.`,
      };
    }

    return {
      allowed: true,
      guarantee,
      ...(guarantee === 'self-asserted' && {
        caveat: `No prior challenge attempt appears in this ledger, but its tail is beyond the last external anchor, so that is the holder's own account of their history rather than a fact a counterparty stands behind. A failed challenge produces no credential and therefore no anchor, which is precisely the entry that would be worth removing. Do not present this as a verified first attempt.`,
      }),
    };
  }

  // Ordinary assessment: reattempt is permitted, and a pass does not need
  // repeating. A candidate who already holds the unit is not blocked from
  // practising it, only from re-earning it.
  //
  // `not-applicable` rather than a weaker word, because there is no one-shot
  // promise here to qualify. Truncating a failed ORDINARY attempt buys nothing:
  // reattempting is already allowed. The guarantee only ever meant something
  // for the challenge exam, which is the only route that offers finality.
  if (priorForUnit.some((e) => e.mode === 'assessment' && e.outcome === 'passed')) {
    return {
      allowed: false,
      guarantee: 'not-applicable',
      reason: `${element} at L${level} has already been passed. Reattempting cannot improve a credential that already exists; recertification is the route when it expires.`,
    };
  }

  return { allowed: true, guarantee: 'not-applicable' };
}

/**
 * How many times a candidate has met an archetype, counting an exposure group
 * as one shape. Drives the archetype's `exposureLimit`.
 */
export function exposureCount(ledger: Ledger, archetype: string): number {
  const groupsSeen = new Set<string>();
  let ungrouped = 0;

  for (const entry of ledger.entries) {
    if (entry.archetype !== archetype || entry.mode === 'practice') continue;
    if (entry.exposureGroup) groupsSeen.add(entry.exposureGroup);
    else ungrouped += 1;
  }
  return groupsSeen.size + ungrouped;
}

/* ------------------------------------------------------------------------ */

/**
 * The sequence number up to which history is fixed by somebody other than the
 * holder. Everything after it is self-asserted and can support nothing above a
 * self-study claim.
 *
 * Returns -1 when no valid anchor exists.
 */
export function trustHorizon(ledger: Ledger): number {
  let horizon = -1;

  for (const anchor of ledger.anchors ?? []) {
    // A holder attesting their own history anchors nothing.
    if (anchor.attestedBy === ledger.subject) continue;

    // Nor does an unsigned one. An anchor exists to convert "the holder says
    // this was the head" into something a third party stands behind; without a
    // signature it is another assertion by whoever holds the file, and the
    // holder is the one who can edit it.
    if (!String(anchor.signature ?? '').trim()) continue;

    // A dangling anchor does not move the horizon either — but unlike the two
    // above it is not merely unhelpful, it is EVIDENCE. See dangling anchors
    // in verifyLedger, which reports it.
    const index = ledger.entries.findIndex((e) => e.hash === anchor.head);
    if (index > horizon) horizon = index;
  }
  return horizon;
}

/**
 * Anchors naming a head this chain no longer contains.
 *
 * THIS IS THE ONE CASE WHERE TRUNCATION IS LOCALLY DETECTABLE, and it was being
 * discarded in silence. The schema already promised it: "anything at or before
 * an anchored head cannot be rewritten without invalidating an attestation
 * somebody else signed". Nothing checked the invalidation. `trustHorizon`
 * skipped an unresolvable head as though it were merely uninformative, so a
 * holder who truncated below a previously anchored point produced a ledger that
 * verified clean while carrying, in its own anchors array, a signed statement
 * by somebody else that an entry existed which is no longer there.
 *
 * The holder can of course also delete the anchor. That is the point: they must
 * now delete BOTH, and the anchor is the copy a counterparty also holds. This
 * does not make a self-held ledger trustworthy — nothing local can — it makes
 * the discarded evidence count where it exists.
 */
export function danglingAnchors(ledger: Ledger): Anchor[] {
  const hashes = new Set(ledger.entries.map((e) => e.hash));
  return (ledger.anchors ?? []).filter(
    (a) => a.attestedBy !== ledger.subject && !hashes.has(a.head),
  );
}

/**
 * Check a presented ledger against an attempt reference held by somebody else.
 *
 * This is what actually defeats truncation, and it is why the credential
 * carries `assessment.attemptRef`. The holder can rewrite their own copy
 * freely; what they cannot do is make a rewritten chain contain a hash that a
 * verifier already holds independently, in a credential signed by someone
 * else. The protection lives in the counterparty's copy, not in the holder's.
 */
export function verifyCredentialAttempt(ledger: Ledger, attemptRef: string): Finding[] {
  if (ledger.entries.some((e) => e.hash === attemptRef)) return [];

  return [
    err(
      `${ledger.subject}: the presented ledger does not contain the attempt this credential was issued against (${attemptRef}). Either the ledger has been truncated or the credential belongs to a different one.`,
    ),
  ];
}

/**
 * A credential earned by challenge exam must rest on an attempt somebody else
 * fixed in place.
 *
 * THE LAUNDERING PATH THIS CLOSES. The no-retake rule is the challenge exam's
 * entire value: one attempt, ever, which is what makes "skip the content you
 * already know" a credible offer rather than a farmable one. But a failed
 * attempt produces no credential and so no anchor, and an anchor produced by
 * the SIGNOFF is computed over the chain as it stands at signing time. So:
 *
 *   1. Fail the challenge. 2. Truncate. 3. Retake and pass. 4. Get a signoff,
 *   which anchors the already-truncated chain. 5. Hold a `peer-reviewed`
 *   credential whose distinguishing claim — one attempt — is false, and whose
 *   anchor certifies a history that had the contradicting entry removed before
 *   the anchoring counterparty ever saw it.
 *
 * The signer cannot detect this and neither can the verifier. What both CAN
 * establish is whether the attempt was anchored INDEPENDENTLY of the signoff
 * that used it. If it was not, the no-retake guarantee behind this credential
 * is the holder's own account, and the credential must not claim a provenance
 * tier that says otherwise.
 *
 * That is a real constraint on deployment rather than a validation nicety: it
 * says a challenge exam served entirely by the candidate's own machine, with no
 * counterparty present at the draw, cannot back anything above self-study. The
 * ordinary assessment route is unaffected and remains open at every level.
 */
export function checkChallengeProvenance(
  credential: {
    id: string;
    element: string;
    level: number;
    provenanceTier?: string;
    assessment?: { modality?: string[]; attemptRef?: string };
  },
  ledger: Ledger,
): Finding[] {
  const modality = credential.assessment?.modality ?? [];
  if (!modality.includes('challenge-exam')) return [];

  const findings: Finding[] = [];
  const at = (msg: string) => `${credential.id}: ${msg}`;
  const attemptRef = credential.assessment?.attemptRef;

  if (!attemptRef) {
    return [
      err(at('was earned by challenge exam and carries no assessment.attemptRef. The attempt reference is the only thing that makes "one attempt, no retake" mean anything to anybody but the holder — without it the rule is unfalsifiable.')),
    ];
  }

  const index = ledger.entries.findIndex((e) => e.hash === attemptRef);
  if (index === -1) {
    return [
      err(at(`names an attempt (${attemptRef}) that the presented ledger does not contain. Either the ledger has been truncated or this credential belongs to a different one.`)),
    ];
  }

  const attempt = ledger.entries[index]!;
  if (attempt.mode !== 'challenge-exam') {
    findings.push(
      err(at(`declares the challenge-exam modality but its attemptRef points at a '${attempt.mode}' attempt. The no-retake rule applies to challenge exams alone, so the two must agree.`)),
    );
  }
  if (attempt.element !== credential.element || attempt.level !== credential.level) {
    findings.push(
      err(at(`points at an attempt for ${attempt.element} at L${attempt.level}, but attests ${credential.element} at L${credential.level}.`)),
    );
  }

  // The heart of it: was this attempt fixed by somebody other than the holder?
  if (index > trustHorizon(ledger)) {
    const message = `rests on a challenge attempt that lies beyond the last external anchor. Nobody but the holder stood behind the record at the time it was served, and a failed attempt would have produced no anchor to contradict it — so "one attempt, no retake" is here the holder's own account.`;

    findings.push(
      credential.provenanceTier === 'self-study'
        ? warn(at(`${message} Consistent with the self-study tier, which is what an unanchored record supports.`))
        : err(at(`${message} A credential claiming '${credential.provenanceTier ?? 'an unstated tier'}' asserts that somebody else stood behind this, and on this evidence nobody did. Either anchor the attempt independently of the signoff that used it, or issue at self-study.`)),
    );
  }

  return findings;
}

export function verifyLedger(ledger: Ledger): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${ledger.subject}: ${msg}`;

  let previous: string | null = null;

  for (const [index, entry] of ledger.entries.entries()) {
    if (entry.sequence !== index) {
      findings.push(
        err(at(`entry ${index} carries sequence ${entry.sequence}. Order and sequence disagree, which means the chain has been reordered or an entry removed.`)),
      );
    }

    if (entry.prevHash !== previous) {
      findings.push(
        err(at(`entry ${index} (${entry.element} L${entry.level}) does not link to the entry before it. Everything from here on is unverifiable.`)),
      );
    }

    const { hash, ...body } = entry;
    const recomputed = attemptHash(body);
    if (recomputed !== hash) {
      findings.push(
        err(at(`entry ${index} (${entry.element} L${entry.level}) has been altered — its recorded hash does not match its content.`)),
      );
    }

    if (entry.outcome === 'voided' && !String(entry.voidReason ?? '').trim()) {
      findings.push(
        err(at(`entry ${index} is voided with no reason given. A void with no stated reason is indistinguishable from a quietly erased failure.`)),
      );
    }

    previous = hash;
  }

  // -- The no-retake rule, verified against the record rather than trusted --
  const challengeUnits = new Map<string, number>();
  for (const entry of ledger.entries) {
    if (entry.mode !== 'challenge-exam' || entry.outcome === 'voided') continue;
    const key = `${entry.element}@${entry.level}`;
    const count = (challengeUnits.get(key) ?? 0) + 1;
    challengeUnits.set(key, count);
    if (count > 1) {
      findings.push(
        err(at(`${key} has ${count} challenge-exam attempts. There is one per element and level, with no retake.`)),
      );
    }
  }

  // -- How far the record is actually trustworthy ---------------------------
  const horizon = trustHorizon(ledger);
  const unanchored = ledger.entries.length - 1 - horizon;
  if (unanchored > 0 && ledger.entries.length > 0) {
    findings.push(
      warn(
        at(`${unanchored} entr${unanchored === 1 ? 'y is' : 'ies are'} beyond the last external anchor. The holder controls this machine and these keys, so this portion of the history is self-asserted: it supports self-study claims and cannot support a higher provenance tier.`),
      ),
    );
  }

  const selfAnchors = (ledger.anchors ?? []).filter((a) => a.attestedBy === ledger.subject);
  if (selfAnchors.length > 0) {
    findings.push(
      err(at(`${selfAnchors.length} anchor(s) are attested by the ledger's own subject. Attesting your own history anchors nothing.`)),
    );
  }

  const unsigned = (ledger.anchors ?? []).filter(
    (a) => a.attestedBy !== ledger.subject && !String(a.signature ?? '').trim(),
  );
  if (unsigned.length > 0) {
    findings.push(
      err(at(`${unsigned.length} anchor(s) carry no signature. An unsigned anchor fixes nothing — it is an assertion inside a file the holder controls — and it does not move the trust horizon.`)),
    );
  }

  // -- Truncation, in the one place it leaves a mark ------------------------
  for (const anchor of danglingAnchors(ledger)) {
    findings.push(
      err(
        at(`an anchor signed by ${anchor.attestedBy} on ${anchor.attestedOn} names a head this chain does not contain (${anchor.head}). Somebody who is not the holder attested that entry existed, and it is gone: the chain has been rewritten below an anchored point. If this is instead a partial copy of the ledger, it is not the record — present the whole chain.`),
      ),
    );
  }

  return findings;
}
