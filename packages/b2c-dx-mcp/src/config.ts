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
 * Application Insights connection string for telemetry.
 *
 * Can be overridden via the `B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING` environment variable for testing.
 */
export const APPLICATION_INSIGHTS_CONNECTION_STRING =
  process.env.B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING ?? DEFAULT_APPLICATION_INSIGHTS_CONNECTION_STRING;
