/**
 * Credential and authorization rules that JSON Schema cannot express.
 *
 * Schema validation answers "is this shaped correctly". These answer the two
 * questions that would do real harm if they were left to policy:
 *
 *   1. Did somebody sign their own competence?
 *   2. Did an authorization escape into a portable wallet?
 *
 * Both are enforced here rather than in the Phase 6 engine so that the rule
 * and its tests exist before anything is built against them. A rule enforced
 * only by the code that happens to call it is a rule that fails the first time
 * someone writes a second caller.
 */

import type { Finding } from './checks.ts';

const err = (message: string): Finding => ({ level: 'error', message });
const warn = (message: string): Finding => ({ level: 'warn', message });

export interface BootstrapAuthority {
  basis: string;
  cohort?: string;
  admittedOn?: string;
}

export interface SignerAuthority {
  basis: 'held-level' | 'reviewer-authority';
  credentialId: string;
  credentialRef: string;
}

export interface Signer {
  did: string;
  heldLevel: number | null;
  credentialedReviewer?: boolean;
  organization?: string;
  bootstrapAuthority?: BootstrapAuthority;
  authority?: SignerAuthority[];
}

export interface Credential {
  id: string;
  subject: string;
  element: string;
  level: number;
  signers: Signer[];
  portable: true;
  [key: string]: unknown;
}

export interface Authorization {
  id: string;
  subject: string;
  portable: false;
  walletExportable: false;
  [key: string]: unknown;
}

/**
 * Rules that hold regardless of which level is being attested.
 *
 * The signoff requirements per level live in content/competence/taxonomy/proficiency.yaml
 * and are passed in rather than hardcoded, because that file is
 * steward-controlled and changing it must change behaviour here without a code
 * edit.
 */
export interface SignoffPolicy {
  signerCount: number;
  witnessMustHoldLevel: number | null;
  requiresCredentialedReviewer?: boolean;
  requiresCrossOrganizational?: boolean;
}

