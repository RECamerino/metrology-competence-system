/**
 * Every route to an assessment, and the fact that none of them is required.
 *
 * THE DEFECT THIS CLOSES. `BOK -> module -> assessment` must never harden into
 * a mandatory linear course, and nothing in this system ever required a module:
 * `preparesFor` says so in terms, no field anywhere can express a training
 * prerequisite, and a check looking for one would find nothing to check.
 *
 * But the record could only be written one way. `training-record` required
 * `module` and `moduleRef`, so the only preparation anybody could put on paper
 * was a module they had finished. Self-study, mentoring, a commercial course
 * and prior practice were named as legitimate in four prose descriptions and
 * represented in no object at all. **A route that is the only one recordable
 * becomes the path without anybody deciding it** — which is how a principle
 * held in prose loses to a schema, and this project has watched that happen
 * before with `blockedPendingCounsel`.
 *
 * WHAT WAS ACTUALLY LOST WAS `pending-demonstration`. That state is the one
 * that turns "I have no employer" into a specific request: the knowledge is
 * done, the witnessed performance on real apparatus is not. It was derived from
 * a module's `requiresPhysicalDemonstration`, so the person who taught
 * themselves an `equipment`-route element had no way to say they owed bench
 * time — the honest position was available only to somebody who had completed a
 * module, which is precisely backwards. The person with no employer is who the
 * Personal edition exists for.
 *
 * SO IT IS DERIVED FROM THE ELEMENT, not from the route somebody took. The
 * element declares how the competence can be evidenced at all; how the person
 * prepared has nothing to do with whether a bench is owed. That generalizes the
 * rule rather than replacing it: a module record is checked exactly as before,
 * and every other record is now checked the same way.
 *
 * AND OFF `kind` LEAST OF ALL. `skill` means the evidence is observable
 * performance rather than explanation; it does not mean the performance happens
 * at a bench. Constructing an uncertainty budget is a skill and is desk work,
 * and a record telling that learner they are waiting for access they never
 * needed invents a barrier — as wrong as hiding a real one, and in the
 * direction that discourages somebody who could sit the assessment tomorrow.
 *
 * WHAT THIS MODULE DOES NOT DO. It does not rank routes, and there is nothing
 * here that reads `route` to decide anything about weight, admissibility or
 * standing. `provenanceTier` on the credential describes the standing of the
 * WITNESS and has never described how the candidate learned. If a check here
 * ever starts treating `self-study` as weaker than `course`, the principle has
 * been lost in the implementation rather than in the schema.
 */

import type { Finding } from './checks.ts';
import { type ElementLike, demonstrationRoutes } from './definitions.ts';

const err = (message: string): Finding => ({ level: 'error', message });
const warn = (message: string): Finding => ({ level: 'warn', message });

export type PreparationRoute =
  | 'module'
  | 'self-study'
  | 'mentoring'
  | 'course'
  | 'workplace-practice';

export interface PreparedFor {
  element: string;
  level?: number;
  route?: 'desk' | 'equipment';
  state?: 'prepared' | 'pending-demonstration';
  [key: string]: unknown;
}

export interface PreparationRecord {
  id?: string;
  subject?: string;
  route?: PreparationRoute;
  module?: string;
  account?: string;
  attestsCompetence?: boolean;
  preparedFor?: PreparedFor[];
  [key: string]: unknown;
}

/**
 * Check one preparation record against the elements it names.
 *
 * `elements` is whatever authored definitions the caller has. An element that
 * is not supplied is not an error — a record may legitimately name an element
 * from a corpus the reader does not hold — but nothing about its route can be
 * decided, and saying so is better than assuming desk work.
 */
export function checkPreparationRecord(
  record: PreparationRecord,
  elements: ElementLike[] = [],
): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string): string => `${record.id ?? 'preparation record'}: ${msg}`;

  // Belt and braces over the schema's `const false`. This is the project's
  // founding objection and it is worth failing twice: a preparation record that
  // attested competence would rebuild 'Completed Advanced Metrology Training'
  // inside the system built to replace it.
  if (record.attestsCompetence !== false) {
    findings.push(
      err(at(`does not carry attestsCompetence: false. Preparing is not attaining, whatever the route, and only a credential attests competence.`)),
    );
  }

  const byId = new Map(elements.filter((e) => e?.id).map((e) => [e.id, e]));

  for (const target of record.preparedFor ?? []) {
    const label = `${target?.element}${typeof target?.level === 'number' ? ` @ L${target.level}` : ''}`;
    const element = byId.get(target?.element);

    if (!element) {
      findings.push(
        warn(at(`names ${label}, whose definition was not supplied. Whether it owes a witnessed demonstration cannot be decided here.`)),
      );
      continue;
    }

    if (typeof target.level === 'number' && typeof element.levelCeiling === 'number' && target.level > element.levelCeiling) {
      findings.push(
        err(at(`prepares ${label}, above its ceiling of ${element.levelCeiling}. There is no such assessable unit.`)),
      );
    }

    const routes = demonstrationRoutes(element as unknown as Record<string, unknown>);
    const multi = routes.length > 1;
    const stated = target.route;

    // The same both-directions rule a module's `preparesFor` entry carries, and
    // for the same reason: where the element declares a single route it has
    // already answered, and a second copy of one fact drifts after an edit.
    if (multi && !stated) {
      findings.push(
        err(at(`prepares ${label}, which admits ${routes.join(' and ')}, without saying which route this preparation reached. Both are admissible, so silence cannot be read as either — and read as desk work it would leave somebody bound for the bench unwarned.`)),
      );
    } else if (!multi && stated) {
      findings.push(
        err(at(`states route '${stated}' for ${label}, which declares only '${routes[0]}'. The element has answered; a copy here can fall out of agreement with it.`)),
      );
    } else if (stated && !routes.includes(stated)) {
      findings.push(
        err(at(`states route '${stated}' for ${label}, which the element does not admit (${routes.join(', ')}).`)),
      );
    }

    // What the state must be, derived from the element and the route reached.
    const reached = stated ?? routes[0];
    if (target.state === undefined) continue;

    if (reached === 'equipment' && target.state !== 'pending-demonstration') {
      findings.push(
        err(at(`records ${label} as '${target.state}', but it was prepared by the equipment route and witnessed performance on real apparatus has not happened. That is 'pending-demonstration' — the knowledge is done and the demonstration is not, and a record saying otherwise leaves the holder believing preparation finished the job.`)),
      );
    }

    if (reached === 'desk' && target.state === 'pending-demonstration') {
      findings.push(
        err(at(`records ${label} as 'pending-demonstration', but it is desk work and there is no bench to wait for. A record that invents a barrier is as misleading as one that hides a real one, and this one lands on somebody who could sit the assessment tomorrow.`)),
      );
    }
  }

  return findings;
}
