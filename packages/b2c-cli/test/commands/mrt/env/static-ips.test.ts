/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MrtEnvCreate from '../../../../src/commands/mrt/env/create.js';
import MrtEnvGet from '../../../../src/commands/mrt/env/get.js';
import MrtEnvUpdate from '../../../../src/commands/mrt/env/update.js';
import {configureLogger, getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

const ORIGIN = 'https://mrt.test';
const TARGETS = `${ORIGIN}/api/projects/:project/target/`;
const TARGET = `${ORIGIN}/api/projects/:project/target/:target/`;
const STATIC_IPS_ERROR = 'Static IPs are not enabled for this organization.';

describe('mrt env static IPs', () => {
  const server = setupServer();
  let config: Config;
  let stdout: sinon.SinonStub;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    stdout = sinon.stub(ux, 'stdout');
  });

  afterEach(() => {
    server.resetHandlers();
    sinon.restore();
    restoreConfig();
  });

  after(() => {
    server.close();
  });

  /** Instantiates the command with real argv parsing and stubs credentials/logging; MSW serves the API. */
  async function initCommand(Cmd: any, argv: string[], json = false): Promise<any> {
    const command = new Cmd(argv, config);
    // `env update` shadows the global --log-level flag with the environment's own log level, so
    // configureLogging() would use its default level instead of the SFCC_LOG_LEVEL=silent that
    // isolateConfig() sets; keep it silent so config-load warnings stay out of the test output.
    sinon.stub(command, 'configureLogging').callsFake(() => {
      configureLogger({level: 'silent'});
      command.logger = getLogger();
    });
    await command.init();
    // Legacy backend only: static IPs are not supported by the SCAPI backend.
    sinon.stub(command, 'getMrtBackendContext').returns({
      preference: 'legacy',
      legacyAuth: {
        fetch: (url: string, init?: Parameters<typeof fetch>[1]) => fetch(url, init),
        getAuthorizationHeader: async () => 'Bearer test-token',
      },
    } as any);
    sinon.stub(command, 'jsonEnabled').returns(json);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtOrigin: ORIGIN, mrtProject: 'my-project', mrtEnvironment: 'production'},
    }));
    return command;
  }

  const printed = () => stdout.args.map((a) => String(a[0])).join('\n');

  describe('flag definitions', () => {
    for (const [name, Cmd] of [
      ['create', MrtEnvCreate],
      ['update', MrtEnvUpdate],
    ] as const) {
      it(`${name} defines a negatable --static-ips with no default value`, () => {
        const flag = (Cmd.flags as any)['static-ips'];
        expect(flag.allowNo).to.equal(true);
        // A default would send ssr_static_ips=false and override the project's static-IP default.
        expect(flag.default).to.equal(undefined);
      });
    }
  });

  describe('create', () => {
    function captureCreate() {
      const captured: {body?: any} = {};
      server.use(
        http.post(TARGETS, async ({request}) => {
          captured.body = await request.json();
          return HttpResponse.json({state: 'creating', ...captured.body});
        }),
      );
      return captured;
    }

    it('sends ssr_static_ips=true for --static-ips and prints Enabled', async () => {
      const captured = captureCreate();
      const command = await initCommand(MrtEnvCreate, ['staging', '--static-ips']);

      await command.run();

      expect(captured.body.ssr_static_ips).to.equal(true);
      expect(printed()).to.match(/Static IPs:\s+Enabled/);
    });

    it('sends ssr_static_ips=false for --no-static-ips', async () => {
      const captured = captureCreate();
      const command = await initCommand(MrtEnvCreate, ['staging', '--no-static-ips']);

      await command.run();

      expect(captured.body.ssr_static_ips).to.equal(false);
      expect(printed()).to.match(/Static IPs:\s+Disabled/);
    });

    it('returns the API object and prints no details table in JSON mode', async () => {
      captureCreate();
      const command = await initCommand(MrtEnvCreate, ['staging', '--static-ips'], true);

      const result = await command.run();

      expect(result.ssr_static_ips).to.equal(true);
      expect(stdout.called).to.equal(false);
    });

    it('omits ssr_static_ips when no flag is given so the project default is inherited', async () => {
      const captured = captureCreate();
      const command = await initCommand(MrtEnvCreate, ['staging']);

      await command.run();

      expect(captured.body).to.not.have.property('ssr_static_ips');
    });

    it('surfaces the server error message unchanged', async () => {
      server.use(http.post(TARGETS, () => HttpResponse.json({message: STATIC_IPS_ERROR}, {status: 403})));
      const command = await initCommand(MrtEnvCreate, ['staging', '--static-ips']);
      let thrown: Error | undefined;
      try {
        await command.run();
      } catch (error) {
        thrown = error as Error;
      }
      expect(thrown?.message).to.include(STATIC_IPS_ERROR);
    });
  });

  describe('update', () => {
    function captureUpdate() {
      const captured: {body?: any} = {};
      server.use(
        http.patch(TARGET, async ({request}) => {
          captured.body = await request.json();
          return HttpResponse.json({slug: 'production', name: 'Production', state: 'active', ...captured.body});
        }),
      );
      return captured;
    }

    it('sends only ssr_static_ips=true for --static-ips', async () => {
      const captured = captureUpdate();
      const command = await initCommand(MrtEnvUpdate, ['--static-ips']);

      await command.run();

      expect(captured.body).to.deep.equal({ssr_static_ips: true});
      expect(printed()).to.match(/Static IPs:\s+Enabled/);
    });

    it('returns the API object and prints no details table in JSON mode', async () => {
      captureUpdate();
      const command = await initCommand(MrtEnvUpdate, ['--static-ips'], true);

      const result = await command.run();

      expect(result.ssr_static_ips).to.equal(true);
      expect(stdout.called).to.equal(false);
    });

    it('sends only ssr_static_ips=false for --no-static-ips', async () => {
      const captured = captureUpdate();
      const command = await initCommand(MrtEnvUpdate, ['--no-static-ips']);

      await command.run();

      expect(captured.body).to.deep.equal({ssr_static_ips: false});
    });

    it('surfaces the server error message unchanged', async () => {
      server.use(http.patch(TARGET, () => HttpResponse.json({message: STATIC_IPS_ERROR}, {status: 403})));
      const command = await initCommand(MrtEnvUpdate, ['--static-ips']);
      let thrown: Error | undefined;
      try {
        await command.run();
      } catch (error) {
        thrown = error as Error;
      }
      expect(thrown?.message).to.include(STATIC_IPS_ERROR);
    });
  });

  describe('legacy backend only', () => {
    /** Runs the real backend-context resolution (not the stub) with a SCAPI connection available. */
    async function resolveContext(Cmd: any, argv: string[]): Promise<{error?: Error; warnings: string[]}> {
      const command = new Cmd(argv, config);
      sinon.stub(command, 'configureLogging').callsFake(() => {
        configureLogger({level: 'silent'});
        command.logger = getLogger();
      });
      await command.init();
      sinon.stub(command, 'getScapiMrtConfig').returns({} as any);
      sinon.stub(command, 'hasMrtCredentials').returns(true);
      sinon.stub(command, 'getMrtAuth').returns({} as any);
      const warnings: string[] = [];
      sinon.stub(command, 'warn').callsFake((msg: unknown) => {
        warnings.push(String(msg));
      });
      try {
        command.getMrtBackendContext();
      } catch (error) {
        return {error: error as Error, warnings};
      }
      return {warnings};
    }

    for (const [name, Cmd, argv] of [
      ['env create', MrtEnvCreate, ['staging']],
      ['env update', MrtEnvUpdate, []],
    ] as const) {
      it(`${name} declares both static IP flag forms as legacy-only`, () => {
        const command = new (Cmd as any)([...argv], config);
        const legacy = command.mrtBackendOnlyFlags().legacy.map((f: {name: string}) => f.name);
        expect(legacy).to.include.members(['--static-ips', '--no-static-ips']);
      });

      it(`${name} errors when --static-ips is combined with --mrt-backend scapi`, async () => {
        const {error} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'scapi', '--static-ips']);
        expect(error?.message).to.include('--static-ips');
        expect(error?.message).to.include('legacy');
      });

      it(`${name} errors when --no-static-ips is combined with --mrt-backend scapi`, async () => {
        const {error} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'scapi', '--no-static-ips']);
        expect(error?.message).to.include('--no-static-ips');
      });

      it(`${name} warns (does not error) when auto resolves to SCAPI and --static-ips is passed`, async () => {
        const {error, warnings} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'auto', '--static-ips']);
        expect(error).to.equal(undefined);
        expect(warnings.join('\n')).to.include('--static-ips');
      });

      it(`${name} accepts --static-ips with --mrt-backend legacy`, async () => {
        const {error, warnings} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'legacy', '--static-ips']);
        expect(error).to.equal(undefined);
        expect(warnings.join('\n')).to.not.include('only affect');
      });
    }
  });

  describe('get', () => {
    const env = {slug: 'production', name: 'Production', state: 'active'};

    it('prints Enabled and each outbound IP, and returns both fields for JSON', async () => {
      const ips = ['203.0.113.10', '203.0.113.11'];
      server.use(
        http.get(TARGET, () => HttpResponse.json({...env, ssr_static_ips: true, ssr_static_outbound_ips: ips})),
      );
      const command = await initCommand(MrtEnvGet, []);

      const result = await command.run();

      expect(printed()).to.match(/Static IPs:\s+Enabled/);
      expect(printed()).to.match(/Outbound IPs:\s+203\.0\.113\.10/);
      expect(printed()).to.include('203.0.113.11');
      expect(result.ssr_static_ips).to.equal(true);
      expect(result.ssr_static_outbound_ips).to.deep.equal(ips);
    });

    it('prints Enabled but no outbound IP rows when none are assigned yet', async () => {
      server.use(
        http.get(TARGET, () => HttpResponse.json({...env, ssr_static_ips: true, ssr_static_outbound_ips: null})),
      );
      const command = await initCommand(MrtEnvGet, []);

      await command.run();

      expect(printed()).to.match(/Static IPs:\s+Enabled/);
      expect(printed()).to.not.include('Outbound IPs');
    });

    it('prints Disabled when static IPs are off', async () => {
      server.use(http.get(TARGET, () => HttpResponse.json({...env, ssr_static_ips: false})));
      const command = await initCommand(MrtEnvGet, []);

      await command.run();

      expect(printed()).to.match(/Static IPs:\s+Disabled/);
    });

    it('does not print static IP rows when the API omits the fields', async () => {
      server.use(http.get(TARGET, () => HttpResponse.json(env)));
      const command = await initCommand(MrtEnvGet, []);

      await command.run();

      expect(printed()).to.not.include('Static IPs');
    });
  });
});
