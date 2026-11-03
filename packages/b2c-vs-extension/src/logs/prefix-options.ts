/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';

export interface LogPrefixOption {
  label: string;
  description?: string;
  picked?: boolean;
}

/** Prefixes offered by the tail picker before the instance's log files are known. */
export const STANDARD_PREFIX_OPTIONS: readonly LogPrefixOption[] = [
  {label: 'error', picked: true},
  {label: 'customerror', picked: true},
  {label: 'warn'},
  {label: 'debug'},
  {label: 'info'},
  {label: 'fatal'},
  {label: 'syserror'},
  {label: 'analytics'},
  {label: 'api'},
  {label: 'customwarn'},
  {label: 'customdebug'},
  {label: 'custominfo'},
  {label: 'deprecation'},
  {label: 'migration'},
  {label: 'performance'},
  {label: 'quota'},
  {label: 'staging'},
  {label: 'custom-', description: 'All custom logger files (custom-*.log)'},
];

/**
 * Returns one picker option per `custom-<name>` logger category found in
 * `files`, sorted by name, so users can tail a specific integration's log.
 */
export function customLoggerOptions(files: LogFile[]): LogPrefixOption[] {
  const prefixes = new Set(files.map((file) => file.prefix).filter((prefix) => prefix.startsWith('custom-')));
  return [...prefixes]
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({label, description: 'Custom logger on this instance'}));
}
