/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {resolve} from 'node:path';
import {validate} from 'jsonschema';
import {OAuthStrategy} from '../auth/oauth.js';
import {JwtOAuthStrategy} from '../auth/oauth-jwt.js';
import type {NormalizedConfig} from '../config/types.js';
import {buildTenantScope, toOrganizationId} from '../clients/custom-apis.js';
import {getGuestToken, getRegisteredToken} from '../slas/token.js';

/** Token exports for external clients; managed SCAPI requests authenticate independently. */
export function createScapiAuth(config: NormalizedConfig, cwd = process.cwd()) {
  return async (operation: string, options: unknown, signal: AbortSignal): Promise<unknown> => {
    signal.throwIfAborted();
    const string = {type: 'string', minLength: 1};
    const properties =
      operation === 'accountManager'
        ? {scopes: {type: 'array', items: {...string, pattern: '^\\S+$'}}, scapi: {type: 'boolean'}}
        : {
            flow: {enum: ['guest', 'registered']},
            siteId: string,
            redirectUri: {...string, format: 'uri'},
            shopperLogin: string,
            shopperPassword: string,
          };
    if (
      !['accountManager', 'slas'].includes(operation) ||
      !validate(options, {
        type: 'object',
        properties,
        additionalProperties: false,
      }).valid
    )
      throw new Error('SCAPI_AUTH_INPUT: Invalid token options. Read the SCAPI token-export reference.');
    try {
      if (operation === 'accountManager') {
        const args = options as {scopes?: string[]; scapi?: boolean};
        if (!config.clientId) throw new Error('Configure clientId. Use config_inspect.');
        if (args.scapi && !config.tenantId) throw new Error('Configure tenantId for a SCAPI token.');
        const scopes = [
          ...new Set([
            ...(config.scopes ?? []),
            ...(args.scopes ?? []),
            ...(args.scapi ? [buildTenantScope(config.tenantId!)] : []),
          ]),
        ];
        for (const method of config.authMethods ?? ['client-credentials', 'jwt']) {
          if (method === 'client-credentials' && config.clientSecret) {
            return await new OAuthStrategy({
              clientId: config.clientId,
              clientSecret: config.clientSecret,
              accountManagerHost: config.accountManagerHost,
              scopes,
            }).getTokenResponse(signal);
          }
          if (method === 'jwt' && config.jwtCertPath && config.jwtKeyPath) {
            return await new JwtOAuthStrategy({
              clientId: config.clientId,
              certPath: resolve(cwd, config.jwtCertPath),
              keyPath: resolve(cwd, config.jwtKeyPath),
              passphrase: config.jwtPassphrase,
              accountManagerHost: config.accountManagerHost ?? 'account.demandware.com',
              scopes,
            }).getTokenResponse(signal);
          }
        }
        throw new Error(
          'Configure an allowed client-credentials or jwt method. Browser authentication requires the CLI: b2c auth token.',
        );
      }
      const args = options as {
        flow?: 'guest' | 'registered';
        siteId?: string;
        redirectUri?: string;
        shopperLogin?: string;
        shopperPassword?: string;
      };
      const {shortCode, tenantId, slasClientId, slasClientSecret} = config;
      const siteId = args.siteId ?? config.siteId;
      const missing = Object.entries({shortCode, tenantId, slasClientId, siteId})
        .filter(([, value]) => !value)
        .map(([name]) => name);
      if (missing.length)
        throw new Error(
          `Configure ${missing.join(', ')}. Use config_inspect; SLAS client scopes and redirect URI must permit the requested flow.`,
        );
      const tokenConfig = {
        shortCode: shortCode!,
        organizationId: toOrganizationId(tenantId!),
        slasClientId: slasClientId!,
        slasClientSecret,
        siteId: siteId!,
        redirectUri: args.redirectUri ?? 'http://localhost:3000/callback',
        signal,
      };
      if (args.flow !== 'registered' && (args.shopperLogin || args.shopperPassword))
        throw new Error('Set flow: registered when supplying shopper credentials.');
      if (args.flow === 'registered' && (!args.shopperLogin || !args.shopperPassword))
        throw new Error('Registered flow requires shopperLogin and shopperPassword.');
      return args.flow === 'registered'
        ? await getRegisteredToken({
            ...tokenConfig,
            shopperLogin: args.shopperLogin!,
            shopperPassword: args.shopperPassword!,
          })
        : await getGuestToken(tokenConfig);
    } catch (error) {
      signal.throwIfAborted();
      throw new Error(
        `SCAPI_AUTH_${operation === 'accountManager' ? 'AM' : 'SLAS'}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
}
