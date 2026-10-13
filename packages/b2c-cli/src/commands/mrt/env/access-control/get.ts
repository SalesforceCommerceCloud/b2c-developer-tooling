/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getAccessControlHeaderWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Get a single access control header for an MRT environment.
 */
export default class MrtAccessControlGet extends MrtCommand<typeof MrtAccessControlGet> {
  static args = {
    id: Args.string({
      description: 'Access control header ID (UUID)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.access-control.get.description', 'Get an access control header for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-access-control-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ff832a9e-0e55-11ef-8f23-0242ac110002 --project my-storefront --environment production',
    '<%= config.bin %> <%= command.id %> ff832a9e-0e55-11ef-8f23-0242ac110002 -p my-storefront -e production --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    getAccessControlHeaderWithBackend,
  };

  async run(): Promise<unknown> {
    const {id} = this.args;
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

    const result = await this.operations.getAccessControlHeaderWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      headerId: id,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Getting access control header via backend'),
    });

    if (!this.jsonEnabled()) {
      const {header} = result;
      ux.stdout(`ID:      ${header.id || '-'}`);
      ux.stdout(`Value:   ${header.value || '-'}`);
      ux.stdout(`Status:  ${header.status ?? '-'}`);
      ux.stdout(`Created: ${header.createdAt ? new Date(header.createdAt).toLocaleString() : '-'}`);
      if (header.createdBy) {
        ux.stdout(`Created by: ${header.createdBy}`);
      }
    }

    // Under --json, emit the backend's native header response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
