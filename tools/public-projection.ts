/**
 * What may be published, and what must never be.
 *
 * Kept in its own module so that the builder and the leak check can share it
 * without either importing the other's side effects, and so the two lists sit
 * next to each other where a reader can see they are consistent.
 *
 * WHY AN ALLOWLIST. Fields are published only if named here. When somebody adds
 * a field to the archetype schema next year and does not know this file exists,
 * it defaults to RESTRICTED. A denylist would default it to published, and that
 * failure is silent and one-way — you cannot unpublish.
 */

/** Published fields of an archetype. Identity and shape; never content. */
export const ARCHETYPE_PUBLIC = [
  'id',
  'title',
  'itemType',
  'kinds',
  'levels',
  'status',
  'citations',
  'exposureLimit',
] as const;

/**
 * Published fields of one binding entry.
 *
 * Enough to show that an assessable unit HAS an item, which is what makes
 * coverage auditable from outside, and nothing about what the item asks.
 */
export const BINDING_PUBLIC = ['level', 'archetype', 'status'] as const;

/**
 * Field names that must never appear anywhere under items/ in the public tree.
 *
 * Checked independently of the projection, as a backstop against the allowlist
 * being widened carelessly. Belt and braces, because publication cannot be
 * undone.
 */
export const RESTRICTED_KEYS = [
  'prompt',
  'parameters',
  'lookupResistance',
  // The counterpart of lookupResistance for a witnessed item, and restricted for
  // the same reason. The ELEMENT publishes where the work goes wrong, because
  // teaching that is what the corpus is for; the archetype says what the witness
  // is scoring and how, which is an assessment internal. Publishing it converts
  // an observation of practice into a checklist to perform.
  'witnessRequirement',
  'scoring',
  'toleranceBand',
  'toleranceOverride',
  'rubricRef',
  'justification',
  'parameterRanges',
  'exposureGroup',
] as const;
