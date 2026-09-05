/**
 * Does this authorization cover this piece of work?
 *
 * THE QUESTION AN ACCREDITATION BODY ACTUALLY ASKS, and until now it could only
 * be answered by a person reading prose. `authorization.scope` was four arrays
 * of free strings — activities, methods, ranges, locations — so "signing
 * certificates", "certificate signing" and "sign accredited certs" were three
 * spellings of one activity that no comparison finds, and a range recorded as
 * "0.5 mm to 100 mm" could not be compared against anything at all. A scope
 * that participates in computation cannot exist only as prose.
 *
 * THREE ANSWERS, NOT TWO. `covered`, `not-covered`, and `undecidable` — and the
 * third is the one that makes the other two safe. Collapsing it into
 * `not-covered` wrongly blocks work somebody is authorized to do; collapsing it
 * into `covered` wrongly permits signing an accredited certificate. Those
 * failures are not symmetrical and neither is acceptable, so the type refuses
 * to express a verdict that has not been reached.
 *
 * THE UNIT TRAP IS WHY `undecidable` HAD TO EXIST. A grant of 0 to 100 mm and a
 * job at 0.5 m compare as 0.5 < 100 the moment units are ignored, authorizing a
 * certificate five times outside the granted range — and the arithmetic would
 * look perfectly sound. This module does not convert units. A half-right
 * conversion table inside a metrology system is worse than none, because it
 * fails silently and in the direction of permitting more. Same quantity,
 * different unit, is a question this module refuses to answer.
 *
 * A NOTE ON WHAT "not stated" MEANS, because it differs by dimension. An
 * authorization that lists no methods is unbounded by method — a real and
 * common grant, not an omission. But a work item that names no method, asked
 * against an authorization that lists them, is a question missing a term, and
 * the answer is that it cannot be decided rather than that it passes.
 */

import type { Finding } from './checks.ts';
import { type ElementStubLike, type ScopeSelectors, matchesSelectors } from './scope.ts';

export type Coverage = 'covered' | 'not-covered' | 'undecidable';

export interface AuthorizationMethod {
  identifier: string;
  source?: string;
  revision?: string;
}

export interface AuthorizationRange {
  quantity: string;
  unit: string;
  min: number;
  max: number;
}

export interface AuthorizationScope {
  activities: string[];
  measurement: { includes: ScopeSelectors; excludes?: Omit<ScopeSelectors, 'domains'> };
  methods?: AuthorizationMethod[];
  ranges?: AuthorizationRange[];
  locations?: Array<{ id: string; name?: string }>;
}

export interface AuthorizationLike {
  id: string;
  scope: AuthorizationScope;
  expiresOn?: string;
  status?: { active?: boolean; endedOn?: string; endedBecause?: string };
  [key: string]: unknown;
}

/** One piece of work, as the question is asked. */
export interface WorkItem {
  activity: string;
  element?: ElementStubLike;
  method?: { identifier: string; revision?: string };
  measurement?: { quantity: string; unit: string; value: number };
  location?: string;
}

const note = (message: string): Finding => ({ level: 'warn', message });

/**
 * A definite NO on any dimension settles the question, whatever else is
 * unknown: an activity outside the grant is not made decidable by a range
 * nobody can compare. Otherwise a single undecidable dimension makes the whole
 * answer undecidable, because the question is a conjunction.
 */
function combine(verdicts: Coverage[]): Coverage {
  if (verdicts.includes('not-covered')) return 'not-covered';
  if (verdicts.includes('undecidable')) return 'undecidable';
  return 'covered';
}

