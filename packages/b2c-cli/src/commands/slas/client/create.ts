/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {randomUUID} from 'node:crypto';
import {
  SlasClientCommand,
  clientSettingFlags,
  clientSettingsFromFlags,
  type Client,
  type ClientOutput,
  normalizeClientResponse,
  printClientDetails,
  formatApiError,
} from '../../../utils/slas/client.js';
import {t, withDocs} from '../../../i18n/index.js';

const DEFAULT_SCOPES = [
  'sfcc.shopper-baskets-orders.rw',
  'sfcc.shopper-categories',
  'sfcc.shopper-customers.login',
  'sfcc.shopper-customers.register',
  'sfcc.shopper-discovery-search',
  'sfcc.shopper-experience',
  'sfcc.shopper-gift-certificates',
  'sfcc.shopper-myaccount.addresses.rw',
  'sfcc.shopper-myaccount.baskets',
  'sfcc.shopper-myaccount.orders',
  'sfcc.shopper-myaccount.paymentinstruments.rw',
  'sfcc.shopper-myaccount.productlists.rw',
  'sfcc.shopper-myaccount.rw',
  'sfcc.shopper-configurations',
  'sfcc.shopper-product-search',
  'sfcc.shopper-productlists',
  'sfcc.shopper-products',
  'sfcc.shopper-promotions',
  'sfcc.shopper-stores',
];

export default class SlasClientCreate extends SlasClientCommand<typeof SlasClientCreate> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to create or update (generates UUID if omitted)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.slas.client.create.description', 'Create or update a SLAS client'),
    '/cli/slas.html#b2c-slas-client-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --channels RefArch --scopes sfcc.shopper-products,sfcc.shopper-search --redirect-uri http://localhost:3000/callback',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --name "My Client" --channels RefArch --scopes sfcc.shopper-products --redirect-uri http://localhost:3000/callback --public',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --name "My Client" --channels RefArch --scopes sfcc.shopper-products --redirect-uri http://localhost:3000/callback --json',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --channels RefArch --default-scopes --redirect-uri http://localhost:3000/callback',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --channels RefArch --default-scopes --redirect-uri http://localhost:3000/callback --six-digit-otp --strict-client-auth',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    name: Flags.string({
      description: 'Display name for the client (generates timestamped name if omitted)',
    }),
    channels: Flags.string({
      description: 'Site IDs/channels (comma-separated)',
      required: true,
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    scopes: Flags.string({
      description: 'OAuth scopes for the client (comma-separated)',
      required: false,
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'default-scopes': Flags.boolean({
      description: 'Use default shopper scopes (can be combined with --scopes for additional scopes)',
      default: false,
    }),
    'redirect-uri': Flags.string({
      description: 'Redirect URIs (comma-separated)',
      required: true,
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'callback-uri': Flags.string({
      description: 'Callback URIs for passwordless login (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    secret: Flags.string({
      description: 'Client secret for private clients (if omitted, one will be generated)',
    }),
    public: Flags.boolean({
      description: 'Create a public client (default is private)',
      default: false,
    }),
    'create-tenant': Flags.boolean({
      description: 'Automatically create tenant if it does not exist',
      default: true,
      allowNo: true,
    }),
    ...clientSettingFlags,
  };

  async run(): Promise<ClientOutput> {
    this.requireOAuthCredentials();

    const {
      name,
      channels,
      scopes,
      'default-scopes': useDefaultScopes,
      'redirect-uri': redirectUri,
      'callback-uri': callbackUri,
      secret,
      public: isPublic,
      'create-tenant': createTenant,
    } = this.flags;
    const tenantId = this.requireTenantId();
    const settings = clientSettingsFromFlags(this.flags);

    if (isPublic && settings.strictClientAuth) {
      this.warn(
        t(
          'commands.slas.client.strictClientAuthPublic',
          '--strict-client-auth applies only to private clients; SLAS ignores it for public clients.',
        ),
      );
    }

    // Validate that either --scopes or --default-scopes is provided
    if (!scopes && !useDefaultScopes) {
      this.error(
        t('commands.slas.client.create.scopesRequired', 'Either --scopes or --default-scopes must be provided'),
      );
    }

    // Use provided client ID or generate a UUID
    const clientId = this.args.clientId ?? randomUUID().toLowerCase();

    // Use provided name or generate a timestamped name
    const clientName = name ?? `b2c-cli client ${new Date().toISOString()}`;

    // oclif handles comma-separation via delimiter option
    const parsedChannels = channels;
    const parsedScopes = useDefaultScopes ? [...new Set([...(scopes ?? []), ...DEFAULT_SCOPES])] : scopes!;
    const parsedRedirectUri = redirectUri;
    const parsedCallbackUri = callbackUri;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.create.creating', 'Creating/updating SLAS client {{clientId}}...', {clientId}));
    }

    const slasClient = this.getSlasClient();

    // Ensure tenant exists before creating client (if enabled)
    if (createTenant) {
      await this.ensureTenantExists(slasClient, tenantId);
    }

    // Build body - secret should only be included for private clients
    const body: Record<string, unknown> = {
      clientId,
      name: clientName,
      channels: parsedChannels,
      scopes: parsedScopes,
      redirectUri: parsedRedirectUri,
      callbackUri: parsedCallbackUri,
      isPrivateClient: !isPublic,
      ...settings,
    };

    // Only include secret for private clients
    if (!isPublic) {
      body.secret = secret ?? `sk_${randomUUID().replaceAll('-', '')}`;
    }

    const {data, error, response} = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: body as any,
    });

    if (error) {
      this.error(
        t('commands.slas.client.create.error', 'Failed to create/update SLAS client: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    let client = data as Client;
    const wasCreated = response.status === 201;

    // SLAS ignores loginEpRestrict when a client is first created; apply it with a follow-up update.
    if (settings.loginEpRestrict !== undefined && (client.loginEpRestrict ?? false) !== settings.loginEpRestrict) {
      this.logger.debug({clientId}, 'Applying loginEpRestrict with a follow-up update');
      const followUp = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
        params: {path: {tenantId, clientId}},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: body as any,
      });
      if (followUp.error) {
        // Warn instead of failing: the client exists, and its generated secret is shown only in this output.
        this.warn(
          t(
            'commands.slas.client.create.loginRestrictError',
            'SLAS client {{clientId}} was saved, but setting login restriction failed: {{message}}. Retry with "b2c slas client update {{clientId}} --login-restricted".',
            {clientId, message: formatApiError(followUp.error, followUp.response)},
          ),
        );
      } else {
        client = {...client, ...(followUp.data as Client), secret: client.secret};
      }
    }

    const output = normalizeClientResponse(client);
    // Use our parsed values as fallback if API doesn't return them
    if (output.scopes.length === 0) output.scopes = parsedScopes;
    if (output.channels.length === 0) output.channels = parsedChannels;
    if (!output.redirectUri) output.redirectUri = parsedRedirectUri.join(', ');

    if (this.jsonEnabled()) {
      return output;
    }

    // Human-readable output
    if (wasCreated) {
      this.log(t('commands.slas.client.create.created', 'SLAS client created successfully.'));
    } else {
      this.log(t('commands.slas.client.create.updated', 'SLAS client updated successfully.'));
    }

    printClientDetails(output);

    return output;
  }
}
