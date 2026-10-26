/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {listAuthSessions, saveAuthSession} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_PUBLIC_CLIENT_ID} from '@salesforce/b2c-tooling-sdk';
import AuthLogout from '../../../src/commands/auth/logout.js';

function createCommand(): AuthLogout {
  const command = new AuthLogout([], {} as any);
  Object.defineProperty(command, 'resolvedConfig', {get: () => ({values: {}}), configurable: true});
  return command;
}

describe('auth logout', () => {
  afterEach(() => sinon.restore());

  it('names who was signed out and clears every sign-in', async () => {
    const session = {flow: 'pkce' as const, accessToken: 'a', refreshToken: 'r'};
    saveAuthSession({...session, clientId: DEFAULT_PUBLIC_CLIENT_ID, sub: 'dev@example.com'});
    saveAuthSession({...session, clientId: 'ci-client', sub: null});
    const command = createCommand();
    const log = sinon.stub(command, 'log');

    await command.run();

    expect(log.firstCall.args[0]).to.include('Signed out dev@example.com, ci-client.');
    expect(listAuthSessions()).to.deep.equal([]);
  });

  it('says when nobody was signed in', async () => {
    const command = createCommand();
    const log = sinon.stub(command, 'log');
    await command.run();
    expect(log.firstCall.args[0]).to.equal('You were not signed in.');
  });
});
