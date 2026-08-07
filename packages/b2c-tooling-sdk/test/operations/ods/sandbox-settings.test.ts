/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  buildSandboxSettings,
  DEFAULT_OCAPI_RESOURCES,
  DEFAULT_WEBDAV_PERMISSIONS,
} from '../../../src/operations/ods/sandbox-settings.js';

describe('buildSandboxSettings', () => {
  it('grants default OCAPI and WebDAV permissions to the client ID', () => {
    const settings = buildSandboxSettings({clientId: 'client-123'});

    expect(settings).to.not.be.undefined;
    expect(settings!.ocapi).to.deep.equal([{client_id: 'client-123', resources: DEFAULT_OCAPI_RESOURCES}]);
    expect(settings!.webdav).to.deep.equal([{client_id: 'client-123', permissions: DEFAULT_WEBDAV_PERMISSIONS}]);
  });

  it('returns undefined when no client ID and no custom settings are provided', () => {
    expect(buildSandboxSettings({})).to.be.undefined;
    expect(buildSandboxSettings({clientId: undefined})).to.be.undefined;
  });

  it('uses custom OCAPI settings in place of the defaults', () => {
    const custom = [{client_id: 'other', resources: [{resource_id: '/foo', methods: ['get'] as const}]}];
    const settings = buildSandboxSettings({clientId: 'client-123', ocapiSettings: custom});

    expect(settings!.ocapi).to.deep.equal(custom);
    // WebDAV still falls back to defaults for the client ID
    expect(settings!.webdav).to.deep.equal([{client_id: 'client-123', permissions: DEFAULT_WEBDAV_PERMISSIONS}]);
  });

  it('uses custom WebDAV settings in place of the defaults', () => {
    const custom = [{client_id: 'other', permissions: [{path: '/impex', operations: ['read'] as const}]}];
    const settings = buildSandboxSettings({clientId: 'client-123', webdavSettings: custom});

    expect(settings!.webdav).to.deep.equal(custom);
    expect(settings!.ocapi).to.deep.equal([{client_id: 'client-123', resources: DEFAULT_OCAPI_RESOURCES}]);
  });

  it('builds settings from custom values even without a client ID', () => {
    const ocapi = [{client_id: 'a', resources: []}];
    const webdav = [{client_id: 'a', permissions: []}];
    const settings = buildSandboxSettings({ocapiSettings: ocapi, webdavSettings: webdav});

    expect(settings).to.deep.equal({ocapi, webdav});
  });
});
