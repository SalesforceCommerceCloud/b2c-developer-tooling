/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {readFile} from 'node:fs/promises';
import {Command, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {ERROR_CODE, OAuthCommand, loadConfig, extractOAuthFlags} from '@salesforce/b2c-tooling-sdk/cli';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {
  createSlasClient,
  getApiErrorMessage,
  getDefaultPublicClientId,
  getLegacyImplicitPublicClientId,
  type SlasClient,
  type SlasComponents,
} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

export type Client = SlasComponents['schemas']['Client'];
export type ClientRequest = SlasComponents['schemas']['ClientRequest'];

/**
 * JSON output structure for SLAS client commands
 */
export interface ClientOutput {
  clientId: string;
  name: string;
  secret?: string;
  scopes: string[];
  channels: string[];
  redirectUri: string;
  callbackUri?: string;
  isPrivateClient: boolean;
  /** Whether calls to the SLAS `/login` endpoint are rejected (403) for this client. */
  loginEpRestrict: boolean;
  /** Whether passwordless, password reset and WebAuthn OTPs are 6 digits instead of 8. */
  isSixDigitOtp: boolean;
  /** Whether `/oauth2/login` and `/oauth2/authorize` require the `x-slas-client-auth` header (private clients only). */
  strictClientAuth: boolean;
}

/**
 * Optional client settings that map one-to-one onto SLAS client request fields.
 */
export interface ClientSettings {
  isSixDigitOtp?: boolean;
  loginEpRestrict?: boolean;
  strictClientAuth?: boolean;
}

/**
 * Flags for client settings, shared by `slas client create` and `slas client update`.
 * Each flag is tri-state: omitted leaves the setting unchanged.
 */
export const clientSettingFlags = {
  'six-digit-otp': Flags.boolean({
    description: 'Use 6-digit OTPs for passwordless login, password reset and WebAuthn (default is 8 digits)',
    allowNo: true,
  }),
  'login-restricted': Flags.boolean({
    description: 'Reject calls to the SLAS /login endpoint for this client (for IDP-only login)',
    allowNo: true,
  }),
  'strict-client-auth': Flags.boolean({
    description: 'Require the x-slas-client-auth header on /oauth2/login and /oauth2/authorize (private clients only)',
    allowNo: true,
  }),
};

/**
 * Map client setting flags to request fields, omitting flags that were not provided.
 */
export function clientSettingsFromFlags(flags: {
  'login-restricted'?: boolean;
  'six-digit-otp'?: boolean;
  'strict-client-auth'?: boolean;
}): ClientSettings {
  const settings: ClientSettings = {};
  if (flags['six-digit-otp'] !== undefined) settings.isSixDigitOtp = flags['six-digit-otp'];
  if (flags['login-restricted'] !== undefined) settings.loginEpRestrict = flags['login-restricted'];
  if (flags['strict-client-auth'] !== undefined) settings.strictClientAuth = flags['strict-client-auth'];
  return settings;
}

/**
 * Normalize a client response from the API.
 * Handles scopes being returned as space-separated string.
 */
export function normalizeClientResponse(client: Client): ClientOutput {
  // Normalize scopes - API returns space-separated string
  const scopes =
    typeof client.scopes === 'string'
      ? (client.scopes as string).split(' ')
      : Array.isArray(client.scopes)
        ? client.scopes
        : [];

  const channels = Array.isArray(client.channels) ? client.channels : [];
  // redirectUri can be returned as string or array from the API
  const redirectUri = Array.isArray(client.redirectUri) ? client.redirectUri.join(', ') : (client.redirectUri ?? '');

  return {
    clientId: client.clientId ?? '',
    name: client.name ?? '',
    secret: client.secret,
    scopes,
    channels,
    redirectUri,
    callbackUri: client.callbackUri,
    isPrivateClient: client.isPrivateClient ?? true,
    loginEpRestrict: client.loginEpRestrict ?? false,
    isSixDigitOtp: client.isSixDigitOtp ?? false,
    strictClientAuth: client.strictClientAuth ?? false,
  };
}

/**
 * Print client details in a formatted table.
 */
export function printClientDetails(output: ClientOutput, showSecret = true): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 18;

  ui.div('');
  ui.div({text: 'Client ID:', width: labelWidth}, {text: output.clientId});
  ui.div({text: 'Name:', width: labelWidth}, {text: output.name});
  ui.div({text: 'Private:', width: labelWidth}, {text: String(output.isPrivateClient)});
  ui.div({text: 'Login Restricted:', width: labelWidth}, {text: String(output.loginEpRestrict)});
  ui.div({text: '6-digit OTP:', width: labelWidth}, {text: String(output.isSixDigitOtp)});
  if (output.isPrivateClient) {
    ui.div({text: 'Strict Auth:', width: labelWidth}, {text: String(output.strictClientAuth)});
  }
  ui.div({text: 'Channels:', width: labelWidth}, {text: output.channels.join(', ')});
  ui.div({text: 'Scopes:', width: labelWidth}, {text: output.scopes.join('\n' + ' '.repeat(labelWidth))});

  const redirectUris = parseUriList(output.redirectUri);
  ui.div(
    {text: 'Redirect URIs:', width: labelWidth},
    {text: redirectUris.length > 0 ? redirectUris.join('\n' + ' '.repeat(labelWidth)) : ''},
  );

  if (output.callbackUri) {
    const callbackUris = parseUriList(output.callbackUri);
    ui.div(
      {text: 'Callback URIs:', width: labelWidth},
      {text: callbackUris.length > 0 ? callbackUris.join('\n' + ' '.repeat(labelWidth)) : output.callbackUri},
    );
  }

  if (showSecret && output.secret) {
    ui.div('');
    ui.div({
      text: t(
        'commands.slas.client.create.secretWarning',
        'IMPORTANT: Save the client secret - it will not be shown again:',
      ),
    });
    ui.div({text: 'Secret:', width: labelWidth}, {text: output.secret});
  }

  ux.stdout(ui.toString());
}

