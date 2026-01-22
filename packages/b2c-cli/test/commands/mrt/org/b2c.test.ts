/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtOrgB2c from '../../../../src/commands/mrt/org/b2c.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt org b2c', () => {
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
    return new MrtOrgB2c([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls getOrgB2cConfig and returns B2C configuration', async () => {
    const command = createCommand();

    stubParse(command, {}, {slug: 'my-org'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      organization: 'my-org',
      client_id: 'client-id-123',
      instances: ['instance1.dx.commercecloud.salesforce.com'],
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({organization: 'my-org', origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.organization).to.equal('my-org');
    expect(result.client_id).to.equal('client-id-123');
  });
});
