/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {validate} from 'jsonschema';
import type {NormalizedConfig} from '../config/types.js';
import {toOrganizationId} from '../clients/custom-apis.js';
import {getGuestToken, getRegisteredToken} from '../slas/token.js';

/**
 * SLAS shopper token exports for external clients (`auth.slas()` in code mode); managed SCAPI requests
 * authenticate independently. Account Manager tokens are not exported to code; use `b2c auth token`.
 */
export function createScapiAuth(config: NormalizedConfig, _cwd = process.cwd()) {
  return async (operation: string, options: unknown, signal: AbortSignal): Promise<unknown> => {
    signal.throwIfAborted();
    const string = {type: 'string', minLength: 1};
    if (
      operation !== 'slas' ||
      !validate(options, {
        type: 'object',
        properties: {
          flow: {enum: ['guest', 'registered']},
          siteId: string,
          redirectUri: {...string, format: 'uri'},
          shopperLogin: string,
          shopperPassword: string,
        },
        additionalProperties: false,
      }).valid
    )
      throw new Error('SCAPI_AUTH_INPUT: Invalid token options. Read the SCAPI token-export reference.');
    try {
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
        selfSignedApi: config.selfSignedApi,
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
      throw new Error(`SCAPI_AUTH_SLAS: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
