/**
 * Semantic pinning: what a credential meant on the day it was issued.
 *
 * THE PROBLEM THIS SOLVES. Rule 1 makes IDs append-only, which guarantees that
 * `CM-03-014` always RESOLVES. It does not guarantee that it always MEANS the
 * same thing. Anchors get rewritten, ceilings get revised, a BOK section gets
 * substantially rewritten when a standard changes. Nothing in an append-only ID
 * prevents any of that, and nothing recorded it.
 *
 * So `CM-03-014 @ L4` earned in 2027 and the identical string earned in 2030
 * could attest materially different competence, with no artifact anywhere
 * capturing the difference. A verifier reading the older credential would
 * silently apply the newer meaning. That is a hole in the project's central
 * promise, and it is not fixed by version numbers — those depend on somebody
 * remembering to increment them.
 *
 * It is fixed by hashing. At issue, a credential pins:
 *
 *   - the ELEMENT DEFINITION as it stood, projected down to the fields that
 *     actually carry meaning for the attested level;
 *   - each BOK SECTION the element pointed at, by content.
 *
 * DRIFT IS NOT INVALIDITY. A credential whose pins no longer match the current
 * corpus is not false — it remains exactly true of the definition in force when
 * it was earned. What drift means is that a reader must be told the definition
 * moved, and what it said at the time. Reported as a warning for that reason;
 * treating it as an error would punish the holder for a change somebody else
 * made years later.
 */

import { sha256Of, sha256OfText } from './canonical.ts';
import type { Finding } from './checks.ts';

const warn = (message: string): Finding => ({ level: 'warn', message });
const err = (message: string): Finding => ({ level: 'error', message });

export interface ElementLike {
  id: string;
  kind: string;
  levelCeiling: number;
  anchors: Record<string, string>;
  [key: string]: unknown;
}

/**
 * The element's evidence routes, normalized.
 *
 * `demonstration` is a SET: some competences have two genuine routes, the
 * competence is the same in both, and which one is available is a property of
 * the laboratory rather than of the element. Three notations therefore have to
 * hash alike, because all three are the same statement — omitting the field,
 * stating the schema default explicitly, and writing the routes in a different
 * order. Author ordering is not meaning, so it is sorted away.
 *
 * A scalar is accepted and lifted into a one-element array. The schema no longer
 * permits one, and content is rejected separately if it uses it — but `desk` and
 * `[desk]` are the same definition, and hashing them differently would
 * manufacture drift out of a change in notation.
 */
export function demonstrationRoutes(element: { demonstration?: unknown; [key: string]: unknown }): string[] {
  const raw = element.demonstration;
  if (raw === undefined || raw === null) return ['desk'];
  const list = Array.isArray(raw) ? (raw as unknown[]) : [raw];
  return [...new Set(list.map(String))].sort();
}

/**
 * Hash of the element definition, for one attested level.
 *
 * The projection is the point. Only the fields that change what the credential
 * ASSERTS are included: the kind (which determines what evidence proves it),
 * the ceiling (which bounds what the level means), the anchor for the attested
 * level (which is the observable behaviour claimed), and the demonstration mode
 * (which decides what evidence is admissible for it). Summary wording,
 * citations, related elements and authoring metadata are excluded deliberately
 * — a typo fix in a summary must not make every credential look like it drifted,
 * or the signal becomes noise and reviewers learn to ignore it.
 *
 * WHY `demonstration` IS IN HERE. It was not, and that left the pin claiming to
 * freeze meaning while a meaning-bearing field moved underneath it. Flip an
 * element from `desk` to `equipment` with the anchor untouched and the hash
 * still matched: a verifier read "definition unchanged" while what counts as
 * valid evidence for that very claim had inverted, and a credential earned by
 * desk work now sat under a definition demanding witnessed work at a bench.
 * Normalized through the schema default AND SORTED, so that omitting the field,
 * writing `[desk]` explicitly, and reordering a multi-route set all hash alike:
 * each is the same definition, and reporting any of them as drift would be
 * noise reviewers learn to ignore. It is a SET because some competences have two
 * genuine routes and which one is available is a property of the laboratory
 * rather than of the element. ADDING a route widens what evidence is admissible
 * and is real drift; the order an author wrote them in is not.
 *
 * WHY THREE OTHER MEANING-BEARING FIELDS ARE STILL OUT. Each was considered and
 * each is excluded for its own reason, not by oversight:
 *
 *   `status` — checked AT ISSUE by checkAttestableStatus, which is where it
 *   belongs. Pinning it would make the ordinary lifecycle draft → review →
 *   stable report drift on every credential below it, and deprecation would
 *   light up every credential ever issued against the element at the moment it
 *   was superseded. That is punishing the holder for a change somebody else
 *   made years later, which is exactly what this module refuses to do.
 *
 *   `roleTargets` — states what ROLES need, not what this person demonstrated.
 *   Gap analysis runs against the current corpus for a current deployment, so
 *   it must read today's targets; a historical pin would be the wrong input.
 *
 *   `prerequisites` — the preparation graph. Somebody who met the anchor met
 *   it, whatever route was recommended at the time.
 */
