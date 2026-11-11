/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '../../../src/clients/mrt.js';
import {DEFAULT_MRT_B2C_ORIGIN} from '../../../src/clients/mrt-b2c.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {getStorefrontManageAccess} from '../../../src/operations/mrt/manage-access.js';

const PROJECT_URL = `${DEFAULT_MRT_ORIGIN}/api/projects/:projectSlug/`;
const TARGETS_URL = `${DEFAULT_MRT_ORIGIN}/api/projects/:projectSlug/target/`;
const B2C_URL = `${DEFAULT_MRT_B2C_ORIGIN}/projects/:projectSlug/b2c-target-info/:targetSlug/`;

const TARGETS = {
  count: 3,
  results: [
    {slug: 'production', name: 'Production'},
    {slug: 'staging', name: 'Staging'},
    {slug: 'dev', name: 'Development'},
  ],
};

const B2C_INFO: Record<string, {instance_id: string; sites: null | string[]}> = {
  production: {instance_id: 'aaaa_prd', sites: ['RefArch']},
  staging: {instance_id: 'aaaa_stg', sites: null},
  dev: {instance_id: 'aaaa_stg', sites: []},
};

describe('operations/mrt/manage-access', () => {
  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  function useHandlers(project: Record<string, unknown>, b2cInfo = B2C_INFO, targets = TARGETS) {
    server.use(
      http.get(PROJECT_URL, () => HttpResponse.json(project)),
      http.get(TARGETS_URL, () => HttpResponse.json(targets)),
      http.get(B2C_URL, ({params}) => {
        const info = b2cInfo[params.targetSlug as string];
        return info ? HttpResponse.json(info) : HttpResponse.json({detail: 'Not found.'}, {status: 404});
      }),
    );
  }

  it('maps project flags and resolves environments', async () => {
    useHandlers({slug: 'sf', ui_managed_at: 'b2c', is_scapi_enabled: true, is_mrt_api_enabled: false});

    const result = await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());

    expect(result.slug).to.equal('sf');
    expect(result.uiManagedAt).to.equal('b2c');
    expect(result.scapiEnabled).to.equal(true);
    expect(result.mrtApiEnabled).to.equal(false);
    expect(result.environments).to.deep.equal([
      {slug: 'production', name: 'Production', instanceId: 'aaaa_prd', sites: ['RefArch']},
      {slug: 'staging', name: 'Staging', instanceId: 'aaaa_stg', sites: []},
      {slug: 'dev', name: 'Development', instanceId: 'aaaa_stg', sites: []},
    ]);
    expect(result.instanceIds).to.deep.equal(['aaaa_prd', 'aaaa_stg']);
  });

  it('treats null ui_managed_at as mrt', async () => {
    useHandlers({slug: 'sf', ui_managed_at: null, is_scapi_enabled: false, is_mrt_api_enabled: true});

    const result = await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());

    expect(result.uiManagedAt).to.equal('mrt');
  });

  it('returns null booleans when backend omits fields', async () => {
    useHandlers({slug: 'sf'});

    const result = await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());

    expect(result.uiManagedAt).to.equal('mrt');
    expect(result.scapiEnabled).to.equal(null);
    expect(result.mrtApiEnabled).to.equal(null);
  });

  it('keeps env with no B2C connection', async () => {
    const {staging: _staging, ...withoutStaging} = B2C_INFO;
    useHandlers({slug: 'sf'}, withoutStaging);

    const result = await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());

    const staging = result.environments.find((e) => e.slug === 'staging');
    expect(staging).to.deep.equal({slug: 'staging', name: 'Staging', instanceId: null, sites: []});
    expect(result.instanceIds).to.deep.equal(['aaaa_prd', 'aaaa_stg']);
  });

  it('excludes unconnected envs from instanceIds', async () => {
    useHandlers({slug: 'sf'}, {production: {instance_id: 'aaaa_prd', sites: []}});

    const result = await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());

    expect(result.environments).to.have.length(3);
    expect(result.instanceIds).to.deep.equal(['aaaa_prd']);
  });

  it('rejects when a B2C lookup fails with a non-404 error', async () => {
    server.use(
      http.get(PROJECT_URL, () => HttpResponse.json({slug: 'sf'})),
      http.get(TARGETS_URL, () => HttpResponse.json(TARGETS)),
      http.get(B2C_URL, ({params}) =>
        params.targetSlug === 'staging'
          ? HttpResponse.json({detail: 'Server Error'}, {status: 500})
          : HttpResponse.json(B2C_INFO[params.targetSlug as string]),
      ),
    );

    try {
      await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());
      expect.fail('should have thrown');
    } catch (error) {
      expect((error as Error).message).to.equal(
        'Failed to get B2C target info for environment staging: {"detail":"Server Error"}',
      );
    }
  });

  it('rejects when project lookup fails without calling environments', async () => {
    server.use(http.get(PROJECT_URL, () => HttpResponse.json({detail: 'Not found.'}, {status: 404})));

    try {
      await getStorefrontManageAccess({projectSlug: 'missing'}, new MockAuthStrategy());
      expect.fail('should have thrown');
    } catch (error) {
      expect((error as Error).message).to.equal('Failed to get project: {"detail":"Not found."}');
    }
  });

  it('returns empty environments for project with no targets', async () => {
    server.use(
      http.get(PROJECT_URL, () => HttpResponse.json({slug: 'sf'})),
      http.get(TARGETS_URL, () => HttpResponse.json({count: 0, results: []})),
    );

    const result = await getStorefrontManageAccess({projectSlug: 'sf'}, new MockAuthStrategy());

    expect(result.environments).to.deep.equal([]);
    expect(result.instanceIds).to.deep.equal([]);
  });
});
