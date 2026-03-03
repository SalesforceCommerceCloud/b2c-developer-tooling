/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnPageShieldScriptsGet from '../../../../../src/commands/ecdn/page-shield/scripts/get.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn page-shield scripts get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnPageShieldScriptsGet, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves('zone123');
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{GET: any}>) {
    Object.defineProperty(command, '_cdnZonesClient', {value: client, configurable: true, writable: true});
  }

  it('returns script details in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-123'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-123',
            url: 'https://example.com/app.js',
            host: 'example.com',
            status: 'active',
            malwareScore: 0,
            mageCartScore: 0,
            obfuscationScore: 5,
            dataflowScore: 10,
            cryptoMiningScore: 0,
            jsIntegrityScore: 95,
            firstSeenAt: '2025-01-01T10:00:00Z',
            lastSeenAt: '2025-01-15T14:30:00Z',
            hash: 'abc123def456',
            pageUrls: ['https://store.com/page1', 'https://store.com/page2'],
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('script');
    expect(result.script.id).to.equal('script-123');
    expect(result.script.url).to.equal('https://example.com/app.js');
    expect(result.script.status).to.equal('active');
    expect(result.script.malwareScore).to.equal(0);
  });

  it('handles script with minimal fields', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-456'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-456',
            url: 'https://cdn.example.com/script.js',
            host: 'cdn.example.com',
            status: 'inactive',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.script.id).to.equal('script-456');
    expect(result.script.firstSeenAt).to.be.undefined;
    expect(result.script.hash).to.be.undefined;
  });

  it('displays script in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-789'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-789',
            url: 'https://example.com/analytics.js',
            host: 'example.com',
            status: 'active',
            malwareScore: 15,
            mageCartScore: 20,
            firstSeenAt: '2025-01-10T08:00:00Z',
            lastSeenAt: '2025-01-20T16:00:00Z',
            hash: 'xyz789abc',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {script: any};

    expect(result.script.id).to.equal('script-789');
    expect(result.script.malwareScore).to.equal(15);
  });

  it('displays script with malicious indicators', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-bad'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-bad',
            url: 'https://malicious.example.com/bad.js',
            host: 'malicious.example.com',
            status: 'active',
            malwareScore: 95,
            domainReportedMalicious: true,
            urlReportedMalicious: true,
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {script: any};

    expect(result.script.domainReportedMalicious).to.be.true;
    expect(result.script.urlReportedMalicious).to.be.true;
  });

  it('displays script with many page URLs', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-multi'});
    stubCommon(command, {jsonEnabled: false});

    const pageUrls = Array.from({length: 10}, (_, i) => `https://store.com/page${i + 1}`);

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-multi',
            url: 'https://example.com/common.js',
            host: 'example.com',
            status: 'active',
            pageUrls,
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {script: any};

    expect(result.script.pageUrls).to.have.lengthOf(10);
  });

  it('displays script with few page URLs', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-few'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-few',
            url: 'https://example.com/widget.js',
            host: 'example.com',
            status: 'active',
            pageUrls: ['https://store.com/page1', 'https://store.com/page2'],
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {script: any};

    expect(result.script.pageUrls).to.have.lengthOf(2);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-404'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'Script not found'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-empty'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: undefined},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('No script data returned');
    }
  });

  it('displays all security scores', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'script-id': 'script-scores'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'script-scores',
            url: 'https://example.com/full.js',
            host: 'example.com',
            status: 'active',
            malwareScore: 10,
            mageCartScore: 15,
            obfuscationScore: 20,
            dataflowScore: 25,
            cryptoMiningScore: 5,
            jsIntegrityScore: 80,
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {script: any};

    expect(result.script.malwareScore).to.equal(10);
    expect(result.script.mageCartScore).to.equal(15);
    expect(result.script.obfuscationScore).to.equal(20);
    expect(result.script.dataflowScore).to.equal(25);
    expect(result.script.cryptoMiningScore).to.equal(5);
    expect(result.script.jsIntegrityScore).to.equal(80);
  });
});
