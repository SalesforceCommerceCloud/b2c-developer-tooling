/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import MrtProjectManageAccessGet from '../../../../../src/commands/mrt/project/manage-access/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

const ORIGIN = 'https://mrt.test';

const DEFAULT_PROJECT = {slug: 'sf', ui_managed_at: 'b2c', is_scapi_enabled: true, is_mrt_api_enabled: false};

describe('mrt project manage-access get', () => {
  const server = setupServer();
  let config: Config;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    server.resetHandlers();
    restoreConfig();
  });

  after(() => {
    server.close();
  });

  async function createCommand(values: Record<string, unknown>): Promise<any> {
    const command: any = new MrtProjectManageAccessGet([], config);
    stubParse(command, {}, {});
    await command.init();
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon
      .stub(command, 'getMrtAuth')
      .returns({fetch: (url: string, init?: Parameters<typeof fetch>[1]) => fetch(url, init)});
    sinon.stub(command, 'resolvedConfig').get(() => ({values}));
    return command;
  }

  function useBackend(project: Record<string, unknown> = DEFAULT_PROJECT): void {
    server.use(
      http.get(`${ORIGIN}/api/projects/sf/`, () => HttpResponse.json(project)),
      http.get(`${ORIGIN}/api/projects/sf/target/`, () =>
        HttpResponse.json({
          count: 2,
          results: [
            {slug: 'production', name: 'Production'},
            {slug: 'dev', name: 'Dev'},
          ],
        }),
      ),
      http.get(`${ORIGIN}/api/cc/b2c/projects/sf/b2c-target-info/production/`, () =>
        HttpResponse.json({instance_id: 'aaaa_prd', sites: ['RefArch']}),
      ),
      http.get(`${ORIGIN}/api/cc/b2c/projects/sf/b2c-target-info/dev/`, () =>
        HttpResponse.json({detail: 'No B2CTargetInfo matches the given query.'}, {status: 404}),
      ),
    );
  }

  it('has json flag and no positional args', () => {
    expect(MrtProjectManageAccessGet.enableJsonFlag).to.equal(true);
    expect(Object.keys(MrtProjectManageAccessGet.args ?? {})).to.have.length(0);
    expect(MrtProjectManageAccessGet.flags).to.have.property('project');
    expect(MrtProjectManageAccessGet.aliases).to.deep.equal(['mrt:storefront:manage-access:get']);
  });

  it('errors when no project is configured', async () => {
    const command = await createCommand({});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.equal(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
  });

  it('returns the JSON result from the configured origin without printing text', async () => {
    useBackend();
    const command = await createCommand({mrtProject: 'sf', mrtOrigin: ORIGIN});
    sinon.stub(command, 'jsonEnabled').returns(true);
    const stdout = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result).to.deep.equal({
      project: 'sf',
      ui: 'b2c',
      scapi: true,
      'legacy-mrt-api': false,
      environments: [
        {slug: 'production', name: 'Production', instanceId: 'aaaa_prd', sites: ['RefArch']},
        {slug: 'dev', name: 'Dev', instanceId: null, sites: []},
      ],
      instances: ['aaaa_prd'],
    });
    expect(stdout.called).to.equal(false);
  });

  it('prints formatted text when json is not enabled', async () => {
    useBackend();
    const command = await createCommand({mrtProject: 'sf', mrtOrigin: ORIGIN});
    sinon.stub(command, 'jsonEnabled').returns(false);
    const stdout = sinon.stub(ux, 'stdout');

    await command.run();

    expect(stdout.calledOnce).to.equal(true);
    const text = stdout.firstCall.args[0] as string;
    expect(text.startsWith('Storefront: sf\nResolved across 1 instance / 2 environments\n')).to.equal(true);
    expect(text).to.match(/ {2}dev +\(no B2C instance connected\)/);
  });

  it('shows ui mrt in JSON and text when backend ui_managed_at is null', async () => {
    useBackend({slug: 'sf', ui_managed_at: null, is_scapi_enabled: false, is_mrt_api_enabled: true});
    const jsonCommand = await createCommand({mrtProject: 'sf', mrtOrigin: ORIGIN});
    sinon.stub(jsonCommand, 'jsonEnabled').returns(true);
    sinon.stub(ux, 'stdout');

    const result = await jsonCommand.run();
    expect(result.ui).to.equal('mrt');

    sinon.restore();
    const textCommand = await createCommand({mrtProject: 'sf', mrtOrigin: ORIGIN});
    sinon.stub(textCommand, 'jsonEnabled').returns(false);
    const stdout = sinon.stub(ux, 'stdout');

    await textCommand.run();
    const text = stdout.firstCall.args[0] as string;
    expect(text).to.include('"ui": "mrt"');
    expect(text).to.match(/ui: mrt +-> Managed in Runtime Admin\. BM Dev Workspace is read-only for this storefront\./);
  });

  it('propagates the SDK error for an unknown project unchanged', async () => {
    server.use(
      http.get(`${ORIGIN}/api/projects/zz-nonexistent/`, () =>
        HttpResponse.json({detail: 'Not found.'}, {status: 404}),
      ),
    );
    const command = await createCommand({mrtProject: 'zz-nonexistent', mrtOrigin: ORIGIN});

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect((error as Error).message).to.equal('Failed to get project: {"detail":"Not found."}');
    }
  });
});
