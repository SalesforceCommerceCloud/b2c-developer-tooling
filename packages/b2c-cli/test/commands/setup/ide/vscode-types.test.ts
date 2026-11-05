/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {ObjectTypesClient} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import SetupIdeVscodeTypes from '../../../../src/commands/setup/ide/vscode-types.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../../helpers/test-setup.js';

describe('setup ide vscode-types', () => {
  const hooks = createIsolatedEnvHooks();
  let config: Config;
  let dir: string;

  beforeEach(async () => {
    hooks.beforeEach();
    config = await Config.load();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-vscode-types-'));
  });

  afterEach(() => {
    sinon.restore();
    fs.rmSync(dir, {recursive: true, force: true});
    hooks.afterEach();
  });

  async function run(flags: Record<string, unknown>): Promise<any> {
    const command: any = new SetupIdeVscodeTypes([], config);
    stubParse(command, {
      output: 'jsconfig.json',
      force: false,
      copy: false,
      'custom-attributes': false,
      'project-directory': dir,
      ...flags,
    });
    await command.init();
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'getOAuthStrategy').returns({});
    sinon.stub(command, 'error').callsFake((msg: unknown) => {
      throw new Error(String(msg));
    });
    return command.run();
  }

  it('writes a jsconfig without custom attributes by default', async () => {
    const result = await run({});
    const jsconfig = JSON.parse(fs.readFileSync(result.jsconfigPath, 'utf8'));
    expect(jsconfig.include).to.not.include('.b2c-script-types/custom-attributes.d.ts');
    expect(result.customAttributes).to.equal(undefined);
  });

  it('generates custom attribute types and includes them in the jsconfig', async () => {
    sinon
      .stub(ObjectTypesClient.prototype, 'listAttributeDefinitions')
      .resolves([{id: 'color', valueType: 'string', system: false}] as never);

    const result = await run({
      'custom-attributes': true,
      'object-type': ['Product'],
      'short-code': 'abc',
      'tenant-id': 'zzxy_prd',
    });

    const file = path.join(dir, '.b2c-script-types', 'custom-attributes.d.ts');
    expect(result.customAttributes.path).to.equal(file);
    expect(result.customAttributes.objectTypes).to.deep.equal([{objectType: 'Product', attributes: 1}]);
    expect(fs.readFileSync(file, 'utf8')).to.include('interface Product {');
    const jsconfig = JSON.parse(fs.readFileSync(result.jsconfigPath, 'utf8'));
    expect(jsconfig.include).to.include('.b2c-script-types/custom-attributes.d.ts');
  });

  it('requires a short code for --custom-attributes', async () => {
    try {
      await run({'custom-attributes': true, 'tenant-id': 'zzxy_prd'});
      expect.fail('expected an error');
    } catch (error) {
      expect(String(error)).to.include('short code');
    }
  });
});
