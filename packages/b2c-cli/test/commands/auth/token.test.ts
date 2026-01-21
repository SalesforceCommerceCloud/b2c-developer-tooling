/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import AuthToken from '../../../src/commands/auth/token.js';
import {createIsolatedConfigHooks} from '../../helpers/test-setup.js';

describe('auth token', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  function createCommand(): any {
    return new AuthToken([], hooks.getConfig());
  }

  it('returns structured JSON in JSON mode', async () => {
    const command = createCommand();

    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const strategy = {
      getTokenResponse: sinon.stub().resolves({
        accessToken: 'token123',
        expires: new Date('2025-01-01T00:00:00.000Z'),
        scopes: ['scope1'],
      }),
    };

    sinon.stub(command, 'getOAuthStrategy').returns(strategy);

    const result = await command.run();

    expect(strategy.getTokenResponse.calledOnce).to.equal(true);
    expect(result.accessToken).to.equal('token123');
    expect(result.scopes).to.have.lengthOf(1);
  });

  it('prints raw token in non-JSON mode', async () => {
    const command = createCommand();

    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const strategy = {
      getTokenResponse: sinon.stub().resolves({
        accessToken: 'token123',
        expires: new Date('2025-01-01T00:00:00.000Z'),
        scopes: [],
      }),
    };

    sinon.stub(command, 'getOAuthStrategy').returns(strategy);

    await command.run();

    expect(stdoutStub.calledOnce).to.equal(true);
  });
});
