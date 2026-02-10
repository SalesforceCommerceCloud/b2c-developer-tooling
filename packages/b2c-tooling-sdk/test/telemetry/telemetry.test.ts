/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {TelemetryReporter} from '@salesforce/telemetry';
import * as telemetryModule from '@salesforce/telemetry';
import {Telemetry, createTelemetry} from '@salesforce/b2c-tooling-sdk/telemetry';

/** Type for TelemetryReporter.create options */
interface ReporterCreateOptions {
  project: string;
  key: string;
  userId: string;
}

/** Partial mock of TelemetryReporter for testing */
interface MockReporter {
  sendTelemetryEvent: sinon.SinonStub;
  sendTelemetryException: sinon.SinonStub;
  start: sinon.SinonStub;
  stop: sinon.SinonStub;
  flush: sinon.SinonStub;
  getTelemetryClient: sinon.SinonStub;
}

function createMockReporter(sandbox: sinon.SinonSandbox): MockReporter {
  const mockClient = {
    flush: sandbox.stub().callsFake((opts?: {callback?: () => void}) => opts?.callback?.()),
  };
  return {
    sendTelemetryEvent: sandbox.stub(),
    sendTelemetryException: sandbox.stub(),
    start: sandbox.stub(),
    stop: sandbox.stub(),
    flush: sandbox.stub().resolves(),
    getTelemetryClient: sandbox.stub().returns(mockClient),
  };
}

/** Cast mock reporter to TelemetryReporter for stub resolution */
function asTelemetryReporter(mock: MockReporter): TelemetryReporter {
  return mock as unknown as TelemetryReporter;
}

