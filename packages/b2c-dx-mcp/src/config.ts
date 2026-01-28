/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration constants.
 *
 * @module config
 */

const DEFAULT_APPLICATION_INSIGHTS_CONNECTION_STRING =
  'InstrumentationKey=6fcc215f-0b11-4864-ad5c-3945ae19e2f3;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=a60f17ec-265a-4dfc-b8df-03a64695697d';

/**
 * Determines if telemetry should be enabled based on environment.
 * Telemetry is disabled in development mode to avoid polluting production data.
 */
function getConnectionString(): string | undefined {
  // Allow explicit override via env var
  if (process.env.B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING) {
    return process.env.B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING;
  }

  // Disable telemetry in development mode
  if (process.env.NODE_ENV === 'development') {
    return undefined;
  }

  return DEFAULT_APPLICATION_INSIGHTS_CONNECTION_STRING;
}

/**
 * Application Insights connection string for telemetry.
 *
 * Returns undefined in development mode (NODE_ENV=development) to disable telemetry.
 * Can be overridden via the `B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING` environment variable.
 */
export const APPLICATION_INSIGHTS_CONNECTION_STRING = getConnectionString();