export function checkCredential(
  credential: Credential,
  policy?: SignoffPolicy,
): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${credential.id}: ${msg}`;

  // -- No self-signoff, ever ------------------------------------------------
  // The single rule with no exception at any level. A credential the holder
  // signed attests nothing, and one that reaches a verifier devalues every
  // honestly earned credential alongside it.
  if (credential.signers.some((s) => s.did === credential.subject)) {
    findings.push(
      err(at('the subject appears among the signers. No self-signoff, at any level — the signer must be a distinct natural person who witnessed the work.')),
    );
  }

  // Two "independent" signers who are the same person is the same defect
  // wearing a disguise.
  const dids = credential.signers.map((s) => s.did);
  if (new Set(dids).size !== dids.length) {
    findings.push(err(at('the same signer appears more than once. Independent signers must be distinct people.')));
  }

  // -- Is the signer's own standing evidenced, or merely stated? -----------
  // A system built to replace "trust me, he's competent" should not rest on
  // "trust me, I'm an L4 reviewer". Warned rather than rejected because no
  // credentials exist yet to reference, and a founding-cohort signer holds
  // none by definition — this becomes an error once chains can be resolved.
  for (const signer of credential.signers) {
    if (signer.bootstrapAuthority) continue;
    const backed = new Set((signer.authority ?? []).map((a) => a.basis));

    if (typeof signer.heldLevel === 'number' && !backed.has('held-level')) {
      findings.push(
        warn(at(`signer ${signer.did} claims level ${signer.heldLevel} in ${credential.element} with no credential backing it. Asserted, not proven.`)),
      );
    }
    if (signer.credentialedReviewer && !backed.has('reviewer-authority')) {
      findings.push(
        warn(at(`signer ${signer.did} is marked a credentialed reviewer with no reviewer-authority credential referenced. Asserted, not proven.`)),
      );
    }
  }

  if (!policy) return findings;

  if (credential.signers.length < policy.signerCount) {
    findings.push(
      err(at(`has ${credential.signers.length} signer(s); level ${credential.level} requires ${policy.signerCount}.`)),
    );
  }

  if (policy.witnessMustHoldLevel !== null && policy.witnessMustHoldLevel !== undefined) {
    const required = policy.witnessMustHoldLevel;
    const qualified = credential.signers.filter(
      (s) => typeof s.heldLevel === 'number' && s.heldLevel >= required,
    );
    const bootstrapped = credential.signers.filter((s) => s.bootstrapAuthority);

    if (qualified.length === 0 && bootstrapped.length === 0) {
      findings.push(
        err(at(`no signer held level ${required} or above in ${credential.element}. From L3 the signer judges quality rather than merely observing, so they must be at least this competent in the same element.`)),
      );
    } else if (qualified.length === 0) {
      // Accepted, and never silent. The founding cohort exists because the
      // ladder cannot otherwise start, but a bootstrap-signed credential is a
      // weaker claim than a peer-signed one and a reader must be told.
      findings.push(
        warn(at(`signed under founding-cohort authority — no signer held level ${required} in ${credential.element}. Legitimate while the cohort is open; the credential must display this permanently and must not be presented as peer-signed.`)),
      );
    }
  }

  if (policy.requiresCredentialedReviewer && !credential.signers.some((s) => s.credentialedReviewer)) {
    findings.push(
      err(at('no signer holds the reviewer-competence credential, which this level requires.')),
    );
  }

  if (policy.requiresCrossOrganizational) {
    const orgs = new Set(credential.signers.map((s) => s.organization).filter(Boolean));
    if (orgs.size < 2) {
      findings.push(
        err(at('every signer is from one organization; this level requires at least one signer outside the candidate\'s own, so that a closed group cannot certify its own experts.')),
      );
    }
  }

  return findings;
}

/**
 * Whether this credential rests on founding-cohort authority.
 *
 * Derived from the signers rather than stored separately, so the two can never
 * disagree. Every renderer must call this: a bootstrap-signed credential
 * displayed as though it were peer-signed misrepresents the strongest claim
 * the system makes.
 */
export function isBootstrapSigned(credential: Credential): boolean {
  return credential.signers.some((s) => s.bootstrapAuthority !== undefined);
}

/**
 * Whether an element may be attested at this level given its lifecycle status.
 *
 * L1 and L2 are witnessed observation and carry little weight, so a draft
 * element is acceptable. L3 is where independent laboratory work is entrusted,
 * and a badly scoped element does real damage to the person holding the
 * credential — draft means the wording is still being argued about.
 *
 * This also creates the pressure that gets elements promoted out of draft
 * before serious credentials come to depend on them.
 */
export function checkAttestableStatus(
  credential: Pick<Credential, 'id' | 'element' | 'level'>,
  elementStatus: string,
): Finding[] {
  if (credential.level <= 2 || elementStatus === 'stable') return [];

  if (elementStatus === 'deprecated') {
    return [
      err(
        `${credential.id}: ${credential.element} is deprecated and cannot be newly attested. Existing credentials against it stay valid; issue against its successor.`,
      ),
    ];
  }

  return [
    err(
      `${credential.id}: ${credential.element} is '${elementStatus}', and L${credential.level} may only be attested against a 'stable' element. L1 and L2 are witnessed observation and may rest on a draft; from L3 the definition must have stopped moving.`,
    ),
  ];
}

/**
 * The wallet export boundary.
 *
 * THE reason authorization is a separate object. An export that carried
 * authorizations would produce a holder who appears to arrive at a new
 * employer already holding signing authority — and the new employer has no way
 * to tell that the authority died when the person left.
 *
 * Written as a filter rather than a check because a check can be skipped by a
 * caller who forgets it. Nothing can construct a wallet except through here,
 * and nothing that passes through here carries an authorization.
 */
export interface WalletExport {
  credentials: Credential[];
  /** Always empty. Present so the omission is explicit rather than an oversight. */
  authorizations: never[];
  /** Recorded so a reader of the export knows something was withheld, and why. */
  withheld: {
    authorizations: number;
    reason: string;
  };
}

export function walletExport(
  credentials: Credential[],
  authorizations: Authorization[] = [],
): WalletExport {
  return {
    credentials: credentials.filter((c) => c.portable === true),
    authorizations: [],
    withheld: {
      authorizations: authorizations.length,
      reason:
        'Authorizations are granted by an organization, scoped to specific work, and end on departure. They are not portable and are never exported. The competence they were granted on IS in this wallet, as credentials.',
    },
  };
}

/**
 * Reciprocal review inside the blocking window is the commonest way a small
 * group launders competence between its own members. Reported as a warning
 * rather than an error because the legitimate case exists — in a thin domain
 * there may be very few qualified reviewers — but it must never pass silently.
 */
export function checkReciprocity(
  credential: Credential,
  priorSignoffs: Array<{ signer: string; subject: string; on: string }>,
  windowDays: number,
): Finding[] {
  const findings: Finding[] = [];
  const signers = new Set(credential.signers.map((s) => s.did));

  for (const prior of priorSignoffs) {
    if (prior.signer === credential.subject && signers.has(prior.subject)) {
      findings.push(
        warn(
          `${credential.id}: reciprocal review — ${prior.subject} is signing for ${credential.subject}, who signed for them on ${prior.on}, inside the ${windowDays}-day window. Legitimate in a thin domain; record why.`,
        ),
      );
    }
  }
  return findings;
}
