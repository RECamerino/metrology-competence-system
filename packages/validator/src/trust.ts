/**
 * Offline verification against a trust registry snapshot.
 *
 * THE PROMISE, AND THE PART OF IT THAT IS NOT ACHIEVABLE. Decision 22: a
 * credential is verified by checking a signature against a signed issuer trust
 * registry distributed as a file. No ledger, no network, no call to the issuer.
 * Air-gapped is the default rather than a variant.
 *
 * A file is a snapshot. An air-gapped verifier holds whichever snapshot reached
 * them, and cannot learn anything that happened afterwards — so a hiring
 * manager on a closed network with last month's USB will accept a credential
 * signed with a key that was compromised last week, and the signature will
 * check out perfectly.
 *
 * "NO NETWORK" AND "FRESH TRUST" CANNOT BOTH BE ABSOLUTE. That is a property of
 * air-gapped operation, not a bug to be engineered away, and any design
 * claiming to deliver both is lying about one of them. This module therefore
 * does not attempt freshness. It makes staleness MEASURABLE and refuses to let
 * a verdict be rendered without it: every result carries the age of the
 * registry it was decided against and what that age leaves unknowable.
 *
 * The defect being fixed is not "the registry can be stale" — it always can be.
 * It is that `verified: true` was reachable with no accompanying statement of
 * what it was verified against, which presents a month-old answer as a current
 * one and puts the whole weight of the gap on a reader who has not been told
 * there is one.
 */

import type { Finding } from './checks.ts';

const err = (message: string): Finding => ({ level: 'error', message });
const warn = (message: string): Finding => ({ level: 'warn', message });

export interface RegistryKey {
  id: string;
  publicKeyMultibase?: string;
  validFrom: string;
  status: 'active' | 'retired' | 'compromised';
  retiredOn?: string;
  compromisedFrom?: string;
}

export interface RegistryIssuer {
  entry: string;
  did: string;
  name: string;
  admittedOn: string;
  removedOn?: string;
  accreditationRecognition?: string;
  keys: RegistryKey[];
}

export interface Revocation {
  credential: string;
  revokedOn: string;
  reason: string;
}

export interface TrustRegistry {
  schemaVersion: 1;
  issuedOn: string;
  sequence: number;
  nextExpectedUpdate?: string;
  didMethods: string[];
  issuers: RegistryIssuer[];
  revocations?: Revocation[];
}

