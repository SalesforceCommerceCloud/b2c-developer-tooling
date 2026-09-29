/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import * as tls from 'node:tls';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {generateCaCertificate} from '@salesforce/b2c-tooling-sdk/operations/mtls';
import EcdnMtlsIssue from '../../../../src/commands/ecdn/mtls/issue.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  expectError,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

describe('ecdn mtls issue', () => {
  const hooks = createIsolatedConfigHooks();
  let tempDir: string;
  let caCertFile: string;
  let caKeyFile: string;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtls-issue-'));
    const ca = generateCaCertificate({commonName: 'Test CA'});
    caCertFile = path.join(tempDir, 'ca.pem');
    caKeyFile = path.join(tempDir, 'ca.key');
    fs.writeFileSync(caCertFile, ca.certificatePem);
    fs.writeFileSync(caKeyFile, ca.privateKeyPem);
  });

  after(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    const command: any = await createTestCommand(
      EcdnMtlsIssue,
      hooks.getConfig(),
      {'ca-cert-file': caCertFile, 'ca-key-file': caKeyFile, days: 365, force: false, ...flags},
      {},
    );
    sinon.stub(command, 'jsonEnabled').returns(true);
    makeCommandThrowOnError(command);
    return command;
  }

  it('writes a .p12 next to the CA by default', async () => {
    const command = await createCommand({name: 'jane doe', 'p12-passphrase': 'pw'});

    const result = await command.run();

    expect(result.file).to.equal(path.join(tempDir, 'jane-doe.p12'));
    expect(result.subject).to.equal('CN=jane doe');
    expect(result.passphrase).to.equal('pw');
    const pfx = fs.readFileSync(result.file);
    expect(() => tls.createSecureContext({pfx, passphrase: 'pw'})).to.not.throw();
  });

  it('writes to --output with a random passphrase', async () => {
    const output = path.join(tempDir, 'nested', 'ci.p12');
    const command = await createCommand({name: 'ci', output});

    const result = await command.run();

    expect(result.file).to.equal(output);
    expect(result.passphrase).to.have.length(32);
    expect((fs.statSync(output).mode % 0o1000).toString(8)).to.equal('600');
  });

  it('refuses to overwrite without --force', async () => {
    const output = path.join(tempDir, 'dup.p12');
    fs.writeFileSync(output, 'existing');
    const command = await createCommand({name: 'dup', output});

    await expectError(() => command.run(), /Refusing to overwrite/);
    expect(fs.readFileSync(output, 'utf8')).to.equal('existing');
  });

  it('rejects a CA key that does not match the certificate', async () => {
    const otherKey = path.join(tempDir, 'other.key');
    fs.writeFileSync(otherKey, generateCaCertificate().privateKeyPem);
    const command = await createCommand({name: 'x', 'ca-key-file': otherKey});

    await expectError(() => command.run(), /does not match/);
  });
});
