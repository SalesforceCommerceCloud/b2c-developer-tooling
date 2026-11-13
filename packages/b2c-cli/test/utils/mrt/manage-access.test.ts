/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  formatManageAccess,
  toManageAccessState,
  type ManageAccessGetResult,
} from '../../../src/utils/mrt/manage-access.js';

function result(overrides: Partial<ManageAccessGetResult> = {}): ManageAccessGetResult {
  return {
    project: 'my-storefront',
    ui: 'mrt',
    scapi: false,
    'legacy-mrt-api': true,
    environments: [
      {slug: 'production', name: 'Production', instanceId: 'aaaa_prd', sites: []},
      {slug: 'staging', name: 'Staging', instanceId: 'aaaa_stg', sites: []},
      {slug: 'development', name: 'Development', instanceId: 'aaaa_dev', sites: []},
      {slug: 'sandbox', name: 'Sandbox', instanceId: null, sites: []},
    ],
    instances: ['aaaa_prd', 'aaaa_stg', 'aaaa_dev'],
    ...overrides,
  };
}

describe('utils/mrt/manage-access', () => {
  it('toManageAccessState renames keys without changing values', () => {
    const state = toManageAccessState({
      slug: 'sf',
      uiManagedAt: 'b2c',
      scapiEnabled: true,
      mrtApiEnabled: false,
      environments: [],
      instanceIds: [],
    });

    expect(state).to.deep.equal({ui: 'b2c', scapi: true, 'legacy-mrt-api': false});
  });

  it('formatManageAccess matches PRD read-state example', () => {
    const out = formatManageAccess(result());

    expect(out.startsWith('Storefront: my-storefront\nResolved across 3 instances / 4 environments\n')).to.equal(true);
    expect(out).to.include('{\n  "ui": "mrt",\n  "scapi": false,\n  "legacy-mrt-api": true\n}');
    expect(out).to.include('-> Managed in Runtime Admin. BM Dev Workspace is read-only for this storefront.');
    expect(out).to.include('-> SCAPI MRT Admin API not available for this storefront.');
    expect(out).to.include('-> Direct MRT API read/writes allowed.');
    expect(out).to.not.include('[!]');
  });

  it('formatManageAccess explains b2c / scapi true / legacy false and warns no write path only when both off', () => {
    const out = formatManageAccess(result({ui: 'b2c', scapi: true, 'legacy-mrt-api': false}));

    expect(out).to.include('-> Managed in Business Manager. Runtime Admin is read-only for this storefront.');
    expect(out).to.include('-> SCAPI MRT Admin API available for this storefront.');
    expect(out).to.include('-> Direct MRT API read/writes blocked.');
    expect(out).to.not.include('[!]');

    const blocked = formatManageAccess(result({ui: 'b2c', scapi: false, 'legacy-mrt-api': false}));
    expect(blocked).to.include(
      '[!] No write path anywhere: SCAPI and direct MRT API access are both off for this storefront.',
    );
  });

  it('formatManageAccess aligns explanation arrows', () => {
    const lines = formatManageAccess(result())
      .split('\n')
      .filter((l) => l.includes(' -> '));

    expect(lines).to.have.length(3);
    const arrowAt = lines.map((l) => l.indexOf(' -> '));
    expect(new Set(arrowAt).size).to.equal(1);
  });

  it('formatManageAccess pluralizes and handles zero environments', () => {
    const one = formatManageAccess(
      result({
        environments: [{slug: 'production', name: 'Production', instanceId: 'aaaa_prd', sites: []}],
        instances: ['aaaa_prd'],
      }),
    );
    expect(one).to.include('Resolved across 1 instance / 1 environment\n');

    const none = formatManageAccess(result({environments: [], instances: []}));
    expect(none).to.include('Resolved across 0 instances / 0 environments\n');
  });

  it('formatManageAccess lists env with no B2C instance', () => {
    const out = formatManageAccess(result());

    expect(out).to.match(/Environments:\n {2}production +aaaa_prd\n/);
    expect(out).to.match(/ {2}sandbox +\(no B2C instance connected\)/);
  });

  it('formatManageAccess shows unknown for missing booleans', () => {
    const out = formatManageAccess(result({scapi: null}));

    expect(out).to.match(/scapi: unknown +-> Not reported by the server\./);
    expect(out).to.include('"scapi": null');
  });

  it('formatManageAccess shows unknown for missing legacy-mrt-api', () => {
    const out = formatManageAccess(result({'legacy-mrt-api': null}));

    expect(out).to.match(/legacy-mrt-api: unknown +-> Not reported by the server\./);
    expect(out).to.include('"legacy-mrt-api": null');
    expect(out).to.not.include('[!]');
  });
});
