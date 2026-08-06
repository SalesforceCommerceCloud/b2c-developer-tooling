/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import type {B2CInstance} from '../../../src/instance/index.js';
import {OcapiRolesBackend} from '../../../src/operations/bm-roles/ocapi-backend.js';
import type {RolePermissionsInfo} from '../../../src/operations/bm-roles/types.js';

const ocapiPermissions = {
  module: {
    organization: [
      {application: 'bm', name: 'Manage_Sites', type: 'module', system: true, value: 'read', values: {site: 'all'}},
    ],
    site: [],
  },
  functional: {
    organization: [{name: 'Manage_Users', type: 'functional', value: 'write', values: {organization: 'all'}}],
    site: [],
  },
  locale: {unscoped: [{locale_id: 'en_US', type: 'locale', value: 'read', values: {fallback: 'en'}}]},
  webdav: {unscoped: [{folder: '/Impex', type: 'webdav', value: 'write', values: {recursive: 'true'}}]},
};

describe('OcapiRolesBackend permission mapping', () => {
  it('preserves every permission field while converting locale_id to localeId', async () => {
    const instance = {
      ocapi: {
        GET: async () => ({data: ocapiPermissions, error: undefined, response: {status: 200}}),
      },
    } as unknown as B2CInstance;

    const permissions = await new OcapiRolesBackend(instance).getPermissions('developer');

    expect(permissions.module?.organization?.[0]).to.deep.equal({
      application: 'bm',
      name: 'Manage_Sites',
      type: 'module',
      system: true,
      value: 'read',
      values: {site: 'all'},
    });
    expect(permissions.functional?.organization?.[0]).to.deep.equal({
      name: 'Manage_Users',
      type: 'functional',
      value: 'write',
      values: {organization: 'all'},
    });
    expect(permissions.locale?.unscoped?.[0]).to.deep.equal({
      localeId: 'en_US',
      type: 'locale',
      value: 'read',
      values: {fallback: 'en'},
    });
    expect(permissions.webdav?.unscoped?.[0]).to.deep.equal({
      folder: '/Impex',
      type: 'webdav',
      value: 'write',
      values: {recursive: 'true'},
    });
  });

  it('round-trips canonical permissions to OCAPI without dropping metadata', async () => {
    let received: unknown;
    const instance = {
      ocapi: {
        PUT: async (_path: string, request: {body: unknown}) => {
          received = request.body;
          return {data: request.body, error: undefined, response: {status: 200}};
        },
      },
    } as unknown as B2CInstance;
    const canonical = {
      ...ocapiPermissions,
      locale: {unscoped: [{localeId: 'en_US', type: 'locale', value: 'read', values: {fallback: 'en'}}]},
    } as unknown as RolePermissionsInfo;

    const result = await new OcapiRolesBackend(instance).setPermissions('developer', canonical);

    expect(received).to.deep.equal(ocapiPermissions);
    expect(result.locale?.unscoped?.[0]).to.deep.equal({
      localeId: 'en_US',
      type: 'locale',
      value: 'read',
      values: {fallback: 'en'},
    });
  });
});
