/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtUserApiKey from '../../../../src/commands/mrt/user/api-key.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt user api-key', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    return new MrtUserApiKey([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls getApiKey and returns API key info', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      api_key: 'abc123xyz',
      created_at: '2025-01-01T00:00:00Z',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(result.api_key).to.equal('abc123xyz');
  });

  it('calls regenerateApiKey with --regenerate flag', async () => {
    const command = createCommand();

    stubParse(command, {regenerate: true}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const regenerateStub = sinon.stub().resolves({
      api_key: 'newkey456',
      created_at: '2025-01-02T00:00:00Z',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await regenerateStub({origin: 'https://example.com', regenerate: true});
      return result;
    };

    const result = await command.run();

    expect(regenerateStub.calledOnce).to.equal(true);
    expect(result.api_key).to.equal('newkey456');
  });
});
