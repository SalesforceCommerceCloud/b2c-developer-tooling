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
  'InstrumentationKey=acf013a7-d3b9-49e3-9d26-03fd87dbec0b;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=efe01240-2e8f-40c1-938a-534cca8a270b';

/**
 * Application Insights connection string for telemetry.
 *
 * Can be overridden via the `B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING` environment variable for testing.
 */
export const APPLICATION_INSIGHTS_CONNECTION_STRING =
  process.env.B2C_DX_MCP_APP_INSIGHTS_CONNECTION_STRING ?? DEFAULT_APPLICATION_INSIGHTS_CONNECTION_STRING;
