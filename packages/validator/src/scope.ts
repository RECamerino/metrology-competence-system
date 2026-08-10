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
  role: string;
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
 */
export function computeGaps(
  elements: Array<ElementStubLike & { roleTargets?: Record<string, number | null> }>,
  scope: DeploymentScope,
  held: Record<string, number> = {},
): Gap[] {
  const gaps: Gap[] = [];

  for (const element of elements) {
    if (!inScope(element, scope)) continue;

    const required = element.roleTargets?.[scope.role];
    if (required === null || required === undefined) continue;

    const current = held[element.id] ?? null;
    if (current === null || current < required) {
      gaps.push({ element: element.id, role: scope.role, required, held: current });
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
