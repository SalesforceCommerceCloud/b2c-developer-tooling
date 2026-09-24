/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteEnvVarWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Delete an environment variable from an MRT project environment.
 */
export default class MrtEnvVarDelete extends MrtCommand<typeof MrtEnvVarDelete> {
  static args = {
    key: Args.string({
      description: 'Environment variable name',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.env.var.delete.description', 'Delete an environment variable from a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-var-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> OLD_API_KEY -p my-project -e staging',
    '<%= config.bin %> <%= command.id %> OLD_API_KEY -p my-project -e staging --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    deleteEnvVarWithBackend,
  };

  async run(): Promise<{key: string; project: string; environment: string}> {
    // Prevent deletion in safe mode
    this.assertDestructiveOperationAllowed('delete environment variable');

    const {key} = this.args;
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    // The resolved backend is surfaced via `onResolve` (debug log) only — it is
    // deliberately kept out of the `--json` payload so the legacy `--json`
    // output stays byte-identical and matches `mrt env var list` / `bundle deploy`.
    await this.operations.deleteEnvVarWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      key,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (resolved) =>
        this.logger.debug({backend: resolved}, '[MRT] Deleting environment variable via backend'),
    });

    // Under --json, emit only the result object: the human success message
    // routes through the logger (stderr) and would otherwise interleave with the
    // JSON. Mirrors `mrt env var list` / `mrt bundle deploy`.
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.env.var.delete.success', 'Deleted {{key}} from {{project}}/{{environment}}', {
          key,
          project,
          environment,
        }),
      );
    }

    return {key, project, environment};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
