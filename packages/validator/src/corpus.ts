/**
 * Corpus loading.
 *
 * Reads the content tree from disk into plain objects. Deliberately does no
 * validation — loading and checking are separate so that a malformed file
 * produces a clear parse diagnostic rather than a confusing schema error.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');

export const PATHS = {
  schemas: join(REPO_ROOT, 'schemas'),
  content: join(REPO_ROOT, 'content'),
  /**
   * One file per domain. A single skeleton file at 2000+ elements would be
   * ten thousand lines and effectively unreviewable; split per domain, each
   * one diffs and reviews on its own. Each file is a complete taxonomy
   * document containing exactly one domain, so it validates against the same
   * schema, and the loader merges them into one view for everything
   * downstream.
   */
  /*
   * Two trees, deliberately.
   *
   * content/bok/ is the Body of Knowledge: encyclopedic reference material,
   * organised by SUBJECT, freely licensed and meant to be published and cited
   * on its own terms. content/competence/ is the system that assesses people:
   * taxonomy, elements, items, roles, training, signoff. They answer different
   * questions and age on different triggers — knowledge ages when a standard
   * is revised, competence expectations age when practice moves — and merging
   * them produced neither a usable encyclopedia nor a clean assessment model.
   *
   * content/sources/ sits outside both because both cite it.
   */
  bok: join(REPO_ROOT, 'content', 'bok'),
  taxonomyDir: join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains'),
  proficiency: join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'proficiency.yaml'),
  idLock: join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'id-registry.lock'),
  roles: join(REPO_ROOT, 'content', 'competence', 'roles', 'registry.yaml'),
  sources: join(REPO_ROOT, 'content', 'sources', 'registry.yaml'),
  elements: join(REPO_ROOT, 'content', 'competence', 'elements'),
  /**
   * The item bank, split the way its economics are split: few expensive
   * archetypes, many cheap bindings. An archetype is a reusable assessment
   * shape; a binding attaches one to a specific (element × level). See
   * decision 36 in docs/00-context.md.
   */
  archetypes: join(REPO_ROOT, 'content', 'competence', 'items', 'archetypes'),
  bindings: join(REPO_ROOT, 'content', 'competence', 'items', 'bindings'),
} as const;

/** A parsed element file: frontmatter plus the Markdown body beneath it. */
export interface ElementFile {
  /** Repo-relative path, always with forward slashes, for stable diagnostics. */
  path: string;
  data: Record<string, unknown>;
  body: string;
}

/** One per-domain taxonomy file, kept separate so diagnostics name the file. */
export interface TaxonomyFile {
  path: string;
  data: Record<string, unknown>;
}

/** A YAML file from the item bank — one archetype, or one element's bindings. */
export interface ItemFile {
  path: string;
  data: Record<string, unknown>;
}

export interface Corpus {
  /** All per-domain files merged into a single taxonomy document. */
  taxonomy: Record<string, unknown> | null;
  /** The same content unmerged, so schema errors can be attributed to a file. */
  taxonomyFiles: TaxonomyFile[];
  proficiency: Record<string, unknown> | null;
  roles: Record<string, unknown> | null;
  sources: Record<string, unknown> | null;
  elements: ElementFile[];
  /** BOK articles. Same frontmatter-plus-body shape as an element, different purpose. */
  bok: ElementFile[];
  archetypes: ItemFile[];
  bindings: ItemFile[];
  /** Every ID recorded in the lock file, or null when the lock does not exist yet. */
  lockedIds: string[] | null;
}

export function repoRelative(absolute: string): string {
  return relative(REPO_ROOT, absolute).split(sep).join('/');
}

function loadYamlFile(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  try {
    return (parseYaml(raw) ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`${repoRelative(path)}: YAML parse error — ${(err as Error).message}`);
  }
}

/**
 * Split `---\n<yaml>\n---\n<markdown>` into its two halves.
 *
 * Hand-rolled rather than pulled from a dependency: the format is trivial, and
 * every avoided dependency is one less thing to vendor for an air-gapped build.
 */
