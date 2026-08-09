/**
 * JSON Schema wiring.
 *
 * Schemas carry https:// $id values because that is the JSON Schema
 * convention, but nothing here ever reaches the network: every schema is read
 * from schemas/ on disk and registered with Ajv up front, so $ref resolution
 * is purely local. An air-gapped build must validate identically to a
 * connected one.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidateFunction, ErrorObject } from 'ajv';
import ajv2020Module from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { PATHS } from './corpus.ts';

/*
 * Ajv and ajv-formats are CommonJS with a `default` export attached to
 * `module.exports`. Under NodeNext that resolves to a namespace object at
 * type level and to either the class or `{ default: class }` at runtime,
 * depending on how the importer is compiled. Unwrap once, here, with the
 * minimal surface we actually use, rather than scattering `any` through the
 * call sites.
 */

interface AjvOptions {
  strict?: boolean;
  strictRequired?: boolean;
  allErrors?: boolean;
  validateFormats?: boolean;
}

interface AjvInstance {
  addSchema(schema: unknown): unknown;
  getSchema(keyRef: string): ValidateFunction | undefined;
}

type AjvConstructor = new (options?: AjvOptions) => AjvInstance;
type AddFormats = (ajv: AjvInstance) => unknown;

function unwrapDefault<T>(mod: unknown): T {
  const candidate = (mod as { default?: unknown }).default;
  return (candidate ?? mod) as T;
}

const Ajv2020 = unwrapDefault<AjvConstructor>(ajv2020Module);
const addFormats = unwrapDefault<AddFormats>(addFormatsModule);

const SCHEMA_BASE = 'https://metrology-bok.org/schemas/';

export type SchemaName =
  | 'common'
  | 'taxonomy'
  | 'element'
  | 'role-registry'
  | 'source-registry'
  | 'proficiency'
  | 'item-archetype'
  | 'item-binding'
  | 'credential'
  | 'authorization'
  | 'attempt-ledger'
  | 'bok-article';

let cached: AjvInstance | null = null;

function getAjv(): AjvInstance {
  if (cached) return cached;

  const instance = new Ajv2020({
    strict: true,
    // Ajv's strictRequired lint rejects `required` inside an if/then branch
    // unless that subschema also redeclares the properties. Conditional
    // requirements are idiomatic JSON Schema and we use them deliberately —
    // "deprecated implies supersededBy", "quotation permitted implies limits".
    // Duplicating property definitions to satisfy the lint would make the
    // schemas harder to read for no validation benefit.
    strictRequired: false,
    allErrors: true,
    // Formats such as `date` and `uri` are annotations by default in 2020-12;
    // ajv-formats makes them assertions, which is what we want for `isoDate`.
    validateFormats: true,
  });
  addFormats(instance);

  for (const file of readdirSync(PATHS.schemas)) {
    if (!file.endsWith('.schema.json')) continue;
    instance.addSchema(JSON.parse(readFileSync(join(PATHS.schemas, file), 'utf8')));
  }

  cached = instance;
  return instance;
}

export function validatorFor(name: SchemaName): ValidateFunction {
  const validate = getAjv().getSchema(`${SCHEMA_BASE}${name}.schema.json`);
  if (!validate) {
    throw new Error(
      `Schema ${name}.schema.json is not registered. Expected it in schemas/ with $id ${SCHEMA_BASE}${name}.schema.json`,
    );
  }
  return validate;
}

/** Render Ajv errors as one readable line each, prefixed with the file. */
export function formatErrors(file: string, errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) return [];

  return errors.map((error) => {
    const where = error.instancePath || '(root)';
    let detail = error.message ?? 'is invalid';

    if (error.keyword === 'additionalProperties') {
      const property = (error.params as { additionalProperty: string }).additionalProperty;
      detail = `has unexpected property '${property}' — check for a typo, or add it to the schema deliberately`;
    } else if (error.keyword === 'enum') {
      const allowed = (error.params as { allowedValues?: unknown[] }).allowedValues ?? [];
      detail = `must be one of: ${allowed.join(', ')}`;
    } else if (error.keyword === 'required') {
      const property = (error.params as { missingProperty: string }).missingProperty;
      detail = `is missing required property '${property}'`;
    }

    return `${file} ${where} ${detail}`;
  });
}
