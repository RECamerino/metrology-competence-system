/**
 * Semantic checks — everything JSON Schema cannot express.
 *
 * Schema validation answers "is this file shaped correctly". These answer the
 * questions that actually protect the corpus: does every ID still exist, does
 * every citation resolve, is any quotation over its licensed limit, is the
 * prerequisite graph traversable.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  type Corpus,
  type ElementFile,
  REPO_ROOT,
  allCorpusIds,
  indexArchetypes,
  indexSources,
  indexStubs,
  roleIds,
} from './corpus.ts';
import { type ElementLike, demonstrationRoutes, elementDefinitionHash, sectionHash } from './definitions.ts';
import { formatErrors, validatorFor } from './schema.ts';

export interface Finding {
  level: 'error' | 'warn';
  message: string;
}

const err = (message: string): Finding => ({ level: 'error', message });
const warn = (message: string): Finding => ({ level: 'warn', message });

/**
 * Phrasing an anchor may not contain, whatever the element's kind.
 *
 * Kept deliberately short. A long list would catch prose that is merely
 * clumsy; these seven are the ones that make an anchor untestable outright,
 * and they are exactly the failures the authoring playbook has always named.
 */
const UNOBSERVABLE_PHRASES = [
  'understands',
  'familiar with',
  'aware of',
  'has knowledge of',
  'appreciates',
  'expert in',
  'proficient in',
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ------------------------------------------------------------------------ */

function checkSchemas(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];

  // Each per-domain file is validated separately so an error names the file
  // that caused it rather than the merged view.
  const validateTaxonomy = validatorFor('taxonomy');
  if (corpus.taxonomyFiles.length === 0) {
    findings.push(warn('content/competence/taxonomy/domains/ contains no domain files yet — skipped'));
  }
  for (const file of corpus.taxonomyFiles) {
    if (!validateTaxonomy(file.data)) {
      findings.push(...formatErrors(file.path, validateTaxonomy.errors).map(err));
    }
  }

  const registryFiles = [
    ['proficiency', corpus.proficiency, 'content/competence/taxonomy/proficiency.yaml'],
    ['role-registry', corpus.roles, 'content/competence/roles/registry.yaml'],
    ['source-registry', corpus.sources, 'content/sources/registry.yaml'],
    ['bootstrap-cohort', corpus.bootstrapCohort, 'content/competence/bootstrap-cohort.yaml'],
    ['trust-registry', corpus.trustRegistry, 'content/trust-registry.yaml'],
  ] as const;

  for (const [schemaName, data, path] of registryFiles) {
    if (data === null) {
      findings.push(warn(`${path} does not exist yet — skipped`));
      continue;
    }
    const validate = validatorFor(schemaName);
    if (!validate(data)) {
      findings.push(...formatErrors(path, validate.errors).map(err));
    }
  }

  const validateElement = validatorFor('element');
  for (const element of corpus.elements) {
    if (!validateElement(element.data)) {
      findings.push(...formatErrors(element.path, validateElement.errors).map(err));
    }
  }

  const validateBok = validatorFor('bok-article');
  for (const article of corpus.bok) {
    if (!validateBok(article.data)) {
      findings.push(...formatErrors(article.path, validateBok.errors).map(err));
    }
  }

  const validateModule = validatorFor('training-module');
  for (const file of corpus.modules) {
    if (!validateModule(file.data)) {
      findings.push(...formatErrors(file.path, validateModule.errors).map(err));
    }
  }

  const validateArchetype = validatorFor('item-archetype');
  for (const file of corpus.archetypes) {
    if (!validateArchetype(file.data)) {
      findings.push(...formatErrors(file.path, validateArchetype.errors).map(err));
    }
  }

  const validateBinding = validatorFor('item-binding');
  for (const file of corpus.bindings) {
    if (!validateBinding(file.data)) {
      findings.push(...formatErrors(file.path, validateBinding.errors).map(err));
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * The single most important check in the project.
 *
 * `content/competence/taxonomy/id-registry.lock` records every ID ever issued. An ID that
 * disappears from the skeleton is a rename or a deletion, and either one breaks
 * every credential already issued against it — the holder of that credential is
 * harmed, and there is no way to repair it after the fact. Deprecate and
 * supersede instead; never remove.
 */
function checkIdRegistry(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  if (!corpus.taxonomy) return findings;

  const declared = allCorpusIds(corpus);
  const current = new Set(declared);

  // Splitting the taxonomy across per-domain files makes a collision possible
  // in a way a single file did not, so check for it explicitly.
  const duplicates = declared.filter((id, i) => i > 0 && declared[i - 1] === id);
  for (const id of new Set(duplicates)) {
    findings.push(err(`ID '${id}' is declared more than once across content/competence/taxonomy/domains/`));
  }

  if (corpus.lockedIds === null) {
    findings.push(
      warn(
        `content/competence/taxonomy/id-registry.lock does not exist — run \`npm run registry:sync\` to create it. Until it exists, nothing prevents an ID from being silently renamed.`,
      ),
    );
    return findings;
  }

  for (const id of corpus.lockedIds) {
    if (!current.has(id)) {
      findings.push(
        err(
          `ID '${id}' is in the lock file but no longer in the skeleton. IDs are append-only: a credential attesting '${id}' must resolve forever. Restore it with status 'deprecated' and a 'supersededBy' pointer instead of removing it.`,
        ),
      );
    }
  }

  const locked = new Set(corpus.lockedIds);
  const added = [...current].filter((id) => !locked.has(id));
  if (added.length > 0) {
    findings.push(
      err(
        `${added.length} new ID(s) are not recorded in the lock file: ${added.slice(0, 8).join(', ')}${added.length > 8 ? ', …' : ''}. Run \`npm run registry:sync\` and commit the result so the addition is visible in review.`,
      ),
    );
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * Two elements with the same title.
 *
 * Not an error — an ID is what a credential names, and two identically titled
 * elements are still two distinct competences. It is a WARNING because a human
 * cannot tell them apart. "Immersion depth and stem conduction error" appeared
 * as both a foundational temperature element and a thermocouple-calibration
 * element; a reader handed either one has no way to know which competence was
 * attested without resolving the ID against the corpus.
 *
 * Added after the same defect was found twice by ad-hoc script during a large
 * generated build-out. A check that has to be remembered is a check that stops
 * being run, and this corpus is now well past the size where a person notices
 * a collision by reading.
 */
function checkDuplicateTitles(corpus: Corpus): Finding[] {
  const byTitle = new Map<string, string[]>();

  for (const stub of indexStubs(corpus.taxonomy).values()) {
    // Internal whitespace collapsed too: a title differing only by a double
    // space is the same title to every reader, and comparing raw strings would
    // let that pair through. The test for this check found exactly that.
    const key = stub.title.trim().replace(/\s+/g, ' ').toLowerCase();
    const ids = byTitle.get(key) ?? [];
    ids.push(stub.id);
    byTitle.set(key, ids);
  }

  const findings: Finding[] = [];
  for (const [, ids] of byTitle) {
    if (ids.length < 2) continue;
    findings.push(
      warn(
        `${ids.join(' and ')} share an element title. Both remain distinct competences, but a reader cannot tell which one a credential names — retitle one so the difference is visible in the words.`,
      ),
    );
  }
  return findings;
}

/* ------------------------------------------------------------------------ */

function checkElementIntegrity(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const stubs = indexStubs(corpus.taxonomy);
  const sources = indexSources(corpus.sources);
  const roles = roleIds(corpus.roles);
  const seen = new Map<string, string>();

  for (const element of corpus.elements) {
    const d = element.data as Record<string, any>;
    const id: string | undefined = d.id;
    const at = (msg: string) => `${element.path}: ${msg}`;

    if (!id) continue; // schema check already reported this

    const duplicate = seen.get(id);
    if (duplicate) {
      findings.push(err(at(`element ID '${id}' is also defined in ${duplicate}`)));
    }
    seen.set(id, element.path);

    // -- Skeleton correspondence -----------------------------------------
    const stub = stubs.get(id);
    if (!stub) {
      findings.push(
        err(at(`'${id}' has no entry in the taxonomy skeleton. Every element must be registered there first.`)),
      );
    } else {
      if (d.levelCeiling !== stub.levelCeiling) {
        findings.push(
          err(at(`levelCeiling ${d.levelCeiling} disagrees with the skeleton's ${stub.levelCeiling}`)),
        );
      }
      if (d.kind !== stub.kind) {
        findings.push(
          err(at(`kind '${d.kind}' disagrees with the skeleton's '${stub.kind}'. Kind determines what evidence proves attainment, so a mismatch means the anchors and the assessment are describing different things.`)),
        );
      }
      if (d.domain !== stub.domain) {
        findings.push(err(at(`domain '${d.domain}' disagrees with the skeleton's '${stub.domain}'`)));
      }
      if (d.competencyArea !== stub.competencyArea) {
        findings.push(
          err(at(`competencyArea '${d.competencyArea}' disagrees with the skeleton's '${stub.competencyArea}'`)),
        );
      }
    }

    // -- Proficiency anchors ---------------------------------------------
    const ceiling: number = d.levelCeiling ?? 0;
    const anchors = (d.anchors ?? {}) as Record<string, string>;
    for (let level = 1; level <= ceiling; level++) {
      if (!anchors[String(level)]) {
        findings.push(
          err(at(`missing observable anchor for level ${level}. Every attainable level needs one — a level nobody can define an observation for cannot be assessed.`)),
        );
      }
    }
    for (const level of Object.keys(anchors)) {
      if (Number(level) > ceiling) {
        findings.push(err(at(`has an anchor for level ${level} but levelCeiling is ${ceiling}`)));
      }
    }

    // Phrasing that cannot be observed, at any kind.
    //
    // These describe a state of mind. Two assessors will not agree on them,
    // and no item can test them — an anchor built from them is unassessable
    // however carefully the rest of the element is written. The last two are
    // worse than vague: they restate the level's own name instead of saying
    // what the person does at it.
    //
    // A lint, not a judgement. Passing it does not make an anchor observable;
    // it only rules out the phrases that guarantee it is not.
    for (const [level, text] of Object.entries(anchors)) {
      for (const phrase of UNOBSERVABLE_PHRASES) {
        if (new RegExp(`\\b${phrase}\\b`, 'i').test(String(text ?? ''))) {
          findings.push(
            err(at(`anchor for level ${level} says '${phrase}', which nobody can observe. Say what the person does — see docs/anchor-template.md.`)),
          );
        }
      }
    }

    // -- Role targets ------------------------------------------------------
    const targets = (d.roleTargets ?? {}) as Record<string, number | null>;
    for (const role of roles) {
      if (!(role in targets)) {
        findings.push(
          err(at(`roleTargets is missing '${role}'. Use null for genuinely not-applicable — silence and N/A are different claims.`)),
        );
      }
    }
    for (const [role, target] of Object.entries(targets)) {
      if (roles.length > 0 && !roles.includes(role)) {
        findings.push(err(at(`roleTargets references unknown role '${role}'`)));
      }
      if (typeof target === 'number' && target > ceiling) {
        findings.push(
          err(at(`role '${role}' targets level ${target} but the element's ceiling is ${ceiling}`)),
        );
      }
    }

    // -- Citations ---------------------------------------------------------
    const citations = (d.citations ?? []) as Array<Record<string, any>>;
    if (citations.length === 0) {
      findings.push(err(at('has no citations. Referenceability is mandatory for every element.')));
    }
    for (const citation of citations) {
      if (!sources.has(citation.source)) {
        findings.push(
          err(at(`cites unregistered source '${citation.source}'. Add it to content/sources/registry.yaml first.`)),
        );
      }
    }

    // -- Quotations --------------------------------------------------------
    const quotes = (d.quotes ?? []) as Array<Record<string, any>>;
    const perSource = new Map<string, number>();

    for (const quote of quotes) {
      const source = sources.get(quote.source);
      if (!source) {
        findings.push(err(at(`quotes unregistered source '${quote.source}'`)));
        continue;
      }

      const rules = source.quotation ?? { permitted: false };
      const label = `${source.designation} §${quote.clause}`;

      if (!rules.permitted) {
        findings.push(
          err(at(`quotes ${label}, but that source is Tier ${source.tier} — reference only, no quotation. Cite the clause and explain it in your own words.`)),
        );
        continue;
      }

      // The register may record limits for a source whose terms counsel has not
      // yet confirmed. Those limits describe the intended ceiling once review
      // completes; until then nothing may be quoted at all. Without this the
      // CONFIRM-WITH-COUNSEL marker is prose in `notes` that no code reads,
      // while the machine-readable limits beside it say quotation is fine.
      if (rules.blockedPendingCounsel) {
        findings.push(
          err(at(`quotes ${label}, but legal review of that source's terms is not complete (blockedPendingCounsel). Cite the clause instead — citations are never restricted.`)),
        );
        continue;
      }

      const words = wordCount(String(quote.text ?? ''));
      if (rules.maxWordsPerQuote !== undefined && words > rules.maxWordsPerQuote) {
        findings.push(
          err(at(`quotation from ${label} is ${words} words; the register allows ${rules.maxWordsPerQuote}`)),
        );
      }

      if (rules.requiresCommentary !== false && !String(quote.commentary ?? '').trim()) {
        findings.push(
          err(at(`quotation from ${label} has no commentary. Restricted quotation must accompany your own analysis, never substitute for the clause.`)),
        );
      }

      const count = (perSource.get(quote.source) ?? 0) + 1;
      perSource.set(quote.source, count);
      if (rules.maxQuotesPerElement !== undefined && count > rules.maxQuotesPerElement) {
        findings.push(
          err(at(`has ${count} quotations from ${source.designation}; the register allows ${rules.maxQuotesPerElement} per element`)),
        );
      }
    }

    // -- Deprecation -------------------------------------------------------
    if (d.status === 'deprecated' && d.supersededBy && !stubs.has(d.supersededBy)) {
      findings.push(err(at(`supersededBy points at '${d.supersededBy}', which is not in the skeleton`)));
    }

    // -- Cross-references --------------------------------------------------
    for (const field of ['prerequisites', 'relatedElements'] as const) {
      for (const ref of (d[field] ?? []) as string[]) {
        if (ref === id) {
          findings.push(err(at(`lists itself in ${field}`)));
        } else if (!stubs.has(ref)) {
          findings.push(err(at(`${field} references unknown element '${ref}'`)));
        }
      }
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * A cycle in the prerequisite graph means a learner can never legitimately
 * start: A requires B requires A. Reported with the actual cycle, because
 * "there is a cycle somewhere in 2000 elements" is not actionable.
 */
function checkPrerequisiteGraph(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const graph = new Map<string, string[]>();

  for (const element of corpus.elements) {
    const d = element.data as Record<string, any>;
    if (d.id) graph.set(d.id, ((d.prerequisites ?? []) as string[]).filter((p) => p !== d.id));
  }

  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const reported = new Set<string>();

  const visit = (node: string): void => {
    const status = state.get(node);
    if (status === 'done') return;

    if (status === 'visiting') {
      const cycle = stack.slice(stack.indexOf(node)).concat(node);
      const key = [...cycle].sort().join('|');
      if (!reported.has(key)) {
        reported.add(key);
        findings.push(
          err(`prerequisite cycle: ${cycle.join(' → ')}. No learner can enter this loop; break it by removing one dependency.`),
        );
      }
      return;
    }

    state.set(node, 'visiting');
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (graph.has(next)) visit(next);
    }
    stack.pop();
    state.set(node, 'done');
  };

  for (const node of graph.keys()) visit(node);

  /*
   * A role cannot be required to hold an element whose prerequisite that same
   * role can never need.
   *
   * `null` is not "low priority" — per rule 10 it says the element could never
   * be that role's work in ANY deployment, and it removes the requirement at
   * every level. So a numeric target on X plus `null` on a prerequisite of X
   * asserts two incompatible things: that the role must reach X, and that the
   * route into X is permanently outside its work. Gap analysis then reports the
   * role as deficient on X while never surfacing the thing X is built on, and a
   * supervisor reading that output trains the wrong element.
   *
   * Checked only where the prerequisite is authored. An unauthored prerequisite
   * has no roleTargets to disagree with, so this necessarily grows in reach as
   * the corpus fills in — which is the point of doing it in CI rather than by
   * hand across 5407 elements.
   */
  const authored = new Map<string, { targets: Record<string, number | null>; path: string }>();
  for (const element of corpus.elements) {
    const d = element.data as Record<string, any>;
    if (d.id) {
      authored.set(d.id, { targets: (d.roleTargets ?? {}) as Record<string, number | null>, path: element.path });
    }
  }

  for (const element of corpus.elements) {
    const d = element.data as Record<string, any>;
    const targets = (d.roleTargets ?? {}) as Record<string, number | null>;

    for (const prerequisite of (d.prerequisites ?? []) as string[]) {
      const prior = authored.get(prerequisite);
      if (!prior) continue;

      for (const [role, target] of Object.entries(targets)) {
        if (typeof target !== 'number') continue;
        if (!(role in prior.targets)) continue;
        if (prior.targets[role] !== null) continue;

        findings.push(
          err(
            `${element.path}: role '${role}' targets level ${target} on ${d.id}, but its prerequisite ${prerequisite} is null for that role — asserting the route into it is never that role's work. Set a target on ${prerequisite}, or null on ${d.id}.`,
          ),
        );
      }
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * The BOK, and the link from a competence claim to the knowledge behind it.
 *
 * The link is the point. Someone who demonstrated competence eight months ago
 * and has forgotten one detail will not retrain — they will look it up. If the
 * knowledgeRef does not resolve, that path dies silently for exactly the person
 * who most needs it, and nothing else in the system notices.
 *
 * Sections are checked in both directions for the same reason placeholders are
 * checked in both directions on an archetype: a declared section with no anchor
 * is an unreachable reference, and an anchor nobody declared is a heading that
 * can be renamed without anyone noticing it was load-bearing.
 */
function checkBok(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const bokCohortDids = new Set(
    ((corpus.bootstrapCohort?.members ?? []) as Array<Record<string, any>>)
      .map((m) => String(m?.did ?? '').trim())
      .filter((did) => did.length > 0),
  );
  const articles = new Map<string, { path: string; sections: Set<string> }>();
  const seen = new Map<string, string>();

  for (const article of corpus.bok) {
    const d = article.data as Record<string, any>;
    const at = (msg: string) => `${article.path}: ${msg}`;
    const id: string | undefined = d.id;
    if (!id) continue;

    const duplicate = seen.get(id);
    if (duplicate) findings.push(err(at(`article ID '${id}' is also defined in ${duplicate}`)));
    seen.set(id, article.path);

    const declared = new Set<string>(
      ((d.sections ?? []) as Array<Record<string, any>>).map((s) => s?.id).filter(Boolean),
    );
    const anchored = new Set(
      [...article.body.matchAll(/\{#(s[0-9]{2})\}/g)].map((m) => m[1]!),
    );

    for (const section of declared) {
      if (!anchored.has(section)) {
        findings.push(
          err(at(`section '${section}' is declared but has no {#${section}} anchor in the body. An element pointing at it would resolve to nothing.`)),
        );
      }
    }
    for (const section of anchored) {
      if (!declared.has(section)) {
        findings.push(
          err(at(`the body anchors '{#${section}}' but no such section is declared. Undeclared anchors get renamed by people who cannot see that anything depends on them.`)),
        );
      }
    }

    for (const section of (d.sections ?? []) as Array<Record<string, any>>) {
      // Flagging controversy without describing it leaves a reader worse off
      // than saying nothing: they know not to trust the passage, and still
      // cannot act.
      const contested = ['contested', 'jurisdiction-dependent', 'organization-specific'];
      if (contested.includes(section?.consensus) && (section?.alternativeViews ?? []).length === 0) {
        findings.push(
          err(at(`section '${section.id}' is marked '${section.consensus}' but records no alternativeViews. Say what the other position is and why it is held, or do not flag it.`)),
        );
      }

      /*
       * `contested` says practitioners disagree. It does not say where the
       * disagreement lives, and the four cases are not interchangeable to
       * anyone deciding what to do next — nor to the tooling that decides when
       * to wake a section for review.
       *
       * A section contested because its source contradicts itself, or admits
       * two readings, is precisely what a revision of that source may resolve,
       * so it should wake on one. A section contested because no source reaches
       * the question would not be, and waking it wastes the reviewer. Without
       * this field the two are indistinguishable and the trigger of open
       * decision 12 cannot be built correctly.
       *
       * Required for `contested` only. `jurisdiction-dependent` and
       * `organization-specific` already say where the disagreement lives.
       */
      if (section?.consensus === 'contested' && !section?.contestedBasis) {
        findings.push(
          err(at(`section '${section.id}' is marked 'contested' with no contestedBasis. Say whether the source is silent, ambiguous, self-conflicting, or clear-but-widely-departed-from — they call for different things from a reader, and only one of them is settled by a revision.`)),
        );
      }

      if (section?.deprecated && !section?.supersededBy) {
        findings.push(
          err(at(`section '${section.id}' is deprecated with no supersededBy. A reader following an old reference must land somewhere that tells them what changed.`)),
        );
      }
    }

    // -- Review provenance -------------------------------------------------
    // A review is an attestation about specific prose at a specific moment.
    // Once the prose changes, the attestation no longer covers what is there,
    // and letting it stand would put a named practitioner's endorsement on
    // words they never read.
    for (const review of (d.reviews ?? []) as Array<Record<string, any>>) {
      const who = review?.reviewer?.name ?? 'unknown reviewer';

      findings.push(...reviewStandingFindings(review, who, at, bokCohortDids));

      for (const covered of (review?.covers ?? []) as Array<Record<string, any>>) {
        if (!declared.has(covered?.section)) {
          findings.push(
            err(at(`review by ${who} covers section '${covered?.section}', which this article does not declare`)),
          );
          continue;
        }

        const current = sectionHash({ id, body: article.body, sections: d.sections }, covered.section);
        if (current !== null && current !== covered.sectionRef) {
          findings.push(
            warn(at(`section '${covered.section}' has been rewritten since ${who} reviewed it on ${review.reviewedOn}. That review no longer covers what is there — re-review, or narrow its scope.`)),
          );
        }
      }
    }

    articles.set(id, { path: article.path, sections: declared });
  }

  // -- Every element must reach the knowledge behind it ---------------------
  const referenced = new Set<string>();

  for (const element of corpus.elements) {
    const d = element.data as Record<string, any>;
    const at = (msg: string) => `${element.path}: ${msg}`;

    for (const ref of (d.knowledgeRefs ?? []) as Array<Record<string, any>>) {
      const article = articles.get(ref?.article);
      if (!article) {
        findings.push(err(at(`knowledgeRef points at unknown article '${ref?.article}'`)));
        continue;
      }
      referenced.add(ref.article);
      if (!article.sections.has(ref?.section)) {
        findings.push(
          err(at(`knowledgeRef points at '${ref.article}#${ref?.section}', which that article does not declare. This is the refresher path for someone who has forgotten a detail; broken, it fails silently.`)),
        );
      }
    }
  }

  // Warn rather than error: the BOK is allowed to exceed the taxonomy. Context
  // and background articles that no element assesses are legitimate, and an
  // encyclopedia constrained to exactly what is examinable is not one.
  for (const [id, article] of articles) {
    if (!referenced.has(id) && corpus.elements.length > 0) {
      findings.push(
        warn(`${article.path}: article '${id}' is not referenced by any element. Legitimate for background material; check it is not an orphan.`),
      );
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * Reviewer standing, on an article review or an element review alike.
 *
 * `reviewer` is a name and an optional DID. Without `standing`, the corpus can
 * establish that X reviewed a section on a date and cannot establish that X had
 * any standing to review it — the exact gap decision 47 closed for credential
 * signers, where an unbacked `heldLevel: 4` stopped counting as evidence of
 * anything. The rule had never been applied to the people reviewing the corpus
 * itself, which is the half of the project that decides what everybody else is
 * assessed against.
 *
 * TWO OF THE THREE BASES RESOLVE AND ONE DOES NOT, and the checks here exist to
 * stop the three being indistinguishable. Nothing can prove a `stated` basis;
 * what a reader gets is the knowledge that it is stated rather than resolvable,
 * and something substantive to weigh. `stated` is the only basis available while
 * nobody holds a credential and the cohort convenes nobody, so it is the normal
 * case rather than the degraded one.
 *
 * Standing is OPTIONAL in general. An editorial review recorded for the audit
 * trail needs no case made for it, and requiring one everywhere would make
 * recording a review harder than not recording it — which is how review records
 * stop being written. It is required only where a claim rests on it.
 */
function reviewStandingFindings(
  review: Record<string, any>,
  who: string,
  at: (msg: string) => string,
  cohortDids: Set<string>,
): Finding[] {
  const standing = review?.standing as Record<string, any> | undefined;
  if (standing === undefined) return [];

  const findings: Finding[] = [];
  const basis = String(standing.basis);

  // Overstating is refused; this is `provenanceTier`'s rule in a second place.
  // Claiming the resolvable basis without the thing that resolves it is worse
  // than claiming nothing, because it reads as evidence and is not.
  if (basis === 'held-credential') {
    const named = String(standing.credentialId ?? '').trim().length > 0;
    const pinned = String(standing.credentialRef ?? '').trim().length > 0;
    if (!named || !pinned) {
      findings.push(
        err(at(`review by ${who} claims standing from a held credential without both naming and pinning it. The resolvable basis may not be claimed without the thing that resolves it.`)),
      );
    }
  }

  // Membership resolves against the published roster or it is not membership —
  // decision 8b, reaching the reviewer. The shipped roster convenes nobody, so
  // this basis correctly resolves for no one today.
  if (basis === 'founding-cohort') {
    const did = String(review?.reviewer?.did ?? '').trim();
    if (did.length === 0) {
      findings.push(
        err(at(`review by ${who} claims founding-cohort standing, but the reviewer carries no did, so there is nothing to resolve against the roster.`)),
      );
    } else if (!cohortDids.has(did)) {
      findings.push(
        err(at(`review by ${who} claims founding-cohort standing, and ${did} is not on the roster in content/competence/bootstrap-cohort.yaml.`)),
      );
    }
  }

  if (basis === 'stated' && String(standing.statement ?? '').trim().length === 0) {
    findings.push(
      err(at(`review by ${who} states external standing without saying what it is. A reader weighs a stated basis rather than resolving it, and there is nothing here to weigh.`)),
    );
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * Element review provenance, and the gold reference that rests on it.
 *
 * THE DEFECT THIS CLOSES. `authoring.goldReference` was a bare boolean. An
 * author could mark their own element as the exemplar every other element is
 * held to, with no review recorded anywhere, and nothing would object. That is
 * the shape decision 8b removed from `bootstrapAuthority` — a field a person
 * writes about their own standing — and it is the shape `bok-article` refuses
 * BY NAME when it says there is deliberately no `authoritative: true` field,
 * because content asserting its own authority is the "trust me" problem this
 * project exists to solve. The article schema said it and the element schema
 * did the opposite.
 *
 * WHY THE ANSWER IS NOT A STEWARD-CONTROLLED ROSTER. That was the obvious read
 * of decision 8b, and it is wrong here. A bootstrap cohort publishes because a
 * VERIFIER has to resolve it offline; a gold reference never leaves the project
 * and no verifier ever asks about one. Worse, steward appointment is blocked
 * with no timetable, and Phase 3's deliverable IS the gold reference set — so
 * gating designation on stewards would have made the control a blocker on the
 * critical path. Derived-from-review needs nobody appointed.
 *
 * WHAT MAKES IT DERIVABLE. Elements had no review provenance at all:
 * `authoring.lastReviewedOn` is a date with nobody attached to it, recording
 * that somebody looked but not who, not at what, and not what they concluded.
 * So `reviews` is the mechanism and the gold reference is a consequence of it,
 * rather than a second parallel record that exists only to justify a flag.
 *
 * THE PIN IS THE SAME ONE A CREDENTIAL USES. A review covers LEVELS, each
 * pinned with `elementDefinitionHash`, so a review and a credential go stale on
 * exactly the same edits and neither is disturbed by a typo fix. That is what
 * turns "gold references are changed reluctantly" from a wish in the playbook
 * into something that happens: rewrite an anchor and the gold status lapses
 * until somebody reviews it again.
 */
function checkElementReviews(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];

  // `editorial` is deliberately not here. A copy-edit is worth recording and is
  // not evidence that an element is exemplary, which is the whole reason the
  // three review types are kept apart.
  const QUALIFYING_TYPE = new Set(['technical', 'assessment']);
  const QUALIFYING_DISPOSITION = new Set(['accepted', 'accepted-with-changes']);
  const norm = (name: unknown): string => String(name ?? '').trim().toLowerCase();

  const cohortDids = new Set(
    ((corpus.bootstrapCohort?.members ?? []) as Array<Record<string, any>>)
      .map((m) => String(m?.did ?? '').trim())
      .filter((did) => did.length > 0),
  );

  for (const file of corpus.elements) {
    const d = file.data as Record<string, any>;
    const at = (msg: string) => `${file.path}: ${msg}`;
    if (!d.id) continue;

    const authoring = (d.authoring ?? {}) as Record<string, any>;
    const gold = authoring.goldReference === true;
    const authors = new Set(
      ((authoring.authors ?? []) as Array<Record<string, any>>)
        .map((a) => norm(a?.name))
        .filter((n) => n.length > 0),
    );
    const ceiling = typeof d.levelCeiling === 'number' ? d.levelCeiling : 0;

    // Levels a qualifying review still covers, as the element stands today.
    const supported = new Set<number>();

    for (const review of (d.reviews ?? []) as Array<Record<string, any>>) {
      const who = review?.reviewer?.name ?? 'unknown reviewer';
      const selfReview = authors.has(norm(review?.reviewer?.name));

      // No-self-signoff, reaching the corpus. The credential model has always
      // refused to let somebody attest their own competence; nothing stopped
      // an author attesting the quality of their own element.
      if (selfReview) {
        findings.push(
          err(at(`review by ${who} names one of this element's own authors. An author reviewing their own work is not a review — it is the assertion a review exists to test.`)),
        );
      }

      if (
        (review?.disposition === 'disputed' || review?.disposition === 'rejected') &&
        String(review?.note ?? '').trim().length === 0
      ) {
        findings.push(
          err(at(`review by ${who} is '${review.disposition}' with no note. A disagreement with no stated substance is unusable to a reader and unfair to the author.`)),
        );
      }

      findings.push(...reviewStandingFindings(review, who, at, cohortDids));

      const qualifiesOnMerit =
        !selfReview &&
        QUALIFYING_TYPE.has(String(review?.reviewType)) &&
        QUALIFYING_DISPOSITION.has(String(review?.disposition));

      // The exemplar the whole corpus is held to may not rest on a name alone.
      // Satisfiable today with a `stated` basis, so this asks for the case to
      // be written down rather than for standing nobody can currently hold.
      const hasStanding = review?.standing !== undefined;
      if (gold && qualifiesOnMerit && !hasStanding) {
        findings.push(
          err(at(`review by ${who} would carry this element's gold reference, but records no standing for its reviewer. A reader can weigh a stated basis; they cannot weigh a name.`)),
        );
      }

      const qualifies = qualifiesOnMerit && hasStanding;

      for (const covered of (review?.covers ?? []) as Array<Record<string, any>>) {
        const level = covered?.level;
        if (typeof level !== 'number') continue;

        if (level > ceiling) {
          findings.push(
            err(at(`review by ${who} covers L${level}, above this element's ceiling of ${ceiling}. There is nothing at that level for anybody to have reviewed.`)),
          );
          continue;
        }

        if (elementDefinitionHash(d as ElementLike, level) !== covered?.definitionRef) {
          findings.push(
            warn(at(`L${level} has changed since ${who} reviewed it on ${review?.reviewedOn}. That review no longer covers what is there — re-review it, or narrow its scope.`)),
          );
          continue;
        }

        if (qualifies) supported.add(level);
      }
    }

    if (!gold) continue;

    if (authors.size === 0) {
      findings.push(
        err(at(`is marked goldReference with no authoring.authors. Whether the reviewer is one of the authors cannot be decided against an element that names none, and an exemplar nobody will put their name to is not one.`)),
      );
    }

    const missing: number[] = [];
    for (let level = 1; level <= ceiling; level += 1) {
      if (!supported.has(level)) missing.push(level);
    }

    if (missing.length > 0) {
      findings.push(
        err(at(`is marked goldReference, but ${missing.map((l) => `L${l}`).join(', ')} ${missing.length === 1 ? 'is' : 'are'} not covered by a current, accepted technical or assessment review from somebody who is not an author. A reviewer who saw three rungs of a five-rung ladder has not made the top two exemplary — gold reference is evidenced, not declared.`)),
      );
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * Training modules.
 *
 * The rule doing the work here: a module that prepares for an element whose
 * `demonstration` is `equipment` must declare that the element still needs
 * physical demonstration. Such an element is evidenced by witnessed work on
 * real apparatus, so a module claiming to finish one by simulation is asserting
 * that a simulation substitutes for the bench. It does not — and the failure
 * would be invisible, because the module would look complete and the learner
 * would believe they had finished something they have never actually done.
 *
 * THE TEST IS `demonstration`, NOT `kind`. `skill` means the evidence is
 * observable performance rather than explanation; it does not mean the
 * performance happens at a bench. Constructing an uncertainty budget is a skill
 * and is desk work, and declaring a bench blocker for it tells a learner they
 * are waiting for access they never needed. Both directions are errors below:
 * inventing a barrier is as wrong as hiding one.
 *
 * What the learner gets instead is `pending-demonstration`: the knowledge is
 * done, the demonstration is not. The requirement to perform the work on real
 * equipment is a property of the competence, not a barrier to be dissolved —
 * this state just records position honestly, so nobody mistakes preparation
 * for attainment.
 */
function checkModules(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const stubs = indexStubs(corpus.taxonomy);
  const authoredElements = new Map<string, Record<string, unknown>>(
    corpus.elements
      .map((e) => e.data as Record<string, any>)
      .filter((d) => d.id)
      .map((d) => [d.id as string, d]),
  );
  const seen = new Map<string, string>();

  const articles = new Map<string, Set<string>>();
  for (const article of corpus.bok) {
    const d = article.data as Record<string, any>;
    if (!d.id) continue;
    articles.set(
      d.id,
      new Set(((d.sections ?? []) as Array<Record<string, any>>).map((s) => s?.id).filter(Boolean)),
    );
  }

  for (const file of corpus.modules) {
    const d = file.data as Record<string, any>;
    const at = (msg: string) => `${file.path}: ${msg}`;
    if (!d.id) continue;

    const duplicate = seen.get(d.id);
    if (duplicate) findings.push(err(at(`module ID '${d.id}' is also defined in ${duplicate}`)));
    seen.set(d.id, file.path);

    // A module teaches the BOK. Teaching material that exists only inside a
    // module is knowledge the corpus has lost.
    for (const ref of (d.knowledgeRefs ?? []) as Array<Record<string, any>>) {
      const sections = articles.get(ref?.article);
      if (!sections) {
        findings.push(err(at(`knowledgeRef points at unknown article '${ref?.article}'`)));
      } else if (!sections.has(ref?.section)) {
        findings.push(err(at(`knowledgeRef points at '${ref.article}#${ref?.section}', which that article does not declare`)));
      }
    }

    const physical = new Set((d.requiresPhysicalDemonstration ?? []) as string[]);

    for (const target of (d.preparesFor ?? []) as Array<Record<string, any>>) {
      const stub = stubs.get(target?.element);
      if (!stub) {
        findings.push(err(at(`preparesFor names unknown element '${target?.element}'`)));
        continue;
      }

      if (typeof target.level === 'number' && target.level > stub.levelCeiling) {
        findings.push(
          err(at(`preparesFor ${target.element} at L${target.level}, above its ceiling of ${stub.levelCeiling}`)),
        );
      }

      // Keyed off the ELEMENT's declared ROUTES, not its kind. `skill` means
      // the evidence is observable performance rather than explanation; it
      // does not mean the performance happens at a bench. Constructing an
      // uncertainty budget is a skill and is desk work.
      //
      // Getting this wrong in either direction invents or hides a barrier:
      // omitting an equipment target tells a learner a simulation finished
      // something it cannot, and listing a desk target tells them they are
      // blocked on access they never needed.
      const authored = authoredElements.get(target.element);
      // Undefined when the element has no authored definition — and that is
      // NOT the same as ['desk']. Defaulting an unknown to desk would silently
      // hide a real equipment blocker on a skill element nobody has written up
      // yet, which is the direction that harms a learner.
      const routes = authored ? demonstrationRoutes(authored) : undefined;
      const listed = physical.has(target.element);
      const declaredRoute = target.route as string | undefined;

      if (stub.kind === 'skill' && routes === undefined) {
        // Unknown, and the two readings are not equally safe. Listing it is the
        // cautious one and is accepted; omitting it may hide a real blocker, so
        // that is the one that gets named.
        findings.push(
          physical.has(target.element)
            ? warn(at(`prepares for skill element '${target.element}', which has no authored definition. Its demonstration mode is unknown, so listing it in requiresPhysicalDemonstration is accepted as the cautious reading — revisit it when the element is authored, and remove it if the demonstration turns out to be desk work.`))
            : warn(at(`prepares for skill element '${target.element}', which has no authored definition, so its demonstration mode is unknown and the physical-demonstration requirement cannot be checked.`)),
        );
      }

      // `routes === undefined` is deliberately NOT swept into the checks below.
      // It means the element has no authored definition, and an earlier version
      // of this code read `mode !== 'equipment'`, which caught that case and
      // told the author "its demonstration mode is 'undefined' — no equipment
      // is needed": an assertion that no equipment is needed, made immediately
      // after warning that the mode is unknown. It left omission as the only
      // permitted move on an unauthored element, which is the direction that
      // hides a blocker — exactly what refusing to default it to desk avoids.
      if (routes !== undefined) {
        // Two routes means the element admits both and the competence is the
        // same in either: which one is available is a property of the
        // LABORATORY rather than of the element.
        const multi = routes.length > 1;

        // A module states its route ONLY where the element leaves the question
        // open. Where the element declares a single route it has already
        // answered it, and a restatement is a second copy of one fact that can
        // fall out of agreement with the element after an edit — an author
        // reading the two files would then be told different things by each,
        // with nothing saying which one the validator believes.
        if (!multi && declaredRoute !== undefined) {
          findings.push(
            err(at(`states route '${declaredRoute}' for '${target.element}', which declares exactly one route ('${routes[0]}'). The element already answers this, and restating it here is a second copy of one fact that can drift out of agreement with it.`)),
          );
        }

        // ...and MUST state it where the element does not. Both routes are
        // admissible for such an element, so neither listing the target nor
        // omitting it is inherently wrong, and a module that said nothing would
        // validate cleanly while leaving a learner bound for the bench with no
        // warning that access is coming. The choice may not be made by silence.
        if (multi && declaredRoute === undefined) {
          findings.push(
            err(at(`prepares for '${target.element}', which admits both a desk and an equipment route, without stating which one in the route field. Both are admissible for the element, so omission cannot be read as either — and read as desk work it would leave a learner who needs bench access unwarned.`)),
          );
        }

        // The route actually prepared: the module's choice where there is one
        // to make, and otherwise the single route the element declares.
        // Undefined only in the case reported directly above.
        const prepared = multi ? declaredRoute : routes[0];

        if (stub.kind === 'skill' && prepared === 'equipment' && !listed) {
          findings.push(
            err(at(`prepares '${target.element}' by the equipment route without listing it in requiresPhysicalDemonstration. A simulation does not substitute for witnessed work on real apparatus; training toward it leaves the element pending demonstration, not complete.`)),
          );
        }

        if (prepared !== undefined && prepared !== 'equipment' && listed) {
          const because = multi
            ? `this module prepares it by the '${prepared}' route`
            : `its only route is '${prepared}'`;
          findings.push(
            err(at(`lists '${target.element}' in requiresPhysicalDemonstration, but ${because} — no equipment is needed. Claiming a blocker that does not exist tells a learner they are waiting for access they never required.`)),
          );
        }
      }
    }

    for (const element of physical) {
      if (!((d.preparesFor ?? []) as Array<Record<string, any>>).some((t) => t?.element === element)) {
        findings.push(
          err(at(`requiresPhysicalDemonstration lists '${element}', which this module does not prepare for`)),
        );
      }
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * Item bank integrity.
 *
 * The economics of the bank — few archetypes, many bindings — are what make
 * 9096 assessable units tractable, and they are also what makes it fragile.
 * An excellent archetype and a well-formed binding can still combine into an
 * item that tests the archetype's generic shape rather than the element. No
 * validator can read prose and catch that, so the checks here enforce the
 * conditions under which it is at least POSSIBLE for the binding to be right,
 * and leave the judgement to binding review.
 *
 * The kind check is the one that earns its keep mechanically: binding a
 * knowledge-shaped archetype to a skill element produces a candidate who
 * explains the task instead of performing it, which is the commonest way an
 * assessment ends up measuring the wrong thing.
 */
function checkItemBank(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const stubs = indexStubs(corpus.taxonomy);
  const archetypes = indexArchetypes(corpus.archetypes);
  const seenArchetypes = new Map<string, string>();

  // -- Archetypes ----------------------------------------------------------
  for (const file of corpus.archetypes) {
    const d = file.data as Record<string, any>;
    const at = (msg: string) => `${file.path}: ${msg}`;
    if (!d.id) continue;

    const duplicate = seenArchetypes.get(d.id);
    if (duplicate) {
      findings.push(err(at(`archetype ID '${d.id}' is also defined in ${duplicate}`)));
    }
    seenArchetypes.set(d.id, file.path);

    // Parameters divide into two kinds and each fails silently in its own way.
    // A `prompt` parameter that never renders varies nothing. A `generator`
    // parameter that DOES render hands the candidate the answer — an item
    // whose prompt announces which defect was injected into the budget still
    // looks perfectly well-formed, which is why this is checked rather than
    // left to review.
    const params = (d.parameters ?? []) as Array<Record<string, any>>;
    const declared = new Map<string, string>(
      params.filter((p) => p?.name).map((p) => [p.name as string, (p.visibility ?? 'prompt') as string]),
    );
    const used = new Set(
      [...String(d.prompt ?? '').matchAll(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g)]
        .map((m) => m[1])
        .filter((name): name is string => Boolean(name)),
    );

    for (const name of used) {
      if (!declared.has(name)) {
        findings.push(
          err(at(`prompt uses {{${name}}}, which is not declared in parameters. It would render literally to the candidate.`)),
        );
      }
    }
    for (const [name, visibility] of declared) {
      if (visibility === 'prompt' && !used.has(name)) {
        findings.push(
          err(at(`parameter '${name}' is declared but never used in the prompt. A parameter nobody sees does not vary the item — mark it visibility 'generator' if it is meant to shape the artifact instead.`)),
        );
      }
      if (visibility === 'generator' && used.has(name)) {
        findings.push(
          err(at(`parameter '${name}' is a generator parameter but appears in the prompt as {{${name}}}. It shapes the artifact the candidate is given; rendering it tells them what to look for and destroys the item.`)),
        );
      }
    }

    // A judgment item without a rubric cannot be scored consistently by two
    // reviewers, and inter-rater reliability is what makes the credential
    // survive an accreditation audit.
    const method: string | undefined = d.scoring?.method;
    const rubricRef = String(d.scoring?.rubricRef ?? '').trim();
    if ((method === 'rubric' || method === 'hybrid') && !rubricRef) {
      findings.push(
        err(at(`scoring method is '${method}' but no rubricRef is given. Every non-auto-scored item ships with its rubric in the same commit.`)),
      );
    }
    // A dangling rubricRef satisfies the schema and still leaves an item no
    // reviewer can score consistently.
    if (rubricRef && !existsSync(join(REPO_ROOT, rubricRef))) {
      findings.push(err(at(`rubricRef '${rubricRef}' does not exist`)));
    }
  }

  // -- Bindings ------------------------------------------------------------
  const seenUnits = new Map<string, string>();

  /*
   * Which elements rest on knowledge the profession genuinely disputes.
   *
   * A rubric scoring a contested question is the one validity defect that
   * reads perfectly well on the page: it credits agreement with its author
   * rather than competence, and nothing about the wording gives it away. The
   * candidate who takes the other side and defends it from the records is
   * marked down for being right in an unexpected direction.
   *
   * The obligation is DERIVED rather than declared, because an author who has
   * to remember to set a flag is the same arrangement that left
   * CONFIRM-WITH-COUNSEL unenforceable for months. The corpus already knows
   * which sections are disputed and which elements reach them.
   */
  const disputedSections = new Set<string>();
  for (const article of corpus.bok) {
    const a = article.data as Record<string, any>;
    for (const section of (a.sections ?? []) as Array<Record<string, any>>) {
      const consensus = section?.consensus ?? 'established';
      if (consensus !== 'established' && consensus !== 'broadly-accepted') {
        disputedSections.add(`${a.id}#${section?.id}`);
      }
    }
  }

  const elementsOnDisputedGround = new Map<string, string[]>();
  for (const element of corpus.elements) {
    const e = element.data as Record<string, any>;
    const reached = ((e.knowledgeRefs ?? []) as Array<Record<string, any>>)
      .map((ref) => `${ref?.article}#${ref?.section}`)
      .filter((key) => disputedSections.has(key));
    if (e.id && reached.length > 0) elementsOnDisputedGround.set(e.id, reached);
  }

  for (const file of corpus.bindings) {
    const d = file.data as Record<string, any>;
    const elementId: string | undefined = d.element;
    const at = (msg: string) => `${file.path}: ${msg}`;
    if (!elementId) continue;

    const stub = stubs.get(elementId);
    if (!stub) {
      findings.push(err(at(`binds unknown element '${elementId}'`)));
      continue;
    }

    for (const binding of (d.bindings ?? []) as Array<Record<string, any>>) {
      const level: number = binding?.level;
      const label = `${elementId} @ L${level}`;

      if (typeof level === 'number' && level > stub.levelCeiling) {
        findings.push(
          err(at(`${label} exceeds the element's ceiling of ${stub.levelCeiling}. There is no such assessable unit.`)),
        );
      }

      const disputed = elementsOnDisputedGround.get(elementId);
      if (disputed && !String(binding?.positionNeutrality ?? '').trim()) {
        findings.push(
          err(
            at(
              `${label} has no positionNeutrality, but this element rests on disputed knowledge (${disputed.join(', ')}). State what the scoring credits and what it must not — a rubric may credit recognising the disagreement, declaring a reading and following it consistently, never arriving at a particular position. If this level does not engage the disputed question, say that in one line.`,
            ),
          ),
        );
      }

      const key = `${elementId}@${level}:${binding?.archetype}`;
      const duplicate = seenUnits.get(key);
      if (duplicate) {
        findings.push(
          err(at(`${label} is bound to ${binding?.archetype} more than once (also ${duplicate}). Two bindings of one archetype to one unit serve the candidate the same shape twice.`)),
        );
      }
      seenUnits.set(key, file.path);

      const archetype = archetypes.get(binding?.archetype);
      if (!archetype) {
        findings.push(err(at(`${label} names unknown archetype '${binding?.archetype}'`)));
        continue;
      }

      if (!archetype.kinds.includes(stub.kind)) {
        findings.push(
          err(at(`${label} binds a '${stub.kind}' element to ${archetype.id}, which serves ${archetype.kinds.join('/')}. Kind determines what evidence proves attainment, so this asks the candidate for the wrong sort of thing entirely.`)),
        );
      }

      if (typeof level === 'number' && !archetype.levels.includes(level)) {
        findings.push(
          err(at(`${label} uses ${archetype.id}, which declares levels ${archetype.levels.join(', ')}`)),
        );
      }

      if (archetype.status === 'deprecated') {
        findings.push(
          warn(at(`${label} binds deprecated archetype ${archetype.id}. Existing credentials stay valid; rebind before authoring more against it.`)),
        );
      }

      for (const range of (binding?.parameterRanges ?? []) as Array<Record<string, any>>) {
        if (range?.name && !archetype.parameterNames.includes(range.name)) {
          findings.push(
            err(at(`${label} sets parameter '${range.name}', which ${archetype.id} does not declare`)),
          );
        }
      }
    }
  }

  return findings;
}

/* ------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------ */

/**
 * Where an evidence modality may legitimately be used.
 *
 * `witnessed-proficiency-test` is a satisfactory result in a proficiency test
 * or interlaboratory comparison, and it is the strongest objective evidence the
 * profession recognises — its comparison value is one the candidate's own
 * laboratory did not set. That is exactly why it cannot stand at L1 or L2:
 * those levels are witnessed observation of framed work, and a PT result is
 * neither framed nor observed. Admitting it there would let the strongest
 * available evidence be recorded against the weakest claim, which reads as a
 * promotion to anyone comparing two credentials.
 *
 * Checked rather than left to the comment beside it, because the comment is
 * prose no code reads — the same defect CONFIRM-WITH-COUNSEL had.
 */
function checkProficiencyPolicy(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  const levels = (corpus.proficiency?.levels ?? []) as Array<Record<string, any>>;

  for (const entry of levels) {
    const level = Number(entry?.level);
    const modality = (entry?.assessment?.modality ?? []) as string[];
    if (level <= 2 && modality.includes('witnessed-proficiency-test')) {
      findings.push(
        err(
          `content/competence/taxonomy/proficiency.yaml: L${level} admits 'witnessed-proficiency-test', but L1 and L2 are witnessed observation of framed work and a proficiency-test result is neither. It is admissible from L3 upward.`,
        ),
      );
    }
  }

  return findings;
}

export function runAllChecks(corpus: Corpus): Finding[] {
  return [
    ...checkSchemas(corpus),
    ...checkIdRegistry(corpus),
    ...checkDuplicateTitles(corpus),
    ...checkElementIntegrity(corpus),
    ...checkPrerequisiteGraph(corpus),
    ...checkElementReviews(corpus),
    ...checkBok(corpus),
    ...checkModules(corpus),
    ...checkItemBank(corpus),
    ...checkProficiencyPolicy(corpus),
  ];
}
