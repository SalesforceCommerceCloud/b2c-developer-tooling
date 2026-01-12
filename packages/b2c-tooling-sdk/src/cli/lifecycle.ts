/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * B2C operation lifecycle types for CLI plugin extensibility.
 *
 * This module defines the interfaces for B2C-specific operation lifecycle hooks
 * that allow CLI plugins to observe and control operation execution for jobs,
 * deployments, and other B2C Commerce operations.
 *
 * ## Plugin Usage
 *
 * Plugins implement the `b2c:operation-lifecycle` hook to receive lifecycle events:
 *
 * ```typescript
 * import type { B2COperationLifecycleHook, B2COperationLifecycleProvider } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * const auditProvider: B2COperationLifecycleProvider = {
 *   name: 'audit-logger',
 *   async beforeOperation(context) {
 *     console.log(`Starting ${context.operationType}: ${context.operationId}`);
 *     // Return { skip: true } to prevent execution
 *   },
 *   async afterOperation(context, result) {
 *     console.log(`Completed ${context.operationType}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
 *   },
 * };
 *
 * const hook: B2COperationLifecycleHook = async function() {
 *   return { providers: [auditProvider] };
 * };
 *
 * export default hook;
 * ```
 *
 * @module cli/lifecycle
 */
import {randomUUID} from 'node:crypto';
import type {Hook} from '@oclif/core';
import type {B2CInstance} from '../instance/index.js';
import type {Logger} from '../logging/index.js';

/**
 * Types of B2C operations that support lifecycle hooks.
 */
export type B2COperationType =
  | 'job:run'
  | 'job:import'
  | 'job:export'
  | 'code:deploy'
  | 'code:activate'
  | 'site-archive:import'
  | 'site-archive:export';

/**
 * Context provided to lifecycle hooks for a B2C operation.
 *
 * Includes the B2CInstance so plugins can access API clients and configuration
 * without needing to construct their own instance.
 */
export interface B2COperationContext {
  /** Type of operation being executed */
  operationType: B2COperationType;
  /** Unique ID for this operation invocation */
  operationId: string;
  /** B2C instance with configured API clients */
  instance: B2CInstance;
  /** Start timestamp */
  startTime: number;
  /** Operation-specific metadata (jobId, codeVersion, parameters, etc.) */
  metadata: Record<string, unknown>;
}

/**
 * Result returned by a beforeOperation hook.
 */
export interface BeforeB2COperationResult {
  /** Set to true to skip the operation */
  skip?: boolean;
  /** Reason for skipping (logged to user) */
  skipReason?: string;
  /** Modified context to pass through to afterOperation */
  context?: Partial<B2COperationContext>;
}

/**
 * Result of a B2C operation execution.
 */
export interface B2COperationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error if operation failed */
  error?: Error;
  /** Duration in milliseconds */
  duration: number;
  /** Operation-specific result data */
  data?: unknown;
}

/**
 * Result returned by an afterOperation hook.
 */
export interface AfterB2COperationResult {
  /** Additional metadata to include */
  metadata?: Record<string, unknown>;
}

/**
 * Provider interface for B2C operation lifecycle hooks.
 *
 * Plugins implement this interface to observe and control B2C operation execution.
 * The context includes the B2CInstance, giving plugins access to:
 * - `context.instance.ocapi` - OCAPI client for API calls
 * - `context.instance.webdav` - WebDAV client for file operations
 * - `context.instance.config` - Resolved configuration (hostname, credentials, etc.)
 */
export interface B2COperationLifecycleProvider {
  /** Human-readable name for the provider (used in logging/debugging) */
  readonly name: string;

  /**
   * Called before an operation executes.
   *
   * Can return `{ skip: true }` to prevent the operation from executing.
   *
   * @param context - Operation context with B2CInstance and metadata
   * @returns Optional result to skip or modify the operation
   */
  beforeOperation?(context: B2COperationContext): Promise<BeforeB2COperationResult | void>;

  /**
   * Called after an operation completes (success or failure).
   *
   * @param context - Operation context with B2CInstance and metadata
   * @param result - Operation result with success/failure info
   * @returns Optional result with additional metadata
   */
  afterOperation?(context: B2COperationContext, result: B2COperationResult): Promise<AfterB2COperationResult | void>;
}

/**
 * Options passed to the `b2c:operation-lifecycle` hook.
 */
export interface B2COperationLifecycleHookOptions {
  /**
   * All parsed CLI flags from the current command.
   */
  flags?: Record<string, unknown>;
  /** Index signature for oclif hook compatibility */
  [key: string]: unknown;
}

/**
 * Result returned by the `b2c:operation-lifecycle` hook.
 */
export interface B2COperationLifecycleHookResult {
  /** Lifecycle providers to register */
  providers: B2COperationLifecycleProvider[];
}

/**
 * Hook type for `b2c:operation-lifecycle`.
 *
 * Implement this hook in your oclif plugin to receive B2C operation lifecycle events
 * for jobs, deployments, and other B2C Commerce operations.
 *
 * ## Plugin Registration
 *
 * Register the hook in your plugin's package.json:
 *
 * ```json
 * {
 *   "oclif": {
 *     "hooks": {
 *       "b2c:operation-lifecycle": "./dist/hooks/operation-lifecycle.js"
 *     }
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * import type { B2COperationLifecycleHook } from '@salesforce/b2c-tooling-sdk/cli';
 *
 * const hook: B2COperationLifecycleHook = async function(options) {
 *   return {
 *     providers: [{
 *       name: 'my-audit-provider',
 *       async beforeOperation(context) {
 *         // Access context.instance for API calls
 *         // Log or check policies before operation
 *       },
 *       async afterOperation(context, result) {
 *         // Log results, send notifications, etc.
 *       },
 *     }],
 *   };
 * };
 *
 * export default hook;
 * ```
 */
export type B2COperationLifecycleHook = Hook<'b2c:operation-lifecycle'>;

/**
 * Creates a new B2C operation context for lifecycle hooks.
 *
 * @param operationType - Type of B2C operation
 * @param metadata - Operation-specific metadata
 * @param instance - B2C instance with configured clients
 * @returns New operation context
 */
export function createB2COperationContext(
  operationType: B2COperationType,
  metadata: Record<string, unknown>,
  instance: B2CInstance,
): B2COperationContext {
  return {
    operationType,
    operationId: randomUUID(),
    instance,
    startTime: Date.now(),
    metadata,
  };
}

/**
 * Helper class for running B2C lifecycle hooks in CLI commands.
 *
 * This class is used internally by CLI commands to collect and invoke
 * lifecycle providers from plugins.
 */
export class B2CLifecycleRunner {
  private providers: B2COperationLifecycleProvider[] = [];
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Adds providers to this runner.
   */
  addProviders(providers: B2COperationLifecycleProvider[]): void {
    this.providers.push(...providers);
  }

  /**
   * Runs beforeOperation hooks for all providers.
   *
   * @param context - Operation context
   * @returns Aggregated result (skip if any provider requests skip)
   */
  async runBefore(context: B2COperationContext): Promise<BeforeB2COperationResult> {
    const aggregatedResult: BeforeB2COperationResult = {};

    for (const provider of this.providers) {
      if (!provider.beforeOperation) continue;

      try {
        const result = await provider.beforeOperation(context);
        if (result?.skip) {
          this.logger?.debug(`Provider ${provider.name} requested skip: ${result.skipReason}`);
          return result; // First skip wins
        }
        if (result?.context) {
          Object.assign(context.metadata, result.context);
        }
      } catch (error) {
        // Don't fail the operation on hook errors
        this.logger?.warn(`Lifecycle provider ${provider.name} beforeOperation failed: ${error}`);
      }
    }

    return aggregatedResult;
  }

  /**
   * Runs afterOperation hooks for all providers.
   *
   * @param context - Operation context
   * @param result - Operation result
   */
  async runAfter(context: B2COperationContext, result: B2COperationResult): Promise<void> {
    for (const provider of this.providers) {
      if (!provider.afterOperation) continue;

      try {
        await provider.afterOperation(context, result);
      } catch (error) {
        // Don't fail on hook errors
        this.logger?.warn(`Lifecycle provider ${provider.name} afterOperation failed: ${error}`);
      }
    }
  }

  /**
   * Returns the number of registered providers.
   */
  get size(): number {
    return this.providers.length;
  }
}
