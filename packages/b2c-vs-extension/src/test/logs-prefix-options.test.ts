/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import type {LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {customLoggerOptions, STANDARD_PREFIX_OPTIONS} from '../logs/prefix-options.js';

function makeFile(name: string, prefix: string): LogFile {
  return {name, prefix, size: 1, lastModified: new Date(0), path: `Logs/${name}`};
}

suite('logs prefix options', () => {
  test('standard options default to error and customerror and offer all custom loggers', () => {
    assert.deepStrictEqual(
      STANDARD_PREFIX_OPTIONS.filter((o) => o.picked).map((o) => o.label),
      ['error', 'customerror'],
    );
    assert.ok(STANDARD_PREFIX_OPTIONS.some((o) => o.label === 'custom-'));
  });

  test('customLoggerOptions lists each custom logger category once, sorted', () => {
    const options = customLoggerOptions([
      makeFile('error-blade1-20260101.log', 'error'),
      makeFile('customerror-blade1-20260101.log', 'customerror'),
      makeFile('custom-Pim-blade1-20260101.log', 'custom-Pim'),
      makeFile('custom-Pim-blade2-20260101.log', 'custom-Pim'),
      makeFile('custom-Avalara-blade1-20260101.log', 'custom-Avalara'),
    ]);
    assert.deepStrictEqual(
      options.map((o) => o.label),
      ['custom-Avalara', 'custom-Pim'],
    );
  });
});
