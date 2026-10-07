/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Read and write individual configuration fields at the source that supplies them.
 *
 * Writes go to the highest-priority source currently supplying a field, so the
 * new value always takes effect. A field no source supplies goes to the entry
 * that selected the instance (for example the active dw.json config). Sources
 * that don't implement {@link ConfigSource.updateConfig} (shell environment,
 * ~/.mobify, package.json) are never written; credential stores are written
 * through {@link ConfigSource.storeCredential} for their declared fields.
 *
 * @module config/config-write
 */
import {getConfigOrigins, type ConfigOrigin} from './config-origins.js';
import {DW_JSON_FIELDS, type JsonSchema} from './dw-json-schema.js';
import {CONFIG_KEY_ALIASES, kebabToCamelCase} from './mapping.js';
import {CREDENTIAL_GROUPS} from './resolver.js';
import type {ConfigSourceInfo, ConfigUpdateResult, NormalizedConfig, ResolvedB2CConfig} from './types.js';

/** dw.json keys whose normalized field has a different name. */
const FIELD_RENAMES: Record<string, keyof NormalizedConfig> = {oauthScopes: 'scopes'};

/** dw.json keys managed by other commands (`setup instance ...`) or shorthands of another key. */
const UNSETTABLE_KEYS = new Set(['name', 'active', 'user-auth']);

/** A settable configuration key. */
export interface ConfigKey {
  /** dw.json key (kebab-case) */
  key: string;
  /** Normalized config field */
  field: keyof NormalizedConfig;
  /** JSON Schema for the value */
  schema: JsonSchema;
}

/** Error raised when a configuration field can't be read or written safely. */
export class ConfigWriteError extends Error {
  constructor(
    readonly code:
      | 'CONFIG_KEY_UNKNOWN'
      | 'CONFIG_VALUE_INVALID'
      | 'CONFIG_SOURCE_READ_ONLY'
      | 'CONFIG_NO_WRITE_TARGET'
      | 'CONFIG_NOT_SET',
    message: string,
  ) {
    super(message);
    this.name = 'ConfigWriteError';
  }
}

function camelToKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** All keys `setup set` accepts, in dw.json order. */
export function listConfigKeys(): ConfigKey[] {
  return Object.entries(DW_JSON_FIELDS)
    .filter(([key]) => !UNSETTABLE_KEYS.has(key))
    .map(([key, schema]) => {
      const dwKey = kebabToCamelCase(key);
      return {key, field: (FIELD_RENAMES[dwKey] ?? dwKey) as keyof NormalizedConfig, schema};
    });
}

/**
 * Resolve a user-supplied key (dw.json kebab-case, camelCase, a legacy alias,
 * or the normalized field name) to a settable configuration key.
 *
 * @throws ConfigWriteError for unknown or unsettable keys
 */
export function resolveConfigKey(input: string): ConfigKey {
  const trimmed = input.trim();
  const canonical = CONFIG_KEY_ALIASES[trimmed] ?? kebabToCamelCase(trimmed);
  const key = camelToKebabCase(canonical);
  if (UNSETTABLE_KEYS.has(key)) {
    throw new ConfigWriteError(
      'CONFIG_KEY_UNKNOWN',
      key === 'user-auth'
        ? '`user-auth` is shorthand for `auth-methods`; set `auth-methods` instead.'
        : `\`${key}\` is managed by \`b2c setup instance\` commands.`,
    );
  }
  const found = listConfigKeys().find((entry) => entry.key === key || entry.field === canonical);
  if (!found) {
    throw new ConfigWriteError(
      'CONFIG_KEY_UNKNOWN',
      `Unknown configuration key "${input}". Keys use dw.json names, for example: ${listConfigKeys()
        .slice(0, 6)
        .map((entry) => entry.key)
        .join(', ')}.`,
    );
  }
  return found;
}

function describeSchema(schema: JsonSchema): string {
  if (Array.isArray(schema.oneOf)) return (schema.oneOf as JsonSchema[]).map(describeSchema).join(' or ');
  if (Array.isArray(schema.enum)) return `one of ${(schema.enum as unknown[]).join(', ')}`;
  if (schema.type === 'array' && schema.items) return `array of ${describeSchema(schema.items as JsonSchema)}`;
  return String(schema.type ?? 'value');
}

