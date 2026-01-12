/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {getJobLog, getJobErrorMessage, type JobExecution} from '../operations/jobs/index.js';
import {t} from '../i18n/index.js';
import {
  B2CLifecycleRunner,
  createB2COperationContext,
  type B2COperationType,
  type B2COperationContext,
  type B2COperationResult,
  type BeforeB2COperationResult,
  type B2COperationLifecycleHookOptions,
  type B2COperationLifecycleHookResult,
} from './lifecycle.js';

/**
 * Base command for job operations.
 *
 * Extends InstanceCommand with job-specific functionality like
 * displaying job logs on failure.
 *
 * @example
 * export default class MyJobCommand extends JobCommand<typeof MyJobCommand> {
 *   async run(): Promise<void> {
 *     try {
 *       await executeJob(this.instance, 'my-job');
 *     } catch (error) {
 *       if (error instanceof JobExecutionError) {
 *         await this.showJobLog(error.execution);
 *       }
 *       throw error;
 *     }
 *   }
 * }
 */
export abstract class JobCommand<T extends typeof Command> extends InstanceCommand<T> {
  /** Lifecycle runner for B2C operation hooks */
  protected lifecycleRunner?: B2CLifecycleRunner;

  /**
   * Override init to collect lifecycle providers from plugins.
   */
  public async init(): Promise<void> {
    await super.init();
    await this.collectLifecycleProviders();
  }

  /**
   * Collects lifecycle providers from plugins via the `b2c:operation-lifecycle` hook.
   */
  protected async collectLifecycleProviders(): Promise<void> {
    this.lifecycleRunner = new B2CLifecycleRunner(this.logger);

    const hookOptions: B2COperationLifecycleHookOptions = {
      flags: this.flags as Record<string, unknown>,
    };

    const hookResult = await this.config.runHook('b2c:operation-lifecycle', hookOptions);

    for (const success of hookResult.successes) {
      const result = success.result as B2COperationLifecycleHookResult | undefined;
      if (!result?.providers?.length) continue;
      this.lifecycleRunner.addProviders(result.providers);
    }

    for (const failure of hookResult.failures) {
      this.logger?.warn(`Plugin ${failure.plugin.name} b2c:operation-lifecycle hook failed: ${failure.error.message}`);
    }

    if (this.lifecycleRunner.size > 0) {
      this.logger?.debug(`Registered ${this.lifecycleRunner.size} lifecycle provider(s)`);
    }
  }

  /**
   * Creates a B2C operation context for lifecycle hooks.
   *
   * @param operationType - Type of B2C operation
   * @param metadata - Operation-specific metadata
   * @returns B2C operation context
   */
  protected createContext(operationType: B2COperationType, metadata: Record<string, unknown>): B2COperationContext {
    return createB2COperationContext(operationType, metadata, this.instance);
  }

  /**
   * Runs beforeOperation hooks for all providers.
   *
   * @param context - B2C operation context
   * @returns Result indicating if operation should be skipped
   */
  protected async runBeforeHooks(context: B2COperationContext): Promise<BeforeB2COperationResult> {
    if (!this.lifecycleRunner) {
      return {};
    }
    return this.lifecycleRunner.runBefore(context);
  }

  /**
   * Runs afterOperation hooks for all providers.
   *
   * @param context - B2C operation context
   * @param result - Operation result
   */
  protected async runAfterHooks(context: B2COperationContext, result: B2COperationResult): Promise<void> {
    if (!this.lifecycleRunner) {
      return;
    }
    await this.lifecycleRunner.runAfter(context, result);
  }

  /**
   * Display a job's log file content and error message if available.
   * Outputs to stderr since this is typically shown for failed jobs.
   *
   * @param execution - Job execution with log file info
   */
  protected async showJobLog(execution: JobExecution): Promise<void> {
    // Extract error message from failed step executions
    const errorMessage = getJobErrorMessage(execution);

    if (!execution.is_log_file_existing) {
      // No log file, but we may still have an error message
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
      return;
    }

    try {
      const log = await getJobLog(this.instance, execution);
      const logFileName = execution.log_file_path?.split('/').pop() ?? 'job.log';

      const header = t('cli.job.logHeader', 'Job log ({{logFileName}}):', {logFileName});
      this.logger.error({log, errorMessage}, `${header}\n${log}`);

      // Log the error message separately if available
      if (errorMessage) {
        this.logger.error(t('cli.job.errorMessage', 'Error: {{message}}', {message: errorMessage}));
      }
    } catch {
      this.warn(t('cli.job.logFetchFailed', 'Could not retrieve job log'));
      // Still try to show error message even if log fetch failed
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
    }
  }
}