/**
 * Parse a SLAS URI list (redirect URIs or callback URIs) into individual URIs.
 *
 * The SLAS API returns both fields as a single pipe-delimited string (e.g. "http://a|http://b").
 * This helper also accepts:
 * - an array response, where each element is a URI (and may itself be pipe-delimited); and
 * - a comma-delimited string, which is what {@link normalizeClientResponse} produces when it
 *   joins an array response for display.
 *
 * This is the single source of truth for splitting SLAS URI lists — both the display path and
 * the update request-building path use it, so the two cannot drift (as they previously did when
 * update split callback URIs on commas instead of pipes).
 *
 * Empty segments are dropped.
 */
export function parseUriList(value: null | string | string[] | undefined): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    // Each element is a URI, but a single element may itself be pipe-delimited.
    return value
      .filter((s): s is string => typeof s === 'string')
      .flatMap((s) => s.split('|'))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // A single string is pipe-delimited from the API, or comma-delimited when produced by
  // normalizeClientResponse joining an array response.
  const parts = value.includes('|') ? value.split('|') : value.split(',');
  return parts.map((s) => s.trim()).filter(Boolean);
}

// Backwards-compatible alias for SDK's getApiErrorMessage; existing call sites
// use this name. New code should import getApiErrorMessage from the SDK directly.
export {getApiErrorMessage as formatApiError} from '@salesforce/b2c-tooling-sdk/clients';

/**
 * Base command for SLAS client operations.
 * Provides common flags and helper methods.
 */
export abstract class SlasClientCommand<T extends typeof Command> extends OAuthCommand<T> {
  /**
   * Check if a tenant exists.
   * Returns true if the tenant exists, false if not found.
   * Throws (via this.error) if an unexpected error occurs.
   */
  protected async checkTenantExists(slasClient: SlasClient, tenantId: string): Promise<boolean> {
    const {error, response} = await slasClient.GET('/tenants/{tenantId}', {
      params: {
        path: {tenantId},
      },
    });

    if (!error) {
      this.logger.debug({tenantId}, 'Tenant exists');
      return true;
    }

    const isTenantNotFound =
      response.status === 404 ||
      (response.status === 400 &&
        typeof error === 'object' &&
        error !== null &&
        'exception_name' in error &&
        (error as {exception_name?: string}).exception_name === 'TenantNotFoundException');

    if (isTenantNotFound) {
      this.logger.debug({tenantId, status: response.status}, 'Tenant not found');
      return false;
    }

    this.error(
      t('commands.slas.client.create.tenantError', 'Failed to check tenant: {{message}}', {
        message: getApiErrorMessage(error, response),
      }),
    );
  }

  /**
   * Ensure tenant exists, creating it if necessary.
   * This is required before creating SLAS clients.
   */
  protected async ensureTenantExists(slasClient: SlasClient, tenantId: string): Promise<void> {
    const tenantExists = await this.checkTenantExists(slasClient, tenantId);

    if (tenantExists) {
      return;
    }

    // Tenant doesn't exist, create it with placeholder values
    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.create.creatingTenant', 'Creating SLAS tenant {{tenantId}}...', {tenantId}));
    }

    const {error: createError, response: createResponse} = await slasClient.PUT('/tenants/{tenantId}', {
      params: {
        path: {tenantId},
      },
      body: {
        tenantId,
        merchantName: 'B2C CLI Tenant',
        description: 'Auto-created by b2c-cli',
        contact: 'B2C CLI',
        emailAddress: 'noreply@example.com',
        phoneNo: '+1 000-000-0000',
      },
    });