export function parseFrontmatter(raw: string, path: string): { data: Record<string, unknown>; body: string } {
  const normalised = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  if (!normalised.startsWith('---\n')) {
    throw new Error(`${path}: missing YAML frontmatter — the file must begin with a '---' line`);
  }

  const end = normalised.indexOf('\n---', 3);
  if (end === -1) {
    throw new Error(`${path}: frontmatter is not terminated by a closing '---' line`);
  }

  const yamlText = normalised.slice(4, end + 1);
  const body = normalised.slice(end + 4).replace(/^\n/, '');

  let data: Record<string, unknown>;
  try {
    data = (parseYaml(yamlText) ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`${path}: frontmatter YAML parse error — ${(err as Error).message}`);
  }

  return { data, body };
}

function walkFiles(dir: string, matches: (name: string) => boolean, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkFiles(full, matches, out);
    } else if (matches(entry)) {
      out.push(full);
    }
  }
  return out;
}

const isMarkdown = (name: string): boolean => name.endsWith('.md');
const isYaml = (name: string): boolean => name.endsWith('.yaml') || name.endsWith('.yml');

export function loadCorpus(): { corpus: Corpus; parseErrors: string[] } {
  const parseErrors: string[] = [];

  const safe = <T>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch (err) {
      parseErrors.push((err as Error).message);
      return fallback;
    }
  };

  const elements: ElementFile[] = [];
  for (const file of walkFiles(PATHS.elements, isMarkdown)) {
    const rel = repoRelative(file);
    try {
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'), rel);
      elements.push({ path: rel, data, body });
    } catch (err) {
      parseErrors.push((err as Error).message);
    }
  }

  const bok: ElementFile[] = [];
  for (const file of walkFiles(PATHS.bok, isMarkdown)) {
    const rel = repoRelative(file);
    try {
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'), rel);
      bok.push({ path: rel, data, body });
    } catch (err) {
      parseErrors.push((err as Error).message);
    }
  }

  const taxonomyFiles: TaxonomyFile[] = [];
  if (existsSync(PATHS.taxonomyDir)) {
    for (const entry of readdirSync(PATHS.taxonomyDir).sort()) {
      if (!entry.endsWith('.yaml') && !entry.endsWith('.yml')) continue;
      const full = join(PATHS.taxonomyDir, entry);
      try {
        taxonomyFiles.push({ path: repoRelative(full), data: loadYamlFile(full) ?? {} });
      } catch (err) {
        parseErrors.push((err as Error).message);
      }
    }
  }

  const mergedDomains = taxonomyFiles.flatMap(
    (file) => (file.data.domains ?? []) as Array<Record<string, unknown>>,
  );
  const taxonomy = taxonomyFiles.length > 0 ? { schemaVersion: 1, domains: mergedDomains } : null;

  const loadItems = (dir: string): ItemFile[] => {
    const files: ItemFile[] = [];
    for (const file of walkFiles(dir, isYaml)) {
      try {
        files.push({ path: repoRelative(file), data: loadYamlFile(file) ?? {} });
      } catch (err) {
        parseErrors.push((err as Error).message);
      }
    }
    return files;
  };

  const archetypes = loadItems(PATHS.archetypes);
  const bindings = loadItems(PATHS.bindings);

  const lockedIds = existsSync(PATHS.idLock)
    ? readFileSync(PATHS.idLock, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
    : null;

  return {
    corpus: {
      taxonomy,
      taxonomyFiles,
      proficiency: safe(() => loadYamlFile(PATHS.proficiency), null),
      roles: safe(() => loadYamlFile(PATHS.roles), null),
      sources: safe(() => loadYamlFile(PATHS.sources), null),
      elements,
      bok,
      archetypes,
      bindings,
      lockedIds,
    },
    parseErrors,
  };
}

/* ------------------------------------------------------------------------ */
/* Shaped views over the raw corpus                                          */
/* ------------------------------------------------------------------------ */