export function elementDefinitionHash(element: ElementLike, level: number): string {
  return sha256Of({
    id: element.id,
    kind: element.kind,
    levelCeiling: element.levelCeiling,
    level,
    anchor: element.anchors?.[String(level)] ?? null,
    // Normalized and sorted, so that omitting the field, stating `[desk]`, and
    // reordering a multi-route set all produce the same hash. They mean the
    // same thing.
    demonstration: demonstrationRoutes(element),
  });
}

/**
 * Hash of the assessment policy in force for one level.
 *
 * `definitionRef` pins what the ELEMENT meant. This pins what the LEVEL meant,
 * and without it decision 39 is only half applied.
 *
 * `content/competence/taxonomy/proficiency.yaml` controls the signer count, the
 * level a witness must hold, whether a credentialed reviewer and a
 * cross-organizational signer are required, double scoring, capstone and work
 * product, mentoring, minimum experience hours, the waiting period, and the
 * recertification default. Its own schema says changing a level's meaning
 * retroactively changes what every existing credential asserts — and yet none
 * of it was captured on the credential.
 *
 * Concretely: if L4 requires 200 hours and two reviewers today, and in three
 * years requires 500 hours and three, an old credential still reads
 * `CM-03-014 @ L4` with a definitionRef that still matches. The element did not
 * move; the bar did. A verifier could not tell.
 *
 * The whole level entry is hashed rather than a projection. Every field in it
 * is a rule that had to be satisfied, and `descriptor` carries the level's
 * generic meaning exactly as an anchor carries the element's. proficiency.yaml
 * is steward-controlled and rarely edited, so drift here should be rare — and
 * when a steward does edit it, being made to think about the effect on existing
 * credentials is the correct outcome rather than an inconvenience.
 */
export function assessmentPolicyHash(levelDefinition: Record<string, unknown>): string {
  return sha256Of(levelDefinition);
}

/** The level entry for one level, from a loaded proficiency document. */
export function levelDefinition(
  proficiency: Record<string, unknown> | null,
  level: number,
): Record<string, unknown> | undefined {
  const levels = (proficiency?.levels ?? []) as Array<Record<string, unknown>>;
  return levels.find((l) => l.level === level);
}

/**
 * Pull one section's text out of an article body, from its {#id} anchor to the
 * next heading of the same or higher rank.
 *
 * Returns null when the anchor is absent, which the BOK checks already reject —
 * but a credential verifier may be handed an article it has never validated,
 * so this must not throw.
 */
