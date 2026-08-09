#!/usr/bin/env node
/**
 * Emit the merged taxonomy as compact JSON, for the review viewer.
 *
 * Reads the same per-domain files the validator reads, so the viewer can never
 * drift from what CI checks.
 *
 * Usage:  node tools/dump-taxonomy.ts > out.json
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DOMAINS_DIR = join(REPO_ROOT, 'content', 'competence', 'taxonomy', 'domains');

const domains = readdirSync(DOMAINS_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .sort()
  .flatMap((f) => {
    const doc = parseYaml(readFileSync(join(DOMAINS_DIR, f), 'utf8')) as Record<string, any>;
    return (doc.domains ?? []) as Array<Record<string, any>>;
  })
  .map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    summary: d.summary ?? '',
    areas: (d.competencyAreas ?? []).map((a: Record<string, any>) => ({
      id: a.id,
      title: a.title,
      summary: a.summary ?? '',
      elements: (a.elements ?? []).map((e: Record<string, any>) => ({
        id: e.id,
        title: e.title,
        c: e.levelCeiling,
      })),
    })),
  }));

process.stdout.write(JSON.stringify({ domains }));
