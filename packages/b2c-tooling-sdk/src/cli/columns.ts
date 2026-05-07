/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared `--columns` / `--extended` flag pair and selection helper for list
 * and search commands.
 *
 * Most list-style commands in the CLI render a {@link TableRenderer | table}
 * with a curated default set of columns and allow callers to override or
 * expand that set. This module provides the canonical implementation so each
 * command does not have to redeclare the flags or copy the selection logic.
 *
 * ## Usage
 *
 * ```typescript
 * import {Flags} from '@oclif/core';
 * import {
 *   InstanceCommand,
 *   TableRenderer,
 *   columnFlagsFor,
 *   selectColumns,
 *   type ColumnDef,
 * } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * const COLUMNS: Record<string, ColumnDef<MyItem>> = { ... };
 * const DEFAULT_COLUMNS = ['id', 'name'];
 * const tableRenderer = new TableRenderer(COLUMNS);
 *
 * export default class MyList extends InstanceCommand<typeof MyList> {
 *   static flags = {
 *     ...columnFlagsFor(COLUMNS),
 *     // ...other flags
 *   };
 *
 *   async run(): Promise<MyResult> {
 *     // ...
 *     tableRenderer.render(items, selectColumns(this, tableRenderer, DEFAULT_COLUMNS));
 *   }
 * }
 * ```
 *
 * @module cli/columns
 */
import {Flags, type Interfaces} from '@oclif/core';
import type {TableRenderer} from './table.js';

type FlagChar = Interfaces.AlphabetLowercase | Interfaces.AlphabetUppercase;

/**
 * Subset of an oclif command's `flags` shape consumed by {@link selectColumns}.
 * Use {@link columnFlagsFor} to populate these consistently.
 */
export interface ColumnFlags {
  columns?: string;
  extended?: boolean;
}

/**
 * Function that emits a non-fatal warning. Pass `this.warn.bind(this)` when
 * calling from a command, or any plain logger callback otherwise.
 */
export type WarnFn = (message: string) => void;

/**
 * Options for {@link columnFlagsFor}.
 */
export interface ColumnFlagsOptions {
  /**
   * Short flag character for `--columns`. Defaults to `'c'`. Set to `false`
   * to omit the short flag (use this when `-c` is already taken by another
   * command-specific flag like `--category`).
   */
  columnsChar?: FlagChar | false;
  /**
   * Short flag character for `--extended`. Defaults to `'x'`. Set to `false`
   * to omit the short flag.
   */
  extendedChar?: FlagChar | false;
}

/**
 * Returns the canonical `--columns` / `--extended` flag pair for a list-style
 * command. The `--columns` flag advertises the available column keys (taken
 * from the supplied `columns` map) so they show up in `--help` output.
 *
 * @param columns - Column definitions, used to enumerate available keys in the
 *   help text.
 * @param options - Optional overrides for the short flag characters when they
 *   conflict with command-specific flags.
 * @returns A flag definition object suitable for spreading into a command's
 *   `static flags`.
 *
 * @example
 * ```typescript
 * static flags = {
 *   ...columnFlagsFor(COLUMNS),
 *   count: Flags.integer({char: 'n', description: '...'}),
 * };
 *
 * // When -c is already used (e.g. for --category):
 * static flags = {
 *   category: Flags.string({char: 'c', description: '...'}),
 *   ...columnFlagsFor(COLUMNS, {columnsChar: false}),
 * };
 * ```
 */
export function columnFlagsFor(columns: Record<string, unknown>, options: ColumnFlagsOptions = {}) {
  const columnsChar = options.columnsChar ?? 'c';
  const extendedChar = options.extendedChar ?? 'x';
  return {
    columns: Flags.string({
      ...(columnsChar === false ? {} : {char: columnsChar}),
      description: `Columns to display (comma-separated). Available: ${Object.keys(columns).join(', ')}`,
    }),
    extended: Flags.boolean({
      ...(extendedChar === false ? {} : {char: extendedChar}),
      description: 'Show all columns including extended fields',
      default: false,
    }),
  };
}

/**
 * Resolves which columns a list-style command should render. Mirrors the
 * pattern duplicated across all `*List` commands:
 *
 * - If `flags.columns === 'id,name'` is provided, validate against the
 *   renderer's known keys; warn (and fall back to defaults) when no valid keys
 *   remain.
 * - If `flags.extended` is set, return every column key (including those
 *   marked `extended: true`).
 * - Otherwise, return the supplied default set.
 *
 * @typeParam T - Row type (carried through the renderer).
 * @param flags - The command's parsed `--columns` / `--extended` values. The
 *   parameter accepts the wider {@link ColumnFlags} shape, so callers can pass
 *   `this.flags` directly even when the inferred type contains additional
 *   fields.
 * @param renderer - The {@link TableRenderer} backing the table — used for
 *   key validation and to enumerate keys in extended mode.
 * @param defaults - Fallback set returned when neither flag overrides the
 *   selection.
 * @param warn - Optional warn callback invoked when `--columns` is provided
 *   but no key validates; defaults to `console.warn`.
 * @returns Ordered list of column keys to render.
 */
export function selectColumns<T>(
  flags: ColumnFlags,
  renderer: TableRenderer<T>,
  defaults: string[],
  warn: WarnFn = console.warn,
): string[] {
  const {columns: columnsFlag, extended} = flags;

  if (columnsFlag) {
    const requested = columnsFlag.split(',').map((c) => c.trim());
    const valid = renderer.validateColumnKeys(requested);
    if (valid.length === 0) {
      warn(`No valid columns specified. Available: ${renderer.getColumnKeys().join(', ')}`);
      return defaults;
    }
    return valid;
  }

  if (extended) {
    return renderer.getColumnKeys();
  }

  return defaults;
}
