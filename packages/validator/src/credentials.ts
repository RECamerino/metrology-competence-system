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

export interface CredentialAssessment {
  modality?: string[];
  archetypes?: string[];
  attemptRef?: string;
  candidateOrganization?: string;
  experienceHours?: number;
  scorerCount?: number;
  previousLevelAttainedOn?: string;
}

export interface CredentialEvidence {
  type: 'work-product' | 'capstone' | 'defense-record' | 'mentoring-record' | 'attempt';
  ref: string;
  archivedOn?: string;
}

export interface Credential {
  id: string;
  subject: string;
  element: string;
  level: number;
  attainedOn?: string;
  assessment?: CredentialAssessment;
  evidence?: CredentialEvidence[];
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

  /**
   * The COST side of the ladder, from the level's `assessment` block.
   *
   * These were stated in proficiency.yaml, hashed into `assessmentPolicyRef`,
   * and enforced by nothing. That is the worst of the three: a credential
   * carrying a pin that says "1000 hours, mentoring, capstone, double-scored"
   * while no code read any of it is not merely unenforced policy — it is a
   * signed artifact asserting compliance with requirements nobody evaluated.
   *
   * Optional because L1 and L2 set none of them, and a caller checking only
   * signoff rules must stay able to.
   */
  minExperienceHours?: number;
  minDaysSincePreviousLevel?: number;
  requiresWorkProduct?: boolean;
  requiresCapstone?: boolean;
  requiresMentoring?: boolean;
  doubleScored?: boolean;
}

/**
 * Flatten one proficiency.yaml level entry into the policy this module applies.
 *
 * The requirements live in two sibling blocks — `signoff` carries who must
 * sign, `assessment` carries what it must have cost — and a caller who
 * assembled the policy by hand would reach for the first and forget the second.
 * That is precisely how the cost side came to be unenforced, so the flattening
 * is done here once rather than at every call site.
 */
export function signoffPolicyFor(levelDefinition: Record<string, unknown>): SignoffPolicy {
  const signoff = (levelDefinition.signoff ?? {}) as Record<string, unknown>;
  const assessment = (levelDefinition.assessment ?? {}) as Record<string, unknown>;

  return {
    signerCount: (signoff.signerCount as number) ?? 1,
    witnessMustHoldLevel: (signoff.witnessMustHoldLevel as number | null) ?? null,
    requiresCredentialedReviewer: signoff.requiresCredentialedReviewer as boolean | undefined,
    requiresCrossOrganizational: signoff.requiresCrossOrganizational as boolean | undefined,
    minExperienceHours: assessment.minExperienceHours as number | undefined,
    minDaysSincePreviousLevel: assessment.minDaysSincePreviousLevel as number | undefined,
    requiresWorkProduct: assessment.requiresWorkProduct as boolean | undefined,
    requiresCapstone: assessment.requiresCapstone as boolean | undefined,
    requiresMentoring: assessment.requiresMentoring as boolean | undefined,
    doubleScored: assessment.doubleScored as boolean | undefined,
  };
}

