/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  commerceAppUninstall,
  JobExecutionError,
  type CommerceAppUninstallResult,
} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

export default class CapUninstall extends JobCommand<typeof CapUninstall> {
  static args = {
    appName: Args.string({
      description: 'App ID to uninstall (from commerce-app.json "id" field, e.g. "avalara-tax")',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.cap.uninstall.description', 'Uninstall a Commerce App from a B2C Commerce instance'),
    '/cli/cap.html#b2c-cap-uninstall',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> avalara-tax --domain tax --site RefArch'];

  static flags = {
    ...JobCommand.baseFlags,
    domain: Flags.string({
      char: 'd',
      description: 'Commerce app domain (e.g. tax, shipping, fraud)',
      required: true,
    }),
    site: Flags.string({
      char: 's',
      description: 'Site ID to uninstall the Commerce App from',
      required: true,
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
  };

  protected operations = {
    commerceAppUninstall,
  };

  async run(): Promise<CommerceAppUninstallResult> {
    this.requireOAuthCredentials();

    const {appName} = this.args;
    const {domain, site, timeout} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(
      t('commands.cap.uninstall.uninstalling', 'Uninstalling {{appName}} from {{hostname}} (site: {{site}})...', {
        appName,
        hostname,
        site,
      }),
    );

    const context = this.createContext('cap:uninstall', {appName, domain, site, hostname});
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.cap.uninstall.skipped', 'Uninstall skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      return {
        execution: {execution_status: 'finished', exit_status: {code: 'skipped'}},
        appName,
      } as unknown as CommerceAppUninstallResult;
    }

    try {
      const result = await this.operations.commerceAppUninstall(this.instance, appName, domain, {
        siteId: site,
        waitOptions: {
          timeout: timeout ? timeout * 1000 : undefined,
          onProgress: (exec, elapsed) => {
            if (!this.jsonEnabled()) {
              const elapsedSec = Math.floor(elapsed / 1000);
              this.log(
                t('commands.cap.uninstall.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                  status: exec.execution_status,
                  elapsed: elapsedSec.toString(),
                }),
              );
            }
          },
        },
      });

      const durationSec = result.execution.duration ? (result.execution.duration / 1000).toFixed(1) : 'N/A';
      this.log(
        t('commands.cap.uninstall.completed', 'Uninstall completed: {{status}} (duration: {{duration}}s)', {
          status: result.execution.exit_status?.code || result.execution.execution_status,
          duration: durationSec,
        }),
      );

      await this.runAfterHooks(context, {
        success: true,
        duration: Date.now() - context.startTime,
        data: result,
      });

      return result;
    } catch (error) {
      await this.runAfterHooks(context, {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - context.startTime,
        data: error instanceof JobExecutionError ? error.execution : undefined,
      });

      if (error instanceof JobExecutionError) {
        await this.showJobLog(error.execution);
        this.error(
          t('commands.cap.uninstall.failed', 'Uninstall failed: {{status}}', {
            status: error.execution.exit_status?.code || 'ERROR',
          }),
        );
      }
      if (error instanceof Error) {
        this.error(t('commands.cap.uninstall.error', 'Uninstall error: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
