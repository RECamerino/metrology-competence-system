/**
 * Semantic checks — everything JSON Schema cannot express.
 *
 * Schema validation answers "is this file shaped correctly". These answer the
 * questions that actually protect the corpus: does every ID still exist, does
 * every citation resolve, is any quotation over its licensed limit, is the
 * prerequisite graph traversable.
 */

import {
  type Corpus,
  type ElementFile,
  allTaxonomyIds,
  indexSources,
  indexStubs,
  roleIds,
} from './corpus.ts';
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
    findings.push(warn('content/taxonomy/domains/ contains no domain files yet — skipped'));
  }
  for (const file of corpus.taxonomyFiles) {
    if (!validateTaxonomy(file.data)) {
      findings.push(...formatErrors(file.path, validateTaxonomy.errors).map(err));
    }
  }

  const registryFiles = [
    ['proficiency', corpus.proficiency, 'content/taxonomy/proficiency.yaml'],
    ['role-registry', corpus.roles, 'content/roles/registry.yaml'],
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

  return findings;
}

/* ------------------------------------------------------------------------ */

/**
 * The single most important check in the project.
 *
 * `content/taxonomy/id-registry.lock` records every ID ever issued. An ID that
 * disappears from the skeleton is a rename or a deletion, and either one breaks
 * every credential already issued against it — the holder of that credential is
 * harmed, and there is no way to repair it after the fact. Deprecate and
 * supersede instead; never remove.
 */
function checkIdRegistry(corpus: Corpus): Finding[] {
  const findings: Finding[] = [];
  if (!corpus.taxonomy) return findings;

  const declared = allTaxonomyIds(corpus.taxonomy);
  const current = new Set(declared);

  // Splitting the taxonomy across per-domain files makes a collision possible
  // in a way a single file did not, so check for it explicitly.
  const duplicates = declared.filter((id, i) => i > 0 && declared[i - 1] === id);
  for (const id of new Set(duplicates)) {
    findings.push(err(`ID '${id}' is declared more than once across content/taxonomy/domains/`));
  }

  if (corpus.lockedIds === null) {
    findings.push(
      warn(
        `content/taxonomy/id-registry.lock does not exist — run \`npm run registry:sync\` to create it. Until it exists, nothing prevents an ID from being silently renamed.`,
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

export function runAllChecks(corpus: Corpus): Finding[] {
  return [
    ...checkSchemas(corpus),
    ...checkIdRegistry(corpus),
    ...checkElementIntegrity(corpus),
    ...checkPrerequisiteGraph(corpus),
  ];
}
