/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export type {TelemetryAttributes, TelemetryEventProperties, TelemetryOptions} from './types.js';
export {Telemetry} from './telemetry.js';

import {Telemetry} from './telemetry.js';
import type {TelemetryOptions} from './types.js';

/**
 * Factory function to create a Telemetry instance.
 *
 * @param options - Telemetry configuration options
 * @returns A new Telemetry instance
 *
 * @example
 * ```typescript
 * import { createTelemetry } from '@salesforce/b2c-tooling-sdk/telemetry';
 *
 * const telemetry = createTelemetry({
 *   project: 'my-mcp-server',
 *   appInsightsKey: process.env.APP_INSIGHTS_KEY,
 *   version: '1.0.0',
 *   initialAttributes: { environment: 'production' },
 * });
 *
 * await telemetry.start();
 * telemetry.sendEvent('SERVER_STATUS', { status: 'started' });
 * ```
 */
export function createTelemetry(options: TelemetryOptions): Telemetry {
  return new Telemetry(options);
}
