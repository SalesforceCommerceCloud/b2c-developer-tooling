/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {setPrimaryEnvironmentWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {printEnvView} from './get.js';

/**
 * Set a storefront's primary environment.
 *
 * SCAPI-only: the legacy MRT Cloud API has no primary-environment concept, so
 * the underlying operation errors on the legacy backend. The environment must be
 * `ready` or `build_failed`, and the operation is idempotent.
 */
export default class MrtEnvSetPrimary extends MrtCommand<typeof MrtEnvSetPrimary> {
  static args = {
    environment: Args.string({
      description: 'Environment to set as primary (or provide it via --environment / -e)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.env.setPrimary.description', "Set a storefront's primary Managed Runtime environment (SCAPI only)"),
    '/cli/mrt.html#b2c-mrt-env-set-primary',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> production --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    setPrimaryEnvironmentWithBackend,
  };

  async run(): Promise<unknown> {
    const environment = this.resolveEnvironmentSlug(this.args.environment);
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t('commands.mrt.env.setPrimary.setting', 'Setting environment "{{environment}}" as primary in {{project}}...', {
        environment,
        project,
      }),
    );

    const result = await this.operations.setPrimaryEnvironmentWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Setting primary environment via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.env.setPrimary.success', 'Environment "{{environment}}" is now the primary environment.', {
          environment,
        }),
      );
      printEnvView(result.environment, project);
    }

    // Under --json, emit the backend's native response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
