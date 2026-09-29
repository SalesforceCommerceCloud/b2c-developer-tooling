/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {SafetyGuard, type SafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';
import sinon from 'sinon';
import SetupOpenShell from '../../../src/commands/setup/openshell.js';
import {makeCommandThrowOnError, stubCommandConfigAndLogger} from '../../helpers/test-setup.js';

describe('setup openshell', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-setup-openshell-'));
  });

  afterEach(async () => {
    sinon.restore();
    await fs.rm(dir, {recursive: true, force: true});
  });

  const CONFIG = {
    hostname: 'abcd-001.dx.commercecloud.salesforce.com',
    clientId: 'my-client',
    clientSecret: 'real-secret',
  };

  function createCommand(
    values: Record<string, unknown>,
    flags: Record<string, unknown> = {},
    safety?: SafetyConfig,
  ): any {
    const command = new SetupOpenShell([], {} as any);
    stubCommandConfigAndLogger(command);
    (command as any).config.version = '1.2.3';
    (command as any).flags = {sandbox: true, directory: dir, ...flags};
    (command as any).safetyGuard = new SafetyGuard(safety ?? {level: 'NONE'});
    Object.defineProperty(command, 'resolvedConfig', {value: {values}, configurable: true});
    command.warn = sinon.stub();
    return command;
  }

  it('writes the files and applies nothing on a dry run', async () => {
    const command = createCommand(CONFIG, {'dry-run': true, 'safety-level': 'NO_DELETE'}, {level: 'READ_ONLY'});

    const result = await command.run();

    expect(result).to.include({sandboxName: 'b2c-abcd-001', accessLevel: 'NO_DELETE', applied: false});
    expect(result.image).to.equal('b2c-openshell:1.2.3');
    expect(result.providers).to.deep.equal([{name: 'b2c-abcd-001-client-secret', envVar: 'SFCC_CLIENT_SECRET'}]);
    expect(result.steps).to.deep.equal([]);
    expect(JSON.stringify(result)).to.not.include('real-secret');
    expect(await fs.readdir(dir)).to.include.members(['Dockerfile', 'policy.yaml', 'profiles', 'setup.sh']);
    expect(await fs.readFile(path.join(dir, 'Dockerfile'), 'utf8')).to.include('@salesforce/b2c-cli@1.2.3');
    expect(command.warn.calledWithMatch(/beta/)).to.equal(true);
  });

  it('defaults to NONE without Safety Mode configured', async () => {
    const result = await createCommand(CONFIG, {'dry-run': true}).run();

    expect(result.accessLevel).to.equal('NONE');
    expect(result.env).to.not.have.property('SFCC_SAFETY_CONFIG');
    expect(await fs.readdir(dir)).to.not.include('safety.json');
  });

  it('forwards the configured Safety Mode level and rules', async () => {
    const rules = [{job: 'sfcc-site-archive-export', action: 'allow' as const}];
    const result = await createCommand(CONFIG, {'dry-run': true}, {level: 'READ_ONLY', confirm: true, rules}).run();

    expect(result.accessLevel).to.equal('READ_ONLY');
    expect(result.env).to.include({SFCC_SAFETY_LEVEL: 'READ_ONLY', SFCC_SAFETY_CONFIG: '/sandbox/.b2c/safety.json'});
    const forwarded = JSON.parse(await fs.readFile(path.join(dir, 'safety.json'), 'utf8'));
    expect(forwarded).to.deep.equal({level: 'READ_ONLY', confirm: true, rules});
  });

  it('errors when there are no credentials to store', async () => {
    const command = createCommand({hostname: 'abcd-001.dx.commercecloud.salesforce.com'}, {'dry-run': true});
    makeCommandThrowOnError(command);

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).to.include('No credentials to store');
    }
  });
});
