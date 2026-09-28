/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {X509Certificate} from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import * as tls from 'node:tls';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {generateCaCertificate, issueClientCertificate} from '@salesforce/b2c-tooling-sdk/operations/mtls';
import EcdnMtlsCreate from '../../../../src/commands/ecdn/mtls/create.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  expectError,
  makeCommandThrowOnError,
  runSilent,
} from '../../../helpers/test-setup.js';

describe('ecdn mtls create', () => {
  const hooks = createIsolatedConfigHooks();
  let tempDir: string;

  beforeEach(async () => {
    await hooks.beforeEach();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtls-create-'));
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnMtlsCreate, hooks.getConfig(), flags, {});
  }

  function stubCommon(
    command: any,
    {jsonEnabled = true, values = {}}: {jsonEnabled?: boolean; values?: Record<string, unknown>} = {},
  ) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {shortCode: 'kv7kzm78', ...values}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    makeCommandThrowOnError(command);
  }

  function stubPost(command: any, post: (path: string, init: any) => Promise<any>) {
    const spy = sinon.spy(post);
    Object.defineProperty(command, '_cdnZonesRwClient', {value: {POST: spy}, configurable: true, writable: true});
    return spy;
  }

  const created = {
    data: {
      data: {
        mtlsCertificateId: 'cert-1',
        mtlsCertificateName: 'my-cert',
        ca: true,
        mtlsAssociatedCodeUploadHostname: 'cert.staging.example.com',
      },
    },
  };

  function generateFlags(extra: Record<string, unknown> = {}) {
    return {
      'tenant-id': 'zzxy_prd',
      name: 'my-cert',
      generate: true,
      'out-dir': tempDir,
      'ca-days': 365,
      'client-days': 365,
      force: false,
      ...extra,
    };
  }

  it('uploads existing PEM files', async () => {
    const ca = generateCaCertificate();
    fs.writeFileSync(path.join(tempDir, 'ca.pem'), ca.certificatePem);
    fs.writeFileSync(path.join(tempDir, 'ca.key'), ca.privateKeyPem);
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      name: 'my-cert',
      'certificate-file': path.join(tempDir, 'ca.pem'),
      'private-key-file': path.join(tempDir, 'ca.key'),
    });
    stubCommon(command);
    const post = stubPost(command, async () => created);

    const result = await command.run();

    expect(result.certificate.mtlsCertificateId).to.equal('cert-1');
    expect(result.files).to.be.undefined;
    expect(post.firstCall.args[1].body).to.deep.equal({
      name: 'my-cert',
      certificate: ca.certificatePem,
      privateKey: ca.privateKeyPem,
    });
  });

  it('rejects a client certificate before uploading', async () => {
    const ca = generateCaCertificate();
    const client = issueClientCertificate({ca, commonName: 'dev'});
    fs.writeFileSync(path.join(tempDir, 'client.pem'), client.certificatePem);
    fs.writeFileSync(path.join(tempDir, 'client.key'), client.privateKeyPem);

    const command: any = await createCommand({
      'tenant-id': 'zzxy_stg',
      name: 'my-cert',
      'certificate-file': path.join(tempDir, 'client.pem'),
      'private-key-file': path.join(tempDir, 'client.key'),
    });
    stubCommon(command);
    const post = stubPost(command, async () => created);

    await expectError(() => command.run(), /not a CA certificate/);
    expect(post.called).to.equal(false);
  });

  it('generates a CA, uploads it, and issues a client certificate', async () => {
    const command: any = await createCommand(generateFlags({'client-name': 'build-server', 'p12-passphrase': 'pw'}));
    stubCommon(command);
    const post = stubPost(command, async () => created);

    const result = await command.run();

    const body = post.firstCall.args[1].body;
    const caX509 = new X509Certificate(body.certificate);
    expect(caX509.ca).to.equal(true);
    expect(caX509.subject).to.equal('CN=my-cert CA');
    expect(body.privateKey).to.include('PRIVATE KEY');

    expect(result.files).to.deep.equal({
      caCertificate: path.join(tempDir, 'ca.pem'),
      caPrivateKey: path.join(tempDir, 'ca.key'),
      clientCertificate: path.join(tempDir, 'build-server.p12'),
    });
    expect(result.clientPassphrase).to.equal('pw');
    expect(fs.readFileSync(result.files.caCertificate, 'utf8')).to.equal(body.certificate);
    expect((fs.statSync(result.files.caPrivateKey).mode % 0o1000).toString(8)).to.equal('600');
    expect(fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf8')).to.include('*');

    const pfx = fs.readFileSync(result.files.clientCertificate);
    expect(() => tls.createSecureContext({pfx, passphrase: 'pw'})).to.not.throw();
  });

  it('uses the staging hostname as the CA common name', async () => {
    const command: any = await createCommand(generateFlags());
    stubCommon(command, {values: {hostname: 'staging-abcd-acme.demandware.net'}});
    const post = stubPost(command, async () => created);

    await command.run();

    expect(new X509Certificate(post.firstCall.args[1].body.certificate).subject).to.equal(
      'CN=staging-abcd-acme.demandware.net',
    );
  });

  it('warns for non-staging organizations', async () => {
    const command: any = await createCommand(generateFlags());
    stubCommon(command);
    stubPost(command, async () => created);

    await command.run();

    expect(command.warn.firstCall.args[0]).to.include('_stg');
  });

  it('prints security guidance in human-readable mode', async () => {
    const command: any = await createCommand(generateFlags());
    stubCommon(command, {jsonEnabled: false});
    stubPost(command, async () => created);
    const {ux} = await import('@oclif/core');
    const stdout = sinon.stub(ux, 'stdout');

    await command.run();

    const out = stdout
      .getCalls()
      .map((c) => String(c.args[0]))
      .join('\n');
    expect(out).to.include('protect the CA private key');
    expect(out).to.include('Never commit');
    expect(out).to.include('allowed a maximum expiry');
    expect(out).to.include('cert.staging.example.com');
    expect(out).to.include('my-cert-client.p12');
  });

  it('keeps the generated CA files when the upload fails', async () => {
    const command: any = await createCommand(generateFlags());
    stubCommon(command);
    stubPost(command, async () => ({
      error: {title: 'Bad Request', detail: 'nope'},
      response: {status: 400, statusText: 'Bad Request'},
    }));

    await expectError(() => runSilent(() => command.run()), /retry the upload with --certificate-file/);

    expect(fs.existsSync(path.join(tempDir, 'ca.pem'))).to.equal(true);
    expect(fs.existsSync(path.join(tempDir, 'ca.key'))).to.equal(true);
    expect(fs.existsSync(path.join(tempDir, 'my-cert-client.p12'))).to.equal(false);
  });

  it('refuses to overwrite existing files without --force', async () => {
    fs.writeFileSync(path.join(tempDir, 'ca.key'), 'existing');
    const command: any = await createCommand(generateFlags());
    stubCommon(command);
    const post = stubPost(command, async () => created);

    await expectError(() => command.run(), /Refusing to overwrite/);

    expect(post.called).to.equal(false);
    expect(fs.readFileSync(path.join(tempDir, 'ca.key'), 'utf8')).to.equal('existing');
  });
});
