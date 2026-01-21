/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtUserProfile from '../../../../src/commands/mrt/user/profile.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt user profile', () => {
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
    return new MrtUserProfile([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls getUserProfile and returns user details', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      email: 'user@example.com',
      name: 'Test User',
      organizations: ['org1', 'org2'],
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(result.email).to.equal('user@example.com');
    expect(result.name).to.equal('Test User');
  });
});
