/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {createScaffoldRegistry, ScaffoldRegistry, SCAFFOLDS_DATA_DIR} from '../../src/scaffold/index.js';

describe('scaffold/registry', () => {
  describe('createScaffoldRegistry', () => {
    it('should create a registry instance', () => {
      const registry = createScaffoldRegistry();
      expect(registry).to.be.instanceOf(ScaffoldRegistry);
    });
  });

  describe('ScaffoldRegistry', () => {
    let registry: ScaffoldRegistry;

    beforeEach(() => {
      registry = createScaffoldRegistry();
    });

    describe('getScaffolds', () => {
      it('should discover built-in scaffolds', async () => {
        const scaffolds = await registry.getScaffolds();
        expect(scaffolds).to.be.an('array');
        expect(scaffolds.length).to.be.greaterThan(0);
      });

      it('should include cartridge scaffold', async () => {
        const scaffolds = await registry.getScaffolds();
        const cartridge = scaffolds.find((s) => s.id === 'cartridge');
        expect(cartridge).to.exist;
        expect(cartridge?.manifest.category).to.equal('cartridge');
        expect(cartridge?.source).to.equal('built-in');
      });

      it('should include custom-api scaffold', async () => {
        const scaffolds = await registry.getScaffolds();
        const customApi = scaffolds.find((s) => s.id === 'custom-api');
        expect(customApi).to.exist;
        expect(customApi?.manifest.category).to.equal('custom-api');
      });

      it('should filter by category', async () => {
        const scaffolds = await registry.getScaffolds({category: 'cartridge'});
        expect(scaffolds.every((s) => s.manifest.category === 'cartridge')).to.be.true;
      });

      it('should filter by query', async () => {
        const scaffolds = await registry.getScaffolds({query: 'cartridge'});
        expect(scaffolds.length).to.be.greaterThan(0);
        expect(scaffolds.some((s) => s.id === 'cartridge')).to.be.true;
      });

      it('should cache results', async () => {
        const scaffolds1 = await registry.getScaffolds();
        const scaffolds2 = await registry.getScaffolds();
        expect(scaffolds1).to.equal(scaffolds2);
      });

      it('should clear cache', async () => {
        const scaffolds1 = await registry.getScaffolds();
        registry.clearCache();
        const scaffolds2 = await registry.getScaffolds();
        expect(scaffolds1).to.not.equal(scaffolds2);
        expect(scaffolds1).to.deep.equal(scaffolds2);
      });
    });

    describe('getScaffold', () => {
      it('should get a scaffold by ID', async () => {
        const scaffold = await registry.getScaffold('cartridge');
        expect(scaffold).to.exist;
        expect(scaffold?.id).to.equal('cartridge');
      });

      it('should return null for non-existent scaffold', async () => {
        const scaffold = await registry.getScaffold('non-existent');
        expect(scaffold).to.be.null;
      });
    });

    describe('searchScaffolds', () => {
      it('should search by query', async () => {
        const results = await registry.searchScaffolds('api');
        expect(results.length).to.be.greaterThan(0);
        expect(results.some((s) => s.id === 'custom-api')).to.be.true;
      });

      it('should search by tags', async () => {
        const results = await registry.searchScaffolds('scapi');
        expect(results.some((s) => s.manifest.tags?.includes('scapi'))).to.be.true;
      });
    });

    describe('providers', () => {
      it('should support custom providers', async () => {
        registry.addProviders([
          {
            name: 'test-provider',
            priority: 'after',
            async getScaffolds() {
              return [
                {
                  id: 'test-scaffold',
                  manifest: {
                    name: 'test-scaffold',
                    displayName: 'Test Scaffold',
                    description: 'A test scaffold',
                    category: 'cartridge',
                    version: '1.0',
                    parameters: [],
                  },
                  path: '/tmp/test',
                  filesPath: '/tmp/test/files',
                  source: 'plugin',
                },
              ];
            },
          },
        ]);

        const scaffolds = await registry.getScaffolds();
        expect(scaffolds.some((s) => s.id === 'test-scaffold')).to.be.true;
      });
    });
  });

  describe('SCAFFOLDS_DATA_DIR', () => {
    it('should be a valid path', () => {
      expect(SCAFFOLDS_DATA_DIR).to.be.a('string');
      expect(SCAFFOLDS_DATA_DIR).to.include('data/scaffolds');
    });
  });
});
