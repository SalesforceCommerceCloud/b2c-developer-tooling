/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createAccessControlHeaderWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Create an access control header for an MRT environment.
 */
export default class MrtAccessControlCreate extends MrtCommand<typeof MrtAccessControlCreate> {
  static args = {
    value: Args.string({
      description: 'Access control header value',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.mrt.access-control.create.description',
      'Create an access control header for a Managed Runtime environment',
    ),
    '/cli/mrt.html#b2c-mrt-env-access-control-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-secret-header-value --project my-storefront --environment production',
    '<%= config.bin %> <%= command.id %> my-secret-header-value -p my-storefront -e production --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    createAccessControlHeaderWithBackend,
  };

  async run(): Promise<unknown> {
    const {value} = this.args;
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

    const result = await this.operations.createAccessControlHeaderWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      value,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Creating access control header via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(
        t(
          'commands.mrt.access-control.create.success',
          'Created access control header {{id}} on {{project}}/{{environment}}',
          {
            id: result.header.id,
            project,
            environment,
          },
        ),
      );
    }

    // Under --json, emit the backend's native create response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
