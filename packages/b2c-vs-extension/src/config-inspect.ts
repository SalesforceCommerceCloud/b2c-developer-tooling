/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ConfigSourceInfo, ConfigWarning, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import {describeInstanceStatus, describeSource, usedFields, type InstanceStatusOptions} from './instance-selection.js';

/** A resolved config value and the source that supplied it. */
export interface InspectRow {
  field: string;
  /** Display value; empty for secrets, which never leave the extension host. */
  value: string;
  source: string;
  location?: string;
  sensitive: boolean;
}

/** A value a source supplied that was not used, and why. */
export interface InspectIgnoredField {
  field: string;
  source: string;
  reason: string;
}

/** A source that took part in resolution. */
export interface InspectSource {
  label: string;
  location?: string;
  used: string[];
  ignored: string[];
}

/** Everything the resolved-config panel shows; built from the extension's own resolution. */
export interface ConfigInspection {
  /** Status bar label for the connection in use. */
  label: string;
  /** Instance selection, env file and provenance notes (the status bar tooltip lines). */
  context: string[];
  warnings: string[];
  rows: InspectRow[];
  ignored: InspectIgnoredField[];
  sources: InspectSource[];
}

const SENSITIVE_FIELD = /(secret|password|passphrase|api[-_]?key)/i;

/** Label sources so Storefront Next fallbacks read differently from SFCC_* values in the same file. */
function sourceLabel(source: ConfigSourceInfo): string {
  const label = describeSource(source);
  return source.name === 'StorefrontNextEnvSource' ? `${label} (Storefront Next)` : label;
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
 * Describe the extension's resolved configuration: each value with its source,
 * the values that were supplied but not used, and the selection context.
 *
 * Secret values are omitted entirely, not just masked, so they never reach a webview.
 */
export function buildConfigInspection(
  config: {sources: ConfigSourceInfo[]; values: NormalizedConfig; warnings: ConfigWarning[]},
  options: InstanceStatusOptions,
): ConfigInspection {
  const status = describeInstanceStatus(config, options);
  const {sources, values} = config;

  const rows: InspectRow[] = [];
  for (const [field, value] of Object.entries(values)) {
    if (value === undefined || field === 'workingDirectory') continue;
    const supplier = sources.find((source) => usedFields(source).includes(field as keyof NormalizedConfig));
    const sensitive = SENSITIVE_FIELD.test(field);
    rows.push({
      field,
      value: sensitive ? '' : displayValue(value),
      source: supplier ? sourceLabel(supplier) : 'extension',
      location: supplier?.location,
      sensitive,
    });
  }

  const ignored: InspectIgnoredField[] = [];
  sources.forEach((source, index) => {
    // A source skipped for a hostname mismatch reports no used fields and ignores all of them.
    const skipped = source.fields.length === 0;
    for (const field of source.fieldsIgnored ?? []) {
      const winner = sources.slice(0, index).find((other) => usedFields(other).includes(field));
      ignored.push({
        field,
        source: sourceLabel(source),
        reason: skipped ? 'source skipped: hostname differs' : winner ? `set by ${sourceLabel(winner)}` : 'not used',
      });
    }
  });

  return {
    label: status.label,
    // The first tooltip line repeats the label shown as the panel title.
    context: status.tooltip.slice(1),
    warnings: config.warnings.map((warning) => warning.message),
    rows,
    ignored,
    sources: sources
      .filter((source) => source.fields.length > 0 || (source.fieldsIgnored?.length ?? 0) > 0)
      .map((source) => ({
        label: sourceLabel(source),
        location: source.location,
        used: usedFields(source),
        ignored: source.fieldsIgnored ?? [],
      })),
  };
}