describe('telemetry/telemetry', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Telemetry.isDisabled()', () => {
    let originalSfDisable: string | undefined;
    let originalSfccDisable: string | undefined;

    beforeEach(() => {
      originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
      originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
      delete process.env.SF_DISABLE_TELEMETRY;
      delete process.env.SFCC_DISABLE_TELEMETRY;
    });

    afterEach(() => {
      if (originalSfDisable !== undefined) {
        process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
      } else {
        delete process.env.SF_DISABLE_TELEMETRY;
      }
      if (originalSfccDisable !== undefined) {
        process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
      } else {
        delete process.env.SFCC_DISABLE_TELEMETRY;
      }
    });

    it('returns false when no disable env vars are set', () => {
      expect(Telemetry.isDisabled()).to.be.false;
    });

    it('returns true when SF_DISABLE_TELEMETRY=true', () => {
      process.env.SF_DISABLE_TELEMETRY = 'true';
      expect(Telemetry.isDisabled()).to.be.true;
    });

    it('returns true when SFCC_DISABLE_TELEMETRY=true', () => {
      process.env.SFCC_DISABLE_TELEMETRY = 'true';
      expect(Telemetry.isDisabled()).to.be.true;
    });

    it('returns false when SF_DISABLE_TELEMETRY=false', () => {
      process.env.SF_DISABLE_TELEMETRY = 'false';
      expect(Telemetry.isDisabled()).to.be.false;
    });

    it('returns false when SFCC_DISABLE_TELEMETRY=false', () => {
      process.env.SFCC_DISABLE_TELEMETRY = 'false';
      expect(Telemetry.isDisabled()).to.be.false;
    });

    it('returns false when only SFCC_DISABLE_TELEMETRY=false and SF_DISABLE_TELEMETRY is unset (e.g. mcp.json)', () => {
      process.env.SFCC_DISABLE_TELEMETRY = 'false';
      delete process.env.SF_DISABLE_TELEMETRY;
      expect(Telemetry.isDisabled()).to.be.false;
    });

    it('returns false when only SF_DISABLE_TELEMETRY=false and SFCC_DISABLE_TELEMETRY is unset', () => {
      process.env.SF_DISABLE_TELEMETRY = 'false';
      delete process.env.SFCC_DISABLE_TELEMETRY;
      expect(Telemetry.isDisabled()).to.be.false;
    });

    it('returns true when both disable vars are set to true', () => {
      process.env.SF_DISABLE_TELEMETRY = 'true';
      process.env.SFCC_DISABLE_TELEMETRY = 'true';
      expect(Telemetry.isDisabled()).to.be.true;
    });

    it('returns true when SF is true and SFCC is false', () => {
      process.env.SF_DISABLE_TELEMETRY = 'true';
      process.env.SFCC_DISABLE_TELEMETRY = 'false';
      expect(Telemetry.isDisabled()).to.be.true;
    });

    it('returns true when SF is false and SFCC is true', () => {
      process.env.SF_DISABLE_TELEMETRY = 'false';
      process.env.SFCC_DISABLE_TELEMETRY = 'true';
      expect(Telemetry.isDisabled()).to.be.true;
    });
  });

  describe('Telemetry.getConnectionString()', () => {
    let originalSfDisable: string | undefined;
    let originalSfccDisable: string | undefined;
    let originalAppInsightsKey: string | undefined;

    beforeEach(() => {
      originalSfDisable = process.env.SF_DISABLE_TELEMETRY;
      originalSfccDisable = process.env.SFCC_DISABLE_TELEMETRY;
      originalAppInsightsKey = process.env.SFCC_APP_INSIGHTS_KEY;
      delete process.env.SF_DISABLE_TELEMETRY;
      delete process.env.SFCC_DISABLE_TELEMETRY;
      delete process.env.SFCC_APP_INSIGHTS_KEY;
    });

    afterEach(() => {
      if (originalSfDisable !== undefined) {
        process.env.SF_DISABLE_TELEMETRY = originalSfDisable;
      } else {
        delete process.env.SF_DISABLE_TELEMETRY;
      }
      if (originalSfccDisable !== undefined) {
        process.env.SFCC_DISABLE_TELEMETRY = originalSfccDisable;
      } else {
        delete process.env.SFCC_DISABLE_TELEMETRY;
      }
      if (originalAppInsightsKey !== undefined) {
        process.env.SFCC_APP_INSIGHTS_KEY = originalAppInsightsKey;
      } else {
        delete process.env.SFCC_APP_INSIGHTS_KEY;
      }
    });

    it('returns undefined when telemetry is disabled via SF_DISABLE_TELEMETRY', () => {
      process.env.SF_DISABLE_TELEMETRY = 'true';
      expect(Telemetry.getConnectionString('project-default')).to.be.undefined;
    });

    it('returns undefined when telemetry is disabled via SFCC_DISABLE_TELEMETRY', () => {
      process.env.SFCC_DISABLE_TELEMETRY = 'true';
      expect(Telemetry.getConnectionString('project-default')).to.be.undefined;
    });

    it('returns project default when no env override', () => {
      expect(Telemetry.getConnectionString('project-default')).to.equal('project-default');
    });

    it('returns env override when SFCC_APP_INSIGHTS_KEY is set', () => {
      process.env.SFCC_APP_INSIGHTS_KEY = 'env-override';
      expect(Telemetry.getConnectionString('project-default')).to.equal('env-override');
    });

    it('returns undefined when no project default and no env override', () => {
      expect(Telemetry.getConnectionString()).to.be.undefined;
    });

    it('returns env override even without project default', () => {
      process.env.SFCC_APP_INSIGHTS_KEY = 'env-override';
      expect(Telemetry.getConnectionString()).to.equal('env-override');
    });

    it('returns undefined when disabled even with env override set', () => {
      process.env.SF_DISABLE_TELEMETRY = 'true';
      process.env.SFCC_APP_INSIGHTS_KEY = 'env-override';
      expect(Telemetry.getConnectionString('project-default')).to.be.undefined;
    });
  });

  describe('Telemetry constructor', () => {
    it('creates instance with minimal options', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('creates instance with all options', () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        version: '1.2.3',
        initialAttributes: {env: 'test'},
        dataDir: '/tmp/test-data',
      });
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('defaults version to 0.0.0 when not provided', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('initializes with empty attributes when not provided', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });
  });

  describe('addAttributes', () => {
    it('adds single attribute', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      telemetry.addAttributes({key: 'value'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('adds multiple attributes', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      telemetry.addAttributes({key1: 'value1', key2: 'value2'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('merges with existing attributes', () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        initialAttributes: {initial: 'value'},
      });
      telemetry.addAttributes({added: 'new'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('overwrites existing attributes with same key', () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        initialAttributes: {key: 'old'},
      });
      telemetry.addAttributes({key: 'new'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('verifies overwritten attributes are sent in events', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        initialAttributes: {key: 'old'},
      });

      await telemetry.start();
      telemetry.addAttributes({key: 'new'});
      telemetry.sendEvent('TEST_EVENT');

      const [, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventProps.key).to.equal('new');
    });
  });

  describe('sendEvent', () => {
    it('does not throw when reporter is not initialized', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.sendEvent('TEST_EVENT')).not.to.throw();
    });

    it('does not throw with event attributes', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.sendEvent('TEST_EVENT', {action: 'click'})).not.to.throw();
    });

    it('sends event when reporter is available', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        version: '1.0.0',
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT', {action: 'click'});

      expect(mockReporter.sendTelemetryEvent.calledOnce).to.be.true;
      const [eventName, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventName).to.equal('TEST_EVENT');
      expect(eventProps).to.include({
        action: 'click',
        version: '1.0.0',
        origin: 'test-project',
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      });
      expect(eventProps.sessionId).to.be.a('string');
      expect(eventProps.cliId).to.be.a('string');
      expect(eventProps.date).to.be.a('string');
      expect(eventProps.timestamp).to.be.a('string');
      expect(eventProps.processUptime).to.be.a('number');
    });

    it('includes initial attributes in events', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        initialAttributes: {environment: 'test'},
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      const [, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventProps.environment).to.equal('test');
    });

    it('includes added attributes in events', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      telemetry.addAttributes({customAttr: 'value'});
      telemetry.sendEvent('TEST_EVENT');

      const [, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventProps.customAttr).to.equal('value');
    });

    it('event attributes override instance attributes', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        initialAttributes: {key: 'initial'},
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT', {key: 'event'});

      const [, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventProps.key).to.equal('event');
    });

    it('silently catches errors during send', async () => {
      const mockReporter = createMockReporter(sandbox);
      mockReporter.sendTelemetryEvent.throws(new Error('Send failed'));
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      expect(() => telemetry.sendEvent('TEST_EVENT')).not.to.throw();
    });

    it('supports COMMAND_START event type', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        initialAttributes: {command: 'test:command'},
      });

      await telemetry.start();
      telemetry.sendEvent('COMMAND_START', {command: 'test:command'});

      const [eventName] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventName).to.equal('COMMAND_START');
    });

    it('supports COMMAND_SUCCESS event type with duration', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      telemetry.sendEvent('COMMAND_SUCCESS', {command: 'test:command', duration: 1234});

      const [eventName, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventName).to.equal('COMMAND_SUCCESS');
      expect(eventProps.duration).to.equal(1234);
    });

    it('supports SERVER_STOPPED event type', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      telemetry.sendEvent('SERVER_STOPPED');

      const [eventName] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventName).to.equal('SERVER_STOPPED');
    });

    it('supports TOOL_CALLED event type', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      telemetry.sendEvent('TOOL_CALLED', {
        toolName: 'cartridge_deploy',
        runTimeMs: 500,
        isError: false,
      });

      const [eventName, eventProps] = mockReporter.sendTelemetryEvent.firstCall.args;
      expect(eventName).to.equal('TOOL_CALLED');
      expect(eventProps.toolName).to.equal('cartridge_deploy');
      expect(eventProps.runTimeMs).to.equal(500);
      expect(eventProps.isError).to.equal(false);
    });
  });

  describe('sendException', () => {
    it('does not throw when reporter is not initialized', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.sendException(new Error('test error'))).not.to.throw();
    });

    it('sends exception when reporter is available', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        version: '1.0.0',
      });

      await telemetry.start();
      const error = new Error('test error');
      telemetry.sendException(error, {context: 'test-context'});

      expect(mockReporter.sendTelemetryException.calledOnce).to.be.true;
      const [sentError, properties] = mockReporter.sendTelemetryException.firstCall.args;
      expect(sentError).to.equal(error);
      expect(properties).to.include({
        context: 'test-context',
        version: '1.0.0',
        origin: 'test-project',
      });
    });

    it('includes initial attributes in exception', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        initialAttributes: {command: 'test-command'},
      });

      await telemetry.start();
      telemetry.sendException(new Error('test error'));

      const [, properties] = mockReporter.sendTelemetryException.firstCall.args;
      expect(properties.command).to.equal('test-command');
    });

    it('silently catches errors during send', async () => {
      const mockReporter = createMockReporter(sandbox);
      mockReporter.sendTelemetryException.throws(new Error('Send failed'));
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      expect(() => telemetry.sendException(new Error('test error'))).not.to.throw();
    });

    it('includes exitCode and command in exception attributes', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        initialAttributes: {command: 'test:command'},
      });

      await telemetry.start();
      telemetry.sendException(new Error('test error'), {exitCode: 1, duration: 500});

      const [, properties] = mockReporter.sendTelemetryException.firstCall.args;
      expect(properties.exitCode).to.equal(1);
      expect(properties.duration).to.equal(500);
      expect(properties.command).to.equal('test:command');
    });
  });

  describe('start', () => {
    it('does nothing when already started', async () => {
      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      await telemetry.start();

      expect(createStub.calledOnce).to.be.true;
    });

    it('does not create reporter when appInsightsKey is not provided', async () => {
      const createStub = sandbox.stub(telemetryModule.TelemetryReporter, 'create');

      const telemetry = new Telemetry({project: 'test-project'});
      await telemetry.start();

      expect(createStub.called).to.be.false;
    });

    it('retries once on initial failure', async () => {
      const mockReporter = createMockReporter(sandbox);

      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .onFirstCall()
        .rejects(new Error('Connection failed'))
        .onSecondCall()
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();

      expect(createStub.calledTwice).to.be.true;
    });

    it('ignores failure after retry', async () => {
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .rejects(new Error('Connection failed'));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();

      expect(createStub.calledTwice).to.be.true;
    });

    it('creates reporter with correct options', async () => {
      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      // Mock fs to return a known CLI ID
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFileSync').returns('known-cli-id');

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key-123',
        dataDir: '/tmp/test-data',
      });

      await telemetry.start();

      expect(createStub.calledOnce).to.be.true;
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.project).to.equal('test-project');
      expect(createOptions.key).to.equal('test-key-123');
      expect(createOptions.userId).to.equal('known-cli-id');
    });
  });

  describe('stop', () => {
    it('does nothing when not started', async () => {
      const telemetry = new Telemetry({project: 'test-project'});
      // Should not throw when stopping without starting
      await telemetry.stop();
    });

    it('stops the reporter', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      await telemetry.stop();

      expect(mockReporter.stop.calledOnce).to.be.true;
    });

    it('can be called multiple times', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      await telemetry.stop();
      await telemetry.stop();

      // Only called once because second stop() returns early (started is false)
      expect(mockReporter.stop.calledOnce).to.be.true;
    });
  });

  describe('flush', () => {
    it('does nothing when not started', async () => {
      const telemetry = new Telemetry({project: 'test-project'});
      // Should not throw when flushing without starting
      await telemetry.flush();
    });

    it('calls native reporter.flush() and App Insights client flush', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      await telemetry.flush();

      expect(mockReporter.flush.calledOnce).to.be.true;
      expect(mockReporter.getTelemetryClient.calledOnce).to.be.true;
      const client = mockReporter.getTelemetryClient.firstCall.returnValue;
      expect(client.flush.calledOnce).to.be.true;
      expect(client.flush.firstCall.args[0]).to.have.property('callback');
    });

    it('allows sending events after flush', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      telemetry.sendEvent('BEFORE_FLUSH');
      await telemetry.flush();
      telemetry.sendEvent('AFTER_FLUSH');

      // Both events should be sent
      expect(mockReporter.sendTelemetryEvent.calledTwice).to.be.true;
      expect(mockReporter.sendTelemetryEvent.firstCall.args[0]).to.equal('BEFORE_FLUSH');
      expect(mockReporter.sendTelemetryEvent.secondCall.args[0]).to.equal('AFTER_FLUSH');
    });
  });

  describe('CLI ID persistence with dataDir', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'telemetry-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, {recursive: true, force: true});
    });

    it('generates random ID when dataDir is not provided', () => {
      const telemetry1 = new Telemetry({project: 'test-project'});
      const telemetry2 = new Telemetry({project: 'test-project'});

      // Each instance should get a unique ID since it can't persist
      expect(telemetry1).to.be.instanceOf(Telemetry);
      expect(telemetry2).to.be.instanceOf(Telemetry);
    });

    it('reads existing CLI ID from dataDir', async () => {
      const cliIdFile = path.join(tempDir, 'cliid');
      fs.writeFileSync(cliIdFile, 'existing-cli-id');

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: tempDir,
      });

      await telemetry.start();

      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.equal('existing-cli-id');
    });

    it('creates new CLI ID and persists it to dataDir', async () => {
      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: tempDir,
      });

      await telemetry.start();

      // Verify ID was created
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.be.a('string');
      expect(createOptions.userId).to.have.lengthOf(40); // 20 bytes as hex

      // Verify ID was persisted
      const persistedId = fs.readFileSync(path.join(tempDir, 'cliid'), 'utf8');
      expect(persistedId).to.equal(createOptions.userId);
    });

    it('handles empty CLI ID file by creating new one', async () => {
      const cliIdFile = path.join(tempDir, 'cliid');
      fs.writeFileSync(cliIdFile, '   '); // whitespace-only file

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: tempDir,
      });

      await telemetry.start();

      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.have.lengthOf(40);
    });

    it('handles read errors by creating new ID', async () => {
      const cliIdFile = path.join(tempDir, 'cliid');
      // Create a directory with the same name as the file to cause read error
      fs.mkdirSync(cliIdFile);

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: tempDir,
      });

      await telemetry.start();

      // Should still get a valid ID despite read error
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.be.a('string');
    });

    it('handles write errors gracefully', async () => {
      // Make the temp directory read-only to simulate write failure
      const readOnlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readOnlyDir, {mode: 0o444});

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: readOnlyDir,
      });

      await telemetry.start();

      // Should still have a valid ID even if persistence failed
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.be.a('string');

      // Clean up permissions for removal
      fs.chmodSync(readOnlyDir, 0o755);
    });

    it('creates dataDir if it does not exist', async () => {
      const nestedDir = path.join(tempDir, 'nested', 'data');

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: nestedDir,
      });

      await telemetry.start();

      // Verify ID was created and persisted
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.be.a('string');
      expect(fs.existsSync(path.join(nestedDir, 'cliid'))).to.be.true;
    });

    it('uses same CLI ID across multiple telemetry instances with same dataDir', async () => {
      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry1 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: tempDir,
      });

      await telemetry1.start();
      const userId1 = (createStub.firstCall.args[0] as ReporterCreateOptions).userId;

      const telemetry2 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        dataDir: tempDir,
      });

      await telemetry2.start();
      const userId2 = (createStub.secondCall.args[0] as ReporterCreateOptions).userId;

      expect(userId1).to.equal(userId2);
    });
  });

  describe('createTelemetry factory', () => {
    it('creates Telemetry instance with options', () => {
      const telemetry = createTelemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
        version: '1.0.0',
      });
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('creates Telemetry instance with minimal options', () => {
      const telemetry = createTelemetry({project: 'test-project'});
      expect(telemetry).to.be.instanceOf(Telemetry);
    });

    it('creates Telemetry instance with dataDir', () => {
      const telemetry = createTelemetry({
        project: 'test-project',
        dataDir: '/tmp/test-data',
      });
      expect(telemetry).to.be.instanceOf(Telemetry);
    });
  });

  describe('session ID uniqueness', () => {
    it('generates unique session IDs per instance', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry1 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });
      const telemetry2 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry1.start();
      await telemetry2.start();

      telemetry1.sendEvent('EVENT1');
      telemetry2.sendEvent('EVENT2');

      const stub = mockReporter.sendTelemetryEvent as sinon.SinonStub;
      const sessionId1 = stub.firstCall.args[1].sessionId;
      const sessionId2 = stub.secondCall.args[1].sessionId;

      expect(sessionId1).to.be.a('string');
      expect(sessionId2).to.be.a('string');
      expect(sessionId1).to.not.equal(sessionId2);
    });
  });

  describe('integration scenarios', () => {
    it('supports full CLI command lifecycle', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'b2c-cli',
        appInsightsKey: 'test-key',
        version: '1.0.0',
        initialAttributes: {command: 'code deploy'},
      });

      await telemetry.start();

      // Simulate command lifecycle
      telemetry.sendEvent('COMMAND_START', {command: 'code deploy'});

      // Simulate successful completion
      telemetry.sendEvent('COMMAND_SUCCESS', {command: 'code deploy', duration: 5000});

      await telemetry.stop();

      expect(mockReporter.sendTelemetryEvent.calledTwice).to.be.true;
      expect(mockReporter.stop.calledOnce).to.be.true;
    });

    it('supports MCP server lifecycle', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'test-key',
        version: '1.0.0',
        initialAttributes: {toolsets: 'MRT, CARTRIDGES'},
      });

      await telemetry.start();

      // Simulate server lifecycle
      telemetry.sendEvent('COMMAND_START', {command: 'mcp'});
      telemetry.sendEvent('SERVER_STATUS', {status: 'started'});

      // Simulate tool calls
      telemetry.sendEvent('TOOL_CALLED', {toolName: 'cartridge_deploy', runTimeMs: 500, isError: false});
      telemetry.sendEvent('TOOL_CALLED', {toolName: 'mrt_bundle_push', runTimeMs: 3000, isError: false});

      // Simulate shutdown
      telemetry.sendEvent('SERVER_STOPPED');
      await telemetry.stop();

      expect(mockReporter.sendTelemetryEvent.callCount).to.equal(5);
      expect(mockReporter.stop.calledOnce).to.be.true;
    });

    it('supports error handling in CLI command', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'b2c-cli',
        appInsightsKey: 'test-key',
        version: '1.0.0',
        initialAttributes: {command: 'code deploy'},
      });

      await telemetry.start();

      // Simulate command start
      telemetry.sendEvent('COMMAND_START', {command: 'code deploy'});

      // Simulate error
      const error = new Error('Connection refused');
      telemetry.sendException(error, {exitCode: 1, duration: 1000});

      await telemetry.stop();

      expect(mockReporter.sendTelemetryEvent.calledOnce).to.be.true;
      expect(mockReporter.sendTelemetryException.calledOnce).to.be.true;
      expect(mockReporter.stop.calledOnce).to.be.true;
    });
  });
});
