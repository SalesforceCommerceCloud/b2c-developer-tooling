/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {saveAuthSession, type AuthSession} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_PUBLIC_CLIENT_ID} from '@salesforce/b2c-tooling-sdk';
import type {NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import AuthStatus from '../../../src/commands/auth/status.js';

function session(clientId: string, overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    clientId,
    flow: 'pkce',
    accessToken: 'opaque',
    refreshToken: 'refresh',
    sub: 'dev@example.com',
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
    ...overrides,
  };
}

function createCommand(values: Partial<NormalizedConfig>, json: boolean): AuthStatus {
  const command = new AuthStatus([], {} as any);
  (command as any).jsonEnabled = () => json;
  Object.defineProperty(command, 'resolvedConfig', {
    get: () => ({values, warnings: [], sources: []}),
    configurable: true,
  });
  return command;
}

describe('auth status', () => {
  afterEach(() => sinon.restore());

  it('lists sessions and what the configured instance uses them for', async () => {
    saveAuthSession(session(DEFAULT_PUBLIC_CLIENT_ID));
    saveAuthSession(session('my-api-client', {flow: 'implicit', refreshToken: null}));

    const result = await createCommand({hostname: 'my-sandbox.example.com'}, true).run();

    expect(result.instance).to.deep.include({hostname: 'my-sandbox.example.com'});
    expect(result.instance?.webdav).to.include({method: 'user', builtInClient: true});
    expect(result.sessions).to.have.length(2);
    const builtIn = result.sessions.find((s) => s.builtInClient);
    expect(builtIn).to.include({user: 'dev@example.com', accessTokenValid: true, canRefresh: true});
    expect(builtIn?.usedFor).to.deep.equal(['webdav']);
    const other = result.sessions.find((s) => s.clientId === 'my-api-client');
    expect(other).to.include({canRefresh: false});
    expect(other?.usedFor).to.equal(undefined);
  });

  it('lists sessions without an instance', async () => {
    saveAuthSession(session('my-api-client'));
    const result = await createCommand({}, true).run();
    expect(result).not.to.have.property('instance');
    expect(result.sessions.map((s) => s.clientId)).to.deep.equal(['my-api-client']);
  });

  it('prints the instance paths, the session table, and the sharing hint', async () => {
    saveAuthSession(session(DEFAULT_PUBLIC_CLIENT_ID));
    const stdout = sinon.stub(ux, 'stdout');

    await createCommand({hostname: 'my-sandbox.example.com'}, false).run();

    const output = stdout.args.map((args) => String(args[0])).join('\n');
    expect(output).to.include('Instance my-sandbox.example.com');
    expect(output).to.include('browser login (built-in client) — signed in as dev@example.com');
    expect(output).to.include('shared across instances');
  });

  it('says when there are no sessions', async () => {
    const stdout = sinon.stub(ux, 'stdout');
    await createCommand({}, false).run();
    expect(stdout.args.map((args) => String(args[0])).join('\n')).to.include('No stored sessions.');
  });
});
