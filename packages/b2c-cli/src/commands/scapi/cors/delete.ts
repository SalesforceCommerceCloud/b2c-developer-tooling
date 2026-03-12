/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {ScapiCorsCommand, getApiErrorMessage} from '../../../utils/scapi/cors.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface CorsDeleteOutput {
  siteId: string;
  deleted: boolean;
}

/**
 * Command to delete all CORS preferences for a site.
 */
export default class ScapiCorsDelete extends ScapiCorsCommand<typeof ScapiCorsDelete> {
  static description = withDocs(
    t('commands.scapi.cors.delete.description', 'Delete all CORS preferences for a site'),
    '/cli/scapi-cors.html#b2c-scapi-cors-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --site-id RefArch --json',
  ];

  static flags = {
    ...ScapiCorsCommand.baseFlags,
    'site-id': Flags.string({
      char: 's',
      description: t('flags.siteId.description', 'The site ID to delete CORS preferences for'),
      env: 'SFCC_SITE_ID',
    }),
  };

  protected getProgressMessage(): string {
    return t('commands.scapi.cors.delete.deleting', 'Deleting CORS preferences...');
  }

  async run(): Promise<CorsDeleteOutput> {
    this.requireOAuthCredentials();

    const siteId = this.requireSiteId();
    const client = this.getCorsClient();
    const organizationId = this.getOrganizationId();

    const {error, response} = await client.DELETE('/organizations/{organizationId}/cors', {
      params: {
        path: {organizationId},
        query: {siteId},
      },
    });

    if (error) {
      this.error(
        t('commands.scapi.cors.delete.error', 'Failed to delete CORS preferences: {{message}}', {
          message: getApiErrorMessage(error, response),
        }),
      );
    }

    const output: CorsDeleteOutput = {siteId, deleted: true};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log(
      t('commands.scapi.cors.delete.success', 'CORS preferences for site {{siteId}} deleted successfully.', {
        siteId,
      }),
    );

    return output;
  }
}
