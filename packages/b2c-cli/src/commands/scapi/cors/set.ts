/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import type {CorsClientPreferences, CorsPreferences} from '@salesforce/b2c-tooling-sdk/clients';
import {ScapiCorsCommand, getApiErrorMessage} from '../../../utils/scapi/cors.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the set command.
 */
interface CorsSetOutput {
  siteId: string;
  corsClientPreferences: CorsClientPreferences[];
}

/**
 * Command to create or replace all CORS preferences for a site.
 */
export default class ScapiCorsSet extends ScapiCorsCommand<typeof ScapiCorsSet> {
  static description = withDocs(
    t('commands.scapi.cors.set.description', 'Create or replace all CORS preferences for a site'),
    '/cli/scapi-cors.html#b2c-scapi-cors-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --site-id RefArch --client-id abc123 --origins http://foo.com,https://bar.com',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --site-id RefArch --client-id abc123 --origins ""',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --site-id RefArch --client-id abc123 --origins http://foo.com --json',
  ];

  static flags = {
    ...ScapiCorsCommand.baseFlags,
    'site-id': Flags.string({
      char: 's',
      description: t('flags.siteId.description', 'The site ID to configure CORS preferences for'),
      env: 'SFCC_SITE_ID',
    }),
    // Overrides the OAuth --client-id base flag. The same client ID is used for both
    // OAuth authentication (must have sfcc.cors-preferences.rw scope) and as the CORS
    // body target — per the CORS Preferences API spec, these are the same client.
    'client-id': Flags.string({
      description: t(
        'commands.scapi.cors.set.clientIdFlag',
        'The Account Manager client ID to configure CORS origins for (also used as the OAuth credential)',
      ),
      env: 'SFCC_CLIENT_ID',
      helpGroup: 'AUTH',
      required: true,
    }),
    origins: Flags.string({
      description: t(
        'commands.scapi.cors.set.originsFlag',
        "Comma-separated list of allowed origins in '<scheme>://<domain>.<tld>' format. Use empty string to allow known domains only.",
      ),
      default: '',
    }),
  };

  protected getProgressMessage(): string {
    return t('commands.scapi.cors.set.setting', 'Setting CORS preferences...');
  }

  async run(): Promise<CorsSetOutput> {
    this.requireOAuthCredentials();

    const siteId = this.requireSiteId();
    const {'client-id': clientId, origins: originsRaw} = this.flags;

    if (!/^[-a-zA-Z0-9]+$/.test(clientId!)) {
      this.error(
        t(
          'commands.scapi.cors.set.clientIdInvalid',
          'client-id must contain only letters, numbers, and hyphens (got "{{clientId}}").',
          {clientId},
        ),
      );
    }

    const origins = originsRaw
      ? originsRaw
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : [];

    const originPattern = /^[a-zA-Z_0-9][-.+a-zA-Z_0-9]+:\/\/[-.a-zA-Z_0-9]{1,253}$/;
    const invalidOrigins = origins.filter((o) => !originPattern.test(o));
    if (invalidOrigins.length > 0) {
      this.error(
        t(
          'commands.scapi.cors.set.originsInvalid',
          "Invalid origins (must be '<scheme>://<domain>.<tld>' without port or path): {{origins}}",
          {origins: invalidOrigins.join(', ')},
        ),
      );
    }

    const body: CorsPreferences = {
      corsClientPreferences: [{clientId: clientId!, origins}],
    };

    const client = this.getCorsClient();
    const organizationId = this.getOrganizationId();

    const {data, error, response} = await client.PUT('/organizations/{organizationId}/cors', {
      params: {
        path: {organizationId},
        query: {siteId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.scapi.cors.set.error', 'Failed to set CORS preferences: {{message}}', {
          message: getApiErrorMessage(error, response),
        }),
      );
    }

    const preferences = data?.corsClientPreferences ?? [];
    const output: CorsSetOutput = {siteId, corsClientPreferences: preferences};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log(
      t('commands.scapi.cors.set.success', 'CORS preferences for site {{siteId}} updated successfully.', {siteId}),
    );

    return output;
  }
}
