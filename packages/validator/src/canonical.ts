/**
 * Canonical serialisation and hashing.
 *
 * Extracted so that every hash in the project is computed the same way. The
 * attempt ledger, the element definition pin and the BOK section pin all have
 * to agree byte for byte with any future reimplementation, including one
 * written in another language by somebody verifying a credential offline.
 *
 * Deliberately boring, and it must not be "improved". Changing this function
 * changes every hash ever computed, which invalidates ledgers and credential
 * pins that people are relying on. If it must ever change, it changes under a
 * new algorithm label with both supported.
 */

import { createHash } from 'node:crypto';

/** Keys sorted, undefined dropped, no incidental whitespace. */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}

export function sha256Of(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonical(value), 'utf8').digest('hex')}`;
}

/** Hash of a raw string rather than a structure — used for prose. */
export function sha256OfText(text: string): string {
  return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}
