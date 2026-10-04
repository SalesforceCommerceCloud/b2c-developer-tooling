/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ConfigSourceInfo, ConfigWarning, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import * as assert from 'assert';
import * as path from 'path';
import {buildConfigInspection} from '../config-inspect.js';
import {renderConfigInspectPanel} from '../config-inspect-panel.js';

const projectDwJson = path.resolve('/project/dw.json');
const envFile = path.resolve('/project/.env.test');

function inspect(sources: ConfigSourceInfo[], values: NormalizedConfig, warnings: ConfigWarning[] = []) {
  return buildConfigInspection(
    {sources, values, warnings},
    {envFile, envFileSelection: envFile, instanceDisabled: false, workspaceSelected: true},
  );
}

suite('config inspection', () => {
  test('attributes each value to the source that supplied it', () => {
    const result = inspect(
      [
        {name: 'DotenvFile', location: envFile, fields: ['codeVersion']},
        {name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'instanceName']},
        {name: 'StorefrontNextEnvSource', location: envFile, fields: ['siteId']},
      ],
      {hostname: 'stg.example.com', instanceName: 'stg', codeVersion: 'v1', siteId: 'RefArch'},
    );

    assert.deepStrictEqual(
      result.rows.map((row) => [row.field, row.value, row.source]),
      [
        ['hostname', 'stg.example.com', 'dw.json'],
        ['instanceName', 'stg', 'dw.json'],
        ['codeVersion', 'v1', '.env.test'],
        ['siteId', 'RefArch', '.env.test (Storefront Next)'],
      ],
    );
    assert.strictEqual(result.label, 'stg');
    assert.ok(result.context.includes(`Env file: ${envFile}`), result.context.join('\n'));
  });

  test('never includes secret values', () => {
    const result = inspect([{name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'clientSecret']}], {
      hostname: 'stg.example.com',
      clientSecret: 'super-secret-value',
    });
    const secret = result.rows.find((row) => row.field === 'clientSecret');

    assert.deepStrictEqual(secret && [secret.value, secret.sensitive], ['', true]);
    assert.ok(!renderConfigInspectPanel(result).includes('super-secret-value'));
  });

  test('explains why supplied values were not used', () => {
    const result = inspect(
      [
        {name: 'DotenvFile', location: envFile, fields: ['hostname', 'clientId']},
        {name: 'DwJsonSource', location: projectDwJson, fields: [], fieldsIgnored: ['hostname', 'shortCode']},
        {name: 'StorefrontNextEnvSource', location: envFile, fields: ['clientId'], fieldsIgnored: ['clientId']},
      ],
      {hostname: 'env.example.com', clientId: 'abc'},
      [{code: 'HOSTNAME_MISMATCH', message: 'dw.json hostname differs', details: {source: 'DwJsonSource'}}],
    );

    assert.deepStrictEqual(
      result.ignored.map((item) => [item.field, item.source, item.reason]),
      [
        ['hostname', 'dw.json', 'source skipped: hostname differs'],
        ['shortCode', 'dw.json', 'source skipped: hostname differs'],
        ['clientId', '.env.test (Storefront Next)', 'set by .env.test'],
      ],
    );
    assert.deepStrictEqual(result.warnings, ['dw.json hostname differs']);
  });

  test('renders an empty state with the resolution error', () => {
    const html = renderConfigInspectPanel(undefined, 'Env file not found: /project/.env.gone');

    assert.ok(html.includes('No B2C instance configured'));
    assert.ok(html.includes('Env file not found: /project/.env.gone'));
  });
});
