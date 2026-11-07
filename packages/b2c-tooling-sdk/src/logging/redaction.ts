/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Pluggable log redaction.
 *
 * Redactors run on every log entry the SDK logger writes, after the built-in
 * `redact` option. None are registered by default, so log output is unchanged
 * unless a host or plugin adds one.
 *
 * ## SDK Usage
 *
 * ```typescript
 * import {deepLogRedactor, globalLogRedactorRegistry} from '@salesforce/b2c-tooling-sdk/logging';
 *
 * globalLogRedactorRegistry.register(deepLogRedactor);
 * ```
 *
 * ## CLI Plugin Usage
 *
 * Plugins can provide redactors with the `b2c:log-redaction` hook.
 *
 * @module logging/redaction
 */

/** One log entry as written: the parsed JSON line (`level`, `time`, `msg` and context fields). */
export type LogEntry = Record<string, unknown>;

/**
 * Rewrites log entries before they are written.
 *
 * `redact` receives each entry and returns the entry to write: the same object
 * changed in place, or a new one. Return `undefined` to keep the entry as is.
 * Redactors must not throw; an error drops that redactor's change for the entry.
 */
export interface LogRedactor {
  /** Unique name, used to unregister or replace the redactor. */
  name: string;
  redact(entry: LogEntry): LogEntry | undefined | void;
}

/** Ordered set of {@link LogRedactor}s applied by the SDK logger. */
export class LogRedactorRegistry {
  private redactors: LogRedactor[] = [];

  /** Adds a redactor, replacing any registered under the same name. Redactors run in registration order. */
  register(redactor: LogRedactor): void {
    this.unregister(redactor.name);
    this.redactors.push(redactor);
  }

  /** Removes a redactor by name. Returns whether one was removed. */
  unregister(name: string): boolean {
    const index = this.redactors.findIndex((redactor) => redactor.name === name);
    if (index === -1) return false;
    this.redactors.splice(index, 1);
    return true;
  }

  /** Removes every redactor. */
  clear(): void {
    this.redactors = [];
  }

  /** Number of registered redactors. */
  get size(): number {
    return this.redactors.length;
  }

  /** Names of the registered redactors, in order. */
  getRedactorNames(): string[] {
    return this.redactors.map((redactor) => redactor.name);
  }

  /** Runs every redactor over `entry`. */
  apply(entry: LogEntry): LogEntry {
    let current = entry;
    for (const redactor of this.redactors) {
      try {
        current = redactor.redact(current) ?? current;
      } catch {
        // A faulty redactor must not stop logging; keep the entry from the previous step.
      }
    }
    return current;
  }
}

/** Registry the SDK logger reads on every write. */
export const globalLogRedactorRegistry = new LogRedactorRegistry();

/**
 * Applies the global redactors to one serialized pino line. Returns the line
 * untouched when no redactor is registered. @internal
 */
export function applyLogRedactors(line: string): string {
  if (globalLogRedactorRegistry.size === 0) return line;
  let entry: LogEntry;
  try {
    entry = JSON.parse(line) as LogEntry;
  } catch {
    return line;
  }
  return `${JSON.stringify(globalLogRedactorRegistry.apply(entry))}\n`;
}

const REDACTED = 'REDACTED';

/** Key suffixes (lowercase, without `-` and `_`) whose values are secrets. */
const SECRET_KEY_SUFFIXES = [
  'password',
  'passwd',
  'passphrase',
  'secret',
  'token',
  'apikey',
  'privatekey',
  'authorization',
  'cookie',
  'credentials',
  'codeverifier',
];

const JWT = /\beyJ[\w-]+\.[\w-]+\.[\w-]*/g;
const AUTH_SCHEME = /\b(Bearer|Basic)\s+[\w.~+/-]+=*/gi;
const FORM_SECRET =
  /\b(client_secret|password|refresh_token|access_token|id_token|code_verifier|api_key|apikey)=[^&\s"']+/gi;

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase().replaceAll(/[-_]/g, '');
  return SECRET_KEY_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function redactString(value: string): string {
  return value.replace(JWT, REDACTED).replace(AUTH_SCHEME, `$1 ${REDACTED}`).replace(FORM_SECRET, `$1=${REDACTED}`);
}

function redactNode(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (typeof value === 'string') return redactString(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value) || depth > 32) return REDACTED;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactNode(item, seen, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = isSecretKey(key) && item !== null && item !== undefined ? REDACTED : redactNode(item, seen, depth + 1);
  }
  return out;
}

/**
 * Returns a copy of `value` with secrets removed, at any depth:
 *
 * - values of keys that name a secret (`password`, `clientSecret`,
 *   `refresh_token`, `authorization`, `clientCredentials`, ...);
 * - JWTs, `Bearer`/`Basic` credentials and form-encoded secrets
 *   (`client_secret=...`) inside any string.
 *
 * Use it on entries a host logs itself, or register {@link deepLogRedactor}
 * to apply it to every SDK log entry.
 */
export function redactLogValue<T>(value: T): T {
  return redactNode(value, new WeakSet(), 0) as T;
}

/** A {@link LogRedactor} that applies {@link redactLogValue} to every entry. Not registered by default. */
export const deepLogRedactor: LogRedactor = {
  name: 'b2c-deep-redaction',
  redact: (entry) => redactLogValue(entry),
};
