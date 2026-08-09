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
  taxonomy: join(REPO_ROOT, 'content', 'taxonomy', 'skeleton.yaml'),
  proficiency: join(REPO_ROOT, 'content', 'taxonomy', 'proficiency.yaml'),
  idLock: join(REPO_ROOT, 'content', 'taxonomy', 'id-registry.lock'),
  roles: join(REPO_ROOT, 'content', 'roles', 'registry.yaml'),
  sources: join(REPO_ROOT, 'content', 'sources', 'registry.yaml'),
  elements: join(REPO_ROOT, 'content', 'elements'),
} as const;

/** A parsed element file: frontmatter plus the Markdown body beneath it. */
export interface ElementFile {
  /** Repo-relative path, always with forward slashes, for stable diagnostics. */
  path: string;
  data: Record<string, unknown>;
  body: string;
}

export interface Corpus {
  taxonomy: Record<string, unknown> | null;
  proficiency: Record<string, unknown> | null;
  roles: Record<string, unknown> | null;
  sources: Record<string, unknown> | null;
  elements: ElementFile[];
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

function walkMarkdown(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkMarkdown(full, out);
    } else if (entry.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

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
  for (const file of walkMarkdown(PATHS.elements)) {
    const rel = repoRelative(file);
    try {
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'), rel);
      elements.push({ path: rel, data, body });
    } catch (err) {
      parseErrors.push((err as Error).message);
    }
  }

  const lockedIds = existsSync(PATHS.idLock)
    ? readFileSync(PATHS.idLock, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
    : null;

  return {
    corpus: {
      taxonomy: safe(() => loadYamlFile(PATHS.taxonomy), null),
      proficiency: safe(() => loadYamlFile(PATHS.proficiency), null),
      roles: safe(() => loadYamlFile(PATHS.roles), null),
      sources: safe(() => loadYamlFile(PATHS.sources), null),
      elements,
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
