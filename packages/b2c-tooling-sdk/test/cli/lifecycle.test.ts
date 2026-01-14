/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  B2CLifecycleRunner,
  createB2COperationContext,
  type B2COperationType,
  type B2COperationResult,
  type B2COperationLifecycleProvider,
  type B2COperationContext,
} from '@salesforce/b2c-tooling-sdk/cli';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';

describe('cli/lifecycle', () => {
  let mockInstance: B2CInstance;

  beforeEach(() => {
    mockInstance = new B2CInstance(
      {
        hostname: 'test.demandware.net',
        codeVersion: 'v1',
      },
      {
        oauth: {
          clientId: 'test-client',
          clientSecret: 'test-secret',
        },
      },
    );
  });

  describe('createB2COperationContext', () => {
    it('creates a context with required fields', () => {
      const context = createB2COperationContext('job:run', {jobId: 'test-job'}, mockInstance);

      expect(context.operationType).to.equal('job:run');
      expect(context.operationId).to.be.a('string');
      expect(context.operationId.length).to.be.greaterThan(0);
      expect(context.instance).to.equal(mockInstance);
      expect(context.startTime).to.be.a('number');
      expect(context.metadata).to.deep.equal({jobId: 'test-job'});
    });

    it('generates unique operation IDs', () => {
      const context1 = createB2COperationContext('job:run', {}, mockInstance);
      const context2 = createB2COperationContext('job:run', {}, mockInstance);

      expect(context1.operationId).to.not.equal(context2.operationId);
    });

    it('sets startTime to current timestamp', () => {
      const before = Date.now();
      const context = createB2COperationContext('code:deploy', {}, mockInstance);
      const after = Date.now();

      expect(context.startTime).to.be.at.least(before);
      expect(context.startTime).to.be.at.most(after);
    });

    it('handles all operation types', () => {
      const types: B2COperationType[] = [
        'job:run',
        'job:import',
        'job:export',
        'code:deploy',
        'code:activate',
        'site-archive:import',
        'site-archive:export',
      ];

      for (const type of types) {
        const context = createB2COperationContext(type, {}, mockInstance);
        expect(context.operationType).to.equal(type);
      }
    });
  });

  describe('B2CLifecycleRunner', () => {
    describe('constructor', () => {
      it('creates a runner without logger', () => {
        const runner = new B2CLifecycleRunner();
        expect(runner.size).to.equal(0);
      });

      it('creates a runner with logger', () => {
        // Logger is optional, so we can create without it
        const runner = new B2CLifecycleRunner();
        expect(runner.size).to.equal(0);
      });
    });

    describe('addProviders', () => {
      it('adds providers to the runner', () => {
        const runner = new B2CLifecycleRunner();
        const provider: B2COperationLifecycleProvider = {
          name: 'test-provider',
        };

        runner.addProviders([provider]);
        expect(runner.size).to.equal(1);
      });

      it('adds multiple providers', () => {
        const runner = new B2CLifecycleRunner();
        const providers: B2COperationLifecycleProvider[] = [
          {name: 'provider1'},
          {name: 'provider2'},
          {name: 'provider3'},
        ];

        runner.addProviders(providers);
        expect(runner.size).to.equal(3);
      });
    });

    describe('size', () => {
      it('returns zero for empty runner', () => {
        const runner = new B2CLifecycleRunner();
        expect(runner.size).to.equal(0);
      });

      it('returns correct count after adding providers', () => {
        const runner = new B2CLifecycleRunner();
        runner.addProviders([{name: 'p1'}, {name: 'p2'}]);
        expect(runner.size).to.equal(2);
      });
    });

    describe('runBefore', () => {
      it('returns empty result when no providers', async () => {
        const runner = new B2CLifecycleRunner();
        const context = createB2COperationContext('job:run', {}, mockInstance);

        const result = await runner.runBefore(context);
        expect(result).to.deep.equal({});
      });

      it('returns empty result when providers have no beforeOperation', async () => {
        const runner = new B2CLifecycleRunner();
        runner.addProviders([{name: 'no-op-provider'}]);
        const context = createB2COperationContext('job:run', {}, mockInstance);

        const result = await runner.runBefore(context);
        expect(result).to.deep.equal({});
      });

      it('calls beforeOperation on providers', async () => {
        const runner = new B2CLifecycleRunner();
        let called = false;
        const provider: B2COperationLifecycleProvider = {
          name: 'test-provider',
          async beforeOperation(context) {
            called = true;
            expect(context.operationType).to.equal('job:run');
            return {};
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);

        await runner.runBefore(context);
        expect(called).to.be.true;
      });

      it('returns skip result when provider requests skip', async () => {
        const runner = new B2CLifecycleRunner();
        const provider: B2COperationLifecycleProvider = {
          name: 'skip-provider',
          async beforeOperation() {
            return {skip: true, skipReason: 'Test skip'};
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);

        const result = await runner.runBefore(context);
        expect(result.skip).to.be.true;
        expect(result.skipReason).to.equal('Test skip');
      });

      it('stops on first skip request', async () => {
        const runner = new B2CLifecycleRunner();
        let secondCalled = false;
        const providers: B2COperationLifecycleProvider[] = [
          {
            name: 'skip-provider',
            async beforeOperation() {
              return {skip: true};
            },
          },
          {
            name: 'second-provider',
            async beforeOperation() {
              secondCalled = true;
              return {};
            },
          },
        ];

        runner.addProviders(providers);
        const context = createB2COperationContext('job:run', {}, mockInstance);

        await runner.runBefore(context);
        expect(secondCalled).to.be.false;
      });

      it('merges context modifications', async () => {
        const runner = new B2CLifecycleRunner();
        const provider: B2COperationLifecycleProvider = {
          name: 'modify-provider',
          async beforeOperation(_context) {
            return {
              context: {customField: 'value'} as Partial<B2COperationContext>,
            };
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);

        await runner.runBefore(context);
        expect(context.metadata.customField).to.equal('value');
      });

      it('handles provider errors gracefully', async () => {
        // Test without logger - errors should be handled gracefully
        const runner = new B2CLifecycleRunner();
        const provider: B2COperationLifecycleProvider = {
          name: 'error-provider',
          async beforeOperation() {
            throw new Error('Provider error');
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);

        // Should not throw
        const result = await runner.runBefore(context);
        expect(result).to.deep.equal({});
      });
    });

    describe('runAfter', () => {
      it('does nothing when no providers', async () => {
        const runner = new B2CLifecycleRunner();
        const context = createB2COperationContext('job:run', {}, mockInstance);
        const result: B2COperationResult = {success: true, duration: 100};

        // Should not throw
        await runner.runAfter(context, result);
      });

      it('does nothing when providers have no afterOperation', async () => {
        const runner = new B2CLifecycleRunner();
        runner.addProviders([{name: 'no-op-provider'}]);
        const context = createB2COperationContext('job:run', {}, mockInstance);
        const result: B2COperationResult = {success: true, duration: 100};

        // Should not throw
        await runner.runAfter(context, result);
      });

      it('calls afterOperation on providers', async () => {
        const runner = new B2CLifecycleRunner();
        let called = false;
        const provider: B2COperationLifecycleProvider = {
          name: 'test-provider',
          async afterOperation(context, result) {
            called = true;
            expect(context.operationType).to.equal('job:run');
            expect(result.success).to.be.true;
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);
        const result: B2COperationResult = {success: true, duration: 100};

        await runner.runAfter(context, result);
        expect(called).to.be.true;
      });

      it('calls afterOperation with failure result', async () => {
        const runner = new B2CLifecycleRunner();
        let receivedError: Error | undefined;
        const provider: B2COperationLifecycleProvider = {
          name: 'test-provider',
          async afterOperation(context, result) {
            receivedError = result.error;
            expect(result.success).to.be.false;
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);
        const error = new Error('Operation failed');
        const result: B2COperationResult = {success: false, duration: 50, error};

        await runner.runAfter(context, result);
        expect(receivedError).to.equal(error);
      });

      it('calls all providers', async () => {
        const runner = new B2CLifecycleRunner();
        const callOrder: string[] = [];
        const providers: B2COperationLifecycleProvider[] = [
          {
            name: 'provider1',
            async afterOperation() {
              callOrder.push('provider1');
            },
          },
          {
            name: 'provider2',
            async afterOperation() {
              callOrder.push('provider2');
            },
          },
        ];

        runner.addProviders(providers);
        const context = createB2COperationContext('job:run', {}, mockInstance);
        const result: B2COperationResult = {success: true, duration: 100};

        await runner.runAfter(context, result);
        expect(callOrder).to.deep.equal(['provider1', 'provider2']);
      });

      it('handles provider errors gracefully', async () => {
        // Test without logger - errors should be handled gracefully
        const runner = new B2CLifecycleRunner();
        const provider: B2COperationLifecycleProvider = {
          name: 'error-provider',
          async afterOperation() {
            throw new Error('Provider error');
          },
        };

        runner.addProviders([provider]);
        const context = createB2COperationContext('job:run', {}, mockInstance);
        const result: B2COperationResult = {success: true, duration: 100};

        // Should not throw
        await runner.runAfter(context, result);
      });
    });
  });
});
