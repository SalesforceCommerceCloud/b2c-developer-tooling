/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {password as passwordPrompt} from '@inquirer/prompts';
import {loadConfig, extractOAuthFlags} from '@salesforce/b2c-tooling-sdk/cli';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {toOrganizationId, decodeJWT} from '@salesforce/b2c-tooling-sdk';
import {getGuestToken, getRegisteredToken, type SlasTokenConfig} from '@salesforce/b2c-tooling-sdk/slas';
import {SlasClientCommand, normalizeClientResponse, parseRedirectUris, type Client} from '../../utils/slas/client.js';
import {t, withDocs} from '../../i18n/index.js';

const DEFAULT_REDIRECT_URI = 'http://localhost:3000/callback';

/**
 * JSON output structure for slas token command.
 */
interface SlasTokenJsonOutput {
  response: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    usid: string;
    customerId: string;
  };
  decodedJWT?: Record<string, unknown>;
  clientId: string;
  siteId: string;
  isGuest: boolean;
}

export default class SlasToken extends SlasClientCommand<typeof SlasToken> {
  static description = withDocs(
    t('commands.slas.token.description', 'Get a SLAS shopper access token'),
    '/cli/slas.html#b2c-slas-token',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --slas-client-id my-client --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --slas-client-id my-client --slas-client-secret sk_xxx --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --site-id RefArch --shopper-login user@example.com --shopper-password secret',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --site-id RefArch --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    'slas-client-id': Flags.string({
      description: 'SLAS client ID (auto-discovered if omitted)',
      env: 'SFCC_SLAS_CLIENT_ID',
    }),
    'slas-client-secret': Flags.string({
      description: 'SLAS client secret (omit for public clients)',
      env: 'SFCC_SLAS_CLIENT_SECRET',
    }),
    'site-id': Flags.string({
      description: 'Site/channel ID',
      env: 'SFCC_SITE_ID',
    }),
    'redirect-uri': Flags.string({
      description: `Redirect URI (default: ${DEFAULT_REDIRECT_URI})`,
    }),
    'shopper-login': Flags.string({
      description: 'Registered customer login (triggers registered flow)',
    }),
    'shopper-password': Flags.string({
      description: 'Registered customer password (prompted if not provided)',
    }),
  };

  protected override loadConfiguration(): ResolvedB2CConfig {
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

  async run(): Promise<SlasTokenJsonOutput> {
    const config = this.resolvedConfig.values;
    const tenantId = this.requireTenantId();

    let slasClientId = config.slasClientId;
    const slasClientSecret = config.slasClientSecret;
    let siteId = config.siteId;
    let redirectUri = this.flags['redirect-uri'] as string | undefined;

    // Auto-discover SLAS client if not provided
    if (!slasClientId) {
      slasClientId = await this.autoDiscoverClient(tenantId, {
        siteId,
        redirectUri,
        onDiscovered(discovered) {
          if (!siteId && discovered.siteId) siteId = discovered.siteId;
          if (!redirectUri && discovered.redirectUri) redirectUri = discovered.redirectUri;
        },
      });
    }

    // Validate required fields
    if (!siteId) {
      this.error(
        t(
          'commands.slas.token.siteIdRequired',
          'site-id is required. Provide via --site-id flag, SFCC_SITE_ID env var, or site-id in dw.json.',
        ),
      );
    }

    const {shortCode} = config;
    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ),
      );
    }

    redirectUri = redirectUri ?? DEFAULT_REDIRECT_URI;

    const tokenConfig: SlasTokenConfig = {
      shortCode,
      organizationId: toOrganizationId(tenantId),
      slasClientId,
      slasClientSecret,
      siteId,
      redirectUri,
    };

    const shopperLogin = this.flags['shopper-login'] as string | undefined;
    const isRegistered = Boolean(shopperLogin);

    if (isRegistered) {
      const shopperPassword = await this.getShopperPassword();

      if (!this.jsonEnabled()) {
        this.log(t('commands.slas.token.fetchingRegistered', 'Fetching registered customer token...'));
      }

      const tokenResponse = await getRegisteredToken({
        ...tokenConfig,
        shopperLogin: shopperLogin!,
        shopperPassword,
      });
      const decodedJWT = this.decodeAndLogToken(tokenResponse.access_token);

      const output: SlasTokenJsonOutput = {
        response: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresIn: tokenResponse.expires_in,
          tokenType: tokenResponse.token_type,
          usid: tokenResponse.usid,
          customerId: tokenResponse.customer_id,
        },
        ...(decodedJWT && {decodedJWT}),
        clientId: slasClientId,
        siteId,
        isGuest: false,
      };

      if (this.jsonEnabled()) return output;
      ux.stdout(tokenResponse.access_token);
      return output;
    }

    // Guest flow
    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.token.fetchingGuest', 'Fetching guest shopper token...'));
    }

    const tokenResponse = await getGuestToken(tokenConfig);
    const decodedJWT = this.decodeAndLogToken(tokenResponse.access_token);

    const output: SlasTokenJsonOutput = {
      response: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type,
        usid: tokenResponse.usid,
        customerId: tokenResponse.customer_id,
      },
      ...(decodedJWT && {decodedJWT}),
      clientId: slasClientId,
      siteId,
      isGuest: true,
    };

    if (this.jsonEnabled()) return output;
    ux.stdout(tokenResponse.access_token);
    return output;
  }

  /**
   * Auto-discover a public SLAS client for the given tenant.
   */
  private async autoDiscoverClient(
    tenantId: string,
    options: {
      siteId?: string;
      redirectUri?: string;
      onDiscovered: (result: {siteId?: string; redirectUri?: string}) => void;
    },
  ): Promise<string> {
    // Admin API access is needed for auto-discovery
    this.requireOAuthCredentials();

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.slas.token.discovering', 'Auto-discovering SLAS client for tenant {{tenantId}}...', {tenantId}),
      );
    }

    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.GET('/tenants/{tenantId}/clients', {
      params: {path: {tenantId}},
    });

    if (error) {
      this.error(
        t('commands.slas.token.discoveryError', 'Failed to list SLAS clients for auto-discovery: {{message}}', {
          message: `HTTP ${response.status}`,
        }),
      );
    }

    const clients = ((data as {data?: Client[]})?.data ?? []).map((c) => normalizeClientResponse(c));

    // Find first public client
    const publicClient = clients.find((c) => !c.isPrivateClient);
    if (!publicClient) {
      this.error(
        t(
          'commands.slas.token.noPublicClient',
          'No public SLAS client found for tenant {{tenantId}}. Create one with `b2c slas client create --public` or provide --slas-client-id.',
          {tenantId},
        ),
      );
    }

    this.logger.debug({clientId: publicClient.clientId, name: publicClient.name}, 'Auto-discovered public SLAS client');

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.slas.token.discovered', 'Using SLAS client: {{clientId}} ({{name}})', {
          clientId: publicClient.clientId,
          name: publicClient.name,
        }),
      );
    }

    // Populate siteId and redirectUri from client config if not already set
    const discovered: {siteId?: string; redirectUri?: string} = {};
    if (!options.siteId && publicClient.channels.length > 0) {
      discovered.siteId = publicClient.channels[0];
    }
    if (!options.redirectUri && publicClient.redirectUri) {
      const uris = parseRedirectUris(publicClient.redirectUri);
      if (uris.length > 0) {
        discovered.redirectUri = uris[0];
      }
    }
    options.onDiscovered(discovered);

    return publicClient.clientId;
  }

  private decodeAndLogToken(accessToken: string): Record<string, unknown> | undefined {
    try {
      const jwt = decodeJWT(accessToken);
      this.logger.debug({jwt: jwt.payload}, '[SLAS] JWT payload');
      return jwt.payload as Record<string, unknown>;
    } catch {
      this.logger.debug('[SLAS] Error decoding JWT (token may not be a JWT)');
      return undefined;
    }
  }

  /**
   * Get shopper password from flag or interactive prompt.
   */
  private async getShopperPassword(): Promise<string> {
    const flagPassword = this.flags['shopper-password'] as string | undefined;
    if (flagPassword) return flagPassword;

    if (!process.stdin.isTTY) {
      this.error(
        t(
          'commands.slas.token.passwordRequired',
          'Shopper password is required. Provide --shopper-password when stdin is not a TTY.',
        ),
      );
    }

    return passwordPrompt({
      message: 'Enter shopper password:',
    });
  }
}
