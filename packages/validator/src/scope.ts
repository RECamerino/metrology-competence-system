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
