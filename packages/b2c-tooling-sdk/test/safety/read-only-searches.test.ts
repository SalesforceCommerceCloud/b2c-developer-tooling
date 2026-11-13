/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadScapiSchemas} from '@salesforce/b2c-tooling-sdk/scapi';
import {READ_ONLY_SEARCH_PATHS, SafetyGuard, isReadOnlySearch} from '@salesforce/b2c-tooling-sdk/safety';

const ORG = 'f_ecom_zzxy_prd';

describe('safety/read-only-searches', () => {
  it('allows POST to listed SCAPI and OCAPI searches', () => {
    for (const path of [
      `/dx/object-definitions/v1/organizations/${ORG}/system/object-types/Product/attribute-definition-search`,
      `/operation/jobs/v1/organizations/${ORG}/job-execution-search`,
      `/product/products/v1/organizations/${ORG}/product-search/`,
      `/s/-/dw/data/v25_6/job_execution_search`,
      `/s/-/dw/data/v25_6/sites/RefArch/campaign_search`,
    ]) {
      expect(isReadOnlySearch('POST', path), path).to.equal(true);
    }
  });

  it('does not allow other methods, unlisted POSTs, or look-alike paths', () => {
    expect(isReadOnlySearch('PUT', `/product/products/v1/organizations/${ORG}/product-search`)).to.equal(false);
    expect(isReadOnlySearch('DELETE', '/s/-/dw/data/v25_6/product_search')).to.equal(false);
    for (const path of [
      `/pricing/campaigns/v1/organizations/${ORG}/campaigns`,
      `/intelligence/analytics/v1/organizations/${ORG}/query/orders`,
      `/product/products/v1/organizations/${ORG}/product-search/extra`,
      `/product/products/v1/organizations/${ORG}/products/a/b/variant-search`,
      `/s/-/dw/data/v25_6/jobs/import/executions`,
      `/s/-/dw/data/v25_6/custom_objects_search`,
    ]) {
      expect(isReadOnlySearch('POST', path), path).to.equal(false);
    }
  });

  it('lets READ_ONLY allow listed searches while configured rules still win', () => {
    const path = `/s/-/dw/data/v25_6/product_search`;
    expect(new SafetyGuard({level: 'READ_ONLY'}).evaluate({type: 'http', method: 'POST', path}).action).to.equal(
      'allow',
    );
    const ruled = new SafetyGuard({
      level: 'READ_ONLY',
      rules: [{method: 'POST', path: '**/product_search', action: 'block'}],
    });
    expect(ruled.evaluate({type: 'http', method: 'POST', path}).action).to.equal('block');
    expect(
      new SafetyGuard({level: 'READ_ONLY'}).evaluate({
        type: 'http',
        method: 'POST',
        path: '/s/-/dw/data/v25_6/products',
      }).action,
    ).to.equal('block');
  });

  it('ignores trailing slashes and handles long runs of them quickly', () => {
    expect(isReadOnlySearch('POST', '/s/-/dw/data/v25_6/product_search///')).to.equal(true);
    expect(isReadOnlySearch('POST', '/')).to.equal(false);
    const start = Date.now();
    expect(isReadOnlySearch('POST', `/${'/'.repeat(100_000)}x`)).to.equal(false);
    expect(Date.now() - start).to.be.below(1000);
  });

  it('lists only POST operations that exist in the bundled API specs', () => {
    const known = new Set<string>();
    for (const document of loadScapiSchemas()) {
      for (const [path, item] of Object.entries<Record<string, unknown>>(document.schema.paths ?? {})) {
        if (item.post) known.add(`/${document.entry.id}${path}`.replaceAll(/\{[^}]+\}/g, '*'));
      }
    }
    const dataApi = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../specs/data-api.json', import.meta.url)), 'utf8'),
    ) as {paths: Record<string, Record<string, unknown>>};
    for (const [path, item] of Object.entries(dataApi.paths)) {
      if (item.post) known.add(`/s/*/dw/data/*${path}`.replaceAll(/\{[^}]+\}/g, '*'));
    }
    const unknown = READ_ONLY_SEARCH_PATHS.filter((path) => !known.has(path));
    expect(unknown).to.deep.equal([]);
  });
});
