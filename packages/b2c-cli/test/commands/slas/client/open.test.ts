/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createRequire} from 'node:module';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import SlasClientOpen from '../../../../src/commands/slas/client/open.js';
import {isolateConfig, restoreConfig} from '../../../helpers/config-isolation.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas client open', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();

    // Prevent any attempt to actually open a browser by stubbing child_process
    const require = createRequire(import.meta.url);
    const childProcess = require('node:child_process') as typeof import('node:child_process');

    sinon.stub(childProcess, 'spawn').throws(new Error('blocked'));
    sinon.stub(childProcess, 'execFile').throws(new Error('blocked'));
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('errors when short code is missing from both flag and resolved config', async () => {
    const command: any = new SlasClientOpen([], config);

    stubParse(command, {'tenant-id': 'abcd_123'}, {clientId: 'my-client'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('builds URL using short code from resolved config and returns it', async () => {
    const command: any = new SlasClientOpen([], config);

    stubParse(command, {'tenant-id': 'abcd_123'}, {clientId: 'my-client'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}}));

    const logStub = sinon.stub(command, 'log').returns(void 0);

    const result = await command.run();

    expect(result.url).to.include('kv7kzm78.api.commercecloud.salesforce.com');
    expect(result.url).to.include('clientId=my-client');
    expect(result.url).to.include('tenantId=abcd_123');
    expect(logStub.called).to.equal(true);
  });

  it('prefers --short-code flag over resolved config', async () => {
    const command: any = new SlasClientOpen([], config);

    stubParse(command, {'tenant-id': 'abcd_123', 'short-code': 'flagcode'}, {clientId: 'my-client'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}}));

    sinon.stub(command, 'log').returns(void 0);

    const result = await command.run();
    expect(result.url).to.include('flagcode.api.commercecloud.salesforce.com');
  });
});
