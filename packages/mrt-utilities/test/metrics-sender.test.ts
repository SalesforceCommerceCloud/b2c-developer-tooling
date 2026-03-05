/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {CloudWatchClient} from '@aws-sdk/client-cloudwatch';
import {MetricsSender} from '@salesforce/mrt-utilities';

describe('MetricsSender', () => {
  let mockSend: sinon.SinonStub;
  let mockCloudWatchClient: CloudWatchClient;
  let originalEnv: NodeJS.ProcessEnv;
  let originalSendCwMetrics: string | undefined;

  beforeEach(() => {
    originalEnv = {...process.env};
    originalSendCwMetrics = process.env.SEND_CW_METRICS;

    (MetricsSender as unknown as {_instance: MetricsSender | null})._instance = null;
    MetricsSender._override = false;
    MetricsSender._testClient = null;

    mockSend = sinon.stub().resolves({});
    mockCloudWatchClient = {send: mockSend} as unknown as CloudWatchClient;
    MetricsSender._testClient = mockCloudWatchClient;

    process.env.SEND_CW_METRICS = 'true';
    MetricsSender._override = true;
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalSendCwMetrics !== undefined) {
      process.env.SEND_CW_METRICS = originalSendCwMetrics;
    } else {
      delete process.env.SEND_CW_METRICS;
    }

    (MetricsSender as unknown as {_instance: MetricsSender | null})._instance = null;
    MetricsSender._override = false;
    MetricsSender._testClient = null;
    sinon.restore();
  });

  describe('getSender', () => {
    it('returns singleton instance', () => {
      const instance1 = MetricsSender.getSender();
      const instance2 = MetricsSender.getSender();

      expect(instance1).to.equal(instance2);
    });

    it('creates new instance if none exists', () => {
      const instance = MetricsSender.getSender();

      expect(instance).to.be.an.instanceOf(MetricsSender);
    });
  });

  describe('queueLength', () => {
    it('returns 0 for empty queue', () => {
      const sender = MetricsSender.getSender();

      expect(sender.queueLength).to.equal(0);
    });

    it('returns correct queue length after adding metrics', () => {
      const sender = MetricsSender.getSender();

      sender.send([
        {name: 'metric1', value: 1},
        {name: 'metric2', value: 2},
      ]);

      expect(sender.queueLength).to.equal(2);
    });
  });

  describe('send', () => {
    it('queues metrics when immediate is false', () => {
      const sender = MetricsSender.getSender();

      sender.send([{name: 'test-metric', value: 42}]);

      expect(sender.queueLength).to.equal(1);
      expect(mockSend.called).to.be.false;
    });

    it('queues metrics by default', () => {
      const sender = MetricsSender.getSender();

      sender.send([{name: 'test-metric', value: 42}]);

      expect(sender.queueLength).to.equal(1);
    });

    it('sends metrics immediately when immediate is true', async () => {
      const sender = MetricsSender.getSender();

      sender.send([{name: 'test-metric', value: 42}], true);

      expect(sender.queueLength).to.equal(0);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend.called).to.be.true;
    });

    it('converts InputMetric to MetricDatum format', async () => {
      const sender = MetricsSender.getSender();
      const timestamp = new Date('2024-01-01T00:00:00Z');
      sender.send(
        [
          {
            name: 'test-metric',
            value: 100,
            timestamp,
            unit: 'Count',
            dimensions: {env: 'test', version: '1.0'},
          },
        ],
        true,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend.called).to.be.true;
      const callArg = mockSend.firstCall.args[0];
      expect(callArg.input).to.deep.include({
        MetricData: [
          {
            MetricName: 'test-metric',
            Value: 100,
            Timestamp: timestamp,
            Unit: 'Count',
            Dimensions: [
              {Name: 'env', Value: 'test'},
              {Name: 'version', Value: '1.0'},
            ],
          },
        ],
        Namespace: 'ssr',
      });
    });

    it('uses default value of 0 when value is not provided', async () => {
      const sender = MetricsSender.getSender();

      sender.send([{name: 'test-metric'}], true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend.called).to.be.true;
      const callArg = mockSend.firstCall.args[0];
      expect(callArg.input.MetricData[0].Value).to.equal(0);
    });

    it('uses default unit "Count" when not provided', async () => {
      const sender = MetricsSender.getSender();

      sender.send([{name: 'test-metric', value: 1}], true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend.called).to.be.true;
      const callArg = mockSend.firstCall.args[0];
      expect(callArg.input.MetricData[0].Unit).to.equal('Count');
    });

    it('filters out empty dimension values', async () => {
      const sender = MetricsSender.getSender();

      sender.send(
        [
          {
            name: 'test-metric',
            value: 1,
            dimensions: {
              env: 'test',
              empty: '',
              nullValue: null as unknown as string,
              undefinedValue: undefined as unknown as string,
            },
          },
        ],
        true,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend.called).to.be.true;
      const callArg = mockSend.firstCall.args[0];
      expect(callArg.input.MetricData[0].Dimensions).to.deep.equal([{Name: 'env', Value: 'test'}]);
    });

    it('handles multiple metrics', () => {
      const sender = MetricsSender.getSender();

      sender.send([
        {name: 'metric1', value: 1},
        {name: 'metric2', value: 2},
        {name: 'metric3', value: 3},
      ]);

      expect(sender.queueLength).to.equal(3);
    });
  });

  describe('flush', () => {
    it('returns a Promise', () => {
      const sender = MetricsSender.getSender();

      const result = sender.flush();

      expect(result).to.be.an.instanceOf(Promise);
    });

    it('clears queue after flush', async () => {
      const sender = MetricsSender.getSender();

      sender.send([
        {name: 'metric1', value: 1},
        {name: 'metric2', value: 2},
      ]);

      expect(sender.queueLength).to.equal(2);

      await sender.flush();

      expect(sender.queueLength).to.equal(0);
    });

    it('sends queued metrics', async () => {
      const sender = MetricsSender.getSender();

      sender.send([
        {name: 'metric1', value: 1},
        {name: 'metric2', value: 2},
      ]);

      await sender.flush();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend.called).to.be.true;
    });

    it('handles empty queue', async () => {
      const sender = MetricsSender.getSender();

      await sender.flush();
    });
  });

  describe('batching', () => {
    it('batches metrics into groups of 20', async () => {
      const sender = MetricsSender.getSender();

      const metrics = Array.from({length: 45}, (_, i) => ({
        name: `metric${i}`,
        value: i,
      }));

      sender.send(metrics, true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSend.callCount).to.equal(3);
      expect(mockSend.firstCall.args[0].input.MetricData).to.have.length(20);
      expect(mockSend.secondCall.args[0].input.MetricData).to.have.length(20);
      expect(mockSend.thirdCall.args[0].input.MetricData).to.have.length(5);
    });
  });

  describe('error handling', () => {
    it('logs errors but does not throw when sending fails', async () => {
      const sender = MetricsSender.getSender();
      const consoleWarnStub = sinon.stub(console, 'warn');

      const error = new Error('CloudWatch error');
      mockSend.rejects(error);

      sender.send([{name: 'test-metric', value: 1}], true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarnStub.calledWith(sinon.match('Metrics: error sending data:'))).to.be.true;
    });

    it('does not throw when flush encounters errors', async () => {
      const sender = MetricsSender.getSender();
      sinon.stub(console, 'warn');

      mockSend.rejects(new Error('CloudWatch error'));

      sender.send([{name: 'test-metric', value: 1}]);

      await sender.flush();
    });
  });

  describe('_override', () => {
    it('respects SEND_CW_METRICS environment variable', () => {
      process.env.SEND_CW_METRICS = 'true';
      MetricsSender._override = !!process.env.SEND_CW_METRICS;

      expect(MetricsSender._override).to.equal(true);
    });

    it('is false when SEND_CW_METRICS is not set', () => {
      delete process.env.SEND_CW_METRICS;
      MetricsSender._override = !!process.env.SEND_CW_METRICS;

      expect(MetricsSender._override).to.equal(false);
    });
  });
});
