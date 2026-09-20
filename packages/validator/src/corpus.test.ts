/**
 * The corpus contains no symbolic links.
 *
 * External review finding A-20. `statSync` follows a symbolic link, so a walker
 * built on it reads whatever the link points at — and the consequence is worst
 * at the publication boundary: `build-public` copies the content tree into
 * `dist/public/`, and `check:leak` defends that boundary by scanning for
 * restricted CONTENT. A symlink is not restricted content, it is a path, so a
 * link planted in `content/` would have copied whatever it addressed into a
 * published distribution with the allowlist seeing nothing at all.
 *
 * THIS TEST PLANTS A REAL LINK rather than trusting the reasoning. Windows
 * refuses a plain symlink without developer mode, so it falls back to a
 * DIRECTORY JUNCTION, which needs no privilege and which `lstat` reports as a
 * symbolic link — the same predicate, the same refusal. CI runs on Linux and
 * takes the first branch.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertNoSymlink } from './corpus.ts';

/**
 * A temp directory holding something real and a link to it.
 *
 * `how` records which kind was planted, because a test that quietly changed
 * what it exercised would be the thing this project keeps finding.
 */
function planted(): { dir: string; real: string; link: string; how: string } | null {
  const dir = mkdtempSync(join(tmpdir(), 'mcs-symlink-'));

  const realFile = join(dir, 'real.md');
  writeFileSync(realFile, '# real\n', 'utf8');
  try {
    const link = join(dir, 'link.md');
    symlinkSync(realFile, link);
    return { dir, real: realFile, link, how: 'symlink' };
  } catch {
    // Windows without developer mode. A junction is the same thing to `lstat`.
  }

  const realDir = join(dir, 'realdir');
  mkdirSync(realDir);
  try {
    const link = join(dir, 'linkdir');
    symlinkSync(realDir, link, 'junction');
    return { dir, real: realDir, link, how: 'junction' };
  } catch {
    rmSync(dir, { recursive: true, force: true });
    return null;
  }
}

test('A LINK IN THE CORPUS IS REFUSED, NOT FOLLOWED AND NOT SKIPPED', () => {
  const fixture = planted();
  if (!fixture) {
    console.log('  (skipped: this platform will create neither a symlink nor a junction)');
    return;
  }

  try {
    // Not simply refusing everything: the real thing beside it passes.
    assert.doesNotThrow(() => assertNoSymlink(fixture.real), `planted as a ${fixture.how}`);

    assert.throws(
      () => assertNoSymlink(fixture.link),
      /is a symbolic link/,
      `a ${fixture.how} in the corpus must be refused`,
    );

    // REFUSED RATHER THAN IGNORED. Skipping would trade a disclosure for a
    // silent absence — content somebody believes is in the corpus, missing,
    // with nothing saying so — which is the failure this project names most.
    assert.throws(() => assertNoSymlink(fixture.link), /replace it with the file itself/);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});
