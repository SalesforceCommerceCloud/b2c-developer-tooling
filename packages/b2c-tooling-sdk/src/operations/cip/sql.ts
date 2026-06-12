/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared SQL literal and identifier helpers for CIP report and metadata queries.
 *
 * CIP runs an Apache Calcite (Avatica JDBC) backend. These helpers centralize the
 * single most security-sensitive logic in the CIP subsystem — turning untrusted
 * parameter values into safe SQL literals — plus the Calcite-specific quoting of
 * reserved words used as identifiers. Both report SQL builders and metadata catalog
 * queries import from here so the escaping rules live (and are tested) in one place.
 *
 * @module operations/cip/sql
 */

/**
 * Apache Calcite reserved words that are also real CIP warehouse column names.
 *
 * Selecting or grouping by any of these as a bare identifier is a parse error; they
 * must be double-quoted. Confirmed against the live JDBC service (for example
 * `SELECT method FROM ...` fails until quoted). Keep lowercase; matching is
 * case-insensitive.
 */
const CALCITE_RESERVED_IDENTIFIERS = new Set([
  'date',
  'method',
  'rows',
  'time',
  'timestamp',
  'user',
  'value',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
]);

/**
 * Escapes single quotes in a value destined for a single-quoted SQL string literal.
 *
 * @param value - Raw string value to escape
 * @returns The value with embedded single quotes doubled per SQL string-literal rules
 */
export function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

/**
 * Quotes a SQL identifier if it collides with a Calcite reserved word.
 *
 * Pass a bare column name; if it is a reserved word it is returned double-quoted
 * (for example `method` -> `"method"`), otherwise it is returned unchanged. Use this
 * whenever a report references a column whose name might be reserved.
 *
 * @param name - Bare column or identifier name
 * @returns The identifier, double-quoted only if it is a Calcite reserved word
 */
export function quoteIdentifierIfReserved(name: string): string {
  return CALCITE_RESERVED_IDENTIFIERS.has(name.toLowerCase()) ? `"${name}"` : name;
}

/**
 * Returns true if the given bare identifier is a Calcite reserved word.
 *
 * @param name - Bare identifier name
 * @returns Whether the name requires double-quoting in Calcite SQL
 */
export function isReservedIdentifier(name: string): boolean {
  return CALCITE_RESERVED_IDENTIFIERS.has(name.toLowerCase());
}

/**
 * Builds a quoted, escaped SQL string literal from a raw value.
 *
 * @param value - Raw string value
 * @returns A single-quoted, escaped SQL string literal (for example `O'Brien` -> `'O''Brien'`)
 */
export function stringLiteral(value: string): string {
  return `'${escapeSqlString(value)}'`;
}

/**
 * Validates a `YYYY-MM-DD` date string and returns it as a quoted SQL date literal.
 *
 * @param value - Date string expected in `YYYY-MM-DD` form
 * @returns A quoted SQL date literal
 * @throws {Error} If the value is not a valid `YYYY-MM-DD` date
 */
export function dateLiteral(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error(`Invalid date: expected YYYY-MM-DD, got "${value}"`);
  }

  return `'${escapeSqlString(value)}'`;
}

/**
 * Validates a boolean string (`true`/`false`, case-insensitive) and returns the SQL literal.
 *
 * @param value - Boolean string value
 * @returns The lowercase boolean literal `true` or `false`
 * @throws {Error} If the value is not `true` or `false`
 */
export function booleanLiteral(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error(`Invalid boolean: expected true or false, got "${value}"`);
  }

  return normalized;
}

/**
 * Validates and returns an integer SQL literal within an inclusive range.
 *
 * @param value - Raw integer string
 * @param min - Inclusive lower bound
 * @param max - Inclusive upper bound
 * @returns The integer rendered as a bare SQL literal
 * @throws {Error} If the value is not an integer within `[min, max]`
 */
export function integerLiteral(value: string, min: number, max: number): string {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || String(parsed) !== value.trim() || parsed < min || parsed > max) {
    throw new Error(`Invalid integer: expected ${min}-${max}, got "${value}"`);
  }

  return String(parsed);
}

/**
 * Builds a comma-separated, quoted string list for a SQL `IN (...)` clause.
 *
 * @param values - Raw string values
 * @returns The escaped, single-quoted values joined by commas (no surrounding parens)
 * @throws {Error} If `values` is empty
 */
export function stringInList(values: string[]): string {
  if (values.length === 0) {
    throw new Error('Cannot build an IN list from an empty value set');
  }

  return values.map((value) => stringLiteral(value)).join(', ');
}
