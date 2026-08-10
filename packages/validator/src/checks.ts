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
import { sectionHash } from './definitions.ts';
import { formatErrors, validatorFor } from './schema.ts';

export interface Finding {
  level: 'error' | 'warn';
  message: string;
}

const err = (message: string): Finding => ({ level: 'error', message });
const warn = (message: string): Finding => ({ level: 'warn', message });

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

      for (const covered of (review?.covers ?? []) as Array<Record<string, any>>) {
        if (!declared.has(covered?.section)) {
          findings.push(
            err(at(`review by ${who} covers section '${covered?.section}', which this article does not declare`)),
          );
          continue;
        }

        const current = sectionHash(article.body, covered.section);
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
 * Training modules.
 *
 * The rule doing the work here: a module that prepares for a `skill` element
 * must declare that the element still needs physical demonstration. A skill is
 * evidenced by witnessed work on real equipment, so a module claiming to finish
 * one by simulation is asserting that a simulation substitutes for the bench.
 * It does not — and the failure would be invisible, because the module would
 * look complete and the learner would believe they had finished something they
 * have never actually done.
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

      if (stub.kind === 'skill' && !physical.has(target.element)) {
        findings.push(
          err(at(`prepares for '${target.element}', which is a skill element, without listing it in requiresPhysicalDemonstration. A skill is evidenced by witnessed work on real equipment; training toward one leaves it pending demonstration, not complete.`)),
        );
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

export function runAllChecks(corpus: Corpus): Finding[] {
  return [
    ...checkSchemas(corpus),
    ...checkIdRegistry(corpus),
    ...checkElementIntegrity(corpus),
    ...checkPrerequisiteGraph(corpus),
    ...checkBok(corpus),
    ...checkModules(corpus),
    ...checkItemBank(corpus),
  ];
}