export function extractSection(body: string, sectionId: string): string | null {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const startIndex = lines.findIndex((line) => line.includes(`{#${sectionId}}`));
  if (startIndex === -1) return null;

  const startHeading = /^(#+)\s/.exec(lines[startIndex]!);
  const startDepth = startHeading ? startHeading[1]!.length : 2;

  const collected: string[] = [lines[startIndex]!];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const heading = /^(#+)\s/.exec(lines[i]!);
    if (heading && heading[1]!.length <= startDepth) break;
    collected.push(lines[i]!);
  }

  return collected.join('\n').trimEnd();
}

export function sectionHash(body: string, sectionId: string): string | null {
  const text = extractSection(body, sectionId);
  return text === null ? null : sha256OfText(text);
}

/* ------------------------------------------------------------------------ */

export interface KnowledgeSnapshotEntry {
  article: string;
  section: string;
  sectionRef: string;
}

export interface PinnedCredential {
  id: string;
  element: string;
  level: number;
  definitionRef?: string;
  assessmentPolicyRef?: string;
  knowledgeSnapshot?: KnowledgeSnapshotEntry[];
  [key: string]: unknown;
}

export interface ArticleLike {
  id: string;
  body: string;
}

/**
 * Compare a credential's pins against the corpus as it stands now.
 *
 * A verifier runs this to answer the question that matters when reading an old
 * credential: "did this mean then what it would mean today?"
 */
export function checkDefinitionDrift(
  credential: PinnedCredential,
  element: ElementLike | undefined,
  articles: ArticleLike[] = [],
  proficiency: Record<string, unknown> | null = null,
): Finding[] {
  const findings: Finding[] = [];
  const at = (msg: string) => `${credential.id}: ${msg}`;

  // -- What the LEVEL meant, alongside what the element meant --------------
  if (!credential.assessmentPolicyRef) {
    findings.push(
      err(at('carries no assessmentPolicyRef. Without it there is no record of what had to be satisfied to earn this level — signer count, reviewer requirements, experience hours, waiting period — and a reader will silently apply whatever the ladder demands today.')),
    );
  } else if (proficiency) {
    const definition = levelDefinition(proficiency, credential.level);
    if (!definition) {
      findings.push(warn(at(`the proficiency document presented has no level ${credential.level}, so the policy pin cannot be checked.`)));
    } else if (assessmentPolicyHash(definition) !== credential.assessmentPolicyRef) {
      findings.push(
        warn(at(`the assessment policy for L${credential.level} has changed since this credential was issued. It was earned under the rules in force at the time; do not represent it as meeting today's.`)),
      );
    }
  }

  if (!credential.definitionRef) {
    findings.push(
      err(at('carries no definitionRef. Without it there is no way to establish what this element meant when the credential was issued, and a reader will silently apply the current definition.')),
    );
  } else if (!element) {
    findings.push(
      warn(at(`element ${credential.element} is not in the corpus presented, so the definition pin cannot be checked. The credential is not thereby false.`)),
    );
  } else {
    const current = elementDefinitionHash(element, credential.level);
    if (current !== credential.definitionRef) {
      findings.push(
        warn(at(`the definition of ${credential.element} at L${credential.level} has changed since this credential was issued. It remains true of the definition in force at the time; show a reader what that definition said rather than the current one.`)),
      );
    }
  }

  const byId = new Map(articles.map((a) => [a.id, a]));

  for (const pin of credential.knowledgeSnapshot ?? []) {
    const article = byId.get(pin.article);
    if (!article) {
      findings.push(
        warn(at(`article ${pin.article} is not in the corpus presented; its section pin cannot be checked.`)),
      );
      continue;
    }

    const current = sectionHash(article.body, pin.section);
    if (current === null) {
      findings.push(
        warn(at(`${pin.article}#${pin.section} no longer exists. The refresher path for this credential is broken — the section should have been deprecated with a supersededBy pointer rather than removed.`)),
      );
    } else if (current !== pin.sectionRef) {
      findings.push(
        warn(at(`${pin.article}#${pin.section} has been rewritten since this credential was issued. The knowledge behind the claim is not what it was.`)),
      );
    }
  }

  return findings;
}

/**
 * Build the pins at issue time. The engine calls this; nothing else should.
 *
 * EVERY DROPPED REF IS REPORTED. A ref that cannot be resolved — the article is
 * not loaded, or the section anchor is gone — used to be skipped in silence,
 * which meant this function could hand back an empty `knowledgeSnapshot` while
 * looking like it had done its job. The credential would then be schema-valid
 * on the old schema, the drift check would iterate an empty array and find
 * nothing wrong, and the knowledge behind the claim would be unpinned with
 * nothing anywhere recording it. An issuer must not be able to produce that by
 * forgetting to load the corpus.
 *
 * Findings are returned rather than thrown: the caller decides whether a
 * partial pin is issuable, and that is an issuance decision rather than a
 * hashing one. But it can no longer be made by accident.
 */
export function pinDefinition(
  element: ElementLike,
  level: number,
  refs: Array<{ article: string; section: string }>,
  articles: ArticleLike[],
): { definitionRef: string; knowledgeSnapshot: KnowledgeSnapshotEntry[]; findings: Finding[] } {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const knowledgeSnapshot: KnowledgeSnapshotEntry[] = [];
  const findings: Finding[] = [];

  for (const ref of refs) {
    const article = byId.get(ref.article);
    if (!article) {
      findings.push(
        err(`${element.id}: cannot pin ${ref.article}#${ref.section} — article ${ref.article} was not supplied, so the knowledge behind this claim would go unpinned.`),
      );
      continue;
    }

    const hash = sectionHash(article.body, ref.section);
    if (!hash) {
      findings.push(
        err(`${element.id}: cannot pin ${ref.article}#${ref.section} — that article declares no such section. The element's knowledgeRef is broken and must be fixed before a credential rests on it.`),
      );
      continue;
    }

    knowledgeSnapshot.push({ article: ref.article, section: ref.section, sectionRef: hash });
  }

  if (knowledgeSnapshot.length === 0) {
    findings.push(
      err(`${element.id}: nothing could be pinned from ${refs.length} knowledgeRef(s). A credential issued on this would carry an empty knowledgeSnapshot, which pins the knowledge in shape only.`),
    );
  }

  return { definitionRef: elementDefinitionHash(element, level), knowledgeSnapshot, findings };
}
