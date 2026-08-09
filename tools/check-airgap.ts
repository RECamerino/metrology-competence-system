#!/usr/bin/env node
/**
 * Air-gap egress scan.
 *
 * The default build must make no external network calls: no CDN, no fonts, no
 * analytics, no telemetry, no licence check-in. Organizations deploy this into
 * enclaves where an unexpected outbound request is not a bug report, it is an
 * incident.
 *
 * This scans build output for anything that looks like it could become a
 * runtime fetch, and fails on the first one that is not explicitly allowed.
 *
 * IMPORTANT: not every URL is egress. Schema `$id` values, JSON-LD `@context`
 * identifiers, licence URLs, and source-registry links are IDENTIFIERS, not
 * fetch targets — nothing in this project resolves them over the network.
 * Those live in ALLOWED_IDENTIFIERS below. Everything else is a finding.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

/** Directories whose contents ship to a deployment. */
const BUILD_DIRS = ['apps', 'packages'];

const SCANNED_EXTENSIONS = ['.js', '.mjs', '.cjs', '.html', '.css', '.json', '.map'];

/**
 * URLs permitted to appear as literal text because they are identifiers that
 * are never dereferenced. Keep this list short and justify every addition.
 */
const ALLOWED_IDENTIFIERS: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /^https:\/\/metrology-bok\.org\/schemas\//, why: 'JSON Schema $id — resolved locally from schemas/' },
  { pattern: /^https:\/\/json-schema\.org\/draft\//, why: 'JSON Schema dialect identifier' },
  { pattern: /^https:\/\/www\.w3\.org\/(ns|2018)\//, why: 'JSON-LD / Verifiable Credentials context identifier' },
  { pattern: /^https:\/\/purl\.imsglobal\.org\//, why: 'Open Badges 3.0 context identifier' },
  { pattern: /^https:\/\/www\.apache\.org\/licenses\//, why: 'Licence text reference in a header comment' },
  { pattern: /^https:\/\/creativecommons\.org\/licenses\//, why: 'Licence text reference' },
];

/** Patterns that indicate an actual runtime network call, regardless of host. */
const EGRESS_APIS = [
  { pattern: /\bfetch\s*\(\s*["'`]https?:/, what: 'fetch() to an absolute URL' },
  { pattern: /new\s+WebSocket\s*\(/, what: 'WebSocket construction' },
  { pattern: /new\s+EventSource\s*\(/, what: 'EventSource construction' },
  { pattern: /XMLHttpRequest/, what: 'XMLHttpRequest' },
  { pattern: /navigator\.sendBeacon/, what: 'navigator.sendBeacon (telemetry)' },
  { pattern: /<script[^>]+src\s*=\s*["']https?:/i, what: 'external <script src>' },
  { pattern: /<link[^>]+href\s*=\s*["']https?:/i, what: 'external <link href>' },
  { pattern: /@import\s+url\(\s*["']?https?:/i, what: 'CSS @import of a remote stylesheet' },
];

const URL_LITERAL = /https?:\/\/[^\s"'`)<>\\]+/g;

interface Finding {
  file: string;
  line: number;
  detail: string;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (SCANNED_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function isAllowed(url: string): boolean {
  return ALLOWED_IDENTIFIERS.some(({ pattern }) => pattern.test(url));
}

function scanFile(path: string): Finding[] {
  const findings: Finding[] = [];
  const rel = relative(REPO_ROOT, path).split(sep).join('/');
  const lines = readFileSync(path, 'utf8').split('\n');

  lines.forEach((text, index) => {
    for (const { pattern, what } of EGRESS_APIS) {
      if (pattern.test(text)) {
        findings.push({ file: rel, line: index + 1, detail: `${what} — this is runtime egress` });
      }
    }

    for (const url of text.match(URL_LITERAL) ?? []) {
      if (!isAllowed(url)) {
        findings.push({ file: rel, line: index + 1, detail: `external URL literal: ${url}` });
      }
    }
  });

  return findings;
}

function main(): number {
  const targets: string[] = [];
  for (const base of BUILD_DIRS) {
    for (const dist of walk(join(REPO_ROOT, base))) {
      // Only build output ships. Source is scanned separately by review.
      if (dist.split(sep).includes('dist')) targets.push(dist);
    }
  }

  if (targets.length === 0) {
    console.log('No build output found under apps/ or packages/ — nothing to scan.');
    console.log('Run the build first; this check is meaningless against source alone.');
    return 0;
  }

  const findings = targets.flatMap(scanFile);

  if (findings.length === 0) {
    console.log(`Air-gap scan clean: ${targets.length} build artifact(s), no external references.`);
    return 0;
  }

  console.error('AIR-GAP SCAN FAILED');
  console.error('');
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}  ${finding.detail}`);
  }
  console.error('');
  console.error(`${findings.length} finding(s).`);
  console.error('');
  console.error('The default build must reach nothing. If a feature genuinely needs egress it');
  console.error('belongs in a separate module that is ABSENT from this build, not merely');
  console.error('disabled. If the URL is an identifier that is never dereferenced, add it to');
  console.error('ALLOWED_IDENTIFIERS in tools/check-airgap.ts with a justification.');
  return 1;
}

process.exit(main());
