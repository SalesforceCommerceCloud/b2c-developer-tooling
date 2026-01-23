/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {TelemetryReporter} from '@salesforce/telemetry';
import type {TelemetryAttributes, TelemetryOptions} from './types.js';

const generateRandomId = (): string => randomBytes(20).toString('hex');

/**
 * Get the path to the persistent CLI ID file.
 * @param project - Project name used for the directory (e.g., 'b2c-dx-mcp' -> ~/.b2c-dx-mcp/cliid)
 */
const getCliIdPath = (project: string): {dir: string; file: string} | null => {
  const home = os.homedir();
  if (!home) return null;
  const dir = path.join(home, `.${project}`);
  const file = path.join(dir, 'cliid');
  return {dir, file};
};

/**
 * Read or create a persistent CLI ID for the given project.
 */
const readOrCreateCliId = (project: string): string => {
  const loc = getCliIdPath(project);
  if (!loc) return generateRandomId();

  // Try to read existing ID
  if (fs.existsSync(loc.file)) {
    try {
      const value = fs.readFileSync(loc.file, 'utf8');
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    } catch {
      // Fall through to create new
    }
  }

  // Create new ID
  const newId = generateRandomId();
  try {
    if (!fs.existsSync(loc.dir)) {
      fs.mkdirSync(loc.dir, {recursive: true, mode: 0o700});
    }
    fs.writeFileSync(loc.file, newId, {encoding: 'utf8', mode: 0o600});
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

  constructor(options: TelemetryOptions) {
    this.project = options.project;
    this.appInsightsKey = options.appInsightsKey;
    this.attributes = {...(options.initialAttributes ?? {})};
    this.cliId = readOrCreateCliId(options.project);
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
   * @param attributes - Event-specific attributes
   */
  sendEvent(eventName: string, attributes: TelemetryAttributes = {}): void {
    try {
      this.reporter?.sendTelemetryEvent(eventName, {
        // TODO create interface for clarity
        ...this.attributes,
        ...attributes,
        // Identifiers
        sessionId: this.sessionId,
        cliId: this.cliId,
        // System information
        version: this.version,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
        origin: this.project,
        // Timestamps
        date: new Date().toUTCString(),
        timestamp: String(Date.now()),
        processUptime: process.uptime() * 1000,
      });
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
        await this.delay(1000);
        await this.createReporter();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Stop the telemetry reporter and flush any pending events.
   */
  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.reporter?.stop();
  }

  private async createReporter(): Promise<void> {
    this.reporter = await ConfigurableTelemetryReporter.create({
      project: this.project,
      key: this.appInsightsKey ?? '',
      userId: this.cliId,
      waitForConnection: true,
    });
    this.reporter.start();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