export function authorizationCovers(
  authorization: AuthorizationLike,
  work: WorkItem,
  asOf?: string,
): { coverage: Coverage; findings: Finding[] } {
  const findings: Finding[] = [];
  const at = (msg: string) => `${authorization.id}: ${msg}`;
  const verdicts: Coverage[] = [];
  const scope = authorization.scope;

  // -- Is the grant even in force? -----------------------------------------
  // An ended or expired authorization covers nothing, and this is a definite
  // answer rather than an unknown one.
  if (authorization.status?.active === false) {
    findings.push(
      note(at(`ended on ${authorization.status.endedOn ?? 'an unrecorded date'}, so it covers no work. An authorization is granted, and it stops when the organization says it does.`)),
    );
    verdicts.push('not-covered');
  }

  if (asOf && authorization.expiresOn && asOf > authorization.expiresOn) {
    findings.push(note(at(`expired on ${authorization.expiresOn} and is being read as of ${asOf}.`)));
    verdicts.push('not-covered');
  }

  // -- Activity -------------------------------------------------------------
  if (!scope.activities.includes(work.activity)) {
    findings.push(
      note(at(`does not permit '${work.activity}'. Granted: ${scope.activities.join(', ')}.`)),
    );
    verdicts.push('not-covered');
  }

  // -- Measurement scope ----------------------------------------------------
  // Required on every authorization, so this dimension is always tested. A
  // question that names no element leaves the grant's principal bound
  // untested, which is a missing term rather than a pass.
  if (!work.element) {
    findings.push(
      note(at('is bounded by a measurement scope, and the work does not say which element it falls under, so the principal bound cannot be tested.')),
    );
    verdicts.push('undecidable');
  } else if (!matchesSelectors(work.element, scope.measurement.includes, scope.measurement.excludes)) {
    findings.push(
      note(at(`does not cover ${work.element.id}, which is outside its measurement scope.`)),
    );
    verdicts.push('not-covered');
  }

  // -- Method ---------------------------------------------------------------
  const methods = scope.methods ?? [];
  if (methods.length > 0) {
    if (!work.method) {
      findings.push(
        note(at('is bounded by method and the work names none, so whether the method is covered cannot be decided.')),
      );
      verdicts.push('undecidable');
    } else {
      const granted = methods.find((m) => m.identifier === work.method!.identifier);
      if (!granted) {
        findings.push(
          note(at(`does not cover method '${work.method.identifier}'. Granted: ${methods.map((m) => m.identifier).join(', ')}.`)),
        );
        verdicts.push('not-covered');
      } else if (granted.revision && !work.method.revision) {
        // The grant is revision-specific and the question is not, so the two
        // cannot be compared. Reading silence as "the granted revision" is the
        // assumption that permits more.
        findings.push(
          note(at(`covers '${granted.identifier}' at revision ${granted.revision}, and the work names no revision, so they cannot be compared.`)),
        );
        verdicts.push('undecidable');
      } else if (granted.revision && work.method.revision !== granted.revision) {
        findings.push(
          note(at(`covers '${granted.identifier}' at revision ${granted.revision}, not ${work.method.revision}. A revision can change what the method is.`)),
        );
        verdicts.push('not-covered');
      }
    }
  }

  // -- Range ----------------------------------------------------------------
  const ranges = scope.ranges ?? [];
  if (ranges.length > 0) {
    if (!work.measurement) {
      findings.push(
        note(at('is bounded by range and the work states no measured value, so whether it falls inside cannot be decided.')),
      );
      verdicts.push('undecidable');
    } else {
      const { quantity, unit, value } = work.measurement;
      const forQuantity = ranges.filter((r) => r.quantity === quantity);

      if (forQuantity.length === 0) {
        findings.push(note(at(`covers no range for '${quantity}'.`)));
        verdicts.push('not-covered');
      } else {
        const comparable = forQuantity.filter((r) => r.unit === unit);
        if (comparable.length === 0) {
          // THE ONE THIS MODULE EXISTS TO GET RIGHT. Units are never converted.
          findings.push(
            note(at(`covers '${quantity}' in ${[...new Set(forQuantity.map((r) => r.unit))].join(', ')} and the work is stated in ${unit}. Units are never converted here, because a conversion that is half right permits more than was granted and fails silently — state the work in the unit the grant uses.`)),
          );
          verdicts.push('undecidable');
        } else if (!comparable.some((r) => value >= r.min && value <= r.max)) {
          findings.push(
            note(at(`covers '${quantity}' over ${comparable.map((r) => `${r.min}–${r.max} ${r.unit}`).join(', ')}, and the work is at ${value} ${unit}.`)),
          );
          verdicts.push('not-covered');
        }
      }
    }
  }

  // -- Location -------------------------------------------------------------
  const locations = scope.locations ?? [];
  if (locations.length > 0) {
    if (!work.location) {
      findings.push(
        note(at('is bounded by site and the work names none, so whether the site is covered cannot be decided.')),
      );
      verdicts.push('undecidable');
    } else if (!locations.some((l) => l.id === work.location)) {
      findings.push(
        note(at(`does not cover site '${work.location}'. Granted: ${locations.map((l) => l.id).join(', ')}.`)),
      );
      verdicts.push('not-covered');
    }
  }

  return { coverage: combine(verdicts), findings };
}