/** Whole days between two ISO dates. Negative when `later` precedes `earlier`. */
function daysBetween(earlier: string, later: string): number | null {
  const from = Date.parse(`${earlier}T00:00:00Z`);
  const to = Date.parse(`${later}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86_400_000);
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
    // The rule as written is "at least one signer outside the CANDIDATE'S
    // organization". Checking "two distinct signer organizations" instead is
    // sound — with two distinct signer orgs at most one can be the
    // candidate's, so at least one is external — but it is over-strict: it
    // rejects a candidate at A whose two signers both come from B, which
    // satisfies the rule completely.
    //
    // So apply the real rule when the candidate's organization is recorded,
    // and fall back to the approximation when it is not, saying which was
    // used rather than quietly claiming more than was proved.
    const candidateOrg = (credential.assessment as { candidateOrganization?: string } | undefined)
      ?.candidateOrganization;
    const orgs = credential.signers.map((s) => s.organization).filter(Boolean) as string[];

    if (candidateOrg) {
      if (!orgs.some((org) => org !== candidateOrg)) {
        findings.push(
          err(at(`no signer is outside the candidate's organization (${candidateOrg}). This level requires one, so that a closed group cannot certify its own experts.`)),
        );
      }
    } else if (new Set(orgs).size < 2) {
      findings.push(
        err(at('every signer is from one organization; this level requires at least one signer outside the candidate\'s own, so that a closed group cannot certify its own experts.')),
      );
    } else {
      findings.push(
        warn(at('cross-organizational signing was checked as "two distinct signer organizations" because the candidate\'s organization is not recorded. That is sound but stricter than the rule; record assessment.candidateOrganization to apply it as written.')),
      );
    }
  }

  // -- What the level had to COST -------------------------------------------
  // Signer rules govern who stood behind the claim. These govern what the
  // candidate had to have done, and absence is an error rather than a warning
  // throughout: proficiency.yaml states these as requirements, the credential
  // pins them into assessmentPolicyRef, and a credential that cannot show it
  // met a requirement it carries is asserting more than was checked. Silence is
  // not evidence of compliance.
  const assessment = (credential.assessment ?? {}) as CredentialAssessment;
  const evidenceTypes = new Set((credential.evidence ?? []).map((e) => e.type));

  const requiredEvidence: Array<[boolean | undefined, CredentialEvidence['type'], string]> = [
    [policy.requiresWorkProduct, 'work-product', 'a real archived deliverable rather than an exam answer'],
    [policy.requiresCapstone, 'capstone', 'a capstone reviewed by the signers'],
    [policy.requiresMentoring, 'mentoring-record', 'evidence of bringing another practitioner to competence in this element'],
  ];

  for (const [required, type, what] of requiredEvidence) {
    if (required && !evidenceTypes.has(type)) {
      findings.push(
        err(at(`level ${credential.level} requires ${what}, and no evidence entry of type '${type}' is present. The requirement is pinned into assessmentPolicyRef, so issuing without it makes the credential assert a bar it did not clear.`)),
      );
    }
  }

  if (typeof policy.minExperienceHours === 'number' && policy.minExperienceHours > 0) {
    const hours = assessment.experienceHours;
    if (typeof hours !== 'number') {
      findings.push(
        err(at(`level ${credential.level} requires at least ${policy.minExperienceHours} experience hours and the credential records none. Record assessment.experienceHours; an unrecorded claim cannot be reviewed, which is the whole point of declaring hours.`)),
      );
    } else if (hours < policy.minExperienceHours) {
      findings.push(
        err(at(`records ${hours} experience hours; level ${credential.level} requires at least ${policy.minExperienceHours}.`)),
      );
    }
  }

  if (policy.doubleScored) {
    const scorers = assessment.scorerCount;
    if (typeof scorers !== 'number') {
      findings.push(
        err(at(`level ${credential.level} is double-scored and the credential does not record how many scorers there were. Record assessment.scorerCount.`)),
      );
    } else if (scorers < 2) {
      findings.push(
        err(at(`records ${scorers} scorer(s); level ${credential.level} is double-scored and requires at least 2. Scoring is not signing — two signers who scored once over do not satisfy this.`)),
      );
    }
  }

  if (typeof policy.minDaysSincePreviousLevel === 'number' && policy.minDaysSincePreviousLevel > 0) {
    const previous = assessment.previousLevelAttainedOn;
    if (!previous) {
      findings.push(
        err(at(`level ${credential.level} requires ${policy.minDaysSincePreviousLevel} days since the previous level was attained, and the credential records no such date. Record assessment.previousLevelAttainedOn.`)),
      );
    } else if (!credential.attainedOn) {
      findings.push(
        err(at('carries a previous-level date but no attainedOn, so the waiting period cannot be computed.')),
      );
    } else {
      const elapsed = daysBetween(previous, credential.attainedOn);
      if (elapsed === null) {
        findings.push(err(at(`cannot parse the dates '${previous}' and '${credential.attainedOn}' to check the waiting period.`)));
      } else if (elapsed < policy.minDaysSincePreviousLevel) {
        findings.push(
          err(at(`was attained ${elapsed} day(s) after the previous level; level ${credential.level} requires at least ${policy.minDaysSincePreviousLevel}. The waiting period exists because the competence at this level is partly accumulated practice, which cannot be compressed by sitting assessments faster.`)),
        );
      }
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
