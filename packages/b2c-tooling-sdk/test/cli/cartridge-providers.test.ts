/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  CartridgeProviderRunner,
  type CartridgeProvider,
  type CartridgeTransformer,
  type CartridgeDiscoveryOptions,
} from '../../src/cli/cartridge-providers.js';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';

describe('cli/cartridge-providers', () => {
  describe('CartridgeProviderRunner', () => {
    describe('constructor', () => {
      it('creates a runner without logger', () => {
        const runner = new CartridgeProviderRunner();
        expect(runner.providerCount).to.equal(0);
        expect(runner.transformerCount).to.equal(0);
      });

      it('creates a runner with logger', () => {
        const logger = {debug: () => {}};
        const runner = new CartridgeProviderRunner(logger);
        expect(runner.providerCount).to.equal(0);
        expect(runner.transformerCount).to.equal(0);
      });
    });

    describe('addProviders', () => {
      it('adds providers to the runner', () => {
        const runner = new CartridgeProviderRunner();
        const provider: CartridgeProvider = {
          name: 'test-provider',
          priority: 'before',
          async findCartridges() {
            return [];
          },
        };

        runner.addProviders([provider]);
        expect(runner.providerCount).to.equal(1);
      });

      it('adds multiple providers', () => {
        const runner = new CartridgeProviderRunner();
        const providers: CartridgeProvider[] = [
          {
            name: 'provider1',
            priority: 'before',
            async findCartridges() {
              return [];
            },
          },
          {
            name: 'provider2',
            priority: 'after',
            async findCartridges() {
              return [];
            },
          },
        ];

        runner.addProviders(providers);
        expect(runner.providerCount).to.equal(2);
      });
    });

    describe('addTransformers', () => {
      it('adds transformers to the runner', () => {
        const runner = new CartridgeProviderRunner();
        const transformer: CartridgeTransformer = {
          name: 'test-transformer',
          async transform(cartridges: CartridgeMapping[]): Promise<CartridgeMapping[]> {
            return cartridges;
          },
        };

        runner.addTransformers([transformer]);
        expect(runner.transformerCount).to.equal(1);
      });

      it('adds multiple transformers', () => {
        const runner = new CartridgeProviderRunner();
        const transformers: CartridgeTransformer[] = [
          {
            name: 'transformer1',
            async transform(cartridges: CartridgeMapping[]) {
              return cartridges;
            },
          },
          {
            name: 'transformer2',
            async transform(cartridges: CartridgeMapping[]) {
              return cartridges;
            },
          },
        ];

        runner.addTransformers(transformers);
        expect(runner.transformerCount).to.equal(2);
      });
    });

    describe('providerCount', () => {
      it('returns zero for empty runner', () => {
        const runner = new CartridgeProviderRunner();
        expect(runner.providerCount).to.equal(0);
      });

      it('returns correct count after adding providers', () => {
        const runner = new CartridgeProviderRunner();
        runner.addProviders([
          {
            name: 'p1',
            priority: 'before',
            async findCartridges() {
              return [];
            },
          },
        ]);
        expect(runner.providerCount).to.equal(1);
      });
    });

    describe('transformerCount', () => {
      it('returns zero for empty runner', () => {
        const runner = new CartridgeProviderRunner();
        expect(runner.transformerCount).to.equal(0);
      });

      it('returns correct count after adding transformers', () => {
        const runner = new CartridgeProviderRunner();
        runner.addTransformers([
          {
            name: 't1',
            async transform(cartridges: CartridgeMapping[]) {
              return cartridges;
            },
          },
        ]);
        expect(runner.transformerCount).to.equal(1);
      });
    });

    describe('findCartridges', () => {
      const defaultCartridges: CartridgeMapping[] = [
        {name: 'default1', src: '/path/default1', dest: 'default1'},
        {name: 'default2', src: '/path/default2', dest: 'default2'},
      ];

      const options: CartridgeDiscoveryOptions = {
        directory: '/test',
        include: undefined,
        exclude: undefined,
      };

      it('returns default cartridges when no providers or transformers', async () => {
        const runner = new CartridgeProviderRunner();
        const result = await runner.findCartridges(defaultCartridges, options);

        expect(result).to.deep.equal(defaultCartridges);
      });

      it('runs before providers first', async () => {
        const runner = new CartridgeProviderRunner();
        const beforeCartridges: CartridgeMapping[] = [{name: 'before1', src: '/path/before1', dest: 'before1'}];
        const provider: CartridgeProvider = {
          name: 'before-provider',
          priority: 'before',
          async findCartridges() {
            return beforeCartridges;
          },
        };

        runner.addProviders([provider]);
        const result = await runner.findCartridges(defaultCartridges, options);

        expect(result).to.have.length(3);
        expect(result[0].name).to.equal('before1');
        expect(result[1].name).to.equal('default1');
        expect(result[2].name).to.equal('default2');
      });

      it('runs after providers after defaults', async () => {
        const runner = new CartridgeProviderRunner();
        const afterCartridges: CartridgeMapping[] = [{name: 'after1', src: '/path/after1', dest: 'after1'}];
        const provider: CartridgeProvider = {
          name: 'after-provider',
          priority: 'after',
          async findCartridges() {
            return afterCartridges;
          },
        };

        runner.addProviders([provider]);
        const result = await runner.findCartridges(defaultCartridges, options);

        expect(result).to.have.length(3);
        expect(result[0].name).to.equal('default1');
        expect(result[1].name).to.equal('default2');
        expect(result[2].name).to.equal('after1');
      });

      it('runs providers in correct order', async () => {
        const runner = new CartridgeProviderRunner();
        const callOrder: string[] = [];
        const providers: CartridgeProvider[] = [
          {
            name: 'before1',
            priority: 'before',
            async findCartridges() {
              callOrder.push('before1');
              return [{name: 'before1', src: '/path/before1', dest: 'before1'}];
            },
          },
          {
            name: 'before2',
            priority: 'before',
            async findCartridges() {
              callOrder.push('before2');
              return [{name: 'before2', src: '/path/before2', dest: 'before2'}];
            },
          },
          {
            name: 'after1',
            priority: 'after',
            async findCartridges() {
              callOrder.push('after1');
              return [{name: 'after1', src: '/path/after1', dest: 'after1'}];
            },
          },
        ];

        runner.addProviders(providers);
        await runner.findCartridges(defaultCartridges, options);

        expect(callOrder).to.deep.equal(['before1', 'before2', 'after1']);
      });

      it('deduplicates cartridges by name (first wins)', async () => {
        const runner = new CartridgeProviderRunner();
        const providers: CartridgeProvider[] = [
          {
            name: 'before-provider',
            priority: 'before',
            async findCartridges() {
              return [{name: 'duplicate', src: '/path/before', dest: 'duplicate'}];
            },
          },
          {
            name: 'after-provider',
            priority: 'after',
            async findCartridges() {
              return [{name: 'duplicate', src: '/path/after', dest: 'duplicate'}];
            },
          },
        ];

        runner.addProviders(providers);
        const result = await runner.findCartridges(
          [{name: 'duplicate', src: '/path/default', dest: 'duplicate'}],
          options,
        );

        expect(result).to.have.length(1);
        expect(result[0].src).to.equal('/path/before'); // First provider wins
      });

      it('applies transformers in order', async () => {
        const runner = new CartridgeProviderRunner();
        const transformOrder: string[] = [];
        const transformers: CartridgeTransformer[] = [
          {
            name: 'transformer1',
            async transform(cartridges: CartridgeMapping[]) {
              transformOrder.push('transformer1');
              return cartridges.map((c: CartridgeMapping) => ({...c, dest: `${c.dest}_t1`}));
            },
          },
          {
            name: 'transformer2',
            async transform(cartridges: CartridgeMapping[]) {
              transformOrder.push('transformer2');
              return cartridges.map((c: CartridgeMapping) => ({...c, dest: `${c.dest}_t2`}));
            },
          },
        ];

        runner.addTransformers(transformers);
        const result = await runner.findCartridges(defaultCartridges, options);

        expect(transformOrder).to.deep.equal(['transformer1', 'transformer2']);
        expect(result[0].dest).to.equal('default1_t1_t2');
        expect(result[1].dest).to.equal('default2_t1_t2');
      });

      it('handles provider errors gracefully', async () => {
        const logger = {
          debug: (msg: string) => {
            expect(msg).to.include('failed');
          },
        };
        const runnerWithLogger = new CartridgeProviderRunner(logger);
        const provider: CartridgeProvider = {
          name: 'error-provider',
          priority: 'before',
          async findCartridges() {
            throw new Error('Provider error');
          },
        };

        runnerWithLogger.addProviders([provider]);
        const result = await runnerWithLogger.findCartridges(defaultCartridges, options);

        // Should still return default cartridges
        expect(result).to.deep.equal(defaultCartridges);
      });

      it('handles transformer errors gracefully', async () => {
        const logger = {
          debug: (msg: string) => {
            expect(msg).to.include('failed');
          },
        };
        const runnerWithLogger = new CartridgeProviderRunner(logger);
        const transformer: CartridgeTransformer = {
          name: 'error-transformer',
          async transform(_cartridges: CartridgeMapping[]) {
            throw new Error('Transformer error');
          },
        };

        runnerWithLogger.addTransformers([transformer]);
        const result = await runnerWithLogger.findCartridges(defaultCartridges, options);

        // Should still return cartridges (transformer failed, so original passed through)
        expect(result).to.have.length(2);
      });

      it('passes options to providers', async () => {
        const runner = new CartridgeProviderRunner();
        let receivedOptions: CartridgeDiscoveryOptions | undefined;
        const provider: CartridgeProvider = {
          name: 'test-provider',
          priority: 'before',
          async findCartridges(opts: CartridgeDiscoveryOptions) {
            receivedOptions = opts;
            return [];
          },
        };

        runner.addProviders([provider]);
        const customOptions: CartridgeDiscoveryOptions = {
          directory: '/custom',
          include: ['cart1'],
          exclude: ['cart2'],
          codeVersion: 'v2',
        };

        await runner.findCartridges(defaultCartridges, customOptions);
        expect(receivedOptions).to.deep.equal(customOptions);
      });

      it('passes options to transformers', async () => {
        const runner = new CartridgeProviderRunner();
        let receivedOptions: CartridgeDiscoveryOptions | undefined;
        const transformer: CartridgeTransformer = {
          name: 'test-transformer',
          async transform(cartridges: CartridgeMapping[], opts: CartridgeDiscoveryOptions) {
            receivedOptions = opts;
            return cartridges;
          },
        };

        runner.addTransformers([transformer]);
        const customOptions: CartridgeDiscoveryOptions = {
          directory: '/custom',
          include: ['cart1'],
        };

        await runner.findCartridges(defaultCartridges, customOptions);
        expect(receivedOptions).to.deep.equal(customOptions);
      });
    });
  });
});
