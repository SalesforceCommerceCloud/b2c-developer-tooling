/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {CloudWatchClient, PutMetricDataCommand, type StandardUnit, type MetricDatum} from '@aws-sdk/client-cloudwatch';
import {isLocal} from '../utils/utils.js';

const isRemote = (): boolean => !isLocal();

export const DEFAULT_NAMESPACE = 'ssr';

export const getDimensions = (): Record<string, string> => {
  return {
    Project: process.env.MOBIFY_PROPERTY_ID || 'UNKNOWN',
    Target: process.env.DEPLOY_TARGET || 'UNKNOWN',
  };
};

/**
 * Input metric for sending to CloudWatch.
 *
 * @property name - The name of the metric (required)
 * @property value - The numeric value of the metric (optional, defaults to 0)
 * @property timestamp - The timestamp for the metric (optional, defaults to current time)
 * @property unit - The unit for the metric (optional, defaults to 'Count')
 * @property dimensions - Key-value pairs for metric dimensions (optional)
 */
interface InputMetric {
  name: string;
  value?: number;
  timestamp?: Date;
  unit?: string;
  dimensions?: Record<string, string>;
}

/**
 * A class that handles asynchronous sending of CloudWatch metrics.
 *
 * This class uses a singleton pattern. Use MetricsSender.getSender()
 * to get the singleton instance. Metrics can be queued and sent in
 * batches, or sent immediately. The class automatically batches metrics
 * into groups of 20 (CloudWatch's limit per request).
 *
 * In local development environments, metrics are queued but not sent
 * unless the SEND_CW_METRICS environment variable is set.
 */
export class MetricsSender {
  private _CW: CloudWatchClient | null = null;
  private _queue: MetricDatum[] = [];
  static _override: boolean = false;
  private static _instance: MetricsSender | null = null;

  /** @internal Test hook: inject a CloudWatch client for unit tests */
  static _testClient: CloudWatchClient | null = null;

  private constructor() {
    // CloudWatch client used to send metrics. For a local dev server,
    // this will remain falsy, since a local dev server doesn't actually
    // send metrics (unless SEND_CW_METRICS is defined for testing).
    this._CW = null;

    // A queue of metrics waiting to be sent. Each is a single
    // name/value metric, and they accumulate on this queue
    // until batched up into a putMetricData call.
    this._queue = [];
  }

  /**
   * Return the number of metrics waiting to be sent
   * @returns {number}
   */
  get queueLength(): number {
    return this._queue.length;
  }

  /**
   * Create a CloudWatch AWS SDK client, or return a falsy value
   * if this MetricsSender is not actually sending metrics.
   *
   * The client is only created when running in a remote environment
   * (AWS Lambda) or when SEND_CW_METRICS environment variable is set.
   * The client is configured with maxAttempts: 1 to prevent retries
   * and reduce latency under high load.
   *
   * @private
   * @returns {CloudWatchClient|null} The CloudWatch client, or null if not sending metrics
   */
  private _setup(): CloudWatchClient | null {
    if (MetricsSender._testClient) {
      this._CW = MetricsSender._testClient;
      return this._CW;
    }
    /* istanbul ignore next */
    if (!this._CW && (isRemote() || MetricsSender._override)) {
      // The AWS_REGION variable is defined by the Lambda
      // environment.
      // Setting maxAttempts to 1 will prevent the SDK from retrying.
      // This is necessary because under high load, there will be backpressure
      // on the Lambda function, and causing severe performance issues (400-500ms latency)
      this._CW = new CloudWatchClient({
        region: process.env.AWS_REGION || 'us-east-1',
        maxAttempts: 1,
      });
    }
    return this._CW;
  }

  /**
   * Convert InputMetric to MetricDatum format
   *
   * @private
   * @param metric - Input metric to convert
   * @param defaultTimestamp - Default timestamp to use if not provided
   * @returns Converted metric datum
   */
  private _convertToMetricDatum(metric: InputMetric, defaultTimestamp: Date): MetricDatum {
    const metricData: MetricDatum = {
      MetricName: metric.name,
      Value: metric.value || 0,
      Timestamp: metric.timestamp instanceof Date ? metric.timestamp : defaultTimestamp,
      Unit: (metric.unit || 'Count') as StandardUnit,
    };

    if (metric.dimensions) {
      const dimensions: Array<{Name: string; Value: string}> = [];
      Object.entries(metric.dimensions).forEach(([key, value]) => {
        if (value) {
          dimensions.push({
            Name: key,
            Value: value,
          });
        }
      });
      if (dimensions.length > 0) {
        metricData.Dimensions = dimensions;
      }
    }

    return metricData;
  }

