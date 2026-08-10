/**
 * Publication boundary guardrails.
 *
 * The build tools decide what leaves this repository, and publication is
 * one-way: a leaked scoring key cannot be recalled from anyone who already has
 * it. These tests check the classification itself is coherent, since the
 * builder and the leak check both trust it and neither can detect that it
 * contradicts itself.
 *
 * The end-to-end behaviour — that a planted rubric or a restricted field in the
 * built artifact actually fails `npm run check:leak` — is verified by running
 * the tool against a deliberately poisoned build, not from here; these tests
 * cover the part that is pure data.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './corpus.ts';
import {
  ARCHETYPE_PUBLIC,
  BINDING_PUBLIC,
  RESTRICTED_KEYS,
} from '../../../tools/public-projection.ts';

const archetypeSchema = JSON.parse(
  readFileSync(join(REPO_ROOT, 'schemas', 'item-archetype.schema.json'), 'utf8'),
) as { properties: Record<string, unknown> };

const bindingSchema = JSON.parse(
  readFileSync(join(REPO_ROOT, 'schemas', 'item-binding.schema.json'), 'utf8'),
) as { $defs: { binding: { properties: Record<string, unknown> } } };

test('no field is both published and restricted', () => {
  // A contradiction here would be resolved differently by the builder and the
  // leak check, and the two would disagree silently.
  const overlap = (ARCHETYPE_PUBLIC as readonly string[]).filter((k) =>
    (RESTRICTED_KEYS as readonly string[]).includes(k),
  );
  assert.deepEqual(overlap, []);

  const bindingOverlap = (BINDING_PUBLIC as readonly string[]).filter((k) =>
    (RESTRICTED_KEYS as readonly string[]).includes(k),
  );
  assert.deepEqual(bindingOverlap, []);
});

test('every published archetype field actually exists in the schema', () => {
  // An allowlisted field that the schema does not define is dead weight, and
  // usually the residue of a rename that the projection did not follow.
  for (const key of ARCHETYPE_PUBLIC) {
    assert.ok(key in archetypeSchema.properties, `'${key}' is published but not in the archetype schema`);
  }
});

test('every published binding field actually exists in the schema', () => {
  for (const key of BINDING_PUBLIC) {
    assert.ok(
      key in bindingSchema.$defs.binding.properties,
      `'${key}' is published but not in the binding schema`,
    );
  }
});

test('the fields that would defeat an item are restricted', () => {
  // Named explicitly rather than derived, so that removing one from the
  // restricted list fails here and has to be argued for. `parameters` carries
  // the generator draws — publishing it tells a candidate which defect was
  // injected, which is the single worst leak available.
  for (const key of ['parameters', 'prompt', 'scoring', 'rubricRef', 'justification', 'parameterRanges']) {
    assert.ok(
      (RESTRICTED_KEYS as readonly string[]).includes(key),
      `'${key}' must stay restricted — publishing it defeats the items bound to it`,
    );
  }
});

test('an archetype schema field that is neither published nor restricted defaults to withheld', () => {
  // Not a failure: the allowlist means unclassified fields are withheld, which
  // is the safe direction. This test exists to make the drift VISIBLE, because
  // silently withholding something intended to be public is a bug too — it just
  // is not a dangerous one.
  const unclassified = Object.keys(archetypeSchema.properties).filter(
    (k) =>
      !(ARCHETYPE_PUBLIC as readonly string[]).includes(k) &&
      !(RESTRICTED_KEYS as readonly string[]).includes(k),
  );

  // Recorded rather than asserted empty: these are withheld deliberately today.
  assert.deepEqual(unclassified.sort(), ['authoring', 'notes']);
});