export interface ElementStub {
  id: string;
  title: string;
  kind: string;
  levelCeiling: number;
  status: string;
  supersededBy?: string;
  domain: string;
  competencyArea: string;
}

export interface SourceEntry {
  id: string;
  tier: 1 | 2 | 3;
  designation: string;
  quotation: {
    permitted: boolean;
    maxWordsPerQuote?: number;
    maxQuotesPerElement?: number;
    requiresCommentary?: boolean;
    strippedInRedistributable?: boolean;
  };
}

/** Flatten the nested skeleton into a lookup keyed by element ID. */
export function indexStubs(taxonomy: Record<string, unknown> | null): Map<string, ElementStub> {
  const index = new Map<string, ElementStub>();
  const domains = (taxonomy?.domains ?? []) as Array<Record<string, any>>;

  for (const domain of domains) {
    for (const area of (domain.competencyAreas ?? []) as Array<Record<string, any>>) {
      for (const el of (area.elements ?? []) as Array<Record<string, any>>) {
        index.set(el.id, {
          id: el.id,
          title: el.title,
          kind: el.kind,
          levelCeiling: el.levelCeiling,
          status: el.status,
          supersededBy: el.supersededBy,
          domain: domain.id,
          competencyArea: area.id,
        });
      }
    }
  }
  return index;
}

/** Every ID the skeleton declares, at all three levels. Used for lock comparison. */
export function allTaxonomyIds(taxonomy: Record<string, unknown> | null): string[] {
  const ids: string[] = [];
  const domains = (taxonomy?.domains ?? []) as Array<Record<string, any>>;

  for (const domain of domains) {
    ids.push(domain.id);
    for (const area of (domain.competencyAreas ?? []) as Array<Record<string, any>>) {
      ids.push(area.id);
      for (const el of (area.elements ?? []) as Array<Record<string, any>>) {
        ids.push(el.id);
      }
    }
  }
  return ids.filter(Boolean).sort();
}

/**
 * Every identifier the corpus issues, taxonomy and BOK alike.
 *
 * BOK article IDs are append-only for the same reason element IDs are, one
 * layer out: the BOK exists to be cited by work outside this project, and a
 * citation that stops resolving is worse than no citation at all.
 */
export function allCorpusIds(corpus: Corpus): string[] {
  const bokIds = corpus.bok
    .map((a) => (a.data as Record<string, any>).id as string | undefined)
    .filter((id): id is string => Boolean(id));

  return [...allTaxonomyIds(corpus.taxonomy), ...bokIds].sort();
}

export function indexSources(sources: Record<string, unknown> | null): Map<string, SourceEntry> {
  const index = new Map<string, SourceEntry>();
  for (const source of (sources?.sources ?? []) as SourceEntry[]) {
    if (source?.id) index.set(source.id, source);
  }
  return index;
}

export function roleIds(roles: Record<string, unknown> | null): string[] {
  return ((roles?.roles ?? []) as Array<Record<string, any>>).map((r) => r.id).filter(Boolean);
}

export interface ArchetypeEntry {
  id: string;
  path: string;
  kinds: string[];
  levels: number[];
  parameterNames: string[];
  scoringMethod: string;
  status: string;
}

/** Archetypes keyed by ID, so a binding can be checked against the shape it names. */
export function indexArchetypes(archetypes: ItemFile[]): Map<string, ArchetypeEntry> {
  const index = new Map<string, ArchetypeEntry>();

  for (const file of archetypes) {
    const d = file.data as Record<string, any>;
    if (!d.id) continue; // the schema check reports this
    index.set(d.id, {
      id: d.id,
      path: file.path,
      kinds: (d.kinds ?? []) as string[],
      levels: (d.levels ?? []) as number[],
      parameterNames: ((d.parameters ?? []) as Array<Record<string, any>>)
        .map((p) => p?.name)
        .filter(Boolean),
      scoringMethod: d.scoring?.method,
      status: d.status,
    });
  }
  return index;
}
