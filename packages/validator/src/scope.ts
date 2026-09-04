/**
 * Gap analysis: what competence a person is short of, and what they are not.
 *
 * Two artifacts meet here and neither is sufficient alone.
 *
 *   roleTargets, on the element, state the MINIMUM level a role requires for
 *   that element — normative, not descriptive, and not an aspiration. They do
 *   NOT state that the element applies to any particular person.
 *
 *   A deployment scope states which elements apply to this person in this role.
 *   It comes from an appointment, or from the person's own declaration in the
 *   Personal edition. The corpus does not and should not know it.
 *
 * The rule that matters, and the reason this module exists rather than a
 * one-line filter somewhere in a dashboard: AN ELEMENT OUTSIDE SCOPE CANNOT
 * PRODUCE A GAP. Not a small gap, not a deprioritised one — none. Without that,
 * a calibration engineer is shown a deficiency in every domain the corpus
 * covers, the dashboard becomes noise, and the first thing anyone does is stop
 * reading it.
 */

import type { Finding } from './checks.ts';
import { sha256Of } from './canonical.ts';
import { type Corpus, indexStubs } from './corpus.ts';

export interface ScopeSelectors {
  domains?: string[];
  areas?: string[];
  elements?: string[];
}

export interface DeploymentScope {
  schemaVersion: 1;
  subject: string;
  /** An OCCUPATIONAL role. Authority overlays go in `overlays`. */
  role: string;
  /** Authority overlays carried on top of the occupational role. */
  overlays?: string[];
  includes: ScopeSelectors;
  excludes?: Omit<ScopeSelectors, 'domains'>;
  effectiveFrom?: string;
  effectiveTo?: string;
  [key: string]: unknown;
}

export interface ElementStubLike {
  id: string;
  domain: string;
  competencyArea: string;
}

/**
 * Is this element inside the scope?
 *
 * Includes are unioned, then excludes are removed. Exclusion wins, because the
 * common phrasing is "this whole domain except the part we subcontract" and the
 * exception is the deliberate part.
 */
export function inScope(element: ElementStubLike, scope: DeploymentScope): boolean {
  const included =
    (scope.includes.domains ?? []).includes(element.domain) ||
    (scope.includes.areas ?? []).includes(element.competencyArea) ||
    (scope.includes.elements ?? []).includes(element.id);

  if (!included) return false;

  const excluded =
    (scope.excludes?.areas ?? []).includes(element.competencyArea) ||
    (scope.excludes?.elements ?? []).includes(element.id);

  return !excluded;
}

export interface Gap {
  element: string;
  role: string;
  required: number;
  held: number | null;
  /**
   * WHICH QUESTION THIS GAP ANSWERS, and it is not the same question in the
   * two cases.
   *
   * `occupational` — what this person is expected to be able to do in their
   * job, and is short of. A deficiency, in the ordinary sense.
   *
   * `authority-overlay` — the competence an authority PRESUPPOSES, which they
   * do not yet hold. It answers "could this person be granted this?" and never
   * "have they earned it?", because nobody earns an authority: it is granted by
   * an organization, recorded in an authorization, and ends on departure.
   *
   * Carried on the gap itself so that a renderer showing the two identically is
   * doing so deliberately. Presenting an overlay gap as a competence deficiency
   * invites "close these gaps to become a signatory", which is the collapse the
   * competence/authorization split exists to prevent.
   */
  basis: 'occupational' | 'authority-overlay';
}

/**
 * Elements the person is short of, given their scope and what they hold.
 *
 * `held` maps element id to the highest level currently credentialed. A missing
 * entry means nothing is held, which is a gap of the full required level rather
 * than an absence of information.
 *
 * A `null` roleTarget is not a gap at any scope. Null means the element is
 * never part of that role's work in any deployment — a distinct claim from
 * "not in this person's scope today", and the reason the validator refuses to
 * let an author leave a role unrated.
 *
 * Occupational gaps come from `scope.role`; overlay gaps from `scope.overlays`.
 * The basis is positional and needs no registry lookup: a role is an overlay
 * here because the scope carried it as one, and `checkScope` is what verifies
 * that placement against the registry.
 */
export function computeGaps(
  elements: Array<ElementStubLike & { roleTargets?: Record<string, number | null> }>,
  scope: DeploymentScope,
  held: Record<string, number> = {},
): Gap[] {
  const gaps: Gap[] = [];
  const against: Array<[string, Gap['basis']]> = [
    [scope.role, 'occupational'],
    ...(scope.overlays ?? []).map((o): [string, Gap['basis']] => [o, 'authority-overlay']),
  ];

  for (const element of elements) {
    if (!inScope(element, scope)) continue;

    for (const [role, basis] of against) {
      const required = element.roleTargets?.[role];
      if (required === null || required === undefined) continue;

      const current = held[element.id] ?? null;
      if (current === null || current < required) {
        gaps.push({ element: element.id, role, required, held: current, basis });
      }
    }
  }

  return gaps;
}

/**
 * Scope integrity: does every selector name something the taxonomy contains?
 *
 * A scope naming a domain that does not exist silently narrows what a person is
 * measured against, and nothing else would notice. A typo becomes a quiet
 * exemption.
 */
