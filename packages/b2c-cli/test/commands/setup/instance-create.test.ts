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

describe('setup instance create', () => {
  const hooks = createIsolatedEnvHooks();
  let directory: string;
  let dwJsonPath: string;

  beforeEach(() => {
    hooks.beforeEach();
    directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-instance-create-')));
    dwJsonPath = path.join(directory, 'dw.json');
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  function create(name: string, ...args: string[]) {
    return runCommand(['setup:instance:create', name, '--hostname', `${name}.example.com`, '--force', ...args]);
  }

  it('reports the file it wrote and how to use it from other directories', async () => {
    delete process.env.SFCC_CONFIG;

    const result = await create('staging', '--project-directory', directory);

    expect(result.error).to.be.undefined;
    expect(fs.existsSync(dwJsonPath)).to.be.true;
    expect(result.stdout).to.include(`Instance "staging" created in ${dwJsonPath} (DwJsonSource).`);
    expect(result.stdout).to.include(`The CLI reads this file when run from ${directory}.`);
    expect(result.stdout).to.include(`setup default-config set ${dwJsonPath}`);
  });

  it('tells an explicit --config user to keep passing --config', async () => {
    const result = await create('staging', '--config', dwJsonPath);

    expect(result.error).to.be.undefined;
    expect(result.stdout).to.include(`Commands use this file when you pass --config ${dwJsonPath}.`);
  });

  it('includes the location in JSON output', async () => {
    const result = await create('staging', '--config', dwJsonPath, '--json');

    expect(result.error).to.be.undefined;
    expect(JSON.parse(result.stdout)).to.include({name: 'staging', location: dwJsonPath, source: 'DwJsonSource'});
  });

  it('explains how to change an instance that already exists', async () => {
    expect((await create('staging', '--config', dwJsonPath)).error).to.be.undefined;

    const result = await create('staging', '--config', dwJsonPath);

    expect(result.error?.message).to.include(`Instance "staging" already exists in ${dwJsonPath}.`);
    expect(result.error?.message).to.include('setup set <key> <value> --instance staging');
    expect(result.error?.message).to.include('setup instance remove staging');
  });
});
