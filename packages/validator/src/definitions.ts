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
 * Hash of the element definition, for one attested level.
 *
 * The projection is the point. Only the fields that change what the credential
 * ASSERTS are included: the kind (which determines what evidence proves it),
 * the ceiling (which bounds what the level means), and the anchor for the
 * attested level (which is the observable behaviour claimed). Summary wording,
 * citations, related elements and authoring metadata are excluded deliberately
 * — a typo fix in a summary must not make every credential look like it drifted,
 * or the signal becomes noise and reviewers learn to ignore it.
 */
export function elementDefinitionHash(element: ElementLike, level: number): string {
  return sha256Of({
    id: element.id,
    kind: element.kind,
    levelCeiling: element.levelCeiling,
    level,
    anchor: element.anchors?.[String(level)] ?? null,
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

/** Build the pins at issue time. The engine calls this; nothing else should. */
export function pinDefinition(
  element: ElementLike,
  level: number,
  refs: Array<{ article: string; section: string }>,
  articles: ArticleLike[],
): { definitionRef: string; knowledgeSnapshot: KnowledgeSnapshotEntry[] } {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const knowledgeSnapshot: KnowledgeSnapshotEntry[] = [];

  for (const ref of refs) {
    const article = byId.get(ref.article);
    const hash = article ? sectionHash(article.body, ref.section) : null;
    if (hash) knowledgeSnapshot.push({ article: ref.article, section: ref.section, sectionRef: hash });
  }

  return { definitionRef: elementDefinitionHash(element, level), knowledgeSnapshot };
}
