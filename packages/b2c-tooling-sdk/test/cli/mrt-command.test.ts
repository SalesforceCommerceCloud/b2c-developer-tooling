/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  OAuthStrategy,
  JwtOAuthStrategy,
  StatefulOAuthStrategy,
  saveAuthSession,
  clearAllAuthSessions,
  initializeFileAuthSessionStore,
  resetAuthSessionStoreForTesting,
} from '@salesforce/b2c-tooling-sdk/auth';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_FIXTURES_DIR = path.join(__dirname, '../fixtures/jwt');
const TEST_CERT_PATH = path.join(TEST_FIXTURES_DIR, 'test-cert.pem');
const TEST_KEY_PATH = path.join(TEST_FIXTURES_DIR, 'test-key.pem');

// Minimal well-formed JWT with a future `exp`, so a stored client-credentials
// session reads as valid (matches the helper in oauth-command.test.ts).
function makeValidJWT(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub: 'test', exp})).toString('base64');
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

// SCAPI MRT coordinates shared across eligibility tests. `credentials-file`
// points at /dev/null so config resolution never touches the real ~/.mobify.
const SCAPI_FLAGS = {'short-code': 'kv7kzm78', 'tenant-id': 'zzxy_prd', 'credentials-file': '/dev/null'};

// Create a test command class. It opts into SCAPI MRT support so the base
// `init()` guard (which rejects explicit `--mrt-backend scapi` on commands that
// have not wired the SCAPI backend) does not block the preference/eligibility
// tests below. The guard itself is exercised via UnsupportedMrtCommand.
class TestMrtCommand extends MrtCommand<typeof TestMrtCommand> {
  static id = 'test:mrt';
  static description = 'Test MRT command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testRequireMrtCredentials() {
    return this.requireMrtCredentials();
  }

  public testMrtBackendPreference() {
    return this.mrtBackendPreference;
  }

  public testGetScapiMrtConfig() {
    return this.getScapiMrtConfig();
  }

  public testGetMrtBackendContext() {
    return this.getMrtBackendContext();
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}

// A command that has NOT wired the SCAPI MRT backend (base default), used to
// verify the `init()` guardrail rejects an explicit `--mrt-backend scapi`.
class UnsupportedMrtCommand extends MrtCommand<typeof UnsupportedMrtCommand> {
  static id = 'test:mrt-unsupported';
  static description = 'Unsupported MRT command';

  async run(): Promise<void> {
    // Test implementation
  }
}

