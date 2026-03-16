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
import appInsights from 'applicationinsights';
import {Telemetry, createTelemetry} from '@salesforce/b2c-tooling-sdk/telemetry';
import {configureLogger, resetLogger} from '@salesforce/b2c-tooling-sdk/logging';

/**
 * Stop telemetry without waiting for the real 300ms flush delay.
 * Uses fake timers to skip the setTimeout inside telemetry.stop().
 */
async function stopTelemetryFast(telemetry: InstanceType<typeof Telemetry>): Promise<void> {
  const clock = sinon.useFakeTimers();
  try {
    const p = telemetry.stop();
    await clock.tickAsync(300);
    await p;
  } finally {
    clock.restore();
  }
}

describe('telemetry/telemetry', () => {
  let sandbox: sinon.SinonSandbox;
  let trackEventStub: sinon.SinonStub;
  let trackExceptionStub: sinon.SinonStub;
  let flushStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    trackEventStub = sandbox.stub(appInsights.TelemetryClient.prototype, 'trackEvent');
    trackExceptionStub = sandbox.stub(appInsights.TelemetryClient.prototype, 'trackException');
    flushStub = sandbox
      .stub(appInsights.TelemetryClient.prototype, 'flush')
      .callsFake((opts?: {callback?: (v: string) => void}) => opts?.callback?.(''));
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
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        initialAttributes: {key: 'old'},
      });

      await telemetry.start();
      telemetry.addAttributes({key: 'new'});
      telemetry.sendEvent('TEST_EVENT');

      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.key).to.equal('new');
    });
  });

  describe('sendEvent', () => {
    it('does not throw when client is not initialized', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.sendEvent('TEST_EVENT')).not.to.throw();
    });

    it('does not throw with event attributes', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.sendEvent('TEST_EVENT', {action: 'click'})).not.to.throw();
    });

    it('sends event when client is available', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        version: '1.0.0',
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT', {action: 'click'});

      expect(trackEventStub.calledOnce).to.be.true;
      const {name, properties, measurements} = trackEventStub.firstCall.args[0];
      expect(name).to.equal('test-project/TEST_EVENT');
      expect(properties).to.include({
        action: 'click',
        version: '1.0.0',
        origin: 'test-project',
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      });
      expect(properties.sessionId).to.be.a('string');
      expect(properties.cliId).to.be.a('string');
      expect(properties.date).to.be.a('string');
      expect(properties.timestamp).to.be.a('string');
      expect(measurements.processUptime).to.be.a('number');
    });

    it('includes initial attributes in events', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        initialAttributes: {environment: 'test'},
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.environment).to.equal('test');
    });

    it('includes added attributes in events', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.addAttributes({customAttr: 'value'});
      telemetry.sendEvent('TEST_EVENT');

      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.customAttr).to.equal('value');
    });

    it('event attributes override instance attributes', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        initialAttributes: {key: 'initial'},
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT', {key: 'event'});

      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.key).to.equal('event');
    });

    it('silently catches errors during send', async () => {
      trackEventStub.throws(new Error('Send failed'));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      expect(() => telemetry.sendEvent('TEST_EVENT')).not.to.throw();
    });

    it('supports COMMAND_START event type', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        initialAttributes: {command: 'test:command'},
      });

      await telemetry.start();
      telemetry.sendEvent('COMMAND_START', {command: 'test:command'});

      const {name} = trackEventStub.firstCall.args[0];
      expect(name).to.equal('test-project/COMMAND_START');
    });

    it('supports COMMAND_SUCCESS event type with duration', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.sendEvent('COMMAND_SUCCESS', {command: 'test:command', duration: 1234});

      const {name, measurements} = trackEventStub.firstCall.args[0];
      expect(name).to.equal('test-project/COMMAND_SUCCESS');
      expect(measurements.duration).to.equal(1234);
    });

    it('supports COMMAND_ERROR event type with error details', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.sendEvent('COMMAND_ERROR', {
        command: 'scapi schemas list',
        exitCode: 1,
        duration: 100,
        errorMessage: 'OAuth client ID required.',
        errorCause: 'Missing SFCC_CLIENT_ID',
      });

      const {name, properties, measurements} = trackEventStub.firstCall.args[0];
      expect(name).to.equal('test-project/COMMAND_ERROR');
      expect(properties.command).to.equal('scapi schemas list');
      expect(measurements.exitCode).to.equal(1);
      expect(properties.errorMessage).to.equal('OAuth client ID required.');
      expect(properties.errorCause).to.equal('Missing SFCC_CLIENT_ID');
    });

    it('supports SERVER_STOPPED event type', async () => {
      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.sendEvent('SERVER_STOPPED');

      const {name} = trackEventStub.firstCall.args[0];
      expect(name).to.equal('b2c-dx-mcp/SERVER_STOPPED');
    });

    it('supports TOOL_CALLED event type', async () => {
      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.sendEvent('TOOL_CALLED', {
        toolName: 'cartridge_deploy',
        runTimeMs: 500,
        isError: false,
      });

      const {name, properties, measurements} = trackEventStub.firstCall.args[0];
      expect(name).to.equal('b2c-dx-mcp/TOOL_CALLED');
      expect(properties.toolName).to.equal('cartridge_deploy');
      expect(measurements.runTimeMs).to.equal(500);
      expect(properties.isError).to.equal('false');
    });
  });

  describe('sendException', () => {
    it('does not throw when client is not initialized', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.sendException(new Error('test error'))).not.to.throw();
    });

    it('sends exception when client is available', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        version: '1.0.0',
      });

      await telemetry.start();
      const error = new Error('test error');
      telemetry.sendException(error, {context: 'test-context'});

      expect(trackExceptionStub.calledOnce).to.be.true;
      const {exception, properties} = trackExceptionStub.firstCall.args[0];
      expect(exception).to.equal(error);
      expect(properties).to.include({
        context: 'test-context',
        version: '1.0.0',
        origin: 'test-project',
      });
    });

    it('includes initial attributes in exception', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        initialAttributes: {command: 'test-command'},
      });

      await telemetry.start();
      telemetry.sendException(new Error('test error'));

      const {properties} = trackExceptionStub.firstCall.args[0];
      expect(properties.command).to.equal('test-command');
    });

    it('silently catches errors during send', async () => {
      trackExceptionStub.throws(new Error('Send failed'));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      expect(() => telemetry.sendException(new Error('test error'))).not.to.throw();
    });

    it('includes exitCode and command in exception attributes', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        initialAttributes: {command: 'test:command'},
      });

      await telemetry.start();
      telemetry.sendException(new Error('test error'), {exitCode: 1, duration: 500});

      const {properties, measurements} = trackExceptionStub.firstCall.args[0];
      expect(measurements.exitCode).to.equal(1);
      expect(measurements.duration).to.equal(500);
      expect(properties.command).to.equal('test:command');
    });
  });

  describe('start', () => {
    it('does nothing when already started', async () => {
      const constructorSpy = sandbox.spy(appInsights, 'TelemetryClient');

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      await telemetry.start();

      // TelemetryClient constructed only once
      expect(constructorSpy.calledOnce).to.be.true;
    });

    it('does not create client when appInsightsKey is not provided', async () => {
      const constructorSpy = sandbox.spy(appInsights, 'TelemetryClient');

      const telemetry = new Telemetry({project: 'test-project'});
      await telemetry.start();

      expect(constructorSpy.called).to.be.false;
    });

    it('creates client with correct connection string', async () => {
      const constructorSpy = sandbox.spy(appInsights, 'TelemetryClient');

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=11111111-1111-1111-1111-111111111111',
      });

      await telemetry.start();

      expect(constructorSpy.calledOnce).to.be.true;
      expect(constructorSpy.firstCall.args[0]).to.equal('InstrumentationKey=11111111-1111-1111-1111-111111111111');
    });
  });

  describe('stop', () => {
    it('does nothing when not started', async () => {
      const telemetry = new Telemetry({project: 'test-project'});
      // Should not throw when stopping without starting
      await stopTelemetryFast(telemetry);
    });

    it('flushes and stops the client', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      await stopTelemetryFast(telemetry);

      expect(flushStub.calledOnce).to.be.true;
    });

    it('can be called multiple times', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      await stopTelemetryFast(telemetry);
      await stopTelemetryFast(telemetry);

      // Only called once because second stop() returns early (started is false)
      expect(flushStub.calledOnce).to.be.true;
    });
  });

  describe('flush', () => {
    it('does nothing when not started', async () => {
      const telemetry = new Telemetry({project: 'test-project'});
      // Should not throw when flushing without starting
      await telemetry.flush();
    });

    it('calls client flush', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      await telemetry.flush();

      expect(flushStub.calledOnce).to.be.true;
      expect(flushStub.firstCall.args[0]).to.have.property('callback');
    });

    it('allows sending events after flush', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.sendEvent('BEFORE_FLUSH');
      await telemetry.flush();
      telemetry.sendEvent('AFTER_FLUSH');

      // Both events should be sent
      expect(trackEventStub.calledTwice).to.be.true;
      expect(trackEventStub.firstCall.args[0].name).to.equal('test-project/BEFORE_FLUSH');
      expect(trackEventStub.secondCall.args[0].name).to.equal('test-project/AFTER_FLUSH');
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

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: tempDir,
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.cliId).to.equal('existing-cli-id');
    });

    it('creates new CLI ID and persists it to dataDir', async () => {
      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: tempDir,
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      // Verify ID was created
      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.cliId).to.be.a('string');
      expect(properties.cliId).to.have.lengthOf(40); // 20 bytes as hex

      // Verify ID was persisted
      const persistedId = fs.readFileSync(path.join(tempDir, 'cliid'), 'utf8');
      expect(persistedId).to.equal(properties.cliId);
    });

    it('handles empty CLI ID file by creating new one', async () => {
      const cliIdFile = path.join(tempDir, 'cliid');
      fs.writeFileSync(cliIdFile, '   '); // whitespace-only file

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: tempDir,
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.cliId).to.have.lengthOf(40);
    });

    it('handles read errors by creating new ID', async () => {
      const cliIdFile = path.join(tempDir, 'cliid');
      // Create a directory with the same name as the file to cause read error
      fs.mkdirSync(cliIdFile);

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: tempDir,
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      // Should still get a valid ID despite read error
      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.cliId).to.be.a('string');
    });

    it('handles write errors gracefully', async () => {
      // Make the temp directory read-only to simulate write failure
      const readOnlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readOnlyDir, {mode: 0o444});

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: readOnlyDir,
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      // Should still have a valid ID even if persistence failed
      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.cliId).to.be.a('string');

      // Clean up permissions for removal
      fs.chmodSync(readOnlyDir, 0o755);
    });

    it('creates dataDir if it does not exist', async () => {
      const nestedDir = path.join(tempDir, 'nested', 'data');

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: nestedDir,
      });

      await telemetry.start();
      telemetry.sendEvent('TEST_EVENT');

      // Verify ID was created and persisted
      const {properties} = trackEventStub.firstCall.args[0];
      expect(properties.cliId).to.be.a('string');
      expect(fs.existsSync(path.join(nestedDir, 'cliid'))).to.be.true;
    });

    it('uses same CLI ID across multiple telemetry instances with same dataDir', async () => {
      const telemetry1 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: tempDir,
      });

      await telemetry1.start();
      telemetry1.sendEvent('EVENT1');
      const cliId1 = trackEventStub.firstCall.args[0].properties.cliId;

      const telemetry2 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        dataDir: tempDir,
      });

      await telemetry2.start();
      telemetry2.sendEvent('EVENT2');
      const cliId2 = trackEventStub.secondCall.args[0].properties.cliId;

      expect(cliId1).to.equal(cliId2);
    });
  });

  describe('createTelemetry factory', () => {
    it('creates Telemetry instance with options', () => {
      const telemetry = createTelemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
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
      const telemetry1 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });
      const telemetry2 = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry1.start();
      await telemetry2.start();

      telemetry1.sendEvent('EVENT1');
      telemetry2.sendEvent('EVENT2');

      const sessionId1 = trackEventStub.firstCall.args[0].properties.sessionId;
      const sessionId2 = trackEventStub.secondCall.args[0].properties.sessionId;

      expect(sessionId1).to.be.a('string');
      expect(sessionId2).to.be.a('string');
      expect(sessionId1).to.not.equal(sessionId2);
    });
  });

  describe('debug logging (SFCC_TELEMETRY_LOG)', () => {
    let originalTelemetryLog: string | undefined;
    let tmpDir: string;

    beforeEach(() => {
      originalTelemetryLog = process.env.SFCC_TELEMETRY_LOG;
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'telemetry-log-test-'));
    });

    afterEach(() => {
      if (originalTelemetryLog !== undefined) {
        process.env.SFCC_TELEMETRY_LOG = originalTelemetryLog;
      } else {
        delete process.env.SFCC_TELEMETRY_LOG;
      }
      resetLogger();
      fs.rmSync(tmpDir, {recursive: true, force: true});
    });

    it('logs telemetry events when SFCC_TELEMETRY_LOG=true', async () => {
      process.env.SFCC_TELEMETRY_LOG = 'true';

      const logFile = path.join(tmpDir, 'log.jsonl');
      configureLogger({level: 'debug', json: true, fd: fs.openSync(logFile, 'w')});

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.addAttributes({realm: 'zzpq'});
      telemetry.sendEvent('COMMAND_START', {command: 'test'});
      telemetry.sendException(new Error('test error'));
      await stopTelemetryFast(telemetry);

      const logContent = fs.readFileSync(logFile, 'utf8');
      expect(logContent).to.include('telemetry start');
      expect(logContent).to.include('telemetry addAttributes');
      expect(logContent).to.include('telemetry sendEvent');
      expect(logContent).to.include('telemetry sendException');
      expect(logContent).to.include('telemetry stop');
    });

    it('does not log when SFCC_TELEMETRY_LOG is not set', async () => {
      delete process.env.SFCC_TELEMETRY_LOG;

      const logFile = path.join(tmpDir, 'log.jsonl');
      configureLogger({level: 'debug', json: true, fd: fs.openSync(logFile, 'w')});

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });

      await telemetry.start();
      telemetry.sendEvent('COMMAND_START');
      await stopTelemetryFast(telemetry);

      const logContent = fs.readFileSync(logFile, 'utf8');
      expect(logContent).to.not.include('telemetry');
    });
  });

  describe('integration scenarios', () => {
    it('supports full CLI command lifecycle', async () => {
      const telemetry = new Telemetry({
        project: 'b2c-cli',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        version: '1.0.0',
        initialAttributes: {command: 'code deploy'},
      });

      await telemetry.start();

      // Simulate command lifecycle
      telemetry.sendEvent('COMMAND_START', {command: 'code deploy'});

      // Simulate successful completion
      telemetry.sendEvent('COMMAND_SUCCESS', {command: 'code deploy', duration: 5000});

      await stopTelemetryFast(telemetry);

      expect(trackEventStub.calledTwice).to.be.true;
      // flush called once during stop
      expect(flushStub.calledOnce).to.be.true;
    });

    it('supports MCP server lifecycle', async () => {
      const telemetry = new Telemetry({
        project: 'b2c-dx-mcp',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
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
      await stopTelemetryFast(telemetry);

      expect(trackEventStub.callCount).to.equal(5);
      // flush called once during stop
      expect(flushStub.calledOnce).to.be.true;
    });

    it('supports error handling in CLI command', async () => {
      const telemetry = new Telemetry({
        project: 'b2c-cli',
        appInsightsKey: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
        version: '1.0.0',
        initialAttributes: {command: 'code deploy'},
      });

      await telemetry.start();

      // Simulate command start
      telemetry.sendEvent('COMMAND_START', {command: 'code deploy'});

      // Simulate error
      const error = new Error('Connection refused');
      telemetry.sendException(error, {exitCode: 1, duration: 1000});

      await stopTelemetryFast(telemetry);

      expect(trackEventStub.calledOnce).to.be.true;
      expect(trackExceptionStub.calledOnce).to.be.true;
      // flush called once during stop
      expect(flushStub.calledOnce).to.be.true;
    });
  });
});
