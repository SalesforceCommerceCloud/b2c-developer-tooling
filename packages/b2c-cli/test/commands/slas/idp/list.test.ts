/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasIdpList from '../../../../src/commands/slas/idp/list.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas idp list', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasIdpList([], config);
    stubParse(command, flags, args);
    await command.init();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('redacts client secrets by default', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({data: {data: [{name: 'google', clientSecret: 'shh'}]}, error: undefined}),
    });

    const result = await command.run();
    expect(result.idps[0].clientSecret).to.equal('********');
  });

  it('shows client secrets with --show-secret', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', 'show-secret': true});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({data: {data: [{name: 'google', clientSecret: 'shh'}]}, error: undefined}),
    });

    const result = await command.run();
    expect(result.idps[0].clientSecret).to.equal('shh');
  });

  it('treats a 404 as an empty list', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({error: {exception_name: 'IdpNotFoundException'}, response: {status: 404}}),
    });

    const result = await command.run();
    expect(result.idps).to.deep.equal([]);
  });
});