export function checkScope(scope: DeploymentScope, corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${scope.subject} (${scope.role}): ${msg}`;
  const stubs = indexStubs(corpus.taxonomy);

  const domains = new Set<string>();
  const areas = new Set<string>();
  for (const stub of stubs.values()) {
    domains.add(stub.domain);
    areas.add(stub.competencyArea);
  }

  // -- Is the role a role, and is it the right KIND of role? ----------------
  // Neither was checked. The first is an ordinary typo guard; the second is
  // the substantive one. `approved-signatory` sat in the registry beside
  // `calibration-engineer` as though the two were the same kind of thing, so a
  // scope could name it and gap analysis would report shortfalls against it as
  // COMPETENCE gaps — inviting an organization to read "close these gaps" as
  // the route to signatory status. It is not. The authority is granted by a
  // laboratory, recognised there for that scope, and ends on departure.
  const roles = new Map(
    ((corpus.roles?.roles ?? []) as Array<Record<string, unknown>>)
      .filter((r) => typeof r.id === 'string')
      .map((r) => [r.id as string, r.roleType as string | undefined]),
  );

  if (roles.size > 0) {
    if (!roles.has(scope.role)) {
      findings.push({ level: 'error', message: at(`names role '${scope.role}', which the role registry does not contain`) });
    } else if (roles.get(scope.role) === 'authority-overlay') {
      findings.push({
        level: 'error',
        message: at(`names '${scope.role}' as its role, but that is an authority overlay rather than an occupation. A person is their occupational role AND this overlay; put it in \`overlays\`. A scope whose role is an overlay reports the competence an authority presupposes as though it were a job's deficiencies, and closing them confers nothing — the authority is granted, not earned.`),
      });
    }

    for (const overlay of scope.overlays ?? []) {
      if (!roles.has(overlay)) {
        findings.push({ level: 'error', message: at(`names overlay '${overlay}', which the role registry does not contain`) });
      } else if (roles.get(overlay) !== 'authority-overlay') {
        findings.push({
          level: 'error',
          message: at(`lists '${overlay}' as an authority overlay, but the registry classifies it as an occupation. An occupational role has a competence profile of its own and belongs in a scope of its own, not stacked on another as a permission.`),
        });
      }
    }
  }

  for (const domain of scope.includes.domains ?? []) {
    if (!domains.has(domain)) findings.push({ level: 'error', message: at(`scope includes unknown domain '${domain}'`) });
  }
  for (const area of [...(scope.includes.areas ?? []), ...(scope.excludes?.areas ?? [])]) {
    if (!areas.has(area)) findings.push({ level: 'error', message: at(`scope references unknown competency area '${area}'`) });
  }
  for (const element of [...(scope.includes.elements ?? []), ...(scope.excludes?.elements ?? [])]) {
    if (!stubs.has(element)) findings.push({ level: 'error', message: at(`scope references unknown element '${element}'`) });
  }

  if (!Object.values(scope.includes).some((v) => (v ?? []).length > 0)) {
    findings.push({
      level: 'error',
      message: at('scope includes nothing. An empty scope produces no gaps for any element, which reads as full competence rather than as an unset scope.'),
    });
  }

  return findings;
}


/* ------------------------------------------------------------------------ */

/**
 * Disclosure: an organization's view of a person's record is not a read.
 *
 * `computeGaps` took what somebody holds as a plain map, with no record of
 * where it came from or what they agreed to share. Left there, the workforce
 * gap dashboard — the feature an organization actually buys — would have been
 * built on the assumption that an employer may see everything a person holds:
 * credentials earned elsewhere, before this job, in domains this job never
 * touches, none of which are the employer's business. The individual owns the
 * record and the organization holds a copy of what it was given.
 *
 * DECISION 34 DECIDED THIS AND NOTHING BUILT IT. "Consented, scoped
 * disclosure; every view audit-logged" was a row in a decision table about
 * accreditation assessors — no schema, no code. So there was no model here to
 * copy for the employer case, and this is the first one. It serves both, which
 * is why the case is named in `purpose` rather than in the shape.
 *
 * WHAT IS NOT A DISCLOSURE. A person looking at their own gaps. That is a read,
 * of their own record, by its owner, and it needs no consent and never will —
 * `computeGaps` stays available unguarded for exactly that. `gapsFromDisclosure`
 * is the organizational path.
 */

export interface DisclosureEntry {
  element: string;
  level: number;
  credentialId?: string;
  credentialRef?: string;
}

export interface Disclosure {
  schemaVersion: 1;
  id: string;
  subject: string;
  organization: { name: string; id?: string };
  purpose: string;
  scopeRef: string;
  grantedOn: string;
  expiresOn: string;
  revokedOn?: string;
  entries: DisclosureEntry[];
  [key: string]: unknown;
}

