/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  SCAPI_STANDARD_SCHEMA_EXPAND,
  fetchScapiSchemaWithFallback,
  isFullScapiExpand,
  listBundledScapiSchemas,
  listScapiSchemasWithFallback,
  loadScapiSchemas,
  normalizeScapiSchemaExpand,
  scapiExpandIncludes,
  scapiSchemaExpandFor,
} from '@salesforce/b2c-tooling-sdk/scapi';

describe('scapi/schema-source', () => {
  describe('normalizeScapiSchemaExpand', () => {
    it('joins values into one canonical comma-separated value', () => {
      expect(normalizeScapiSchemaExpand(['titles', 'summaries', 'summaries'])).to.equal('summaries,titles');
      expect(normalizeScapiSchemaExpand('descriptions;custom_properties')).to.equal('custom_properties,descriptions');
    });
    it('collapses to all, and to undefined when empty', () => {
      expect(normalizeScapiSchemaExpand('summaries, all')).to.equal('all');
      expect(normalizeScapiSchemaExpand(undefined)).to.equal(undefined);
      expect(normalizeScapiSchemaExpand([])).to.equal(undefined);
    });
    it('rejects unknown values', () => {
      expect(() => normalizeScapiSchemaExpand('summary')).to.throw(/Unknown schema expansion "summary"/);
    });
  });

  describe('scapiSchemaExpandFor', () => {
    it('asks for nothing when only an outline is needed', () => {
      expect(scapiSchemaExpandFor({})).to.equal(undefined);
    });
    it('asks for only what will be used', () => {
      expect(scapiSchemaExpandFor({customProperties: true})).to.equal('custom_properties');
      expect(scapiSchemaExpandFor({prose: true})).to.equal('descriptions,summaries,titles');
      expect(scapiSchemaExpandFor({examples: true, customProperties: true})).to.equal('custom_properties,examples');
      expect(scapiSchemaExpandFor({full: true, prose: true})).to.equal('all');
    });
  });

  describe('expansion predicates', () => {
    it('treats all as every section', () => {
      expect(scapiExpandIncludes('all', 'examples')).to.equal(true);
      expect(scapiExpandIncludes('summaries', 'examples')).to.equal(false);
      expect(scapiExpandIncludes(undefined, 'tags')).to.equal(false);
    });
    it('is full only with custom properties and prose', () => {
      expect(isFullScapiExpand('all')).to.equal(true);
      expect(isFullScapiExpand('custom_properties,summaries,descriptions')).to.equal(true);
      expect(isFullScapiExpand('custom_properties')).to.equal(false);
      expect(isFullScapiExpand(SCAPI_STANDARD_SCHEMA_EXPAND)).to.equal(false);
    });
  });

  describe('bundled corpus', () => {
    it('lists the bundled schemas with filters', () => {
      const all = listBundledScapiSchemas();
      expect(all).to.have.length(loadScapiSchemas().length);
      const one = listBundledScapiSchemas({apiName: all[0].apiName, apiVersion: all[0].apiVersion});
      expect(one.every((item) => item.apiName === all[0].apiName)).to.equal(true);
      expect(listBundledScapiSchemas({apiName: 'nope'})).to.deep.equal([]);
    });
  });

  describe('fallback', () => {
    const identity = (() => {
      const {entry} = loadScapiSchemas()[0];
      return {apiFamily: entry.apiFamily, apiName: entry.apiName, apiVersion: entry.apiVersion};
    })();

    it('returns the live contract without a warning', async () => {
      const result = await fetchScapiSchemaWithFallback(identity, async () => ({openapi: '3.0.3', paths: {}}));
      expect(result.source).to.equal('live');
      expect(result.warning).to.equal(undefined);
    });
    it('falls back to the bundled contract with a warning, including configuration errors', async () => {
      const result = await fetchScapiSchemaWithFallback(identity, async () => {
        throw new Error('SCAPI short code required.');
      });
      expect(result.source).to.equal('bundled');
      expect(result.schema.paths).to.be.an('object');
      expect(result.warning)
        .to.match(/short code required/)
        .and.match(/bundled/);
    });
    it('rethrows when nothing is bundled or the request was aborted', async () => {
      const failure = async () => {
        throw new Error('boom');
      };
      let error: unknown;
      try {
        await fetchScapiSchemaWithFallback({apiFamily: 'custom', apiName: 'x', apiVersion: 'v1'}, failure);
      } catch (e) {
        error = e;
      }
      expect((error as Error).message).to.equal('boom');
      const controller = new AbortController();
      controller.abort();
      error = undefined;
      try {
        await fetchScapiSchemaWithFallback(identity, failure, controller.signal);
      } catch (e) {
        error = e;
      }
      expect((error as Error).message).to.equal('boom');
    });
    it('falls back to the filtered bundled listing', async () => {
      const result = await listScapiSchemasWithFallback({apiName: identity.apiName}, async () => {
        throw new Error('HTTP 403');
      });
      expect(result.source).to.equal('bundled');
      expect(result.total).to.equal(result.schemas.length);
      expect(result.schemas.every((item) => item.apiName === identity.apiName)).to.equal(true);
      expect(result.warning).to.match(/HTTP 403/);
    });
  });
});
