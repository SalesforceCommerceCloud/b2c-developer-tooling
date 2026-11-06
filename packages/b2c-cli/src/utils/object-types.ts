/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Command, Flags} from '@oclif/core';
import {ERROR_CODE, OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {ObjectTypesClient} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {t} from '../i18n/index.js';

const LOCALE_PREFIX = /^([A-Za-z]{2}(?:[-_][A-Za-z0-9]+)?|default)=([\s\S]*)$/;

/** Positional `object-type` argument shared by the topic. */
export const objectTypeArg = Args.string({
  description: 'System object type (for example Product, Order, Profile, SitePreferences)',
  required: true,
});

/** Shared `--force` flag for destructive commands. */
export const forceFlag = Flags.boolean({
  char: 'f',
  description: 'Skip the confirmation prompt',
  default: false,
});

/** Shared `--file` flag for JSON request bodies. */
export const bodyFileFlag = Flags.string({
  description: 'JSON file with the request body (use - for stdin)',
});

/** Parses localized-string flag values (`text` or `locale=text`) into a map. */
export function parseLocalized(values: string[] | undefined): Record<string, string> | undefined {
  if (!values || values.length === 0) return undefined;
  const result: Record<string, string> = {};
  for (const value of values) {
    const match = value.match(LOCALE_PREFIX);
    if (match) result[match[1]] = match[2];
    else result.default = value;
  }
  return result;
}

/** Reads a JSON object body from a file path or `-` (stdin). */
export function readJsonBody(file: string): Record<string, unknown> {
  const raw = file === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(file, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(t('commands.objectTypes.invalidJson', 'File {{file}} must contain a JSON object.', {file}));
  }
  return parsed as Record<string, unknown>;
}

/**
 * Base command for `b2c object-types`, backed by the SCAPI Object Definitions
 * API (`sfcc.object-definitions` / `sfcc.object-definitions.rw` scopes).
 */
export abstract class ObjectTypesCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _objectTypes?: ObjectTypesClient;

  protected get objectTypes(): ObjectTypesClient {
    if (!this._objectTypes) {
      const shortCode = this.resolvedConfig.values.shortCode;
      const tenantId = this.requireTenantId();
      if (!shortCode) {
        this.error(
          t(
            'error.shortCodeRequired',
            'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
          ) + this.configDocsHint(),
          {code: ERROR_CODE.VALIDATION},
        );
      }
      this._objectTypes = new ObjectTypesClient({shortCode, tenantId, auth: this.getOAuthStrategy()});
    }
    return this._objectTypes;
  }
}
