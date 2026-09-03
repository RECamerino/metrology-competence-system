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

export interface OrganizationRef {
  name: string;
  id?: string;
}

export interface Signer {
  did: string;
  heldLevel: number | null;
  credentialedReviewer?: boolean;
  organization?: OrganizationRef;
  bootstrapAuthority?: BootstrapAuthority;
  authority?: SignerAuthority[];
}

/*
 * Deciding whether two organizations are the same one.
 *
 * The cross-organizational rule at L5 exists so that a closed group cannot
 * certify its own experts, and it rested on string inequality: two colleagues
 * at one laboratory writing "Northfield Calibration" and "Northfield
 * Calibration Ltd" satisfied it. That is a defect with plausible deniability —
 * it looks like a formatting difference and works like an evasion.
 *
 * Three layers, weakest last, and the validator reports which one decided:
 *
 *   `id` — settles it. Two organizations are the same iff their identifiers are.
 *   normalised `name` — collapses case, punctuation and trailing legal suffixes,
 *   which catches the accidental variant and the lazy one.
 *   nothing — a name that identifies nobody ("Independent", "self") is not an
 *   organization, and two of them are not two organizations.
 *
 * None of this catches an abbreviation or a deliberate rename. That limit is
 * real and is stated rather than papered over: `id` is the only thing that
 * closes it, which is why the finding says when it was absent.
 */

/** Trailing tokens that are corporate form rather than identity. */
const LEGAL_SUFFIXES = new Set([
  'ltd', 'limited', 'llc', 'llp', 'lp', 'inc', 'incorporated', 'corp', 'corporation',
  'co', 'company', 'gmbh', 'mbh', 'ag', 'kg', 'plc', 'sa', 'sas', 'sarl', 'srl', 'spa',
  'bv', 'nv', 'ab', 'oy', 'oyj', 'as', 'asa', 'aps', 'pty', 'kk', 'pte',
]);

/**
 * Names that identify nobody. A person with no organizational affiliation is
 * not a member of an organization called "Independent" — and two such people
 * are two unaffiliated individuals, not two organizations, so they cannot
 * between them satisfy a rule about organizational separation.
 */
const NON_IDENTIFYING = new Set([
  'independent', 'self', 'selfemployed', 'freelance', 'freelancer', 'contractor',
  'consultant', 'none', 'na', 'nil', 'unaffiliated', 'individual', 'private',
  'unknown', 'retired', 'sole trader', 'soletrader',
]);

export function normalizeOrganization(name: string): string {
  const tokens = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // Only trailing suffixes: "Co-ordinate Metrology" must keep its first token.
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1]!)) tokens.pop();
  return tokens.join(' ');
}

/** Whether this reference picks out a particular organization at all. */
export function isIdentifyingOrganization(org?: OrganizationRef): boolean {
  if (!org) return false;
  if (org.id?.trim()) return true;

  const normalized = normalizeOrganization(org.name ?? '');
  return normalized.length > 0 && !NON_IDENTIFYING.has(normalized) && !NON_IDENTIFYING.has(normalized.replace(/\s/g, ''));
}

/** The value two organizations are compared on. */
export function organizationKey(org: OrganizationRef): string {
  return org.id?.trim() ? `id:${org.id.trim()}` : `name:${normalizeOrganization(org.name ?? '')}`;
}

export interface CredentialAssessment {
  modality?: string[];
  archetypes?: string[];
  attemptRef?: string;
  candidateOrganization?: OrganizationRef;
  experienceHours?: number;
  distinctActivities?: number;
  scorerCount?: number;
  previousLevelAttainedOn?: string;
}

export interface CredentialEvidence {
  type: 'work-product' | 'capstone' | 'defense-record' | 'mentoring-record' | 'attempt';
  ref: string;
  archivedOn?: string;
}

export interface CredentialIssuer {
  did: string;
  name?: string;
  trustRegistryEntry?: string;
  accreditationRecognition?: string;
}