/** Validate a value against the JSON Schema subset used by the dw.json schema. */
function validate(schema: JsonSchema, value: unknown, path: string): string | undefined {
  if (Array.isArray(schema.oneOf)) {
    const options = schema.oneOf as JsonSchema[];
    return options.some((option) => validate(option, value, path) === undefined)
      ? undefined
      : `${path} must be ${describeSchema(schema)}`;
  }
  switch (schema.type) {
    case 'array': {
      if (!Array.isArray(value)) return `${path} must be an array`;
      for (const [index, item] of value.entries()) {
        const error = schema.items ? validate(schema.items as JsonSchema, item, `${path}[${index}]`) : undefined;
        if (error) return error;
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') return `${path} must be true or false`;
      break;
    }
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return `${path} must be a JSON object`;
      const record = value as Record<string, unknown>;
      const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
      for (const required of (schema.required as string[] | undefined) ?? []) {
        if (record[required] === undefined) return `${path}.${required} is required`;
      }
      for (const [name, item] of Object.entries(record)) {
        if (!properties[name]) {
          if (schema.additionalProperties === false) return `${path}.${name} is not a known property`;
          continue;
        }
        const error = validate(properties[name], item, `${path}.${name}`);
        if (error) return error;
      }
      break;
    }
    case 'string': {
      if (typeof value !== 'string') return `${path} must be a string`;
      break;
    }
  }
  if (Array.isArray(schema.enum) && !(schema.enum as unknown[]).includes(value)) {
    return `${path} must be ${describeSchema(schema)}`;
  }
  return undefined;
}

function acceptsStringList(schema: JsonSchema): boolean {
  if (Array.isArray(schema.oneOf)) return (schema.oneOf as JsonSchema[]).some(acceptsStringList);
  return schema.type === 'array' && (schema.items as JsonSchema | undefined)?.type === 'string';
}

/**
 * Coerce a command-line value to the key's type.
 *
 * String keys keep the text as given. Other keys accept JSON (`true`,
 * `["a","b"]`, `{"level":"NO_DELETE"}`); string-list keys also accept a
 * plain or comma-separated value (`./schemas` becomes `["./schemas"]`).
 *
 * @throws ConfigWriteError when the value doesn't match the key's schema
 */