  /**
   * Send metrics to CloudWatch using putMetricData.
   *
   * Errors are caught and logged but not re-thrown. If the client
   * is null (local environment without SEND_CW_METRICS), this method
   * returns immediately without sending.
   *
   * @private
   * @param cw - CloudWatch client (may be null)
   * @param metrics - Array of MetricDatum to send
   * @returns Promise that resolves when the send operation completes (or immediately if client is null)
   */
  private async _putMetricData(cw: CloudWatchClient | null, metrics: MetricDatum[]): Promise<void> {
    /* istanbul ignore next */
    if (!cw) {
      return Promise.resolve();
    }

    try {
      const command = new PutMetricDataCommand({
        MetricData: metrics,
        Namespace: DEFAULT_NAMESPACE,
      });
      await cw.send(command);
    } catch (err) {
      console.warn(`Metrics: error sending data: ${err}`);
    }
  }

  /**
   * Batch and send metrics. Handles batching into groups of 20 (CloudWatch limit)
   * and sends them asynchronously (fire and forget). Errors are logged but not raised.
   *
   * @private
   * @param metrics - Array of metrics to send
   */
  private _sendBatchedMetrics(metrics: MetricDatum[]): void {
    if (metrics.length === 0) {
      return;
    }

    const cw = this._setup();
    const promises: Promise<void>[] = [];
    const batchSize = 20;

    for (let i = 0; i < metrics.length; i += batchSize) {
      const batch = metrics.slice(i, i + batchSize);
      promises.push(this._putMetricData(cw, batch));
    }

    // Wait for all promises to complete, log any errors but don't raise them
    Promise.all(promises).catch(
      /* istanbul ignore next */
      (err) => {
        console.warn(`Metrics: error during batch send: ${err}`);
      },
    );
  }

  /**
   * Send any queued metrics. Returns a Promise that resolves immediately
   * after starting the send operations (fire and forget). Errors are logged
   * but not raised. The queue is cleared before sending begins.
   *
   * @returns Promise that resolves immediately after starting send operations
   */
  flush(): Promise<void> {
    const metricsToSend = [...this._queue];
    this._queue = [];
    this._sendBatchedMetrics(metricsToSend);
    return Promise.resolve();
  }

  /**
   * Add one or more custom metric values to the queue of those waiting
   * to be sent, or send them immediately. This function supports simple
   * name-and-value metrics. It doesn't support more complex CloudWatch types.
   *
   * A metric is an object with at least 'name' (string) and optionally 'value'
   * (number, defaults to 0). It may also optionally include 'timestamp'
   * (defaults to the time of the call to send()), and 'unit', which
   * must be one of Seconds, Microseconds, Milliseconds, Bytes, Kilobytes,
   * Megabytes, Gigabytes, Terabytes, Bits, Kilobits, Megabits, Gigabits,
   * Terabits, Percent, Count, Bytes/Second, Kilobytes/Second,
   * Megabytes/Second, Gigabytes/Second, Terabytes/Second,
   * Bits/Second, Kilobits/Second, Megabits/Second, Gigabits/Second,
   * Terabits/Second, Count/Second or None (defaults to 'Count').
   * There may also be a 'dimensions'
   * object, which has dimension names as keys and dimension
   * values as values. Empty or falsy dimension values are filtered out.
   *
   * In a local development environment, metrics are queued but not sent
   * unless the SEND_CW_METRICS environment variable is set. This allows
   * for testing metric sending behavior locally.
   *
   * The metrics are added to an internal queue so that they can be
   * batched up to send more efficiently. They are only sent when
   * flush() is called, unless immediate is true.
   *
   * @private
   * @param metrics - Array of InputMetric objects to send
   * @param immediate - If true, send metrics immediately instead of queuing (default: false)
   */
  send(metrics: InputMetric[], immediate: boolean = false): void {
    const now = new Date();
    const metricDataArray: MetricDatum[] = metrics.map((metric) => this._convertToMetricDatum(metric, now));

    if (immediate) {
      // Send immediately without waiting (fire and forget)
      this._sendBatchedMetrics(metricDataArray);
    } else {
      // Add to queue
      this._queue.push(...metricDataArray);
    }
  }

  /**
   * Get the singleton MetricsSender instance.
   *
   * Creates a new instance if one doesn't exist, otherwise returns
   * the existing instance.
   *
   * @returns The singleton MetricsSender instance
   */
  static getSender(): MetricsSender {
    if (!MetricsSender._instance) {
      MetricsSender._instance = new MetricsSender();
    }
    return MetricsSender._instance;
  }
}

// Allow the presence of an environment variable to
// enable sending of CloudWatch metrics (for local
// integration testing)
MetricsSender._override = !!process.env.SEND_CW_METRICS;