export interface Credential {
  id: string;
  subject: string;
  element: string;
  level: number;
  attainedOn?: string;
  provenanceTier?: ProvenanceTier;
  assessment?: CredentialAssessment;
  custody?: CustodyRecord[];
  evidence?: CredentialEvidence[];
  signers: Signer[];
  issuer?: CredentialIssuer;
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

/* -- Provenance: who actually stood behind this --------------------------- */

/**
 * The five tiers, weakest first. Order is the whole point — see
 * `highestSupportedTier`.
 */
export type ProvenanceTier =
  | 'self-study'
  | 'peer-reviewed'
  | 'organization'
  | 'accredited-body'
  | 'authority';

const TIER_ORDER: ProvenanceTier[] = [
  'self-study',
  'peer-reviewed',
  'organization',
  'accredited-body',
  'authority',
];

/**
 * WHAT `self-study` MEANS ON A CREDENTIAL, since it was never written down.
 *
 * An external review read the tier alongside "no self-signoff, ever" and
 * concluded the tier could not be honestly issued at all: the schema demands at
 * least one signer, the validator rejects the subject among them, so who signs
 * a self-study credential?
 *
 * Somebody does. `self-study` describes the STANDING OF THE WITNESS, not their
 * absence. A person with no employer and no professional network studies alone,
 * does the work, and has it witnessed by whoever is available — a colleague, a
 * mentor, a former supervisor. That person is real, is not the subject, and
 * holds no credential and no reviewer authority. `heldLevel: null` is already
 * legitimate at L1 and L2 for exactly this case. The tier records the truth a
 * reader needs: somebody stood behind this, and nobody with standing did.
 *
 * That is issuable, honest, and consistent with the entry-barrier principle. It
 * was only ever a contradiction because the definition lived nowhere.
 *
 * AND THE SEPARATE THING THE SAME WORD WAS DOING. "An unanchored ledger
 * supports self-study claims and nothing more" is a statement about an ATTEMPT
 * RECORD, not about a credential, and reading the two as one sentence produces
 * a genuine confusion. Every credential has a signer; every signoff anchors the
 * ledger. So an unanchored ledger backs no credential AT ALL — not even at this
 * tier. What it supports is a person's own account of their own practice, which
 * is a claim and not an attestation. See ledger.ts.
 */

/**
 * The highest tier this credential's own evidence will carry.
 *
 * Each step up requires something a reader can check, offline, in the document
 * in front of them:
 *
 *   self-study      a signer who is not the subject. The floor, guaranteed by
 *                   the schema and by checkCredential.
 *   peer-reviewed   a signer whose standing is EVIDENCED — an authority chain,
 *                   or founding-cohort admission. An unbacked `heldLevel: 4` or
 *                   `credentialedReviewer: true` does not count, which is what
 *                   gives the "Asserted, not proven" warning consequences.
 *   organization    plus an issuer that is a registered entity rather than a
 *                   person: a name and a trust-registry key a verifier can
 *                   resolve without contacting anybody.
 *   accredited-body plus the issuer's own accreditation, recorded.
 *   authority       never returned. The authority-tier issuer does not exist —
 *                   it needs a neutral foundation with funding and legal
 *                   existence, which is open decision 4 and a roadmap item.
 */
export function highestSupportedTier(credential: Credential): ProvenanceTier {
  const standing = credential.signers.some(
    (s) => s.bootstrapAuthority !== undefined || (s.authority ?? []).length > 0,
  );
  if (!standing) return 'self-study';

  const issuer = credential.issuer;
  if (!issuer?.name?.trim() || !issuer?.trustRegistryEntry?.trim()) return 'peer-reviewed';
  if (!issuer.accreditationRecognition?.trim()) return 'organization';

  return 'accredited-body';
}

/**
 * The tier must not claim more than the document can show.
 *
 * `provenanceTier` was, until now, read by NOTHING. It carries the entire
 * argument for how open entry and rigour coexist — "nothing is blocked, and the
 * difference is legible rather than hidden" — and a credential could assert
 * `accredited-body` with one unevidenced witness and no issuer at all. A tier
 * nobody checks is not legibility; it is a field.
 *
 * Overstating is an error. UNDERSTATING IS NOT, and is deliberately silent: a
 * holder or issuer who claims less than they could prove misleads nobody, and
 * an organization with house rules about when it will claim its own name is
 * making a decision this validator has no business overriding.
 */
export function checkProvenanceTier(credential: Credential): Finding[] {
  const at = (msg: string) => `${credential.id}: ${msg}`;
  const declared = credential.provenanceTier;
  if (!declared) return [];

  if (declared === 'authority') {
    return [
      err(at('claims the `authority` tier. No authority-tier issuer exists — it requires a neutral foundation with funding and legal existence, which is open decision 4 and unbuilt. Nothing may claim it in the meantime.')),
    ];
  }

  const supported = highestSupportedTier(credential);
  if (TIER_ORDER.indexOf(declared) <= TIER_ORDER.indexOf(supported)) return [];

  const reason =
    supported === 'self-study'
      ? 'no signer has evidenced standing — every claim of a held level or reviewer authority on this credential is asserted rather than backed by a credential reference, and a founding-cohort basis is not recorded either'
      : supported === 'peer-reviewed'
        ? 'the issuer is not recorded as a registered entity; a name and a resolvable trust-registry entry are what distinguish an organization standing behind this from an individual'
        : 'the issuer records no accreditation of its own';

  return [
    err(at(`claims the '${declared}' provenance tier, but its own evidence supports '${supported}': ${reason}. The tier is how a reader weighs the claim, so overstating it defeats the purpose of publishing it at all.`)),
  ];
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
  minDistinctActivities?: number;
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
    minDistinctActivities: assessment.minDistinctActivities as number | undefined,
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
  cohort?: BootstrapCohort,
  bootstrapContext?: BootstrapContext,
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

  // Called from inside rather than exported for the caller to remember. The
  // tier needs nothing but the credential itself, and a check that depends on
  // being invoked is how provenanceTier came to be read by nothing at all.
  findings.push(...checkProvenanceTier(credential));

  // Same reasoning. Without a roster this warns rather than passing, so a
  // caller who has one and forgets to pass it is told, and a bootstrap claim is
  // never silently accepted on its own word.
  findings.push(...checkBootstrapAuthority(credential, cohort, bootstrapContext));

  findings.push(...checkCustody(credential));

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
    const candidateOrg = credential.assessment?.candidateOrganization;
    const orgs = credential.signers.map((s) => s.organization).filter(Boolean) as OrganizationRef[];

    // How much the comparison is worth. Identifiers settle identity; names are
    // compared after normalisation, which catches the accidental variant and
    // not a deliberate one.
    const byIdentifier =
      orgs.every((o) => o.id?.trim()) && (!candidateOrg || Boolean(candidateOrg.id?.trim()));

    const nominal = () => {
      if (!byIdentifier) {
        findings.push(
          warn(at('cross-organizational signing was decided by comparing organization NAMES, because at least one party records no identifier. Normalisation collapses case, punctuation and legal suffixes, so "Northfield Calibration Ltd" and "northfield calibration" are one organization — but an abbreviation or a rename is not caught, and at this level that is the difference between a rule and an appearance. Record `id` on each organization.')),
        );
      }
    };

    if (candidateOrg) {
      const candidateKey = organizationKey(candidateOrg);
      const external = orgs.filter((o) => organizationKey(o) !== candidateKey);

      if (external.length === 0) {
        findings.push(
          err(at(`no signer is outside the candidate's organization (${candidateOrg.name}). This level requires one, so that a closed group cannot certify its own experts.`)),
        );
      } else {
        nominal();
      }
    } else {
      // Only organizations that identify somebody can be counted as distinct.
      // Two signers declaring "Independent" and "Self-employed" are two
      // unaffiliated people, not two organizations, and treating them as two
      // satisfied the rule while proving nothing about separation.
      const identifying = orgs.filter((o) => isIdentifyingOrganization(o));
      const distinct = new Set(identifying.map(organizationKey));

      if (distinct.size < 2) {
        const unidentified = orgs.length - identifying.length;
        findings.push(
          err(at(
            unidentified > 0
              ? `cannot establish two distinct signer organizations: ${unidentified} signer(s) record an organization that identifies nobody (for example "independent" or "self-employed"). An unaffiliated signer may well be outside the candidate's organization, but that cannot be shown without recording the candidate's organization — set assessment.candidateOrganization and the rule can be applied as written.`
              : 'every signer is from one organization; this level requires at least one signer outside the candidate\'s own, so that a closed group cannot certify its own experts.',
          )),
        );
      } else {
        findings.push(
          warn(at('cross-organizational signing was checked as "two distinct signer organizations" because the candidate\'s organization is not recorded. That is sound but stricter than the rule; record assessment.candidateOrganization to apply it as written.')),
        );
        nominal();
      }
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

  /*
   * Breadth, which hours cannot express.
   *
   * An hours threshold is satisfied by endurance. LM-14 describes progression
   * as several years of progressively more complex ASSIGNMENTS, and 1000 hours
   * on one repetitive task clears a 1000-hour bar exactly as well as 1000
   * hours across escalating work — at L5, whose whole claim is judgement in
   * cases the holder has not met before.
   *
   * Enforced rather than declared, because a requirement nothing reads is the
   * defect this project has now corrected twice.
   */
  if (typeof policy.minDistinctActivities === 'number' && policy.minDistinctActivities > 0) {
    const activities = assessment.distinctActivities;
    if (typeof activities !== 'number') {
      findings.push(
        err(at(`level ${credential.level} requires experience spanning at least ${policy.minDistinctActivities} distinct activities and the credential records none. Record assessment.distinctActivities; hours alone cannot show breadth.`)),
      );
    } else if (activities < policy.minDistinctActivities) {
      findings.push(
        err(at(`records ${activities} distinct activity/activities; level ${credential.level} requires at least ${policy.minDistinctActivities}. The hours may be sufficient and the range is not — that is the distinction this threshold exists for.`)),
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

/* -- Dual custody, as a record rather than a sentence --------------------- */

export interface CustodyRecord {
  custodian: string;
  role: 'holder' | 'issuing-organization' | 'assessing-organization';
  since: string;
  retentionUntil?: string;
  retentionBasis?: string;
}

/**
 * Who holds a true copy, and under what obligation.
 *
 * Decision 23 said this credential is held in DUAL CUSTODY: the laboratory
 * needs a competence record it can produce at audit under ISO/IEC 17025:2017
 * §6.2, and the individual needs portability. That was a sentence in the schema
 * description and nothing else — a single object with no record of who else
 * held it, so a two-custodian arrangement was a claim the data could neither
 * carry nor contradict.
 *
 * WHAT THIS CANNOT DO. It cannot stop a laboratory purging its copy. Nothing in
 * a file held by somebody else can, and a mechanism that pretended otherwise
 * would be worse than the gap. What it does is make the arrangement legible: a
 * verifier reading the holder's copy after a purge can see that an organization
 * took custody under a retention obligation running to a stated date, so the
 * absence is a failure somebody can name rather than a silence.
 *
 * WHAT IT DOES DO, and it is the half that protects the person. An organization
 * could issue a credential ABOUT somebody, retain it for its own audit file,
 * and never deliver it — leaving a person unable to prove a competence that has
 * been formally attested about them. A holder entry naming the subject is
 * required, so that credential cannot be well-formed.
 *
 * DIVERGENCE NEEDS NOTHING HERE. Two copies that differ in content cannot both
 * verify, because every credential is signed; the cryptography settles it, and
 * a content hash on each custody entry would be a second and weaker answer to a
 * question already answered. What a signature cannot detect is a copy that does
 * not exist, which is exactly what this records.
 */
export function checkCustody(credential: Credential): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${credential.id}: ${msg}`;
  const custody = (credential.custody ?? []) as CustodyRecord[];

  const holders = custody.filter((c) => c.role === 'holder');

  if (holders.length === 0) {
    findings.push(
      err(at('records no holder custody. A credential its own subject does not hold is one they cannot present anywhere — the organization has an audit record and the person has nothing, which inverts what this object is for.')),
    );
  }

  for (const entry of holders) {
    if (entry.custodian !== credential.subject) {
      findings.push(
        err(at(`records a holder custody entry for '${entry.custodian}', who is not the subject. The holder of a credential is the person it is about.`)),
      );
    }
  }

  if (holders.length > 1) {
    findings.push(err(at('records more than one holder. There is one subject and therefore one holder.')));
  }

  // The organization side is required exactly where an organization is
  // standing behind the credential. Below that tier there is no laboratory,
  // no §6.2 obligation, and single custody is the honest arrangement rather
  // than a defect — a self-study credential has nobody to retain anything.
  const supported = highestSupportedTier(credential);
  const organizational = supported === 'organization' || supported === 'accredited-body';

  const organizations = custody.filter((c) => c.role !== 'holder');

  if (organizational && organizations.length === 0) {
    findings.push(
      err(at(`is issued by ${credential.issuer?.name ?? 'an organization'} and records no organizational custody. ISO/IEC 17025:2017 §6.2 requires the laboratory to hold competence records it can produce at audit; if the only copy leaves with the person, the laboratory cannot.`)),
    );
  }

  for (const entry of organizations) {
    if (!entry.retentionUntil) {
      findings.push(
        warn(at(`custodian '${entry.custodian}' records no retention period. ISO/IEC 17025:2017 §8.4 requires records to be retained for a defined period, and an undefined one is a finding waiting to happen.`)),
      );
    } else if (credential.attainedOn && entry.retentionUntil < credential.attainedOn) {
      findings.push(
        err(at(`custodian '${entry.custodian}' records a retention period ending ${entry.retentionUntil}, before the credential was attained on ${credential.attainedOn}. A record retired before it existed is not a retention schedule.`)),
      );
    }
  }

  return findings;
}

/* -- The founding cohort, as a roster rather than an adjective ------------ */

export interface CohortMember {
  did: string;
  name?: string;
  admittedOn: string;
  basis: string;
  scope: string[];
  maxCredentials?: number;
}

export interface BootstrapCohort {
  schemaVersion: 1;
  convenedOn?: string;
  closesOn?: string;
  members: CohortMember[];
}

export interface BootstrapContext {
  /**
   * The element's authoritative domain.
   *
   * Passed in rather than parsed from the element ID, because the ID's prefix
   * records where the element was FIRST created and is historical — rule 1 in
   * CLAUDE.md. Reading `CM-03` out of `CM-03-046` would silently check the
   * wrong domain for any element that has been reorganised.
   */
  elementDomain?: string;
  /** How many credentials each signer has already bootstrap-signed. */
  signedAlready?: Record<string, number>;
}

/**
 * Bootstrap authority, checked against the roster that defines it.
 *
 * DECISION 43 SAID "CLOSED, TIME-LIMITED", AND NEITHER WORD HAD A MECHANISM.
 * `bootstrapAuthority` was a field a signer wrote about themselves: a basis
 * string of at least forty characters, an optional cohort name nothing
 * resolved, and an optional admission date nothing compared to anything. So
 * any signer could join a cohort that had no roster, no convening and no
 * closing date, and a closed cohort anybody can join is not closed.
 *
 * The consequence an external review put plainly: three people could
 * bootstrap-sign each other to L5 across an entire domain in a weekend, every
 * marker correctly displayed, and then be the only people able to sign anybody
 * else as a peer. The markers are permanent, but a market that reads "L5" and
 * skips the annotation is not a market the annotation protects anybody from.
 * The ladder's peer meaning would never start.
 *
 * Four controls, in rough order of how much work they do:
 *
 *   SCOPE. A founder is admitted on standing in a field, and may sign only in
 *   the domains that standing covers. There is no wildcard. This is also the
 *   first principle enforced as code — no single person should hold all of it.
 *
 *   NO SELF-DEALING WITHIN THE COHORT. A member may not be the SUBJECT of a
 *   bootstrap-signed credential. Founders are admitted on external standing and
 *   do not need bootstrap-signed credentials; the authority exists to bring
 *   OTHER people onto the ladder. Decision 43 explicitly rejected the mutual
 *   peer cohort as "structurally the reciprocal-review pattern the
 *   anti-collusion controls exist to detect — a poor founding act for a trust
 *   network", and this is that rejection made executable.
 *
 *   TIME. A signature after `closesOn` is invalid, and one before the member's
 *   own `admittedOn` is too, which stops a credential being backdated into a
 *   period when its signer had no standing.
 *
 *   VOLUME. Enforced when a steward sets `maxCredentials`. The mechanism is
 *   here; the number is a governance judgement this module declines to invent.
 *
 * Credentials signed while the cohort was open stay valid forever and keep
 * their marker. Closing the cohort ends new bootstrap signing; it does not
 * un-happen what was signed.
 */
export function checkBootstrapAuthority(
  credential: Credential,
  cohort?: BootstrapCohort,
  context: BootstrapContext = {},
): Finding[] {
  const bootstrapped = credential.signers.filter((s) => s.bootstrapAuthority);
  if (bootstrapped.length === 0) return [];

  const findings: Finding[] = [];
  const at = (msg: string) => `${credential.id}: ${msg}`;

  if (!cohort) {
    return [
      warn(at('rests on founding-cohort authority, and no cohort roster was presented, so membership could not be verified. The claim is the signer\'s own until it is checked against content/competence/bootstrap-cohort.yaml.')),
    ];
  }

  if (!cohort.closesOn) {
    return [
      err(at('rests on founding-cohort authority, but no cohort has been convened — the roster sets no closing date. Until a steward convenes one, no bootstrap signature is valid.')),
    ];
  }

  const byDid = new Map(cohort.members.map((m) => [m.did, m]));

  // A founder signing a founder is the reciprocal pattern decision 43 rejected
  // when it chose this mechanism over a mutual peer cohort.
  if (byDid.has(credential.subject)) {
    findings.push(
      err(at(`the subject is a founding-cohort member, and a member may not be the subject of a bootstrap-signed credential. They were admitted on external standing and need no bootstrap-signed credential; the authority exists to bring others onto the ladder, not to certify the cohort to itself.`)),
    );
  }

  for (const signer of bootstrapped) {
    const member = byDid.get(signer.did);

    if (!member) {
      findings.push(
        err(at(`signer ${signer.did} claims founding-cohort authority but is not on the roster. Founding standing is resolved against the cohort file, not asserted on the credential — otherwise the cohort is open to anybody willing to write a basis string.`)),
      );
      continue;
    }

    if (credential.attainedOn) {
      if (credential.attainedOn > cohort.closesOn) {
        findings.push(
          err(at(`was attained on ${credential.attainedOn}, after the founding cohort closed on ${cohort.closesOn}. Bootstrap signing has ended; credentials signed before that date remain valid and keep their marker.`)),
        );
      }
      if (credential.attainedOn < member.admittedOn) {
        findings.push(
          err(at(`was attained on ${credential.attainedOn}, before ${signer.did} was admitted to the cohort on ${member.admittedOn}. A signature predating the signer's own standing is backdating.`)),
        );
      }
    }

    if (context.elementDomain) {
      if (!member.scope.includes(context.elementDomain)) {
        findings.push(
          err(at(`signer ${signer.did} bootstrap-signed an element in ${context.elementDomain}, which is outside the scope they were admitted for (${member.scope.join(', ')}). Founding standing is standing in a field, and authority that ran across every domain would contradict the principle that no single person holds all of it.`)),
        );
      }
    } else {
      findings.push(
        warn(at(`the element's domain was not supplied, so the scope of ${signer.did}'s founding authority could not be checked. Pass the element's \`domain\` field — never the ID prefix, which is historical.`)),
      );
    }

    const already = context.signedAlready?.[signer.did];
    if (typeof member.maxCredentials === 'number' && typeof already === 'number' && already >= member.maxCredentials) {
      findings.push(
        err(at(`signer ${signer.did} has already bootstrap-signed ${already} credential(s), reaching the ceiling of ${member.maxCredentials} set for them.`)),
      );
    }

    if (signer.bootstrapAuthority?.basis && signer.bootstrapAuthority.basis !== member.basis) {
      findings.push(
        warn(at(`signer ${signer.did} states a founding basis that does not match the roster. A reader comparing the two will find them disagreeing about what this person was admitted on.`)),
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