export function parseConfigValue(key: ConfigKey, raw: string): unknown {
  const candidates: unknown[] = [];
  if (key.schema.type === 'string') {
    candidates.push(raw);
  } else {
    try {
      candidates.push(JSON.parse(raw));
    } catch {
      // Not JSON; fall through to the plain-text forms below.
    }
    if (acceptsStringList(key.schema)) {
      candidates.push(
        raw
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }
  }
  let error: string | undefined;
  for (const candidate of candidates) {
    error = validate(key.schema, candidate, key.key);
    if (!error) return candidate;
  }
  throw new ConfigWriteError(
    'CONFIG_VALUE_INVALID',
    `Invalid value for ${key.key}: ${error ?? `expected ${describeSchema(key.schema)}`}.`,
  );
}

/** Where a field's value comes from and where a write would go. */
export interface ConfigFieldLocation {
  /** Source currently supplying the field, if any */
  supplier?: ConfigSourceInfo;
  /** Origin that a write would update */
  target?: ConfigOrigin;
  /** Why the field can't be written, when {@link target} is absent */
  error?: ConfigWriteError;
}

function describeSource(info: ConfigSourceInfo): string {
  return info.location ? `${info.name} (${info.location})` : info.name;
}

/**
 * Whether a source can persist `field`: through {@link ConfigSource.updateConfig},
 * or for a credential store, {@link ConfigSource.storeCredential} for a declared
 * credential field.
 */
function canWrite(origin: ConfigOrigin, field: keyof NormalizedConfig): boolean {
  const {source} = origin;
  return Boolean(source.updateConfig || (source.storeCredential && source.credentialFields?.includes(field)));
}

/**
 * Locate a field in a resolved configuration: which source supplies it and
 * which source a write should update.
 *
 * The target is, in order: the source supplying the field; the source
 * supplying the other half of its credential pair; or, for a field nothing
 * sets, the source that supplied the instance itself (its `instanceName`, else
 * its `hostname`). A derived value (a sandbox hostname worked out from its
 * tenant ID) counts as supplied by the source of the field it came from. Every
 * rule uses only {@link ConfigSourceInfo} and the optional write methods, so
 * plugin sources take part the same way dw.json does.
 */
export function locateConfigField(config: ResolvedB2CConfig, field: keyof NormalizedConfig): ConfigFieldLocation {
  const origins = getConfigOrigins(config) ?? [];
  const supplies = (info: ConfigSourceInfo, name: keyof NormalizedConfig) =>
    info.fields.includes(name) && !info.fieldsIgnored?.includes(name);
  /** The origin supplying `name`, following a derived value back to the origin of its base field. */
  const originOf = (name: keyof NormalizedConfig): ConfigOrigin | undefined => {
    const direct = origins.find((origin) => supplies(origin.info, name));
    if (direct) return direct;
    const base = config.sources.find((info) => info.derivedFrom && supplies(info, name))?.derivedFrom?.field;
    return base ? origins.find((origin) => supplies(origin.info, base)) : undefined;
  };
  const supplier = config.sources.find((info) => supplies(info, field));
  // A credential pair (client ID + secret) must come from one source, so the
  // other half of a supplied pair decides where this field goes.
  const partners = CREDENTIAL_GROUPS.find((group) => group.includes(field)) ?? [field];
  const own = originOf(field);
  const supplying = own ?? partners.map(originOf).find(Boolean);
  if (supplying) {
    if (!canWrite(supplying, field)) {
      return {
        supplier: own?.info,
        error: new ConfigWriteError(
          'CONFIG_SOURCE_READ_ONLY',
          own
            ? `${field} comes from ${describeSource(supplying.info)}, which can't be written. Change or remove it there.`
            : `${field} pairs with ${partners.filter((partner) => partner !== field).join(', ')} from ${describeSource(supplying.info)}, which can't be written. Set both there.`,
        ),
      };
    }
    return {supplier, target: supplying};
  }

  if (supplier || config.values[field] !== undefined) {
    const base = supplier?.derivedFrom;
    return {
      supplier,
      error: new ConfigWriteError(
        'CONFIG_SOURCE_READ_ONLY',
        base
          ? `${field} is derived from ${base.field}${base.source ? '' : ' given as a flag'}, so it can't be written here.`
          : `${field} comes from ${supplier ? describeSource(supplier) : 'a command-line flag'}, which can't be written.`,
      ),
    };
  }

  // Nothing supplies the field: write it where the instance itself is defined.
  const instanceOrigin = originOf('instanceName') ?? originOf('hostname');
  if (instanceOrigin && canWrite(instanceOrigin, field)) return {target: instanceOrigin};
  return {
    error: new ConfigWriteError(
      'CONFIG_NO_WRITE_TARGET',
      instanceOrigin
        ? `${field} isn't set, and ${describeSource(instanceOrigin.info)} can't store it.`
        : `${field} isn't set and no instance is selected to write it to. Select one with --instance, mark one active with \`b2c setup instance set-active\`, or create one with \`b2c setup instance create\`.`,
    ),
  };
}

/** Persist one field through whichever write method the target source implements. */
async function persist(
  config: ResolvedB2CConfig,
  {source, info, options}: ConfigOrigin,
  field: keyof NormalizedConfig,
  value: unknown,
): Promise<ConfigUpdateResult> {
  if (source.updateConfig) return source.updateConfig({[field]: value} as Partial<NormalizedConfig>, options);

  const instance = config.values.instanceName ?? options.instance;
  if (!instance) {
    throw new ConfigWriteError(
      'CONFIG_NO_WRITE_TARGET',
      `${source.name} stores credentials per instance, and no instance name is selected. Use --instance.`,
    );
  }
  if (value === undefined) {
    if (!source.removeCredential) {
      throw new ConfigWriteError('CONFIG_SOURCE_READ_ONLY', `${source.name} can't remove ${field}.`);
    }
    await source.removeCredential(instance, field, options);
  } else {
    if (typeof value !== 'string') throw new ConfigWriteError('CONFIG_VALUE_INVALID', `${field} must be a string.`);
    await source.storeCredential!(instance, field, value, options);
  }
  return {location: info.location ?? source.name, instance};
}

/**
 * Set or remove (`value === undefined`) a field at the source that supplies it.
 *
 * @throws ConfigWriteError when the field has no writable target
 */
export async function writeConfigField(
  config: ResolvedB2CConfig,
  field: keyof NormalizedConfig,
  value: unknown,
): Promise<ConfigUpdateResult & {source: string}> {
  const location = locateConfigField(config, field);
  if (value === undefined && !location.supplier) {
    throw new ConfigWriteError('CONFIG_NOT_SET', `${field} isn't set.`);
  }
  const base = value === undefined ? location.supplier?.derivedFrom : undefined;
  if (base) {
    throw new ConfigWriteError(
      'CONFIG_NOT_SET',
      `${field} isn't set; it's derived from ${base.field}${base.source ? ` in ${base.source}` : ''}. Unset ${base.field} instead.`,
    );
  }
  if (!location.target) throw location.error!;
  const result = await persist(config, location.target, field, value);
  return {...result, source: location.target.source.name};
}

/**
 * Remove a field from the source that supplies it.
 *
 * @throws ConfigWriteError when the field isn't set or its source can't be written
 */
export async function removeConfigField(
  config: ResolvedB2CConfig,
  field: keyof NormalizedConfig,
): Promise<ConfigUpdateResult & {source: string}> {
  return writeConfigField(config, field, undefined);
}
