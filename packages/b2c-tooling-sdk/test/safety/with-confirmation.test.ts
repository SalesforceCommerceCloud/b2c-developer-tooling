/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {SafetyGuard, SafetyBlockedError, withSafetyConfirmation} from '@salesforce/b2c-tooling-sdk';

describe('safety/with-confirmation', () => {
  describe('withSafetyConfirmation', () => {
    it('returns result when operation succeeds without confirmation', async () => {
      const guard = new SafetyGuard({level: 'NONE'});

      const result = await withSafetyConfirmation(
        guard,
        async () => 'success',
        async () => true,
      );

      expect(result).to.equal('success');
    });

    it('prompts and retries when SafetyConfirmationRequired is thrown', async () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{command: 'sandbox:delete', action: 'confirm'}],
      });

      let callCount = 0;
      let confirmCalled = false;

      const result = await withSafetyConfirmation(
        guard,
        async () => {
          callCount++;
          if (callCount === 1) {
            // First call: guard evaluates and finds confirm rule
            guard.assert({type: 'command', commandId: 'sandbox:delete'});
          }
          return 'success';
        },
        async (evaluation) => {
          confirmCalled = true;
          expect(evaluation.action).to.equal('confirm');
          return true;
        },
      );

      expect(result).to.equal('success');
      expect(confirmCalled).to.be.true;
      expect(callCount).to.equal(2);
    });

    it('throws SafetyBlockedError when user declines confirmation', async () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{command: 'sandbox:delete', action: 'confirm'}],
      });

      try {
        await withSafetyConfirmation(
          guard,
          async () => {
            guard.assert({type: 'command', commandId: 'sandbox:delete'});
            return 'success';
          },
          async () => false, // User declines
        );
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
        expect((error as SafetyBlockedError).message).to.include('Operation cancelled');
      }
    });

    it('re-throws non-confirmation errors', async () => {
      const guard = new SafetyGuard({level: 'NONE'});

      try {
        await withSafetyConfirmation(
          guard,
          async () => {
            throw new Error('Network error');
          },
          async () => true,
        );
        throw new Error('Expected error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Network error');
      }
    });

    it('re-throws SafetyBlockedError without confirmation prompt', async () => {
      const guard = new SafetyGuard({level: 'NO_DELETE'});
      let confirmCalled = false;

      try {
        await withSafetyConfirmation(
          guard,
          async () => {
            guard.assert({type: 'http', method: 'DELETE', url: 'https://example.com/items/1', path: '/items/1'});
            return 'success';
          },
          async () => {
            confirmCalled = true;
            return true;
          },
        );
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
        expect(confirmCalled).to.be.false;
      }
    });

    it('cleans up temporary allow after retry completes', async () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{command: 'sandbox:delete', action: 'confirm'}],
      });

      let callCount = 0;
      await withSafetyConfirmation(
        guard,
        async () => {
          callCount++;
          if (callCount === 1) {
            guard.assert({type: 'command', commandId: 'sandbox:delete'});
          }
          return 'done';
        },
        async () => true,
      );

      // After withSafetyConfirmation returns, the temporary allow should be cleaned up
      // So evaluating the same operation should get the confirm action again
      const evaluation = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
      expect(evaluation.action).to.equal('confirm');
    });

    it('cleans up temporary allow even if retry fails', async () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{command: 'sandbox:delete', action: 'confirm'}],
      });

      let callCount = 0;
      try {
        await withSafetyConfirmation(
          guard,
          async () => {
            callCount++;
            if (callCount === 1) {
              guard.assert({type: 'command', commandId: 'sandbox:delete'});
            }
            // Retry also fails with a different error
            throw new Error('Operation failed after confirmation');
          },
          async () => true,
        );
      } catch {
        // expected
      }

      // Temporary allow should be cleaned up
      const evaluation = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
      expect(evaluation.action).to.equal('confirm');
    });
  });
});
