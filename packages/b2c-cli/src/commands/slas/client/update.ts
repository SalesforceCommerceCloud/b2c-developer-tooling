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
import {t, withDocs} from '../../../i18n/index.js';

export default class SlasClientUpdate extends SlasClientCommand<typeof SlasClientUpdate> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to update',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.slas.client.update.description', 'Update a SLAS client'),
    '/cli/slas.html#b2c-slas-client-update',
  );

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
      name,
      secret,
      channels,
      scopes,
      'redirect-uri': redirectUri,
      'callback-uri': callbackUri,
      replace,
    } = this.flags;
    const {clientId} = this.args;
    const tenantId = this.requireTenantId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.update.fetching', 'Fetching SLAS client {{clientId}}...', {clientId}));
    }

    const slasClient = this.getSlasClient();

    // First, fetch the existing client
    const {
      data: existingData,
      error: getError,
      response: getResponse,
    } = await slasClient.GET('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
    });

    if (getError) {
      this.error(
        t('commands.slas.client.update.fetchError', 'Failed to fetch SLAS client: {{message}}', {
          message: formatApiError(getError, getResponse),
        }),
      );
    }

    const existing = existingData as Client;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.update.updating', 'Updating SLAS client {{clientId}}...', {clientId}));
    }

    // Build request body with merged values
    const body = this.buildUpdateRequest(existing, {
      clientId,
      name,
      secret,
      channels: channels ?? [],
      scopes: scopes ?? [],
      redirectUri: redirectUri ?? [],
      callbackUri: callbackUri ?? [],
      replace,
    });

    // Update the client
    const {data, error, response} = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
      body: body as ClientRequest,
    });

    if (error) {
      this.error(
        t('commands.slas.client.update.error', 'Failed to update SLAS client: {{message}}', {
          message: formatApiError(error, response),
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

  /**
   * Build the update request body with merged values.
   */
  private buildUpdateRequest(
    existing: Client,
    updates: {
      clientId: string;
      name?: string;
      secret?: string;
      channels: string[];
      scopes: string[];
      redirectUri: string[];
      callbackUri: string[];
      replace: boolean;
    },
  ): Partial<ClientRequest> {
    const existingScopes = this.normalizeScopes(existing.scopes);
    const existingRedirectUri = this.normalizeUriArray(existing.redirectUri);
    const existingCallbackUri = this.normalizeCallbackUri(existing.callbackUri);

    // Determine merged values
    const mergedChannels = this.mergeArrayValues(existing.channels ?? [], updates.channels, updates.replace);
    const mergedScopes = this.mergeArrayValues(existingScopes, updates.scopes, updates.replace);
    const mergedRedirectUri = this.mergeArrayValues(existingRedirectUri, updates.redirectUri, updates.replace);
    const mergedCallbackUri = this.computeCallbackUri(existingCallbackUri, updates.callbackUri, updates.replace);

    const body: Partial<ClientRequest> = {
      clientId: updates.clientId,
      name: updates.name ?? existing.name ?? '',
      channels: updates.channels.length > 0 ? mergedChannels : (existing.channels ?? []),
      scopes: updates.scopes.length > 0 ? mergedScopes : existingScopes,
      redirectUri: updates.redirectUri.length > 0 ? mergedRedirectUri : existingRedirectUri,
      callbackUri: mergedCallbackUri,
      isPrivateClient: existing.isPrivateClient ?? true,
    };

    if (updates.secret) {
      body.secret = updates.secret;
    }

    return body;
  }

  /**
   * Compute callback URI value, handling the special case where no new values means keeping existing.
   */
  private computeCallbackUri(existing: string[], updated: string[], replace: boolean): string[] | undefined {
    if (updated.length > 0) {
      return this.mergeArrayValues(existing, updated, replace);
    }
    return existing.length > 0 ? existing : undefined;
  }

  /**
   * Merge array values, optionally replacing or appending with deduplication.
   */
  private mergeArrayValues(existing: string[], updated: string[], replace: boolean): string[] {
    return replace ? updated : [...new Set([...existing, ...updated])];
  }

  /**
   * Normalize callback URI from API response (comma-separated string).
   */
  private normalizeCallbackUri(value: string | undefined): string[] {
    return value ? value.split(',').map((s) => s.trim()) : [];
  }

  /**
   * Normalize scopes from API response (may be space-separated string or array).
   */
  private normalizeScopes(scopes: string | string[] | undefined): string[] {
    if (typeof scopes === 'string') {
      return scopes.split(' ');
    }
    return Array.isArray(scopes) ? scopes : [];
  }

  /**
   * Normalize URI values from API response (may be pipe-delimited string or array).
   */
  private normalizeUriArray(value: string | string[] | undefined): string[] {
    if (Array.isArray(value)) {
      return value.flatMap((uri) => (typeof uri === 'string' ? uri.split('|').map((s) => s.trim()) : []));
    }
    return typeof value === 'string' ? value.split('|').map((s) => s.trim()) : [];
  }
}