    if (createError) {
      this.error(
        t('commands.slas.client.create.tenantCreateError', 'Failed to create tenant: {{message}}', {
          message: getApiErrorMessage(createError, createResponse),
        }),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.create.tenantCreated', 'SLAS tenant created successfully.'));
    }
  }

  protected override getDefaultClientId(method: 'implicit' | 'user' = 'user'): string {
    return method === 'implicit'
      ? getLegacyImplicitPublicClientId(this.accountManagerHost)
      : getDefaultPublicClientId(this.accountManagerHost);
  }

  /**
   * Get the SLAS client, ensuring short code is configured.
   */
  protected getSlasClient(): SlasClient {
    const {shortCode} = this.resolvedConfig.values;
    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ) + this.configDocsHint(),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    const oauthStrategy = this.getOAuthStrategy();
    return createSlasClient({shortCode}, oauthStrategy);
  }
}

/**
 * Base command for operations that target an existing SLAS client.
 * Resolves the client ID from an explicit positional argument first, then configuration.
 */
export abstract class ExistingSlasClientCommand<T extends typeof Command> extends SlasClientCommand<T> {
  static baseFlags = {
    ...SlasClientCommand.baseFlags,
    'slas-client-id': Flags.string({
      description: 'SLAS client ID (positional argument takes precedence)',
      env: 'SFCC_SLAS_CLIENT_ID',
    }),
  };

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const flags = this.flags as Record<string, unknown>;
    return loadConfig(
      {
        ...extractOAuthFlags(flags),
        slasClientId: flags['slas-client-id'] as string | undefined,
      },
      this.getBaseConfigOptions(),
    );
  }

  protected requireSlasClientId(clientId?: string): string {
    const resolvedClientId = clientId ?? this.resolvedConfig.values.slasClientId;
    if (!resolvedClientId) {
      this.error(
        t(
          'commands.slas.client.clientIdRequired',
          'SLAS client ID is required. Provide it as an argument, use --slas-client-id, set SFCC_SLAS_CLIENT_ID, or configure slasClientId in dw.json.',
        ),
      );
    }
    return resolvedClientId;
  }
}

/**
 * Extract the SLAS `exception_name` from an error response body, if present.
 */
export function slasExceptionName(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'exception_name' in error) {
    const name = (error as {exception_name?: unknown}).exception_name;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
}

/**
 * Whether a SLAS error means "nothing found". SLAS answers several list/read
 * calls with 404 (or 400 with a `*NotFoundException`) when the collection is empty.
 *
 * Pass `expected` when an empty result is acceptable: SLAS also answers 404 for a missing
 * parent resource (for example `ClientNotFoundException` on a template lookup), which must
 * surface as an error rather than as "nothing found".
 */
export function isSlasNotFound(error: unknown, response: {status: number}, expected?: string): boolean {
  const name = slasExceptionName(error);
  if (expected && name) return name === expected;
  return response.status === 404 || Boolean(name?.endsWith('NotFoundException'));
}

/**
 * Read text from a file path, or from stdin when the path is `-`.
 */
export async function readTextInput(path: string): Promise<string> {
  if (path !== '-') return readFile(path, 'utf8');
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Read and parse a JSON object from a file path, or from stdin when the path is `-`.
 */
export async function readJsonObjectInput(path: string): Promise<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(await readTextInput(path));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Expected a JSON object in ${path === '-' ? 'stdin' : path}`);
  }
  return parsed as Record<string, unknown>;
}

/** `--site-id` flag (alias `--channel-id`) for SLAS operations scoped to a site/channel. */
export const siteIdFlag = Flags.string({
  description: 'Site/channel ID',
  env: 'SFCC_SITE_ID',
  aliases: ['channel-id'],
});

/**
 * Error raised when no site ID is resolved for a channel-scoped SLAS command.
 */
export function siteIdRequiredMessage(): string {
  return t(
    'commands.slas.siteIdRequired',
    'Site ID is required. Provide --site-id (or --channel-id), set SFCC_SITE_ID, or configure siteId in dw.json.',
  );
}

/**
 * Base command for SLAS operations scoped to a site/channel.
 * Adds `--site-id` (alias `--channel-id`), falling back to the configured site ID.
 */
export abstract class SlasChannelCommand<T extends typeof Command> extends SlasClientCommand<T> {
  static baseFlags = {
    ...SlasClientCommand.baseFlags,
    'site-id': siteIdFlag,
  };

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const flags = this.flags as Record<string, unknown>;
    return loadConfig(
      {...extractOAuthFlags(flags), siteId: flags['site-id'] as string | undefined},
      this.getBaseConfigOptions(),
    );
  }

  protected requireSiteId(): string {
    const {siteId} = this.resolvedConfig.values;
    if (!siteId) {
      this.error(siteIdRequiredMessage(), {code: ERROR_CODE.VALIDATION});
    }
    return siteId;
  }
}
