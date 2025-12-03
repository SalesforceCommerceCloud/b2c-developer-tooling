import {Command, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OAuthCommand} from '@salesforce/b2c-tooling/cli';
import {createSlasClient, type SlasClient, type SlasComponents} from '@salesforce/b2c-tooling';
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
  };
}

/**
 * Print client details in a formatted table.
 */
export function printClientDetails(output: ClientOutput, showSecret = true): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 14;

  ui.div('');
  ui.div({text: 'Client ID:', width: labelWidth}, {text: output.clientId});
  ui.div({text: 'Name:', width: labelWidth}, {text: output.name});
  ui.div({text: 'Private:', width: labelWidth}, {text: String(output.isPrivateClient)});
  ui.div({text: 'Channels:', width: labelWidth}, {text: output.channels.join(', ')});
  ui.div({text: 'Scopes:', width: labelWidth}, {text: output.scopes.join('\n' + ' '.repeat(labelWidth))});
  ui.div({text: 'Redirect URI:', width: labelWidth}, {text: output.redirectUri});

  if (output.callbackUri) {
    ui.div({text: 'Callback URI:', width: labelWidth}, {text: output.callbackUri});
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
 * Format API error for display.
 */
export function formatApiError(error: unknown): string {
  return typeof error === 'object' ? JSON.stringify(error) : String(error);
}

/**
 * Base command for SLAS client operations.
 * Provides common flags and helper methods.
 */
export abstract class SlasClientCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'tenant-id': Flags.string({
      description: 'SLAS tenant ID (organization ID)',
      env: 'SFCC_TENANT_ID',
      required: true,
    }),
  };

  /**
   * Get the SLAS client, ensuring short code is configured.
   */
  protected getSlasClient(): SlasClient {
    const {shortCode} = this.resolvedConfig;
    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ),
      );
    }

    const oauthStrategy = this.getOAuthStrategy();
    return createSlasClient({shortCode}, oauthStrategy);
  }
}
