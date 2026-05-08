/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  SafetyBlockedError,
  SafetyConfirmationRequired,
  SafetyGuard,
  loadGlobalSafetyConfig,
  resolveEffectiveSafetyConfig,
  withSafetyConfirmation,
} from '@salesforce/b2c-tooling-sdk';
import {createSafetyMiddleware, globalMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from './config-provider.js';
import {type FeatureCategory, markFeatureUsed} from './telemetry.js';

/**
 * Map command-id prefixes to broad feature categories so usage telemetry can
 * answer "did the user use feature X this session" without per-command noise.
 * Commands not matched here don't emit a usage event (the lifecycle events
 * still fire). Keep the prefix list short and stable.
 */
const COMMAND_PREFIX_TO_CATEGORY: Array<readonly [string, FeatureCategory]> = [
  ['b2c-dx.sandbox.', 'sandbox'],
  ['b2c-dx.webdav.', 'webdav'],
  ['b2c-dx.content.', 'content'],
  ['b2c-dx.codeSync.', 'codeSync'],
  ['b2c-dx.apiBrowser.', 'apiBrowser'],
  ['b2c-dx.scaffold.', 'scaffold'],
  ['b2c-dx.cap.', 'cap'],
  ['b2c-dx.logs.', 'logs'],
  ['b2c-dx.instance.', 'instance'],
];

function categoryForCommand(commandId: string): FeatureCategory | undefined {
  for (const [prefix, category] of COMMAND_PREFIX_TO_CATEGORY) {
    if (commandId.startsWith(prefix)) return category;
  }
  return undefined;
}

const PROVIDER_NAME = 'vscode-safety-guard';

let currentGuard = new SafetyGuard({level: 'NONE'});

function rebuildGuard(configProvider: B2CExtensionConfig): void {
  const instanceSafety = configProvider.getConfig()?.values.safety;
  const globalSafety = loadGlobalSafetyConfig();
  const effective = resolveEffectiveSafetyConfig(instanceSafety, globalSafety);
  currentGuard = new SafetyGuard(effective);

  if (effective.level !== 'NONE' || effective.rules?.length || effective.confirm) {
    getLogger().info(
      {level: effective.level, confirm: effective.confirm, ruleCount: effective.rules?.length ?? 0},
      'B2C DX: Safety mode active',
    );
  }
}

/**
 * Register a single middleware provider that delegates to the current SafetyGuard.
 *
 * The registration happens once; `currentGuard` is swapped out on config resets
 * so existing and future SDK clients both pick up the new policy.
 */
export function registerSafety(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  rebuildGuard(configProvider);

  globalMiddlewareRegistry.register({
    name: PROVIDER_NAME,
    getMiddleware: () => {
      if (currentGuard.config.level === 'NONE' && !currentGuard.config.rules?.length) {
        return undefined;
      }
      return createSafetyMiddleware(currentGuard);
    },
  });

  context.subscriptions.push(
    configProvider.onDidReset(() => rebuildGuard(configProvider)),
    {dispose: () => globalMiddlewareRegistry.unregister(PROVIDER_NAME)},
  );
}

/**
 * Run a destructive SDK operation with VS Code-idiomatic safety confirmation.
 *
 * If the configured safety policy requires confirmation, a modal warning dialog
 * is shown. On `Proceed`, the operation is retried with a scoped exemption. On
 * cancel, the SDK throws a `SafetyBlockedError` — callers should let it surface
 * to their existing error handling.
 *
 * @example
 * ```ts
 * const result = await runWithSafety(
 *   () => odsClient.DELETE('/sandboxes/{sandboxId}', {params: {path: {sandboxId}}}),
 *   `Delete sandbox "${sandboxId}"?`,
 * );
 * ```
 */
export function runWithSafety<T>(operation: () => Promise<T>, detail?: string): Promise<T> {
  return withSafetyConfirmation(currentGuard, operation, async (evaluation) => {
    const message = detail ? `${detail}\n\n${evaluation.reason}` : evaluation.reason;
    const choice = await vscode.window.showWarningMessage(message, {modal: true}, 'Proceed');
    return choice === 'Proceed';
  });
}

/**
 * Register a VS Code command with automatic safety evaluation.
 *
 * Before the handler runs, the command ID is evaluated against the SafetyGuard:
 * - `allow` (or no matching rule): the handler runs as normal.
 * - `block`: the handler is skipped and an error toast is shown.
 * - `confirm`: a modal warning dialog is shown; on `Proceed` the handler runs
 *   with a scoped exemption so downstream HTTP middleware won't re-prompt for
 *   the same command operation.
 *
 * This mirrors how `BaseCommand.evaluateCommandSafety()` runs on every oclif
 * command. Use this anywhere you'd otherwise call `vscode.commands.registerCommand`.
 */
// Matches vscode.commands.registerCommand's own signature, which uses any[] for context-menu args.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSafeCommand(commandId: string, handler: (...args: any[]) => any): vscode.Disposable {
  const category = categoryForCommand(commandId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return vscode.commands.registerCommand(commandId, async (...args: any[]) => {
    if (category) markFeatureUsed(category);
    try {
      currentGuard.assert({type: 'command', commandId});
    } catch (err) {
      if (err instanceof SafetyBlockedError) {
        await vscode.window.showErrorMessage(`B2C DX: Blocked by safety policy — ${err.message}`);
        return undefined;
      }
      if (err instanceof SafetyConfirmationRequired) {
        const choice = await vscode.window.showWarningMessage(
          `B2C DX: ${err.evaluation.reason}. Proceed?`,
          {modal: true},
          'Proceed',
        );
        if (choice !== 'Proceed') return undefined;
        const release = currentGuard.temporarilyAllow(err.evaluation.operation);
        try {
          return await handler(...args);
        } finally {
          release();
        }
      }
      throw err;
    }
    return handler(...args);
  });
}
