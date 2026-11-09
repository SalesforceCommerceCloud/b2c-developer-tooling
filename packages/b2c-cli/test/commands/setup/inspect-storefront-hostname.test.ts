/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

describe('setup inspect storefront hostname warning', () => {
  const hooks = createIsolatedEnvHooks();
  let directory: string;

  beforeEach(() => {
    hooks.beforeEach();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-inspect-storefront-'));
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('warns when hostname is a Default Domain and suggests the Business Manager host', async () => {
    const dwJsonPath = path.join(directory, 'dw.json');
    fs.writeFileSync(dwJsonPath, JSON.stringify({hostname: 'abcd-001.sbx.my.commercecloud.salesforce.com'}));

    const {stdout} = await runCommand(['setup:inspect', '--config', dwJsonPath, '--json']);
    const result = JSON.parse(stdout) as {warnings?: string[]};

    expect(result.warnings).to.have.length(1);
    expect(result.warnings![0]).to.include('storefront Default Domain');
    expect(result.warnings![0]).to.include('abcd-001.dx.commercecloud.salesforce.com');
  });

  it('does not warn for a Business Manager hostname', async () => {
    const dwJsonPath = path.join(directory, 'dw.json');
    fs.writeFileSync(dwJsonPath, JSON.stringify({hostname: 'abcd-001.dx.commercecloud.salesforce.com'}));

    const {stdout} = await runCommand(['setup:inspect', '--config', dwJsonPath, '--json']);

    expect((JSON.parse(stdout) as {warnings?: string[]}).warnings).to.equal(undefined);
  });
});
