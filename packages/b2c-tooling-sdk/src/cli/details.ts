/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared "label / value" detail block printer for `*Get` style commands.
 *
 * Many commands render the same two-column "Title / dashes / label-value
 * pairs" block via cliui. This helper centralizes the layout so individual
 * commands only need to provide the title and field list.
 *
 * @module cli/details
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';

/**
 * A single label / value pair. Tuple form is supported as a shorthand —
 * `['Login', 'user@example.com']` is equivalent to `{label: 'Login', value: 'user@example.com'}`.
 *
 * Values that are `null` or `undefined` are skipped entirely (the row is not
 * rendered). This matches the common shape of optional fields in OpenAPI
 * responses where missing data is `null`.
 */
export type DetailField = [label: string, value: DetailValue] | DetailFieldObject;

/**
 * Allowed scalar values for a detail field.
 */
export type DetailValue = string | number | boolean | null | undefined;

/**
 * Object form of a {@link DetailField} entry.
 */
export interface DetailFieldObject {
  label: string;
  value: DetailValue;
}

/**
 * Section under a sub-heading. Renders a blank line, the heading, a separator,
 * and then either label/value `fields` or a flat list of `lines`.
 */
export interface DetailSection {
  /** Section heading shown above the body */
  title: string;
  /** Label/value rows. Mutually exclusive with `lines`. */
  fields?: DetailField[];
  /** Flat list of single-column rows (e.g. role names). Mutually exclusive with `fields`. */
  lines?: string[];
}

/**
 * Options for {@link printFieldsBlock}.
 */
export interface PrintFieldsBlockOptions {
  /** Width of the label column (default 25) */
  labelWidth?: number;
  /** Width of the separator dashes (default 50) */
  separatorWidth?: number;
  /** Total terminal width (default `process.stdout.columns || 80`) */
  termWidth?: number;
  /** Optional sections rendered after the primary fields */
  sections?: DetailSection[];
}

function normalizeField(field: DetailField): DetailFieldObject {
  return Array.isArray(field) ? {label: field[0], value: field[1]} : field;
}

function renderFields(ui: ReturnType<typeof cliui>, fields: DetailField[], labelWidth: number): void {
  for (const raw of fields) {
    const {label, value} = normalizeField(raw);
    if (value === undefined || value === null) continue;
    ui.div({text: `${label}:`, width: labelWidth, padding: [0, 2, 0, 0]}, {text: String(value), padding: [0, 0, 0, 0]});
  }
}

/**
 * Renders a "details" block to stdout: a title, a separator, then a column
 * of `label: value` rows. Optional named sections can be rendered after the
 * primary block.
 *
 * @param title - Heading rendered above the fields.
 * @param fields - Primary list of label / value rows. Rows whose value is
 *   `undefined` are skipped.
 * @param options - Rendering options including optional sub-sections.
 *
 * @example
 * ```typescript
 * printFieldsBlock('User Details', [
 *   ['Login', user.login],
 *   ['Email', user.email],
 *   ['Disabled', user.disabled?.toString()],
 * ], {
 *   sections: user.roles?.length
 *     ? [{title: 'Roles', fields: user.roles.map((r) => [r, ''] as DetailField)}]
 *     : [],
 * });
 * ```
 */
export function printFieldsBlock(title: string, fields: DetailField[], options: PrintFieldsBlockOptions = {}): void {
  const labelWidth = options.labelWidth ?? 25;
  const separatorWidth = options.separatorWidth ?? 50;
  const termWidth = options.termWidth ?? process.stdout.columns ?? 80;

  const ui = cliui({width: termWidth});

  ui.div({text: title, padding: [1, 0, 0, 0]});
  ui.div({text: '─'.repeat(separatorWidth), padding: [0, 0, 0, 0]});
  renderFields(ui, fields, labelWidth);

  for (const section of options.sections ?? []) {
    ui.div({text: '', padding: [1, 0, 0, 0]});
    ui.div({text: section.title, padding: [0, 0, 0, 0]});
    ui.div({text: '─'.repeat(separatorWidth), padding: [0, 0, 0, 0]});
    if (section.fields) {
      renderFields(ui, section.fields, labelWidth);
    }
    for (const line of section.lines ?? []) {
      ui.div({text: line, padding: [0, 0, 0, 0]});
    }
  }

  ux.stdout(ui.toString());
}
