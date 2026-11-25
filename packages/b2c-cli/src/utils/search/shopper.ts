/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {ERROR_CODE, OAuthCommand, extractOAuthFlags, loadConfig} from '@salesforce/b2c-tooling-sdk/cli';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {createShopperSearchClient, toOrganizationId, type ShopperSearchClient} from '@salesforce/b2c-tooling-sdk';
import {getGuestToken} from '@salesforce/b2c-tooling-sdk/slas';
import {t} from '../../i18n/index.js';

const DEFAULT_REDIRECT_URI = 'http://localhost:3000/callback';

/** A Shopper Search client and the organization, short code and site it searches. */
export interface ShopperSearchConnection {
  client: ShopperSearchClient;
  organizationId: string;
  shortCode: string;
  siteId: string;
}

/**
 * Base command for commands that call the Shopper Search API with a SLAS guest
 * shopper token instead of an Account Manager API client.
 *
 * Adds the `--slas-client-id`, `--slas-client-secret`, `--site-id` and
 * `--redirect-uri` flags, resolves them from configuration, and provides
 * {@link ShopperSearchCommand.connectShopperSearch} to validate the settings,
 * get the guest token and create the client.
 */
export abstract class ShopperSearchCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'slas-client-id': Flags.string({
      description: 'SLAS client ID used to get a guest shopper token',
      env: 'SFCC_SLAS_CLIENT_ID',
      helpGroup: 'SHOPPER',
    }),
    'slas-client-secret': Flags.string({
      description: 'SLAS client secret (omit for public clients)',
      env: 'SFCC_SLAS_CLIENT_SECRET',
      helpGroup: 'SHOPPER',
    }),
    'site-id': Flags.string({
      description: 'Site ID to search',
      env: 'SFCC_SITE_ID',
      helpGroup: 'SHOPPER',
    }),
    'redirect-uri': Flags.string({
      description: `Redirect URI registered on a public SLAS client (default: ${DEFAULT_REDIRECT_URI})`,
      helpGroup: 'SHOPPER',
    }),
  };

  /** The operations the command runs. Tests replace them. */
  protected abstract operations: {getGuestToken: typeof getGuestToken};

  /**
   * Checks the tenant, short code, site and SLAS client settings, gets a guest
   * shopper token and creates the Shopper Search client.
   */
  protected async connectShopperSearch(): Promise<ShopperSearchConnection> {
    const flags = this.flags as Record<string, unknown>;
    const config = this.resolvedConfig.values;
    const tenantId = this.requireTenantId();
    const {shortCode, siteId, slasClientId, slasClientSecret} = config;

    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ) + this.configDocsHint(),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    if (!siteId) {
      this.error(
        t(
          'commands.search.shopper.siteIdRequired',
          'site-id is required. Provide via --site-id flag, SFCC_SITE_ID env var, or site-id in dw.json.',
        ) + this.configDocsHint(),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    if (!slasClientId) {
      this.error(
        t(
          'commands.search.shopper.slasClientIdRequired',
          'A SLAS client ID is required. Provide --slas-client-id, set SFCC_SLAS_CLIENT_ID, or configure slas-client-id in dw.json. List clients with `b2c slas client list`.',
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    const organizationId = toOrganizationId(tenantId);

    if (!this.jsonEnabled()) {
      this.log(t('commands.search.shopper.fetchingToken', 'Fetching guest shopper token...'));
    }
    const token = await this.operations.getGuestToken({
      shortCode,
      organizationId,
      slasClientId,
      slasClientSecret,
      siteId,
      redirectUri: (flags['redirect-uri'] as string | undefined) ?? DEFAULT_REDIRECT_URI,
      selfSignedApi: config.selfSignedApi,
    });

    const client = createShopperSearchClient({
      shortCode,
      getAccessToken: () => token.access_token,
      selfSignedApi: config.selfSignedApi,
    });

    return {client, organizationId, shortCode, siteId};
  }

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const flags = this.flags as Record<string, unknown>;
    return loadConfig(
      {
        ...extractOAuthFlags(flags),
        slasClientId: flags['slas-client-id'] as string | undefined,
        slasClientSecret: flags['slas-client-secret'] as string | undefined,
        siteId: flags['site-id'] as string | undefined,
      },
      this.getBaseConfigOptions(),
    );
  }
}
