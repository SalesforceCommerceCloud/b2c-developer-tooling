/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Flags} from '@oclif/core';
import {
  parseBaseline,
  validateSecurityConfig,
  type SecurityBaseline,
  type SecurityConfig,
} from '@salesforce/b2c-tooling-sdk/security';

/** Baseline file picked up automatically from the current directory. */
export const DEFAULT_BASELINE_FILE = '.b2c-security-baseline.json';

export const ruleFilterFlags = {
  rule: Flags.string({
    description: 'Run only this rule (repeatable; see "b2c security rules")',
    multiple: true,
  }),
  'exclude-rule': Flags.string({
    description: 'Skip this rule (repeatable)',
    multiple: true,
  }),
  ignore: Flags.string({
    description: 'Leave out files matching this glob, relative to the project directory (repeatable)',
    multiple: true,
  }),
};

/** Reads a baseline file, or the default one in `cwd` when present. */
export function loadBaseline(file: string | undefined, cwd: string): {baseline?: SecurityBaseline; file?: string} {
  const candidate = file ?? path.join(cwd, DEFAULT_BASELINE_FILE);
  if (!fs.existsSync(candidate)) {
    if (file) throw new Error(`Baseline file not found: ${file}`);
    return {};
  }
  return {baseline: parseBaseline(fs.readFileSync(candidate, 'utf8')), file: candidate};
}

/**
 * The `security` settings from dw.json, validated, or undefined so the scan
 * reads `.b2c-security.json` from the project directory instead.
 */
export function securityConfigFromDwJson(value: unknown): SecurityConfig | undefined {
  return value === undefined ? undefined : validateSecurityConfig(value, 'dw.json "security"');
}