describe('cli/mrt-command', () => {
  let config: Config;
  let command: TestMrtCommand;
  let testDir: string;

  before(() => {
    testDir = mkdtempSync(path.join(tmpdir(), 'b2c-mrt-cmd-test-'));
    initializeFileAuthSessionStore(testDir);
  });

  after(() => {
    resetAuthSessionStoreForTesting();
    rmSync(testDir, {recursive: true, force: true});
  });

  beforeEach(async () => {
    clearAllAuthSessions();
    isolateConfig();
    config = await Config.load();
    command = new TestMrtCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
    clearAllAuthSessions();
  });

  describe('requireMrtCredentials', () => {
    it('throws error when no credentials', async () => {
      stubParse(command, {'credentials-file': '/dev/null'}); // Use non-existent credentials file

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireMrtCredentials();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when API key is set', async () => {
      stubParse(command, {'api-key': 'test-api-key'});

      await command.init();
      // Should not throw
      command.testRequireMrtCredentials();
    });
  });

  describe('flags', () => {
    it('exposes --storefront / -s as aliases of --project', () => {
      // stubParse bypasses real oclif parsing, so assert on the flag definition
      // directly to confirm the alias/charAlias wiring survives.
      const projectFlag = MrtCommand.baseFlags.project as {aliases?: string[]; charAliases?: string[]};
      expect(projectFlag.aliases).to.include('storefront');
      expect(projectFlag.charAliases).to.include('s');
    });

    it('offers auto/legacy/scapi on --mrt-backend and reads MRT_BACKEND', () => {
      const backendFlag = MrtCommand.baseFlags['mrt-backend'] as {options?: readonly string[]; env?: string};
      expect(backendFlag.options).to.have.members(['auto', 'legacy', 'scapi']);
      expect(backendFlag.env).to.equal('MRT_BACKEND');
    });

    it('inherits the OAuth base flags (short-code, tenant-id, client-id)', () => {
      // Re-parenting onto OAuthCommand must carry over the SCAPI prerequisites.
      expect(MrtCommand.baseFlags).to.have.property('short-code');
      expect(MrtCommand.baseFlags).to.have.property('tenant-id');
      expect(MrtCommand.baseFlags).to.have.property('client-id');
      expect(MrtCommand.baseFlags).to.have.property('client-secret');
    });
  });

  describe('mrtBackendPreference', () => {
    it("defaults to 'auto' when unset", async () => {
      stubParse(command, {'credentials-file': '/dev/null'});
      await command.init();
      expect(command.testMrtBackendPreference()).to.equal('auto');
    });

    it('reflects an explicit --mrt-backend scapi', async () => {
      stubParse(command, {'mrt-backend': 'scapi', 'credentials-file': '/dev/null'});
      await command.init();
      expect(command.testMrtBackendPreference()).to.equal('scapi');
    });

    it('reflects an explicit --mrt-backend legacy', async () => {
      stubParse(command, {'mrt-backend': 'legacy', 'credentials-file': '/dev/null'});
      await command.init();
      expect(command.testMrtBackendPreference()).to.equal('legacy');
    });
  });

  describe('init backend guardrail', () => {
    it('errors on explicit --mrt-backend scapi for a command that has not wired SCAPI', async () => {
      const unsupported = new UnsupportedMrtCommand([], config);
      stubParse(unsupported, {'mrt-backend': 'scapi', 'credentials-file': '/dev/null'});

      const errorStub = sinon.stub(unsupported, 'error').throws(new Error('Expected error'));

      try {
        await unsupported.init();
        expect.fail('Expected init to error');
      } catch {
        // Expected
      }

      expect(errorStub.calledOnce).to.equal(true);
      const [message] = errorStub.firstCall.args;
      expect(message).to.include('not supported by this command');
    });

    it('does not error on --mrt-backend auto for an unsupported command', async () => {
      const unsupported = new UnsupportedMrtCommand([], config);
      stubParse(unsupported, {'mrt-backend': 'auto', 'credentials-file': '/dev/null'});
      const errorStub = sinon.stub(unsupported, 'error').throws(new Error('Unexpected error'));

      await unsupported.init();

      expect(errorStub.called).to.equal(false);
    });

    it('does not error on --mrt-backend legacy for an unsupported command', async () => {
      const unsupported = new UnsupportedMrtCommand([], config);
      stubParse(unsupported, {'mrt-backend': 'legacy', 'credentials-file': '/dev/null'});
      const errorStub = sinon.stub(unsupported, 'error').throws(new Error('Unexpected error'));

      await unsupported.init();

      expect(errorStub.called).to.equal(false);
    });

    it('allows explicit --mrt-backend scapi for a command that supports it', async () => {
      const supported = new TestMrtCommand([], config);
      stubParse(supported, {'mrt-backend': 'scapi', 'credentials-file': '/dev/null'});
      const errorStub = sinon.stub(supported, 'error').throws(new Error('Unexpected error'));

      await supported.init();

      expect(errorStub.called).to.equal(false);
    });
  });

  describe('getScapiMrtConfig', () => {
    describe('returns config (SCAPI eligible)', () => {
      it('builds a client-credentials strategy when clientId + clientSecret are present', async () => {
        stubParse(command, {...SCAPI_FLAGS, 'client-id': 'client', 'client-secret': 'secret'});
        await command.init();

        const scapi = command.testGetScapiMrtConfig();
        expect(scapi).to.not.equal(undefined);
        expect(scapi!.shortCode).to.equal('kv7kzm78');
        expect(scapi!.tenantId).to.equal('zzxy_prd');
        expect(scapi!.auth).to.be.instanceOf(OAuthStrategy);
      });

      it('builds a JWT strategy when cert/key paths are present (no client secret)', async () => {
        stubParse(command, {
          ...SCAPI_FLAGS,
          'client-id': 'client',
          'jwt-cert': TEST_CERT_PATH,
          'jwt-key': TEST_KEY_PATH,
        });
        await command.init();

        const scapi = command.testGetScapiMrtConfig();
        expect(scapi).to.not.equal(undefined);
        expect(scapi!.auth).to.be.instanceOf(JwtOAuthStrategy);
      });

      it('reuses a stored client-credentials session (from `auth client`) with no secret configured', async () => {
        // Regression guard: MRT must accept the same stored session the rest of
        // the SCAPI stack (e.g. eCDN) reuses via getOAuthStrategy(), not just
        // live client-credentials/JWT config.
        saveAuthSession({
          clientId: 'stored-client',
          flow: 'client-credentials',
          accessToken: makeValidJWT(),
          refreshToken: null,
        });
        stubParse(command, {...SCAPI_FLAGS, 'client-id': 'stored-client'});
        await command.init();

        const scapi = command.testGetScapiMrtConfig();
        expect(scapi).to.not.equal(undefined);
        expect(scapi!.shortCode).to.equal('kv7kzm78');
        expect(scapi!.tenantId).to.equal('zzxy_prd');
        expect(scapi!.auth).to.be.instanceOf(StatefulOAuthStrategy);
      });
    });

    describe('returns undefined (not SCAPI eligible)', () => {
      it('when shortCode is missing', async () => {
        stubParse(command, {
          'tenant-id': 'zzxy_prd',
          'client-id': 'client',
          'client-secret': 'secret',
          'credentials-file': '/dev/null',
        });
        await command.init();
        expect(command.testGetScapiMrtConfig()).to.equal(undefined);
      });

      it('when tenantId is missing', async () => {
        stubParse(command, {
          'short-code': 'kv7kzm78',
          'client-id': 'client',
          'client-secret': 'secret',
          'credentials-file': '/dev/null',
        });
        await command.init();
        expect(command.testGetScapiMrtConfig()).to.equal(undefined);
      });

      it('when only a public clientId is set (no secret or JWT — browser/implicit flow)', async () => {
        stubParse(command, {...SCAPI_FLAGS, 'client-id': 'client'});
        await command.init();
        expect(command.testGetScapiMrtConfig()).to.equal(undefined);
      });

      it('when no OAuth credentials are configured at all', async () => {
        stubParse(command, {...SCAPI_FLAGS});
        await command.init();
        expect(command.testGetScapiMrtConfig()).to.equal(undefined);
      });
    });
  });

  describe('getMrtBackendContext — ignored legacy-flag warning', () => {
    // Simulate the user typing the given tokens on the command line. `_rawArgv`
    // is what detectIgnoredLegacyFlags inspects; stubParse does not populate it.
    function setRawArgv(cmd: TestMrtCommand, argv: string[]): void {
      (cmd as unknown as {_rawArgv: string[]})._rawArgv = argv;
    }

    it('does NOT warn under auto even when SCAPI is selected (auto can fall back to legacy, which honors the flags)', async () => {
      // SCAPI-eligible (short code + tenant + client-credentials) so auto → SCAPI,
      // but auto can still fall back to the legacy backend on a safe error, and the
      // legacy branch *honors* these flags — so warning up front would be misleading.
      stubParse(command, {...SCAPI_FLAGS, 'client-id': 'client', 'client-secret': 'secret'});
      await command.init();
      setRawArgv(command, ['-o', 'https://custom.example.com', '-c', '/tmp/.mobify']);
      const warnStub = sinon.stub(command, 'warn');

      command.testGetMrtBackendContext();

      expect(warnStub.called).to.be.false;
    });

    it('warns under explicit --mrt-backend scapi when legacy flags are supplied', async () => {
      stubParse(command, {...SCAPI_FLAGS, 'client-id': 'client', 'client-secret': 'secret', 'mrt-backend': 'scapi'});
      await command.init();
      setRawArgv(command, ['-o', 'https://custom.example.com']);
      const warnStub = sinon.stub(command, 'warn');

      command.testGetMrtBackendContext();

      expect(warnStub.calledOnce).to.be.true;
      const message = warnStub.firstCall.args[0] as string;
      expect(message).to.include('--cloud-origin');
      expect(message).to.include('--mrt-backend scapi');
    });

    it('does not warn when no legacy flags were supplied', async () => {
      stubParse(command, {...SCAPI_FLAGS, 'client-id': 'client', 'client-secret': 'secret'});
      await command.init();
      setRawArgv(command, []);
      const warnStub = sinon.stub(command, 'warn');

      command.testGetMrtBackendContext();

      expect(warnStub.called).to.be.false;
    });

    it('does not warn under --mrt-backend legacy even when legacy flags are supplied', async () => {
      // Explicit legacy honors the flags, so the warning would be misleading.
      stubParse(command, {'mrt-backend': 'legacy', 'api-key': 'test-api-key'});
      await command.init();
      setRawArgv(command, ['-o', 'https://custom.example.com']);
      const warnStub = sinon.stub(command, 'warn');

      command.testGetMrtBackendContext();

      expect(warnStub.called).to.be.false;
    });
  });
});
