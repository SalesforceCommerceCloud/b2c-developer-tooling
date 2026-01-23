/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {TelemetryReporter} from '@salesforce/telemetry';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT = 'b2c-dx-mcp';

interface TelemetryAttributes {
  [key: string]: boolean | number | string | undefined;
}

const loadConfigValue = (key: string): null | string => {
  try {
    const cfgPath = path.resolve(__dirname, '../../config.json');
    if (!fs.existsSync(cfgPath)) return null;
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const cfg = JSON.parse(raw) as Record<string, unknown>;
    const v = cfg?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
};

const customAppInsightsKey = loadConfigValue('applicationInsightsConnectionString');

const generateRandomId = (): string => randomBytes(20).toString('hex');

// Our own persistent CLI ID location: ~/.b2c-dx-mcp/cliid
const getOwnCliIdPath = (): null | {dir: string; file: string} => {
  const home = os.homedir();
  if (!home) return null;
  const dir = path.join(home, `.${PROJECT}`);
  const file = path.join(dir, 'cliid');
  return {dir, file};
};

const readOrCreateOwnCliId = (): null | string => {
  const loc = getOwnCliIdPath();
  if (!loc) return null;
  if (fs.existsSync(loc.file)) {
    const value = fs.readFileSync(loc.file, 'utf8');
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  // Create new
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

const readCliIdIfPresent = (): string => {
  // Use our own persisted cliid under the user's home; if not present, generate one
  const ownId = readOrCreateOwnCliId();
  if (ownId) return ownId;
  // Fallback: generate a random id for this session
  return generateRandomId();
};

// Read version from package.json
const getPackageVersion = (): string => {
  try {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as {version?: string};
    return pkg?.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
};

class McpTelemetryReporter extends TelemetryReporter {
  // Always allow telemetry for this reporter; gating is handled by instantiation site.
  override isSfdxTelemetryEnabled(): boolean {
    return true;
  }
}

export class Telemetry {
  private attributes: TelemetryAttributes;
  private cliId: string;
  private reporter: TelemetryReporter | undefined;
  private sessionId: string;
  private started: boolean;
  private version: string;

  constructor(initialAttributes: TelemetryAttributes = {}) {
    this.attributes = {...initialAttributes};
    this.cliId = readCliIdIfPresent();
    this.reporter = undefined;
    this.sessionId = generateRandomId();
    this.started = false;
    this.version = getPackageVersion();
  }

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
        origin: PROJECT,
        // Timestamps
        date: new Date().toUTCString(),
        timestamp: String(Date.now()),
        processUptime: process.uptime() * 1000,
      });
    } catch {
      // ignore send errors
    }
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    try {
      await this.createMcpTelemetryReporter();
    } catch {
      // Best-effort retry after ~1s: first runs can hit transient failures
      // establishing the Application Insights connection (DNS/proxy/VPN warm-up,
      // brief network blips, or backend cold start). One short delay usually fixes it.
      // If the retry still fails, ignore it to avoid impacting the server.
      try {
        await this.delay(1000);
        await this.createMcpTelemetryReporter();
      } catch {
        // ignore
      }
    }
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.reporter?.stop();
  }

  /**
   * Creates and initializes the MCP telemetry reporter with App Insights.
   */
  private async createMcpTelemetryReporter(): Promise<void> {
    this.reporter = await McpTelemetryReporter.create({
      project: PROJECT,
      key: customAppInsightsKey ?? '',
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
