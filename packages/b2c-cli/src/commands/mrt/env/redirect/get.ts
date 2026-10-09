/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getRedirectWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Get a single redirect for an MRT environment.
 */
export default class MrtRedirectGet extends MrtCommand<typeof MrtRedirectGet> {
  static args = {
    identifier: Args.string({
      // Legacy keys a redirect by its source path (from_path); SCAPI keys it by
      // its UUID. Accept whichever the resolved backend expects.
      description: 'Redirect identifier: the source path (legacy) or the redirect UUID (SCAPI)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.redirect.get.description', 'Get a redirect for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-redirect-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> /old-page --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> 3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d -p my-storefront -e staging --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    getRedirectWithBackend,
  };

  async run(): Promise<unknown> {
    const {identifier} = this.args;
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

    const result = await this.operations.getRedirectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      identifier,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Getting redirect via backend'),
    });

    if (!this.jsonEnabled()) {
      const {redirect} = result;
      ux.stdout(`ID:          ${redirect.id || '-'}`);
      ux.stdout(`From:        ${redirect.source || '-'}`);
      ux.stdout(`To:          ${redirect.destination || '-'}`);
      ux.stdout(`HTTP:        ${redirect.httpStatusCode ?? 301}`);
      ux.stdout(`Forward QS:  ${redirect.forwardQuerystring ? 'Yes' : 'No'}`);
      ux.stdout(`Forward WC:  ${redirect.forwardWildcard ? 'Yes' : 'No'}`);
      ux.stdout(`Status:      ${redirect.status ?? '-'}`);
      ux.stdout(`Created:     ${redirect.createdAt ? new Date(redirect.createdAt).toLocaleString() : '-'}`);
      if (redirect.createdBy) {
        ux.stdout(`Created by:  ${redirect.createdBy}`);
      }
    }

    // Under --json, emit the backend's native redirect response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
