/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createDeployment, type CreateDeploymentResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Deploy a bundle to an MRT environment.
 */
export default class MrtDeployCreate extends MrtCommand<typeof MrtDeployCreate> {
  static args = {
    bundleId: Args.integer({
      description: 'Bundle ID to deploy',
      required: true,
    }),
  };

  static description = t('commands.mrt.deploy.create.description', 'Deploy a bundle to a Managed Runtime environment');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> 12345 --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront -e production',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<CreateDeploymentResult> {
    this.requireMrtCredentials();

    const {bundleId} = this.args;
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

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

    this.log(
      t('commands.mrt.deploy.create.deploying', 'Deploying bundle {{bundleId}} to {{project}}/{{environment}}...', {
        bundleId,
        project,
        environment,
      }),
    );

    try {
      const result = await createDeployment(
        {
          projectSlug: project,
          targetSlug: environment,
          bundleId,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t(
            'commands.mrt.deploy.create.success',
            'Deployment started. Bundle {{bundleId}} is being deployed to {{environment}}.',
            {
              bundleId,
              environment,
            },
          ),
        );
        this.log(
          t(
            'commands.mrt.deploy.create.note',
            'Note: Deployments are asynchronous. Use "b2c mrt env get" or the Runtime Admin dashboard to check status.',
          ),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.deploy.create.failed', 'Failed to create deployment: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
