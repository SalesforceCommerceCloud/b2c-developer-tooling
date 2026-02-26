/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Logger} from '../logging/types.js';

/**
 * Minimal hook context that shims the `this` context oclif provides to hooks.
 *
 * Provides `debug()`, `log()`, `warn()`, `error()`, and a stub `config` object
 * so that existing hook implementations work without `@oclif/core`.
 */
export interface HookContext {
  debug(...args: unknown[]): void;
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  config: Record<string, unknown>;
}

export interface HookContextOptions {
  /** Logger to route debug/log/warn/error through */
  logger?: Logger;
  /** Extra properties to include on the stub config object */
  config?: Record<string, unknown>;
}

/**
 * Creates a minimal hook context matching what oclif provides to hooks.
 */
export function createHookContext(options: HookContextOptions = {}): HookContext {
  const {logger} = options;

  return {
    debug(...args: unknown[]) {
      logger?.debug(args.map(String).join(' '));
    },
    log(...args: unknown[]) {
      logger?.info(args.map(String).join(' '));
    },
    warn(...args: unknown[]) {
      logger?.warn(args.map(String).join(' '));
    },
    error(...args: unknown[]) {
      logger?.error(args.map(String).join(' '));
    },
    config: options.config ?? {},
  };
}

/**
 * Dynamic import that survives esbuild CJS bundling.
 *
 * esbuild transforms `import()` to `require()` in CJS output, which cannot
 * load ESM plugins. Using `new Function` preserves the native dynamic import.
 */

const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<Record<string, unknown>>;

/**
 * Dynamically imports a hook file and invokes its default export.
 *
 * @param hookFilePath - Absolute path to the hook JS file
 * @param context - Hook context (`this` inside the hook)
 * @param hookOptions - Options passed as the first argument to the hook function
 * @param logger - Optional logger for warnings on failure
 * @returns The hook function's return value, or `undefined` on error
 */
export async function invokeHook<TResult>(
  hookFilePath: string,
  context: HookContext,
  hookOptions: Record<string, unknown>,
  logger?: Logger,
): Promise<TResult | undefined> {
  try {
    const mod = await dynamicImport(hookFilePath);
    const hookFn = (mod.default ?? mod) as (...args: unknown[]) => Promise<TResult>;

    if (typeof hookFn !== 'function') {
      logger?.warn(`Hook file ${hookFilePath} does not export a function`);
      return undefined;
    }

    return await hookFn.call(context, hookOptions);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.warn(`Failed to invoke hook ${hookFilePath}: ${message}`);
    return undefined;
  }
}
