/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {
  SlasClientCommand,
  type Client,
  type ClientRequest,
  type ClientOutput,
  normalizeClientResponse,
  printClientDetails,
  formatApiError,
} from '../../../utils/slas/client.js';
import {t} from '../../../i18n/index.js';

export default class SlasClientUpdate extends SlasClientCommand<typeof SlasClientUpdate> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to update',
      required: true,
    }),
  };

  static description = t('commands.slas.client.update.description', 'Update a SLAS client');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --name "New Name"',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --secret new-secret-value',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --scopes sfcc.shopper-baskets',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --scopes sfcc.shopper-baskets --replace',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --channels RefArch,SiteGenesis --replace',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    name: Flags.string({
      description: 'Display name for the client',
    }),
    secret: Flags.string({
      description: 'New client secret (rotates the existing secret)',
    }),
    channels: Flags.string({
      description: 'Site IDs/channels (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    scopes: Flags.string({
      description: 'OAuth scopes for the client (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'redirect-uri': Flags.string({
      description: 'Redirect URIs (comma-separated)',
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
    replace: Flags.boolean({
      description: 'Replace list values instead of appending (affects channels, scopes, redirect-uri, callback-uri)',
      default: false,
    }),
  };

  async run(): Promise<ClientOutput> {
    this.requireOAuthCredentials();

    const {
      'tenant-id': tenantId,
      name,
      secret,
      channels,
      scopes,
      'redirect-uri': redirectUri,
      'callback-uri': callbackUri,
      replace,
    } = this.flags;
    const {clientId} = this.args;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.update.fetching', 'Fetching SLAS client {{clientId}}...', {clientId}));
    }

    const slasClient = this.getSlasClient();

    // First, fetch the existing client
    const {data: existingData, error: getError} = await slasClient.GET('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
    });

    if (getError) {
      this.error(
        t('commands.slas.client.update.fetchError', 'Failed to fetch SLAS client: {{message}}', {
          message: formatApiError(getError),
        }),
      );
    }

    const existing = existingData as Client;

    // Normalize existing scopes (API returns space-separated string)
    const existingScopes =
      typeof existing.scopes === 'string'
        ? (existing.scopes as string).split(' ')
        : Array.isArray(existing.scopes)
          ? existing.scopes
          : [];

    // Normalize existing redirectUri (ensure array) - API returns string or array
    const existingRedirectUri = Array.isArray(existing.redirectUri)
      ? existing.redirectUri
      : typeof existing.redirectUri === 'string'
        ? [existing.redirectUri]
        : [];

    // oclif handles comma-separation via delimiter option
    const newChannels = channels ?? [];
    const newScopes = scopes ?? [];
    const newRedirectUri = redirectUri ?? [];
    const newCallbackUri = callbackUri ?? [];

    // Merge or replace values
    const mergedChannels = replace ? newChannels : [...new Set([...(existing.channels ?? []), ...newChannels])];
    const mergedScopes = replace ? newScopes : [...new Set([...existingScopes, ...newScopes])];
    const mergedRedirectUri = replace ? newRedirectUri : [...new Set([...existingRedirectUri, ...newRedirectUri])];
    // Handle callbackUri - existing value is comma-separated string from API
    const existingCallbackUri = existing.callbackUri?.split(',').map((s) => s.trim()) ?? [];
    const mergedCallbackUri = callbackUri
      ? replace
        ? newCallbackUri
        : [...new Set([...existingCallbackUri, ...newCallbackUri])]
      : existingCallbackUri.length > 0
        ? existingCallbackUri
        : undefined;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.update.updating', 'Updating SLAS client {{clientId}}...', {clientId}));
    }

    // Build request body - only include secret if provided (to rotate it)
    const body: Partial<ClientRequest> = {
      clientId,
      name: name ?? existing.name ?? '',
      channels: channels ? mergedChannels : (existing.channels ?? []),
      scopes: scopes ? mergedScopes : existingScopes,
      redirectUri: redirectUri ? mergedRedirectUri : existingRedirectUri,
      callbackUri: mergedCallbackUri,
      isPrivateClient: existing.isPrivateClient ?? true,
    };

    if (secret) {
      body.secret = secret;
    }

    // Update the client
    const {data, error} = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
      body: body as ClientRequest,
    });

    if (error) {
      this.error(
        t('commands.slas.client.update.error', 'Failed to update SLAS client: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output = normalizeClientResponse(data as Client);

    if (this.jsonEnabled()) {
      return output;
    }

    this.log(t('commands.slas.client.update.success', 'SLAS client updated successfully.'));
    // Show secret in output only if it was rotated
    printClientDetails(output, Boolean(secret));

    return output;
  }
}
