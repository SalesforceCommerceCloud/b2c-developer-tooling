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
import MrtProjectCreate from '../../../../src/commands/mrt/project/create.js';
import MrtProjectGet from '../../../../src/commands/mrt/project/get.js';
import MrtProjectUpdate from '../../../../src/commands/mrt/project/update.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

const ORIGIN = 'https://mrt.test';
const STATIC_IPS_ERROR = 'Static IPs are not enabled for this organization.';

describe('mrt project static IPs', () => {
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
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: ORIGIN}}));
    return command;
  }

  const printed = () => stdout.args.map((a) => String(a[0])).join('\n');

  describe('flag definitions', () => {
    for (const [name, Cmd] of [
      ['create', MrtProjectCreate],
      ['update', MrtProjectUpdate],
    ] as const) {
      it(`${name} defines a negatable --static-ips-default with no default value`, () => {
        const flag = (Cmd.flags as any)['static-ips-default'];
        expect(flag.allowNo).to.equal(true);
        expect(flag.default).to.equal(undefined);
      });
    }
  });

  describe('create', () => {
    function captureCreate() {
      const captured: {body?: any} = {};
      server.use(
        http.post(`${ORIGIN}/api/projects/`, async ({request}) => {
          captured.body = await request.json();
          return HttpResponse.json({slug: 'my-project', ...captured.body});
        }),
      );
      return captured;
    }

    it('sends static_ips_default=true for --static-ips-default and does not print a Static IPs Default row', async () => {
      const captured = captureCreate();
      const command = await initCommand(MrtProjectCreate, ['My Project', '-o', 'my-org', '--static-ips-default']);

      await command.run();

      expect(captured.body.static_ips_default).to.equal(true);
      expect(printed()).to.not.include('Static IPs Default');
    });

    it('sends static_ips_default=false for --no-static-ips-default', async () => {
      const captured = captureCreate();
      const command = await initCommand(MrtProjectCreate, ['My Project', '-o', 'my-org', '--no-static-ips-default']);

      await command.run();

      expect(captured.body.static_ips_default).to.equal(false);
      expect(printed()).to.not.include('Static IPs Default');
    });

    it('returns the API object and prints no details table in JSON mode', async () => {
      captureCreate();
      const command = await initCommand(MrtProjectCreate, ['My Project', '-o', 'my-org', '--static-ips-default'], true);

      const result = await command.run();

      expect(result.static_ips_default).to.equal(true);
      expect(stdout.called).to.equal(false);
    });

    it('omits static_ips_default when no flag is given', async () => {
      const captured = captureCreate();
      const command = await initCommand(MrtProjectCreate, ['My Project', '-o', 'my-org']);

      await command.run();

      expect(captured.body).to.not.have.property('static_ips_default');
    });

    it('surfaces the server error message unchanged', async () => {
      server.use(
        http.post(`${ORIGIN}/api/projects/`, () => HttpResponse.json({message: STATIC_IPS_ERROR}, {status: 403})),
      );
      const command = await initCommand(MrtProjectCreate, ['My Project', '-o', 'my-org', '--static-ips-default']);
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
        http.patch(`${ORIGIN}/api/projects/:slug/`, async ({request}) => {
          captured.body = await request.json();
          return HttpResponse.json({slug: 'my-project', name: 'My Project', ...captured.body});
        }),
      );
      return captured;
    }

    it('sends exactly {static_ips_default: false} for --no-static-ips-default and does not print a Static IPs Default row', async () => {
      const captured = captureUpdate();
      const command = await initCommand(MrtProjectUpdate, ['my-project', '--no-static-ips-default']);

      await command.run();

      expect(captured.body).to.deep.equal({static_ips_default: false});
      expect(printed()).to.not.include('Static IPs Default');
    });

    it('returns the API object and prints no details table in JSON mode', async () => {
      captureUpdate();
      const command = await initCommand(MrtProjectUpdate, ['my-project', '--static-ips-default'], true);

      const result = await command.run();

      expect(result.static_ips_default).to.equal(true);
      expect(stdout.called).to.equal(false);
    });

    it('accepts --static-ips-default as the only change (no "at least one" error)', async () => {
      const captured = captureUpdate();
      const command = await initCommand(MrtProjectUpdate, ['my-project', '--static-ips-default']);

      await command.run();

      expect(captured.body).to.deep.equal({static_ips_default: true});
    });

    it('still requires at least one change when no flag is given', async () => {
      const command = await initCommand(MrtProjectUpdate, ['my-project']);
      let thrown: Error | undefined;
      try {
        await command.run();
      } catch (error) {
        thrown = error as Error;
      }
      expect(thrown?.message).to.include('--static-ips-default');
    });
  });

  describe('legacy backend only', () => {
    /** Runs the real backend-context resolution (not the stub) with a SCAPI connection available. */
    async function resolveContext(Cmd: any, argv: string[]): Promise<{error?: Error; warnings: string[]}> {
      const command = new Cmd(argv, config);
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
      ['project create', MrtProjectCreate, ['My Project', '-o', 'my-org']],
      ['project update', MrtProjectUpdate, ['my-project']],
    ] as const) {
      it(`${name} declares both static IP flag forms as legacy-only`, () => {
        const command = new (Cmd as any)([...argv], config);
        const legacy = command.mrtBackendOnlyFlags().legacy.map((f: {name: string}) => f.name);
        expect(legacy).to.include.members(['--static-ips-default', '--no-static-ips-default']);
      });

      it(`${name} errors when --static-ips is combined with --mrt-backend scapi`, async () => {
        const {error} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'scapi', '--static-ips-default']);
        expect(error?.message).to.include('--static-ips-default');
        expect(error?.message).to.include('legacy');
      });

      it(`${name} errors when --no-static-ips is combined with --mrt-backend scapi`, async () => {
        const {error} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'scapi', '--no-static-ips-default']);
        expect(error?.message).to.include('--no-static-ips-default');
      });

      it(`${name} warns (does not error) when auto resolves to SCAPI and --static-ips is passed`, async () => {
        const {error, warnings} = await resolveContext(Cmd, [...argv, '--mrt-backend', 'auto', '--static-ips-default']);
        expect(error).to.equal(undefined);
        expect(warnings.join('\n')).to.include('--static-ips-default');
      });

      it(`${name} accepts --static-ips with --mrt-backend legacy`, async () => {
        const {error, warnings} = await resolveContext(Cmd, [
          ...argv,
          '--mrt-backend',
          'legacy',
          '--static-ips-default',
        ]);
        expect(error).to.equal(undefined);
        expect(warnings.join('\n')).to.not.include('only affect');
      });
    }
  });

  describe('get', () => {
    it('does not print a Static IPs Default row, and returns static_ips_default for JSON', async () => {
      server.use(
        http.get(`${ORIGIN}/api/projects/:slug/`, () =>
          HttpResponse.json({slug: 'my-project', name: 'My Project', static_ips_default: false}),
        ),
      );
      const command = await initCommand(MrtProjectGet, ['my-project']);

      const result = await command.run();

      expect(printed()).to.not.include('Static IPs Default');
      expect(result.static_ips_default).to.equal(false);
    });
  });
});
