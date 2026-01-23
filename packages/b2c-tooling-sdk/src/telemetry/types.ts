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
 * Options for creating a Telemetry instance.
 */
export interface TelemetryOptions {
  /**
   * Project identifier used for telemetry reporting and CLI ID storage.
   * This is used as the project name in Application Insights and for
   * the persistent CLI ID directory (e.g., ~/.{project}/cliid).
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
}
