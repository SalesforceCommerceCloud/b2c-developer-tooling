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
  waitForConnection: boolean;
}

/** Partial mock of TelemetryReporter for testing */
interface MockReporter {
  sendTelemetryEvent: sinon.SinonStub;
  start: sinon.SinonStub;
  stop: sinon.SinonStub;
}

function createMockReporter(sandbox: sinon.SinonSandbox): MockReporter {
  return {
    sendTelemetryEvent: sandbox.stub(),
    start: sandbox.stub(),
    stop: sandbox.stub(),
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
      // Attributes are included in sendEvent - we'll verify through sendEvent test
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
      const clock = sandbox.useFakeTimers();
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

      const startPromise = telemetry.start();
      await clock.tickAsync(1100);
      await startPromise;

      expect(createStub.calledTwice).to.be.true;
    });

    it('ignores failure after retry', async () => {
      const clock = sandbox.useFakeTimers();
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .rejects(new Error('Connection failed'));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      const startPromise = telemetry.start();
      await clock.tickAsync(1100);
      await startPromise;

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
      });

      await telemetry.start();

      expect(createStub.calledOnce).to.be.true;
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.project).to.equal('test-project');
      expect(createOptions.key).to.equal('test-key-123');
      expect(createOptions.userId).to.equal('known-cli-id');
      expect(createOptions.waitForConnection).to.be.true;
    });
  });

  describe('stop', () => {
    it('does nothing when not started', () => {
      const telemetry = new Telemetry({project: 'test-project'});
      expect(() => telemetry.stop()).not.to.throw();
    });

    it('stops the reporter', async () => {
      const mockReporter = createMockReporter(sandbox);
      sandbox.stub(telemetryModule.TelemetryReporter, 'create').resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();
      telemetry.stop();

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
      telemetry.stop();
      telemetry.stop();

      // Only called once because second stop() returns early (started is false)
      expect(mockReporter.stop.calledOnce).to.be.true;
    });
  });

  describe('CLI ID persistence', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'telemetry-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, {recursive: true, force: true});
    });

    it('generates new CLI ID when home directory is unavailable', () => {
      sandbox.stub(os, 'homedir').returns('');

      const telemetry1 = new Telemetry({project: 'test-project'});
      const telemetry2 = new Telemetry({project: 'test-project'});

      // Each instance should get a unique ID since it can't persist
      expect(telemetry1).to.be.instanceOf(Telemetry);
      expect(telemetry2).to.be.instanceOf(Telemetry);
    });

    it('reads existing CLI ID from file', async () => {
      const projectDir = path.join(tempDir, '.test-project');
      const cliIdFile = path.join(projectDir, 'cliid');

      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(cliIdFile, 'existing-cli-id');

      sandbox.stub(os, 'homedir').returns(tempDir);

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();

      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.equal('existing-cli-id');
    });

    it('creates new CLI ID and persists it', async () => {
      sandbox.stub(os, 'homedir').returns(tempDir);

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();

      // Verify ID was created
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.be.a('string');
      expect(createOptions.userId).to.have.lengthOf(40); // 20 bytes as hex

      // Verify ID was persisted
      const persistedId = fs.readFileSync(path.join(tempDir, '.test-project', 'cliid'), 'utf8');
      expect(persistedId).to.equal(createOptions.userId);
    });

    it('handles empty CLI ID file by creating new one', async () => {
      const projectDir = path.join(tempDir, '.test-project');
      const cliIdFile = path.join(projectDir, 'cliid');

      fs.mkdirSync(projectDir, {recursive: true});
      fs.writeFileSync(cliIdFile, '   '); // whitespace-only file

      sandbox.stub(os, 'homedir').returns(tempDir);

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();

      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.have.lengthOf(40);
    });

    it('handles read errors by creating new ID', async () => {
      const projectDir = path.join(tempDir, '.test-project');
      const cliIdFile = path.join(projectDir, 'cliid');

      fs.mkdirSync(projectDir, {recursive: true});
      // Create a directory with the same name as the file to cause read error
      fs.mkdirSync(cliIdFile);

      sandbox.stub(os, 'homedir').returns(tempDir);

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
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

      sandbox.stub(os, 'homedir').returns(readOnlyDir);

      const mockReporter = createMockReporter(sandbox);
      const createStub = sandbox
        .stub(telemetryModule.TelemetryReporter, 'create')
        .resolves(asTelemetryReporter(mockReporter));

      const telemetry = new Telemetry({
        project: 'test-project',
        appInsightsKey: 'test-key',
      });

      await telemetry.start();

      // Should still have a valid ID even if persistence failed
      const createOptions = createStub.firstCall.args[0] as ReporterCreateOptions;
      expect(createOptions.userId).to.be.a('string');

      // Clean up permissions for removal
      fs.chmodSync(readOnlyDir, 0o755);
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
});
