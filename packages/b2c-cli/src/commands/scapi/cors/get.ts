/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CorsClientPreferences} from '@salesforce/b2c-tooling-sdk/clients';
import {ScapiCorsCommand, getApiErrorMessage} from '../../../utils/scapi/cors.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the get command.
 */
interface CorsGetOutput {
  siteId: string;
  corsClientPreferences: CorsClientPreferences[];
}

const COLUMNS: Record<string, ColumnDef<CorsClientPreferences>> = {
  clientId: {
    header: 'Client ID',
    get: (p) => p.clientId,
  },
  origins: {
    header: 'Allowed Origins',
    get: (p) => (p.origins.length > 0 ? p.origins.join(', ') : '(none)'),
  },
};

const DEFAULT_COLUMNS = ['clientId', 'origins'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to get CORS preferences for a site.
 */
export default class ScapiCorsGet extends ScapiCorsCommand<typeof ScapiCorsGet> {
  static description = withDocs(
    t('commands.scapi.cors.get.description', 'Get CORS preferences for a site'),
    '/cli/scapi-cors.html#b2c-scapi-cors-get',
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
      description: t('flags.siteId.description', 'The site ID to retrieve CORS preferences for'),
      env: 'SFCC_SITE_ID',
    }),
  };

  protected getProgressMessage(): string {
    return t('commands.scapi.cors.get.fetching', 'Fetching CORS preferences...');
  }

  async run(): Promise<CorsGetOutput> {
    this.requireOAuthCredentials();

    const siteId = this.requireSiteId();
    const client = this.getCorsClient();
    const organizationId = this.getOrganizationId();

    const {data, error, response} = await client.GET('/organizations/{organizationId}/cors', {
      params: {
        path: {organizationId},
        query: {siteId},
      },
    });

    if (error) {
      this.error(
        t('commands.scapi.cors.get.error', 'Failed to fetch CORS preferences: {{message}}', {
          message: getApiErrorMessage(error, response),
        }),
      );
    }

    const preferences = data?.corsClientPreferences ?? [];
    const output: CorsGetOutput = {siteId, corsClientPreferences: preferences};

    if (this.jsonEnabled()) {
      return output;
    }

    if (preferences.length === 0) {
      this.log(
        t('commands.scapi.cors.get.noPreferences', 'No CORS preferences configured for site {{siteId}}.', {siteId}),
      );
      return output;
    }

    this.log(
      t('commands.scapi.cors.get.count', 'Found {{count}} client configuration(s) for site {{siteId}}:', {
        count: preferences.length,
        siteId,
      }),
    );
    this.log('');
    tableRenderer.render(preferences, DEFAULT_COLUMNS);

    return output;
  }
}
