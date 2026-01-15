/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';
import {stubParse} from '../helpers/stub-parse.js';

// Create a concrete test command class
class TestBaseCommand extends BaseCommand<typeof TestBaseCommand> {
  static id = 'test:base';
  static description = 'Test base command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testGetExtraParams() {
    return this.getExtraParams();
  }

  public testCatch(err: Error & {exitCode?: number}) {
    return this.catch(err);
  }
}

describe('cli/base-command', () => {
  let config: Config;
  let command: TestBaseCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestBaseCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('getExtraParams', () => {
    it('returns undefined when no extra params', async () => {
      stubParse(command);

      await command.init();
      const params = command.testGetExtraParams();
      expect(params).to.be.undefined;
    });

    it('parses extra-query flag', async () => {
      stubParse(command, {'extra-query': '{"debug":"true"}'});

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
    });

    it('parses extra-body flag', async () => {
      stubParse(command, {'extra-body': '{"_internal":true}'});

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.body).to.deep.equal({_internal: true});
    });

    it('parses both extra-query and extra-body', async () => {
      stubParse(command, {
        'extra-query': '{"debug":"true"}',
        'extra-body': '{"_internal":true}',
      });

      await command.init();
      const params = command.testGetExtraParams();
      expect(params?.query).to.deep.equal({debug: 'true'});
      expect(params?.body).to.deep.equal({_internal: true});
    });

    it('throws error for invalid JSON in extra-query', async () => {
      stubParse(command, {'extra-query': 'invalid-json'});

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testGetExtraParams();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('throws error for invalid JSON in extra-body', async () => {
      stubParse(command, {'extra-body': 'invalid-json'});

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testGetExtraParams();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });
  });

  describe('catch', () => {
    it('handles errors with exit code', async () => {
      stubParse(command, {json: false});

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      const error = new Error('Test error') as Error & {exitCode?: number};
      error.exitCode = 2;

      try {
        await command.testCatch(error);
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('outputs JSON error in JSON mode', async () => {
      stubParse(command, {json: true});

      await command.init();

      // Mock jsonEnabled to return true
      sinon.stub(command, 'jsonEnabled').returns(true);

      let writtenData = '';
      sinon.stub(process.stderr, 'write').callsFake((chunk: string | Uint8Array) => {
        writtenData += chunk.toString();
        return true;
      });

      const exitStub = sinon.stub(process, 'exit').throws(new Error('Exit called'));

      const error = new Error('Test error');

      try {
        await command.testCatch(error);
      } catch {
        // Expected
      }

      // In JSON mode, error should be written to stderr as JSON
      expect(writtenData).to.include('error');
      expect(writtenData).to.include('Test error');
      expect(exitStub.calledWith(1)).to.be.true;

      // Cleanup handled by sinon.restore() in afterEach
    });
  });
});
