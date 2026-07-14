/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createPreferencesClient,
  type PreferenceInstanceType,
  type PreferencesClient,
} from '@salesforce/b2c-tooling-sdk';
import {t} from '../i18n/index.js';

const INSTANCE_TYPES: PreferenceInstanceType[] = ['staging', 'development', 'sandbox', 'production'];

/**
 * Flag for selecting the SCAPI Preferences instance type.
 *
 * Defaults to `development` — a real tier valid for both reads and writes.
 * `current` is accepted (handy for reads) but the SCAPI Preferences API
 * rejects it on writes, so it is never the default.
 */
export const instanceTypeFlag = Flags.string({
  char: 'I',
  description: 'Instance type. Use "current" (reads only) to target the instance handling the request.',
  options: [...INSTANCE_TYPES, 'current'],
  default: 'development',
});

/** Shared `--mask-passwords` (plural) flag used by all instance-scoped preferences commands. */
export const maskPasswordsFlag = Flags.boolean({
  description: 'Mask values of type password',
  default: false,
  allowNo: true,
});

export type PreferenceAssignmentValue = boolean | null | number | Record<string, unknown> | string | unknown[];

/**
 * Parse a single assignment expression for the preferences write commands.
 *
 * Operators:
 *  - `key=value`   string value
 *  - `key:=json`   raw JSON (number, bool, array, object)
 *  - `key=@file`   file contents as a string value
 *  - `key:=@file`  file contents parsed as JSON
 *  - `key=`        null (clears/unsets the attribute)
 *
 * The Preferences API does not coerce types, so callers must use `:=` to send
 * non-string JSON types.
 */
export function parsePreferenceAssignment(expr: string): {key: string; value: PreferenceAssignmentValue} {
  const jsonIdx = expr.indexOf(':=');
  const eqIdx = expr.indexOf('=');

  // ":=" wins only if it appears before the first "="
  if (jsonIdx !== -1 && (eqIdx === -1 || jsonIdx < eqIdx)) {
    const key = expr.slice(0, jsonIdx);
    const rest = expr.slice(jsonIdx + 2);
    if (!key) {
      throw new Error(t('commands.preferences.assignment.emptyKey', 'Empty key in assignment: {{expr}}', {expr}));
    }
    const raw = rest.startsWith('@') ? readPreferenceFile(rest.slice(1)) : rest;
    try {
      return {key, value: JSON.parse(raw) as PreferenceAssignmentValue};
    } catch {
      throw new Error(
        t('commands.preferences.assignment.invalidJson', 'Invalid JSON for {{key}} (use := for raw JSON)', {key}),
      );
    }
  }

  if (eqIdx === -1) {
    throw new Error(
      t(
        'commands.preferences.assignment.invalidFormat',
        'Invalid assignment: {{expr}}. Use KEY=value, KEY:=json, KEY=@file, or KEY:=@file.',
        {expr},
      ),
    );
  }

  const key = expr.slice(0, eqIdx);
  const rest = expr.slice(eqIdx + 1);
  if (!key) {
    throw new Error(t('commands.preferences.assignment.emptyKey', 'Empty key in assignment: {{expr}}', {expr}));
  }

  if (rest === '') return {key, value: null};
  if (rest.startsWith('@')) return {key, value: readPreferenceFile(rest.slice(1))};
  return {key, value: rest};
}

/** Build a flat `{ [key]: value }` object from assignment expressions. */
export function buildAssignmentMap(exprs: string[]): Record<string, PreferenceAssignmentValue> {
  const map: Record<string, PreferenceAssignmentValue> = {};
  for (const expr of exprs) {
    const {key, value} = parsePreferenceAssignment(expr);
    map[key] = value;
  }
  return map;
}

function readPreferenceFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(t('commands.preferences.fileNotFound', 'File not found: {{file}}', {file: filePath}));
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Base command class for SCAPI Configuration Preferences API commands.
 *
 * Provides lazy-initialized read-only and read-write clients with proper
 * OAuth strategy and configuration.
 */
export abstract class PreferencesCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _preferencesClient?: PreferencesClient;
  private _preferencesRwClient?: PreferencesClient;

  /** Returns a read-only Preferences API client. */
  protected get preferencesClient(): PreferencesClient {
    if (!this._preferencesClient) {
      this._preferencesClient = createPreferencesClient(this.preferencesClientConfig(), this.getOAuthStrategy());
    }
    return this._preferencesClient;
  }

  /** Returns a read-write Preferences API client. */
  protected get preferencesRwClient(): PreferencesClient {
    if (!this._preferencesRwClient) {
      this._preferencesRwClient = createPreferencesClient(this.preferencesClientConfig(), this.getOAuthStrategy(), {
        readWrite: true,
      });
    }
    return this._preferencesRwClient;
  }

  private preferencesClientConfig() {
    const shortCode = this.resolvedConfig.values.shortCode;
    const tenantId = this.requireTenantId();

    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ),
      );
    }

    return {shortCode, tenantId};
  }
}
