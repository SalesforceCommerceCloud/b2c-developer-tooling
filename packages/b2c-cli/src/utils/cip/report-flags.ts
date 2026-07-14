/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags, type Interfaces} from '@oclif/core';
import {getCipReportByName, type CipReportDefinition, type CipReportParamDefinition} from '@salesforce/b2c-tooling-sdk';

interface SiteIdFlagOptions {
  required?: boolean;
}

interface LimitFlagOptions {
  max?: number;
  min?: number;
}

/** Converts a camelCase report parameter name to its kebab-case CLI flag name. */
export function paramNameToFlag(name: string): string {
  return name.replaceAll(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`);
}

export function createSiteIdFlag(options: SiteIdFlagOptions = {}) {
  return Flags.string({
    description: 'Site ID parameter for CIP report filters',
    helpGroup: 'QUERY',
    required: options.required ?? false,
  });
}

export function createLimitFlag(options: LimitFlagOptions = {}) {
  return Flags.integer({
    description: 'Maximum number of rows',
    helpGroup: 'QUERY',
    max: options.max ?? 500,
    min: options.min ?? 1,
    required: false,
  });
}

/**
 * Maps a single report parameter definition to an oclif flag.
 *
 * `from`/`to` are intentionally skipped because they are already provided by
 * {@link CipCommand.baseFlags}; callers should exclude them. Number params become
 * range-checked integer flags, enum params become string flags with `options`, and
 * `multiple` params accept repeated values.
 */
function paramToFlag(parameter: CipReportParamDefinition): Interfaces.FlagInput[string] {
  // Report params are intentionally NOT marked oclif-required even when the catalog
  // marks them required: the SDK's validateReportParams enforces required-ness when
  // building SQL, and `--describe` / metadata flows must run without supplying them.
  // Making them oclif-required would break `cip report <name> --describe`.
  const common = {
    description: parameter.description,
    helpGroup: 'QUERY' as const,
    required: false,
  };

  if (parameter.type === 'number') {
    return Flags.integer({
      ...common,
      ...(parameter.min === undefined ? {} : {min: parameter.min}),
      ...(parameter.max === undefined ? {} : {max: parameter.max}),
    });
  }

  // string / boolean / date all surface as string flags; the SDK validates and
  // escapes the value when building SQL. Enum params constrain to their options.
  const options = parameter.options && parameter.options.length > 0 ? parameter.options : undefined;

  if (parameter.multiple) {
    return Flags.string({...common, multiple: true, ...(options ? {options} : {})});
  }

  return Flags.string({...common, ...(options ? {options} : {})});
}

/**
 * Builds the oclif flag map for a report's own parameters from its catalog
 * definition, excluding `from`/`to` which are handled by the base command. `siteId`
 * is mapped to the shared `--site-id` flag. Returns flags keyed by kebab-cased name.
 */
export function buildReportFlags(report: CipReportDefinition): Interfaces.FlagInput {
  const flags: Interfaces.FlagInput = {};

  for (const parameter of report.parameters) {
    if (parameter.name === 'from' || parameter.name === 'to') {
      continue;
    }

    if (parameter.name === 'siteId') {
      // Not oclif-required; the SDK validates required-ness at SQL-build time so
      // `--describe` works without a site id (matches the historical behavior).
      flags['site-id'] = createSiteIdFlag({required: false});
      continue;
    }

    flags[paramNameToFlag(parameter.name)] = paramToFlag(parameter);
  }

  return flags;
}

/**
 * Resolves a report definition by name or throws — used by per-command files at
 * module load to fail loudly if a report name does not exist in the catalog.
 */
export function requireReport(reportName: string): CipReportDefinition {
  const report = getCipReportByName(reportName);
  if (!report) {
    throw new Error(`Unknown CIP report referenced by command: ${reportName}`);
  }

  return report;
}