/**
 * The pin a disclosure is bounded by.
 *
 * THE ORGANIZATION OWNS THE DEPLOYMENT SCOPE — it is the one artifact in this
 * system that it does own — so a disclosure bounded by a scope the organization
 * can edit is bounded by nothing at all. Widening a job description would
 * silently widen what an employer may see of somebody's record, with nobody
 * consenting to anything. Pinned, adding elements to the job invalidates the
 * disclosure and a new one has to be granted, which is right: the person
 * consented to a scope, not to a role name.
 *
 * The projection covers what determines VISIBILITY and nothing else. `notes`,
 * `assignedBy` and the effective dates are excluded on the same reasoning that
 * keeps editorial fields out of a credential's `definitionRef` — an
 * administrative edit must not invalidate somebody's consent, or re-consent
 * becomes a routine formality and stops meaning anything. Selectors are sorted,
 * because the order somebody listed two domains in is not a fact about scope.
 */
export function deploymentScopeHash(scope: DeploymentScope): string {
  const sorted = (values?: string[]): string[] => [...(values ?? [])].sort();

  return sha256Of({
    subject: scope.subject,
    role: scope.role,
    overlays: sorted(scope.overlays),
    includes: {
      domains: sorted(scope.includes?.domains),
      areas: sorted(scope.includes?.areas),
      elements: sorted(scope.includes?.elements),
    },
    excludes: {
      areas: sorted(scope.excludes?.areas),
      elements: sorted(scope.excludes?.elements),
    },
  });
}

/**
 * Does this disclosure actually permit what it is being used for?
 *
 * The rule that does the work is the third one: EVERY ENTRY MUST BE IN SCOPE.
 * An element outside the deployment scope cannot produce a gap, so a credential
 * for one cannot inform this organization's dashboard — it can only tell them
 * something about the person they had no business learning. Without that check
 * a disclosure is a formality wrapped around a full record.
 */
export function checkDisclosure(
  disclosure: Disclosure,
  scope: DeploymentScope,
  elements: ElementStubLike[],
  asOf?: string,
): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${disclosure.id}: ${msg}`;
  const err = (message: string): Finding => ({ level: 'error', message });

  if (disclosure.subject !== scope.subject) {
    findings.push(
      err(at(`discloses the record of ${disclosure.subject} against a deployment scope belonging to ${scope.subject}. One person's consent does not bound another person's record.`)),
    );
  }

  if (disclosure.scopeRef !== deploymentScopeHash(scope)) {
    findings.push(
      err(at('is bound to a deployment scope that has since changed. The organization owns the scope, so a disclosure that floated with it would let a widened job description widen what the employer may see, with nobody consenting to anything. A new scope needs a new disclosure.')),
    );
  }

  const byId = new Map(elements.map((e) => [e.id, e]));
  for (const entry of disclosure.entries ?? []) {
    const element = byId.get(entry.element);
    if (!element) {
      findings.push(
        err(at(`discloses ${entry.element}, which is not in the corpus presented, so whether it falls inside the scope cannot be decided.`)),
      );
      continue;
    }
    if (!inScope(element, scope)) {
      findings.push(
        err(at(`discloses ${entry.element}, which is outside this deployment scope. An element outside scope cannot produce a gap, so this tells the organization nothing it needs and something it has no business knowing.`)),
      );
    }
  }

  if (disclosure.expiresOn <= disclosure.grantedOn) {
    findings.push(
      err(at('expires on or before the day it was granted. A standing, indefinite grant is not consent, and neither is one that never applied.')),
    );
  }

  if (disclosure.revokedOn) {
    findings.push(
      err(at(`was withdrawn by its subject on ${disclosure.revokedOn}. Withdrawal needs no reason and takes effect at once.`)),
    );
  }

  if (asOf && asOf > disclosure.expiresOn) {
    findings.push(
      err(at(`expired on ${disclosure.expiresOn} and is being read as of ${asOf}. The person re-grants, or the organization stops seeing.`)),
    );
  }

  return findings;
}

/**
 * Gap analysis for an ORGANIZATION, through the consent that permits it.
 *
 * `gaps` is null when the disclosure does not hold up, and that is deliberate:
 * an empty array would read as "no gaps found", which is the most dangerous
 * possible rendering of "you were not permitted to look". A refusal is not a
 * clean bill of health, and the type says so rather than a comment asking a
 * caller to remember.
 *
 * Note what is NOT partial. A disclosure carrying one out-of-scope entry yields
 * no view at all, rather than a view with that entry dropped. Silently trimming
 * would teach an integrator that over-disclosing is free and gets corrected
 * downstream, and the correction only ever runs where somebody remembered to
 * call this.
 */
export function gapsFromDisclosure(
  elements: Array<ElementStubLike & { roleTargets?: Record<string, number | null> }>,
  scope: DeploymentScope,
  disclosure: Disclosure,
  asOf?: string,
): { gaps: Gap[] | null; findings: Finding[] } {
  const findings = checkDisclosure(disclosure, scope, elements, asOf);
  if (findings.some((f) => f.level === 'error')) return { gaps: null, findings };

  const held: Record<string, number> = {};
  for (const entry of disclosure.entries) {
    const current = held[entry.element];
    if (current === undefined || entry.level > current) held[entry.element] = entry.level;
  }

  return { gaps: computeGaps(elements, scope, held), findings };
}
