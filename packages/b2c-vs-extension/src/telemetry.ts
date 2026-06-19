/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createTelemetry, Telemetry, type TelemetryAttributes} from '@salesforce/b2c-tooling-sdk/telemetry';
import * as vscode from 'vscode';

const TELEMETRY_PROJECT = 'b2c-vs-extension';
const SETTING_ENABLED = 'b2c-dx.telemetry.enabled';

let instance: Telemetry | undefined;
const usedCategories = new Set<FeatureCategory>();

/**
 * Broad feature categories used to bucket usage events. Keep this list short
 * — one event per session per category is the goal. Adding a new category
 * should require explicit thought about cardinality.
 */
export type FeatureCategory =
  | 'sandbox'
  | 'webdav'
  | 'content'
  | 'codeSync'
  | 'apiBrowser'
  | 'debugger'
  | 'scaffold'
  | 'cap'
  | 'logs'
  | 'instance'
  | 'cipAnalytics'
  | 'scriptTypes';

/** VS Code 1.86+ telemetry-level signal. Falls back to true on older hosts. */
function isVsCodeTelemetryEnabled(): boolean {
  return vscode.env.isTelemetryEnabled !== false;
}

function isExtensionTelemetryEnabled(): boolean {
  return vscode.workspace.getConfiguration().get<boolean>(SETTING_ENABLED, true);
}

/**
 * Initialize the extension's telemetry client.
 *
 * Telemetry is enabled when ALL of the following are true:
 *   - VS Code's `telemetry.telemetryLevel` is not `off`.
 *   - The `b2c-dx.telemetry.enabled` setting is not `false`.
 *   - Neither `SFCC_DISABLE_TELEMETRY` nor `SF_DISABLE_TELEMETRY` env vars are set to `true`.
 *   - A connection string is available (from `telemetry.connectionString` in
 *     this package's package.json, or from the `SFCC_APP_INSIGHTS_KEY` env var).
 *
 * Initialization runs in the background and never blocks activation. The
 * telemetry client buffers events in memory, so `sendEvent` calls are
 * non-blocking. Because the extension host is long-lived and may not get a
 * clean `deactivate()` flush, we enable a periodic auto-flush (see
 * `flushIntervalMs`) so a dirty shutdown loses at most one interval of events.
 * Failure to initialize is silent — the extension continues without telemetry.
 */
export function initTelemetry(context: vscode.ExtensionContext): void {
  if (instance) return;
  if (!isVsCodeTelemetryEnabled()) return;
  if (!isExtensionTelemetryEnabled()) return;

  const connectionString = Telemetry.getConnectionString(__TELEMETRY_CONNECTION_STRING__ || undefined);
  if (!connectionString) return;

  // Run start() in the background. Events sent before start() resolves are
  // dropped — that's intentional and acceptable for a usage tracker.
  const client = createTelemetry({
    project: TELEMETRY_PROJECT,
    appInsightsKey: connectionString,
    version: __EXT_VERSION__,
    dataDir: context.globalStorageUri.fsPath,
    // Long-lived host: deliver buffered events every 30s so a non-clean
    // shutdown (window force-close, host crash) loses at most one interval.
    flushIntervalMs: 30_000,
    initialAttributes: {
      host: vscode.env.appName,
      uiKind: vscode.env.uiKind === vscode.UIKind.Web ? 'web' : 'desktop',
    },
  });

  // Don't await — non-blocking by design.
  void client.start().then(
    () => {
      instance = client;
    },
    () => {
      // start() failed; leave instance undefined so subsequent calls no-op.
    },
  );
}

/**
 * Send an event. Fire-and-forget — writes into the in-memory buffer, no HTTP
 * I/O on the calling stack; delivery happens on the periodic flush or at
 * dispose. No-ops when telemetry is disabled.
 */
export function sendEvent(eventName: string, attributes: TelemetryAttributes = {}): void {
  instance?.sendEvent(eventName, attributes);
}

/**
 * Mark a feature category as used in this session. Sends one `FEATURE_USED`
 * event per category per session — subsequent calls are no-ops. This gives us
 * a low-cardinality "did the user touch feature X" signal without the noise
 * of per-command tracking.
 */
export function markFeatureUsed(category: FeatureCategory): void {
  if (usedCategories.has(category)) return;
  usedCategories.add(category);
  sendEvent('FEATURE_USED', {category});
}

/** Send an exception. No-ops when telemetry is disabled. */
export function sendException(error: Error, attributes: TelemetryAttributes = {}): void {
  instance?.sendException(error, attributes);
}

/**
 * Flush and stop telemetry. Call from the extension's `deactivate()` hook so
 * pending events reach the server before the extension host terminates.
 * The SDK's stop() includes a small grace period for in-flight HTTP requests.
 */
export async function disposeTelemetry(): Promise<void> {
  if (!instance) return;
  try {
    await instance.stop();
  } catch {
    // best-effort
  }
  instance = undefined;
  usedCategories.clear();
}
