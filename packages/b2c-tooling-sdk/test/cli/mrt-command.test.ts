/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {globalMiddlewareRegistry, type UnifiedMiddleware} from '@salesforce/b2c-tooling-sdk/clients';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

/** Minimal context accepted by openapi-fetch's onResponse hook (only fields we exercise). */
type OnResponseContext = Parameters<NonNullable<UnifiedMiddleware['onResponse']>>[0];

// Create a test command class
class TestMrtCommand extends MrtCommand<typeof TestMrtCommand> {
  static id = 'test:mrt';
  static description = 'Test MRT command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testRequireMrtCredentials() {
    return this.requireMrtCredentials();
  }

  public async testCatch(err: Error & {exitCode?: number}): Promise<never> {
    return this.catch(err);
  }
}

describe('cli/mrt-command', () => {
  let config: Config;
  let command: TestMrtCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestMrtCommand([], config);
  });

  afterEach(() => {
    // init() registers the read-only warning provider globally; finally() isn't
    // called in these tests, so unregister it here to balance each init().
    globalMiddlewareRegistry.unregister('mrt-read-only-warning');
    sinon.restore();
    restoreConfig();
  });

  describe('requireMrtCredentials', () => {
    it('throws error when no credentials', async () => {
      stubParse(command, {'credentials-file': '/dev/null'}); // Use non-existent credentials file

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireMrtCredentials();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when API key is set', async () => {
      stubParse(command, {'api-key': 'test-api-key'});

      await command.init();
      // Should not throw
      command.testRequireMrtCredentials();
    });
  });

  describe('catch() - read-only mode guidance', () => {
    beforeEach(async () => {
      stubParse(command, {'api-key': 'test-api-key'});
      await command.init();
    });

    it('replaces a raw read-only failure with clear guidance', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('Failed to create deployment: {"detail":"Service is in READ_ONLY mode"}');

      try {
        await command.testCatch(err);
      } catch {
        // Expected — super.catch() re-throws via this.error()
      }

      expect(errorStub.calledOnce).to.be.true;
      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.include('maintenance mode');
      expect(message).to.include('This command was not run');
      // Surfaces the Trust status page so users can check status and ETA
      expect(message).to.include('https://status.salesforce.com/instances/MANAGEDRUNTIMEADMIN');
      // Names the specific command (test command id is "test:mrt")
      expect(message).to.include('test mrt');
      // Raw JSON blob must not be the primary, user-facing message
      expect(message).to.not.include('{"detail"');
    });

    it('preserves the original detail as err.cause', async () => {
      sinon.stub(command, 'error').throws(new Error('exit'));
      const original = 'Failed to push bundle (HTTP 503): {"detail":"Service is in READ_ONLY mode"}';
      const err = new Error(original);

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      expect(err.cause).to.equal(original);
    });

    it('detects the marker case-insensitively', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('Failed to push bundle: {"detail":"service is in read_only MODE"}');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.include('maintenance mode');
    });

    it('passes through non-read-only errors unchanged', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('Failed to create deployment: Connection timeout');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.equal('Failed to create deployment: Connection timeout');
      expect(err.cause).to.be.undefined;
    });

    it('does not misclassify a 403 authorization error as read-only', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('403 Forbidden');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      const message = errorStub.firstCall.args[0] as string;
      expect(message).to.equal('403 Forbidden');
    });

    it('handles an error with an empty message safely', async () => {
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));
      const err = new Error('');

      try {
        await command.testCatch(err);
      } catch {
        // Expected
      }

      expect(errorStub.calledOnce).to.be.true;
    });
  });

  describe('read-only mode warning (reads)', () => {
    beforeEach(async () => {
      stubParse(command, {'api-key': 'test-api-key'});
      await command.init();
    });

    // Locate the read-only warning middleware that init() registered.
    function getReadOnlyMiddleware(): UnifiedMiddleware | undefined {
      const middlewares = globalMiddlewareRegistry.getMiddleware('mrt');
      return middlewares.find((m) => typeof m.onResponse === 'function');
    }

    function readOnlyResponse(): Response {
      return new Response('{}', {status: 200, headers: {'X-MRT-Read-Only': 'true'}});
    }

    // Invoke the middleware's onResponse with a minimal context — only `request`
    // and `response` are read. openapi-fetch's full context type isn't needed here.
    async function triggerOnResponse(method: string, response: Response): Promise<void> {
      const mw = getReadOnlyMiddleware();
      const request = new Request('https://cloud.mobify.com/api/projects/', {method});
      const context = {request, response} as unknown as OnResponseContext;
      await mw!.onResponse!(context);
    }

    it('registers the middleware only for MRT clients', () => {
      expect(globalMiddlewareRegistry.getMiddleware('mrt').some((m) => typeof m.onResponse === 'function')).to.be.true;
      expect(globalMiddlewareRegistry.getMiddleware('ocapi')).to.have.lengthOf(0);
    });

    it('warns when a read succeeds during maintenance mode', async () => {
      const warnStub = sinon.stub(command, 'warn');

      await triggerOnResponse('GET', readOnlyResponse());

      expect(warnStub.calledOnce).to.be.true;
      const message = warnStub.firstCall.args[0] as string;
      expect(message).to.include('maintenance mode');
      expect(message).to.include('read operations');
      expect(message).to.include('https://status.salesforce.com/instances/MANAGEDRUNTIMEADMIN');
    });

    it('warns at most once across multiple reads', async () => {
      const warnStub = sinon.stub(command, 'warn');

      await triggerOnResponse('GET', readOnlyResponse());
      await triggerOnResponse('GET', readOnlyResponse());

      expect(warnStub.calledOnce).to.be.true;
    });

    it('does not warn on write requests (those are handled by catch())', async () => {
      const warnStub = sinon.stub(command, 'warn');

      await triggerOnResponse('POST', readOnlyResponse());

      expect(warnStub.called).to.be.false;
    });

    it('does not warn when the read-only header is absent', async () => {
      const warnStub = sinon.stub(command, 'warn');

      await triggerOnResponse('GET', new Response('{}', {status: 200}));

      expect(warnStub.called).to.be.false;
    });
  });
});
