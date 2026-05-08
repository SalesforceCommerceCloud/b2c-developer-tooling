/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createTelemetry, Telemetry, type TelemetryAttributes} from '@salesforce/b2c-tooling-sdk/telemetry';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

const TELEMETRY_PROJECT = 'b2c-vs-extension';

let instance: Telemetry | undefined;

interface TelemetryPjson {
  version: string;
  telemetry?: {connectionString?: string};
}

function readPjson(extensionPath: string): TelemetryPjson | undefined {
  try {
    const raw = fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8');
    return JSON.parse(raw) as TelemetryPjson;
  } catch {
    return undefined;
  }
}

/**
 * VS Code 1.86+ ships `vscode.env.isTelemetryEnabled` reflecting the user's
 * `telemetry.telemetryLevel` setting (off / crash / error / all). When the user
 * has telemetry off, return false regardless of our own opt-out logic.
 */
function isVsCodeTelemetryEnabled(): boolean {
  return vscode.env.isTelemetryEnabled !== false;
}

/**
 * Initialize the extension's telemetry client.
 *
 * Telemetry is enabled when ALL of the following are true:
 *   - VS Code's `telemetry.telemetryLevel` is not `off`.
 *   - Neither `SFCC_DISABLE_TELEMETRY` nor `SF_DISABLE_TELEMETRY` env vars are set to `true`.
 *   - A connection string is available (from `telemetry.connectionString` in
 *     this package's package.json, or from the `SFCC_APP_INSIGHTS_KEY` env var).
 *
 * Failure to initialize is non-fatal — the extension continues without telemetry.
 *
 * @param context VS Code extension context, used to locate package.json and persist the cliId.
 * @returns The shared {@link Telemetry} instance, or undefined if disabled.
 */
export async function initTelemetry(context: vscode.ExtensionContext): Promise<Telemetry | undefined> {
  if (instance) return instance;
  if (!isVsCodeTelemetryEnabled()) return undefined;

  const pjson = readPjson(context.extensionPath);
  const connectionString = Telemetry.getConnectionString(pjson?.telemetry?.connectionString);
  if (!connectionString) return undefined;

  try {
    instance = createTelemetry({
      project: TELEMETRY_PROJECT,
      appInsightsKey: connectionString,
      version: pjson?.version,
      // Persist the cliId in VS Code's globalStorage so a single anonymous id
      // is reused across sessions. Falls back to a per-session random id if
      // the directory is not writable.
      dataDir: context.globalStorageUri.fsPath,
      initialAttributes: {
        host: vscode.env.appName,
        hostVersion: vscode.version,
        sessionId: vscode.env.sessionId,
        machineId: vscode.env.machineId,
        uiKind: vscode.env.uiKind === vscode.UIKind.Web ? 'web' : 'desktop',
      },
    });
    await instance.start();
  } catch {
    instance = undefined;
  }
  return instance;
}

/** Return the shared telemetry instance, or undefined if disabled. */
export function getTelemetry(): Telemetry | undefined {
  return instance;
}

/** Send an event with shared attributes. No-ops when telemetry is disabled. */
export function sendEvent(eventName: string, attributes: TelemetryAttributes = {}): void {
  instance?.sendEvent(eventName, attributes);
}

/** Send an exception. No-ops when telemetry is disabled. */
export function sendException(error: Error, attributes: TelemetryAttributes = {}): void {
  instance?.sendException(error, attributes);
}

/**
 * Flush and stop telemetry. Call from the extension's `deactivate()` hook so
 * pending events reach the server before the extension host terminates.
 */
export async function disposeTelemetry(): Promise<void> {
  if (!instance) return;
  try {
    await instance.stop();
  } catch {
    // best-effort
  }
  instance = undefined;
}

/**
 * Wrap a command handler so each invocation emits a `COMMAND_INVOKED` event
 * (with success/failure outcome and duration) and exceptions are reported.
 * No-ops when telemetry is disabled.
 *
 * The wrapper preserves the handler's original return value and rethrows any
 * error so existing error handling (toasts, safety prompts) is unaffected.
 */
// Matches vscode.commands.registerCommand's handler signature, which uses any[] for context-menu args.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapCommandHandler<T extends (...args: any[]) => any>(commandId: string, handler: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped = async (...args: any[]) => {
    const start = Date.now();
    let outcome: 'success' | 'failure' = 'success';
    try {
      return await handler(...args);
    } catch (err) {
      outcome = 'failure';
      if (err instanceof Error) sendException(err, {commandId});
      throw err;
    } finally {
      sendEvent('COMMAND_INVOKED', {
        commandId,
        outcome,
        durationMs: Date.now() - start,
      });
    }
  };
  return wrapped as unknown as T;
}
