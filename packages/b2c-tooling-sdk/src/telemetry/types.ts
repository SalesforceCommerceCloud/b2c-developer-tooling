/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Telemetry event attributes - key-value pairs sent with each event.
 */
export interface TelemetryAttributes {
  [key: string]: boolean | number | string | undefined;
}

/**
 * Core properties automatically included with every telemetry event.
 */
export interface TelemetryEventProperties extends TelemetryAttributes {
  /** Unique session identifier (generated per Telemetry instance) */
  sessionId: string;
  /** Persistent CLI identifier (stored in {dataDir}/cliid) */
  cliId: string;
  /** Package version */
  version: string;
  /** Operating system platform (e.g., 'darwin', 'linux', 'win32') */
  platform: string;
  /** CPU architecture (e.g., 'x64', 'arm64') */
  arch: string;
  /** Node.js version */
  nodeVersion: string;
  /** NODE_ENV environment variable value */
  nodeEnv: string | undefined;
  /** Project name / origin of the event */
  origin: string;
  /** Human-readable UTC date string */
  date: string;
  /** Unix timestamp in milliseconds */
  timestamp: string;
  /** Process uptime in milliseconds */
  processUptime: number;
  /**
   * Whether the event originated from a CI / automation environment.
   * Allows analytics to separate human-developer traffic from CI runs, which
   * can otherwise dominate volume and skew blended KPIs.
   */
  isCI: boolean;
}

/**
 * Options for creating a Telemetry instance.
 */
export interface TelemetryOptions {
  /**
   * Project identifier used for telemetry reporting.
   * This is used as the project name in Application Insights.
   */
  project: string;

  /**
   * Application Insights connection string or instrumentation key.
   * If not provided, telemetry will be disabled.
   */
  appInsightsKey?: string;

  /**
   * Initial attributes to include with every telemetry event.
   */
  initialAttributes?: TelemetryAttributes;

  /**
   * Package version to include in telemetry events.
   */
  version?: string;

  /**
   * oclif dataDir for persistent CLI ID storage.
   * If provided, CLI ID is stored in {dataDir}/cliid.
   * If not provided or non-writable, falls back to random ID.
   */
  dataDir?: string;

  /**
   * Optional periodic auto-flush interval in milliseconds. When set (> 0),
   * buffered events are delivered on this cadence in addition to explicit
   * {@link Telemetry.flush}/{@link Telemetry.stop} calls.
   *
   * Intended for long-lived hosts (e.g. the VS Code extension) that buffer
   * events for a whole session and cannot guarantee a clean shutdown flush.
   * Short-lived processes (CLI, MCP) should leave this unset and flush
   * deterministically. The interval timer is `unref`'d, so it never keeps a
   * process alive on its own.
   */
  flushIntervalMs?: number;
}
