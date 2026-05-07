/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  commerceAppInstall,
  validateCap,
  JobExecutionError,
  type CommerceAppInstallResult,
} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

export default class CapInstall extends JobCommand<typeof CapInstall> {
  static args = {
    path: Args.string({
      description: 'Path to a CAP directory or .zip file',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.cap.install.description', 'Install a Commerce App Package (CAP) on a B2C Commerce instance'),
    '/cli/cap.html#b2c-cap-install',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5 --site RefArch',
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5.zip --site RefArch',
    '<%= config.bin %> <%= command.id %> ./commerce-avalara-tax-app-v0.2.5 --site RefArch --skip-validate',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    'site-id': Flags.string({
      char: 's',
      description: 'Site ID to install the Commerce App on',
      required: true,
      aliases: ['site'],
    }),
    'clean-archive': Flags.boolean({
      description: 'Delete the uploaded zip from the instance after install',
      default: false,
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
    'skip-validate': Flags.boolean({
      description: 'Skip CAP structure validation before install',
      default: false,
    }),
  };

  protected operations = {
    commerceAppInstall,
    validateCap,
  };

  async run(): Promise<CommerceAppInstallResult> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const {path} = this.args;
    const {'site-id': site, 'clean-archive': cleanArchive, timeout, 'skip-validate': skipValidate} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    // Validate first unless skipped
    if (!skipValidate) {
      this.log(t('commands.cap.install.validating', 'Validating CAP structure...'));
      const validation = await this.operations.validateCap(path);
      if (!validation.valid) {
        for (const err of validation.errors) {
          this.log(`  ✗ ${err}`);
        }
        this.error(
          t('commands.cap.install.validationFailed', 'CAP validation failed — use --skip-validate to bypass'),
          {exit: 1},
        );
      }
      if (validation.warnings.length > 0) {
        for (const warn of validation.warnings) {
          this.log(`  ⚠ ${warn}`);
        }
      }
    }

    this.log(
      t('commands.cap.install.installing', 'Installing CAP {{path}} to {{hostname}} (site: {{site}})...', {
        path,
        hostname,
        site,
      }),
    );

    const context = this.createContext('cap:install', {path, site, hostname});
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.cap.install.skipped', 'Install skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      return {
        execution: {execution_status: 'finished', exit_status: {code: 'skipped'}},
        appName: '',
        appVersion: '',
        archiveFilename: '',
        archiveKept: false,
      } as unknown as CommerceAppInstallResult;
    }

    try {
      const result = await this.operations.commerceAppInstall(this.instance, path, {
        siteId: site,
        keepArchive: !cleanArchive,
        waitOptions: {
          timeoutSeconds: timeout || undefined,
          onPoll: (info) => {
            if (!this.jsonEnabled()) {
              this.log(
                t('commands.cap.install.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                  status: info.status,
                  elapsed: Math.floor(info.elapsedSeconds).toString(),
                }),
              );
            }
          },
        },
      });

      const durationSec = result.execution.duration ? (result.execution.duration / 1000).toFixed(1) : 'N/A';
      this.log(
        t('commands.cap.install.completed', 'Install completed: {{status}} (duration: {{duration}}s)', {
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
          t('commands.cap.install.failed', 'Install failed: {{status}}', {
            status: error.execution.exit_status?.code || 'ERROR',
          }),
        );
      }
      if (error instanceof Error) {
        this.error(t('commands.cap.install.error', 'Install error: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
