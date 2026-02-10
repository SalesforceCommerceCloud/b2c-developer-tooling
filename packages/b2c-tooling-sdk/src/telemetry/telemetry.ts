/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {TelemetryReporter} from '@salesforce/telemetry';
import type {TelemetryAttributes, TelemetryEventProperties, TelemetryOptions} from './types.js';

const generateRandomId = (): string => randomBytes(20).toString('hex');

/**
 * Redact connection string for debug logging (InstrumentationKey=first8...last4).
 */
function redactConnectionString(connectionString: string): string {
  const match = connectionString.match(/InstrumentationKey=([^;]+)/);
  if (!match) return 'InstrumentationKey=***';
  const key = match[1];
  if (key.length <= 12) return 'InstrumentationKey=***';
  return `InstrumentationKey=${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * Sanitize attributes to only include string, number, boolean (App Insights–safe).
 * Aligns with sf CLI telemetry record() validation.
 */
function sanitizeAttributes(attributes: TelemetryAttributes): TelemetryAttributes {
  const out: TelemetryAttributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Get the path to the persistent CLI ID file.
 * @param dataDir - oclif dataDir for persistent storage
 */
const getCliIdPath = (dataDir?: string): string | null => {
  if (!dataDir) return null;
  return path.join(dataDir, 'cliid');
};

/**
 * Read or create a persistent CLI ID.
 * @param dataDir - oclif dataDir for persistent storage
 */
const readOrCreateCliId = (dataDir?: string): string => {
  const filePath = getCliIdPath(dataDir);
  if (!filePath) return generateRandomId();

  // Try to read existing ID
  try {
    if (fs.existsSync(filePath)) {
      const value = fs.readFileSync(filePath, 'utf8');
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
  } catch {
    // Fall through to create new
  }

  // Create new ID
  const newId = generateRandomId();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true, mode: 0o700});
    }
    fs.writeFileSync(filePath, newId, {encoding: 'utf8', mode: 0o600});
  } catch {
    // If we can't persist, still return the generated id
  }
  return newId;
};

/**
 * Custom TelemetryReporter that always enables telemetry.
 * Gating is handled at the instantiation site.
 */
class ConfigurableTelemetryReporter extends TelemetryReporter {
  override isSfdxTelemetryEnabled(): boolean {
    return true;
  }
}

/**
 * Telemetry client for sending events to Application Insights.
 *
 * @example
 * ```typescript
 * const telemetry = new Telemetry({
 *   project: 'my-app',
 *   appInsightsKey: 'InstrumentationKey=...',
 *   version: '1.0.0',
 *   dataDir: '/path/to/data',
 * });
 *
 * await telemetry.start();
 * telemetry.sendEvent('USER_ACTION', { action: 'click' });
 * telemetry.stop();
 * ```
 */
export class Telemetry {
  private attributes: TelemetryAttributes;
  private cliId: string;
  private project: string;
  private reporter: TelemetryReporter | undefined;
  private sessionId: string;
  private started: boolean;
  private version: string;
  private appInsightsKey: string | undefined;

  /**
   * Check if telemetry is disabled via environment variables.
   * Supports both SF_DISABLE_TELEMETRY (sf CLI standard) and SFCC_DISABLE_TELEMETRY.
   */
  static isDisabled(): boolean {
    return process.env.SF_DISABLE_TELEMETRY === 'true' || process.env.SFCC_DISABLE_TELEMETRY === 'true';
  }

  /**
   * Get the connection string for telemetry, respecting disable flags and env overrides.
   * @param projectDefault - Default connection string from project config (e.g., package.json)
   * @returns Connection string to use, or undefined if telemetry should be disabled
   */
  static getConnectionString(projectDefault?: string): string | undefined {
    if (Telemetry.isDisabled()) return undefined;
    return process.env.SFCC_APP_INSIGHTS_KEY ?? projectDefault;
  }

  constructor(options: TelemetryOptions) {
    this.project = options.project;
    this.appInsightsKey = options.appInsightsKey;
    this.attributes = {...(options.initialAttributes ?? {})};
    this.cliId = readOrCreateCliId(options.dataDir);
    this.reporter = undefined;
    this.sessionId = generateRandomId();
    this.started = false;
    this.version = options.version ?? '0.0.0';
  }

  /**
   * Add additional attributes to include with all future events.
   */
  addAttributes(attributes: TelemetryAttributes): void {
    this.attributes = {...this.attributes, ...attributes};
  }

  /**
   * Send a telemetry event.
   *
   * @param eventName - Name of the event (e.g., 'SERVER_STATUS', 'TOOL_CALLED')
   * @param attributes - Event-specific attributes (only string/number/boolean are sent)
   */
  sendEvent(eventName: string, attributes: TelemetryAttributes = {}): void {
    try {
      const name = eventName?.trim() || 'UNKNOWN';
      const eventProperties = this.buildEventProperties(attributes);
      this.reporter?.sendTelemetryEvent(name, eventProperties);
    } catch {
      // ignore send errors
    }
  }

  /**
   * Send an exception to telemetry.
   *
   * @param error - The error to report
   * @param attributes - Additional attributes to include with the exception
   */
  sendException(error: Error, attributes: TelemetryAttributes = {}): void {
    try {
      const properties = this.buildEventProperties(sanitizeAttributes(attributes));
      this.reporter?.sendTelemetryException(error, properties);
    } catch {
      // ignore send errors
    }
  }

  /**
   * Start the telemetry reporter.
   * Must be called before sending events.
   */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    // If no key provided, telemetry is disabled
    if (!this.appInsightsKey) return;

    try {
      await this.createReporter();
    } catch {
      // Best-effort retry after ~1s: first runs can hit transient failures
      // establishing the Application Insights connection (DNS/proxy/VPN warm-up,
      // brief network blips, or backend cold start). One short delay usually fixes it.
      // If the retry still fails, ignore it to avoid impacting the application.
      try {
        await this.createReporter();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Flush pending telemetry events without stopping the reporter.
   * Use this for long-running processes that need to ensure events are sent periodically.
   * Uses the native reporter.flush() as documented in https://github.com/forcedotcom/telemetry,
   * and also flushes the App Insights client when present (SDK flush() only flushes O11y).
   */
  async flush(): Promise<void> {
    if (!this.started || !this.reporter) return;

    await this.reporter.flush();

    // SDK flush() only flushes O11y; we use App Insights. Flush the underlying client.
    try {
      const client = this.reporter.getTelemetryClient();
      if (client?.flush) {
        await new Promise<void>((resolve) => {
          client.flush({callback: () => resolve()});
        });
      }
    } catch {
      // getTelemetryClient() throws if App Insights not initialized
    }
  }

  /**
   * Stop the telemetry reporter and flush any pending events.
   * Includes a delay to allow async HTTP requests to complete.
   */
  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;
    this.reporter?.stop();

    // Allow pending HTTP requests to flush before process exits.
    // Application Insights SDK sends events asynchronously, so we need
    // a delay to ensure events reach the server on fast exits.
    // 300ms gives enough time for the HTTP request to complete even on
    // cold starts when establishing the initial connection.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  private buildEventProperties(attributes: TelemetryAttributes = {}): TelemetryEventProperties {
    const sanitized = sanitizeAttributes({...this.attributes, ...attributes});
    return {
      ...sanitized,
      sessionId: this.sessionId,
      cliId: this.cliId,
      version: this.version,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV,
      origin: this.project,
      date: new Date().toUTCString(),
      timestamp: String(Date.now()),
      processUptime: process.uptime() * 1000,
    };
  }

  private async createReporter(): Promise<void> {
    this.reporter = await ConfigurableTelemetryReporter.create({
      project: this.project,
      key: this.appInsightsKey ?? '',
      userId: this.cliId,
    });
    this.reporter.start();
  }
}
