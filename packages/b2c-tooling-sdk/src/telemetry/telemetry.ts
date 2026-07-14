/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {AppInsightsClient} from './app-insights-client.js';
import type {TelemetryAttributes, TelemetryEventProperties, TelemetryOptions} from './types.js';
import {getLogger, type Logger} from '../logging/index.js';

const generateRandomId = (): string => randomBytes(20).toString('hex');

/**
 * Best-effort detection of a CI / non-interactive automation environment.
 *
 * Telemetry analysis showed a small number of automation installs can account
 * for a large share of events, skewing blended KPIs (e.g. error rates). Tagging
 * every event with `isCI` lets analytics separate human-developer traffic from
 * CI without resorting to fragile cliId/IP heuristics after the fact.
 *
 * Recognizes the generic `CI` convention plus common provider-specific vars.
 */
function detectCI(): boolean {
  const env = process.env;
  // Generic convention honored by most CI providers (GitHub Actions, GitLab,
  // CircleCI, Travis, etc.). `CI=false`/`CI=0`/empty explicitly opt out.
  if (env.CI !== undefined && env.CI !== 'false' && env.CI !== '0' && env.CI !== '') {
    return true;
  }
  return Boolean(
    env.CONTINUOUS_INTEGRATION ||
    env.BUILD_NUMBER ||
    env.GITHUB_ACTIONS ||
    env.GITLAB_CI ||
    env.CIRCLECI ||
    env.TRAVIS ||
    env.JENKINS_URL ||
    env.TEAMCITY_VERSION ||
    env.TF_BUILD ||
    env.BITBUCKET_BUILD_NUMBER ||
    env.CODEBUILD_BUILD_ID,
  );
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
 * Split attributes into string properties and numeric measurements
 * for Application Insights, matching the behavior of @salesforce/telemetry.
 * String values have $HOME replaced with ~ for GDPR safety.
 * Boolean values are converted to strings.
 */
function buildPropertiesAndMeasurements(attributes: TelemetryAttributes): {
  properties: Record<string, string>;
  measurements: Record<string, number>;
} {
  const properties: Record<string, string> = {};
  const measurements: Record<string, number> = {};
  const home = process.env.HOME ?? '';
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') {
      properties[key] = home ? value.replace(home, '~') : value;
    } else if (typeof value === 'number') {
      measurements[key] = value;
    } else if (typeof value === 'boolean') {
      properties[key] = String(value);
    }
  }
  return {properties, measurements};
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
  private client: AppInsightsClient | undefined;
  private sessionId: string;
  private started: boolean;
  private version: string;
  private appInsightsKey: string | undefined;
  private traceLog: Logger | undefined;
  private flushIntervalMs: number | undefined;
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private isCI: boolean;

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
    this.client = undefined;
    this.sessionId = generateRandomId();
    this.started = false;
    this.version = options.version ?? '0.0.0';
    this.flushIntervalMs = options.flushIntervalMs;
    this.isCI = detectCI();

    if (process.env.SFCC_TELEMETRY_LOG === 'true') {
      this.traceLog = getLogger().child({component: 'telemetry'});
    }
  }

  /**
   * Add additional attributes to include with all future events.
   */
  addAttributes(attributes: TelemetryAttributes): void {
    this.traceLog?.debug({attributes}, 'telemetry addAttributes');
    this.attributes = {...this.attributes, ...attributes};
  }

  /**
   * Send a telemetry event. Events are buffered until you call {@link flush} or
   * {@link stop}. Use this for batching; use {@link sendEventAndFlush} when you
   * need one event sent before continuing.
   *
   * @param eventName - Name of the event (e.g., 'SERVER_STATUS', 'TOOL_CALLED')
   * @param attributes - Event-specific attributes (only string/number/boolean are sent)
   */
  sendEvent(eventName: string, attributes: TelemetryAttributes = {}): void {
    try {
      const name = eventName?.trim() || 'UNKNOWN';
      this.traceLog?.debug({event: name, attributes}, 'telemetry sendEvent');
      const eventProperties = this.buildEventProperties(attributes);
      const {properties, measurements} = buildPropertiesAndMeasurements(eventProperties);
      this.client?.trackEvent({name: `${this.project}/${name}`, properties, measurements});
    } catch {
      // ignore send errors
    }
  }

  /**
   * Send a telemetry event and flush immediately. Use this when you need the event
   * delivered before continuing (e.g. after a tool call or server lifecycle event),
   * so you don't have to remember to call {@link flush}. For batching multiple
   * events and flushing once, use {@link sendEvent} and then {@link flush}.
   *
   * @param eventName - Name of the event (e.g., 'SERVER_STATUS', 'TOOL_CALLED')
   * @param attributes - Event-specific attributes (only string/number/boolean are sent)
   */
  async sendEventAndFlush(eventName: string, attributes: TelemetryAttributes = {}): Promise<void> {
    this.sendEvent(eventName, attributes);
    await this.flush();
  }

  /**
   * Send an exception to telemetry.
   *
   * @param error - The error to report
   * @param attributes - Additional attributes to include with the exception
   */
  sendException(error: Error, attributes: TelemetryAttributes = {}): void {
    try {
      this.traceLog?.debug({error: error.name, message: error.message}, 'telemetry sendException');
      const eventProperties = this.buildEventProperties(sanitizeAttributes(attributes));
      const {properties, measurements} = buildPropertiesAndMeasurements(eventProperties);
      this.client?.trackException({exception: error, properties, measurements});
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

    this.traceLog?.debug(
      {project: this.project, sessionId: this.sessionId, cliId: this.cliId.slice(0, 8) + '...'},
      'telemetry start',
    );

    try {
      this.createClient();
    } catch {
      // best-effort — telemetry failure never impacts the application
    }

    // Long-lived hosts (e.g. the VS Code extension) buffer events for a whole
    // session and may not get a clean shutdown flush. An opt-in periodic flush
    // delivers events on a cadence so a dirty exit loses at most one interval.
    // The timer is unref'd so it never keeps a short-lived process alive.
    if (this.client && this.flushIntervalMs && this.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => void this.flush(), this.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  /**
   * Flush pending telemetry events without stopping the client.
   * Use this for long-running processes that need to ensure events are sent periodically.
   */
  async flush(): Promise<void> {
    if (!this.started || !this.client) return;

    await this.client.flush();
  }

  /**
   * Stop the telemetry client and flush any pending events.
   * Includes a delay to allow async HTTP requests to complete.
   */
  async stop(): Promise<void> {
    if (!this.started) return;
    this.traceLog?.debug('telemetry stop');
    this.started = false;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.client) {
      await this.client.flush();
      this.client = undefined;
    }

    // flush() awaits the ingestion POST directly, but keep a small drain delay
    // so any in-flight request started elsewhere can settle before a fast exit.
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
      isCI: this.isCI,
    };
  }

  private createClient(): void {
    // Manual event tracking only — no auto-collection, no statsbeat, no
    // background telemetry. This zero-dependency client POSTs Breeze envelopes
    // directly, so there is nothing to opt out of.
    const client = new AppInsightsClient(this.appInsightsKey as string);

    // Set user ID for session tracking.
    client.context.tags[client.context.keys.userId] = this.cliId;
    // GDPR: hide machine-identifying cloud role instance.
    client.context.tags[client.context.keys.cloudRoleInstance] = '';

    this.client = client;
  }
}
