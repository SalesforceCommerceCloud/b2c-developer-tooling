/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteEnvVar} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

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

  static description = t(
    'commands.mrt.env.var.delete.description',
    'Delete an environment variable from a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> OLD_API_KEY -p my-project -e staging',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<{key: string; project: string; environment: string}> {
    this.requireMrtCredentials();

    const {key} = this.args;
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    await deleteEnvVar(
      {
        projectSlug: project,
        environment,
        key,
        origin: this.resolvedConfig.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    this.log(
      t('commands.mrt.env.var.delete.success', 'Deleted {{key}} from {{project}}/{{environment}}', {
        key,
        project,
        environment,
      }),
    );

    return {key, project, environment};
  }
}
