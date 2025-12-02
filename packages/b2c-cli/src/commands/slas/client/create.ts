import {Args, Flags} from '@oclif/core';
import {randomUUID} from 'node:crypto';
import {
  SlasClientCommand,
  type Client,
  type ClientOutput,
  parseMultiple,
  normalizeClientResponse,
  printClientDetails,
  formatApiError,
} from '../../../utils/slas/client.js';
import {t} from '../../../i18n/index.js';

export default class SlasClientCreate extends SlasClientCommand<typeof SlasClientCreate> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to create or update (generates UUID if omitted)',
      required: false,
    }),
  };

  static description = t('commands.slas.client.create.description', 'Create or update a SLAS client');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --channels RefArch --scopes sfcc.shopper-products,sfcc.shopper-search --redirect-uri http://localhost:3000/callback',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --name "My Client" --channels RefArch --scopes sfcc.shopper-products --redirect-uri http://localhost:3000/callback --public',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --name "My Client" --channels RefArch --scopes sfcc.shopper-products --redirect-uri http://localhost:3000/callback --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    name: Flags.string({
      description: 'Display name for the client (generates timestamped name if omitted)',
    }),
    channels: Flags.string({
      description: 'Site IDs/channels (comma-separated or multiple flags)',
      required: true,
      multiple: true,
    }),
    scopes: Flags.string({
      description: 'OAuth scopes for the client (comma-separated or multiple flags)',
      required: true,
      multiple: true,
    }),
    'redirect-uri': Flags.string({
      description: 'Redirect URIs (comma-separated or multiple flags)',
      required: true,
      multiple: true,
    }),
    'callback-uri': Flags.string({
      description: 'Callback URIs for passwordless login (comma-separated or multiple flags)',
      multiple: true,
    }),
    secret: Flags.string({
      description: 'Client secret for private clients (if omitted, one will be generated)',
    }),
    public: Flags.boolean({
      description: 'Create a public client (default is private)',
      default: false,
    }),
  };

  async run(): Promise<ClientOutput> {
    this.requireOAuthCredentials();

    const {
      'tenant-id': tenantId,
      name,
      channels,
      scopes,
      'redirect-uri': redirectUri,
      'callback-uri': callbackUri,
      secret,
      public: isPublic,
    } = this.flags;

    // Use provided client ID or generate a UUID
    const clientId = this.args.clientId ?? randomUUID().toLowerCase();

    // Use provided name or generate a timestamped name
    const clientName = name ?? `b2c-cli client ${new Date().toISOString()}`;

    const parsedChannels = parseMultiple(channels);
    const parsedScopes = parseMultiple(scopes);
    const parsedRedirectUri = parseMultiple(redirectUri);
    const parsedCallbackUri = callbackUri ? parseMultiple(callbackUri) : undefined;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.create.creating', 'Creating/updating SLAS client {{clientId}}...', {clientId}));
    }

    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
      body: {
        clientId,
        name: clientName,
        channels: parsedChannels,
        scopes: parsedScopes,
        redirectUri: parsedRedirectUri,
        callbackUri: parsedCallbackUri,
        // For private clients, use provided secret or generate one with sk_ prefix
        // For public clients, secret is ignored but still required by the schema
        secret: secret ?? (isPublic ? '' : `sk_${randomUUID().replaceAll('-', '')}`),
        isPrivateClient: !isPublic,
      },
    });

    if (error) {
      this.error(
        t('commands.slas.client.create.error', 'Failed to create/update SLAS client: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const client = data as Client;
    const wasCreated = response.status === 201;

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