export interface VerifiableCredential {
  id: string;
  subject: string;
  attainedOn?: string;
  issuer?: { did: string; name?: string; trustRegistryEntry?: string };
  proof?: { cryptosuite?: string; verificationMethod?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * What a verification was decided against.
 *
 * Returned alongside the findings rather than folded into them, because a
 * renderer needs to show it even when nothing is wrong. "Verified" on its own
 * is the misleading output; "verified against a registry cut 34 days ago, which
 * was due for replacement 4 days ago" is the true one.
 */
export interface TrustBasis {
  /** Days between the registry snapshot and the date of verification. */
  registryAgeDays: number;
  registryIssuedOn: string;
  registrySequence: number;
  /** True when the snapshot is past the date its own publisher said to replace it. */
  overdue: boolean;
  /**
   * The plain-language statement a verifier must not suppress. Present in every
   * result, including clean ones.
   */
  statement: string;
}

/**
 * The holder's answer to a revocation. Signed by them, held by them, presented
 * by them — see counter-statement.schema.json for why it cannot live in the
 * registry alongside the revocation it answers.
 */
export interface CounterStatement {
  id: string;
  credential: string;
  subject: string;
  answers: { revokedOn: string; reason: string };
  basis: string;
  statement: string;
  signedOn: string;
  proof?: { cryptosuite?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface TrustVerdict {
  findings: Finding[];
  basis: TrustBasis;
}

function days(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

function didMethodOf(did: string): string {
  const parts = did.split(':');
  return parts.length >= 2 ? `did:${parts[1]}` : did;
}

/**
 * Verify a credential against a registry snapshot, as of a given date.
 *
 * `asOf` is passed rather than read from the clock so that verification is
 * reproducible and testable, and so an auditor re-running a decision years
 * later gets the answer that was actually given rather than today's.
 */
/**
 * Is this counter-statement one this credential's holder actually made, about
 * the revocation it claims to answer?
 *
 * It never decides whether the holder is RIGHT. Nothing in this system is
 * competent to adjudicate a dispute between an issuer and a holder, and a field
 * recording an outcome would be read as a verdict by every renderer that met
 * it. What is checkable is narrower and worth checking: that the person
 * speaking is the subject, that the revocation they answer is the one that
 * happened, and that they signed.
 */
export function checkCounterStatement(
  statement: CounterStatement,
  credential: VerifiableCredential,
  revocation: Revocation | undefined,
): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${statement.id}: ${msg}`;

  if (statement.credential !== credential.id) {
    findings.push(err(at(`answers ${statement.credential}, which is not the credential presented (${credential.id}).`)));
    return findings;
  }

  // Nobody speaks for somebody else's record. This is the ownership principle
  // pointing where it always points, and it is the one check that matters most
  // — a counter-statement written by the disputing party would otherwise read
  // exactly like one written by the holder.
  if (statement.subject !== credential.subject) {
    findings.push(
      err(at('is not signed by the subject of the credential it answers. Nobody speaks for somebody else\'s record, least of all the party they are disputing with.')),
    );
  }

  if (!statement.proof?.cryptosuite) {
    findings.push(
      err(at('is unsigned. An unsigned counter-statement is an assertion anybody could have written on the holder\'s behalf.')),
    );
  }

  if (!revocation) {
    findings.push(
      err(at('answers a revocation this registry does not record. A statement against a revocation that has not happened would sit on a live credential implying one had.')),
    );
    return findings;
  }

  if (
    statement.answers?.revokedOn !== revocation.revokedOn ||
    statement.answers?.reason !== revocation.reason
  ) {
    findings.push(
      err(at(`answers a revocation dated ${statement.answers?.revokedOn} for ${statement.answers?.reason}, and the one on record is dated ${revocation.revokedOn} for ${revocation.reason}. An issuer who revokes again on different grounds has not been pre-answered.`)),
    );
  }

  return findings;
}

export function verifyAgainstRegistry(
  credential: VerifiableCredential,
  registry: TrustRegistry,
  asOf: string,
  counterStatements: CounterStatement[] = [],
): TrustVerdict {
  const findings: Finding[] = [];
  const at = (msg: string) => `${credential.id}: ${msg}`;

  const age = days(registry.issuedOn, asOf);
  const overdue = Boolean(registry.nextExpectedUpdate && asOf > registry.nextExpectedUpdate);

  const basis: TrustBasis = {
    registryAgeDays: age,
    registryIssuedOn: registry.issuedOn,
    registrySequence: registry.sequence,
    overdue,
    statement: overdue
      ? `Verified against trust registry #${registry.sequence}, issued ${registry.issuedOn} — ${age} day(s) old, and ${days(registry.nextExpectedUpdate!, asOf)} day(s) past the update it was expected to receive. A key compromised, an issuer removed, or a credential revoked since then does not appear here.`
      : `Verified against trust registry #${registry.sequence}, issued ${registry.issuedOn} — ${age} day(s) old. Anything that changed since then does not appear here.`,
  };

  if (overdue) {
    findings.push(
      warn(at(`the trust registry used is past its own expected update date (${registry.nextExpectedUpdate}). It remains the best available truth in an air gap and verification proceeds, but the window of things it cannot know is now open-ended and growing.`)),
    );
  }

  // -- The DID method profile (open item 18) --------------------------------
  // The credential schema deliberately permits any method, because the Personal
  // edition runs with no server and no registrar. That freedom collides with
  // offline verification: a method needing a network resolver produces a
  // credential this verifier cannot resolve, which is the advertised promise
  // failing at the moment it is relied upon rather than at authoring time.
  for (const [label, did] of [['subject', credential.subject], ['issuer', credential.issuer?.did]] as const) {
    if (!did) continue;
    const method = didMethodOf(did);
    if (!registry.didMethods.includes(method)) {
      findings.push(
        err(at(`the ${label} uses DID method '${method}', which this deployment's verifiers cannot resolve offline. The profile is ${registry.didMethods.join(', ')}. A credential outside it is well-formed and unverifiable here, which is the offline promise failing silently.`)),
      );
    }
  }

  // -- Revocation, distributed with the registry rather than fetched ---------
  const revoked = (registry.revocations ?? []).find((r) => r.credential === credential.id);
  if (revoked) {
    findings.push(
      err(at(`was revoked on ${revoked.revokedOn} (${revoked.reason}), per this registry snapshot. Revocation is for fraud and demonstrable assessment defect; it does not mean the competence was never demonstrated.`)),
    );
  }

  // -- The holder's answer, where they have made one ------------------------
  // IT DOES NOT CHANGE THE VERDICT. The error above stands and the credential
  // stays revoked: a holder's statement that could lift a revocation would make
  // revocation negotiable, and the fraud case is exactly the one that cannot
  // afford that. What it changes is what a reader is told, which is the same
  // shape as drift — a pin that no longer matches does not invalidate anything
  // and does oblige a renderer to say what moved.
  for (const statement of counterStatements) {
    if (statement.credential !== credential.id) continue;

    const problems = checkCounterStatement(statement, credential, revoked);
    if (problems.length > 0) {
      findings.push(...problems);
      continue;
    }

    findings.push(
      warn(at(`the holder has answered this revocation (${statement.basis}, ${statement.signedOn}). It does not lift the revocation and is not adjudicated here; show it to a reader alongside the issuer's grounds, because one party wrote the rest of this record.`)),
    );
  }

  // A verifier resolving only the registry sees only the issuer's account. That
  // asymmetry is real, and saying nothing about it would let a reader take the
  // absence of an answer for the absence of a dispute.
  if (revoked && counterStatements.every((c) => c.credential !== credential.id)) {
    findings.push(
      warn(at('no counter-statement from the holder was presented with this credential. That is not evidence the revocation is uncontested — a counter-statement travels with the holder, and a verifier reading only the registry would never see one.')),
    );
  }

  // -- The issuer ------------------------------------------------------------
  const entry = credential.issuer?.trustRegistryEntry;
  const issuer = registry.issuers.find(
    (i) => (entry && i.entry === entry) || (credential.issuer?.did && i.did === credential.issuer.did),
  );

  if (!issuer) {
    findings.push(
      err(at(`names an issuer this registry does not contain (${entry ?? credential.issuer?.did ?? 'unidentified'}). Either the issuer was never admitted, or this snapshot predates their admission — the age above is what distinguishes those, and only one of them is a problem with the credential.`)),
    );
    return { findings, basis };
  }

  const signedOn = credential.attainedOn;

  if (signedOn) {
    if (signedOn < issuer.admittedOn) {
      findings.push(
        err(at(`is dated ${signedOn}, before ${issuer.name} was admitted to the registry on ${issuer.admittedOn}.`)),
      );
    }
    // Removal stops new issuance and does not unmake old attestations, so this
    // is only a problem for credentials dated after the issuer left.
    if (issuer.removedOn && signedOn > issuer.removedOn) {
      findings.push(
        err(at(`is dated ${signedOn}, after ${issuer.name} was removed from the registry on ${issuer.removedOn}. Credentials they issued while admitted remain valid; this one was not.`)),
      );
    }
  }

  // -- The key ---------------------------------------------------------------
  const methodId = credential.proof?.verificationMethod;
  if (!methodId) {
    findings.push(
      warn(at('carries no proof.verificationMethod, so which of the issuer\'s keys signed it cannot be established. Key rotation and compromise are per-key, so without this a compromised key cannot be told from a sound one.')),
    );
    return { findings, basis };
  }

  const key = issuer.keys.find((k) => k.id === methodId);
  if (!key) {
    findings.push(
      err(at(`was signed with key '${methodId}', which is not among ${issuer.name}'s registered keys. Keys are append-only in the registry precisely so this means "never theirs" rather than "theirs once, since deleted".`)),
    );
    return { findings, basis };
  }

  if (signedOn) {
    if (signedOn < key.validFrom) {
      findings.push(
        err(at(`is dated ${signedOn}, before its signing key became valid on ${key.validFrom}.`)),
      );
    }

    // The distinction open item 8 turns on, and the reason `compromised` and
    // `retired` are not one status.
    if (key.status === 'compromised' && key.compromisedFrom) {
      if (signedOn >= key.compromisedFrom) {
        findings.push(
          err(at(`was signed on ${signedOn} with a key compromised from ${key.compromisedFrom}. The signature verifies and proves nothing: whoever held the key could produce it.`)),
        );
      } else {
        findings.push(
          warn(at(`was signed with a key later compromised, from ${key.compromisedFrom}. This credential predates that and stands — invalidating it would punish the holder for a breach that happened after they earned it.`)),
        );
      }
    }

    if (key.status === 'retired' && key.retiredOn && signedOn > key.retiredOn) {
      findings.push(
        err(at(`is dated ${signedOn}, after its signing key was retired on ${key.retiredOn}. Ordinary rotation leaves earlier signatures valid; it does not permit later ones.`)),
      );
    }
  }

  return { findings, basis };
}

/**
 * Whether a newly presented snapshot may replace one already held.
 *
 * A signed registry cannot be forged, but a courier, a mirror or a helpful
 * colleague can hand a verifier an OLDER snapshot than the one they already
 * have — and every revocation and compromise recorded in between disappears
 * with no signature broken. The sequence number is what makes that visible.
 */
export function checkRegistryReplacement(held: TrustRegistry, presented: TrustRegistry): Finding[] {
  if (presented.sequence > held.sequence) return [];

  if (presented.sequence === held.sequence) {
    return presented.issuedOn === held.issuedOn
      ? []
      : [err(`trust registry #${presented.sequence} was presented with issue date ${presented.issuedOn}, but a snapshot with the same sequence and date ${held.issuedOn} is already held. Two different files claiming one sequence number means one of them is not what it says.`)];
  }

  return [
    err(
      `trust registry #${presented.sequence} (${presented.issuedOn}) is older than #${held.sequence} (${held.issuedOn}), which is already held. Accepting it would silently discard every revocation and key compromise recorded in between — a rollback needs no forgery, only a helpful courier.`,
    ),
  ];
}
