import {ux} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccessTokenResponse} from '@salesforce/b2c-tooling-sdk/auth';
import {t} from '../../i18n/index.js';

/**
 * JSON output structure for the token command
 */
interface TokenJsonOutput {
  accessToken: string;
  expires: string;
  scopes: string[];
}

export default class AuthToken extends OAuthCommand<typeof AuthToken> {
  static description = t('commands.auth.token.description', 'Get an OAuth access token');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --scope sfcc.orders --scope sfcc.products',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  async run(): Promise<TokenJsonOutput> {
    this.requireOAuthCredentials();

    const strategy = this.getOAuthStrategy();
    const tokenResponse: AccessTokenResponse = await strategy.getTokenResponse();

    const output: TokenJsonOutput = {
      accessToken: tokenResponse.accessToken,
      expires: tokenResponse.expires.toISOString(),
      scopes: tokenResponse.scopes,
    };

    // In JSON mode, return the full token response
    if (this.jsonEnabled()) {
      return output;
    }

    // In normal mode, output just the raw token to stdout
    ux.stdout(tokenResponse.accessToken);

    return output;
  }
}
