/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Command, Flags} from '@oclif/core';
import type {AuthMethod} from '@salesforce/b2c-tooling-sdk/auth';
import {createCipClient, DEFAULT_CIP_HOST, type CipClient} from '@salesforce/b2c-tooling-sdk/clients';
import {extractOAuthFlags, loadConfig, OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {t} from '../../i18n/index.js';

const CIP_AUTH_METHODS: AuthMethod[] = ['client-credentials'];

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultFromDate(): string {
  const now = new Date();
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getDefaultToDate(): string {
  return toIsoDate(new Date());
}

export abstract class CipCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'cip-host': Flags.string({
      description: `CIP host override (default: ${DEFAULT_CIP_HOST})`,
      env: 'SFCC_CIP_HOST',
      helpGroup: 'QUERY',
    }),
    from: Flags.string({
      description: 'Inclusive start date (YYYY-MM-DD)',
      default: getDefaultFromDate(),
      helpGroup: 'QUERY',
    }),
    to: Flags.string({
      description: 'Inclusive end date (YYYY-MM-DD)',
      default: getDefaultToDate(),
      helpGroup: 'QUERY',
    }),
    format: Flags.string({
      description: 'Output format',
      options: ['table', 'json', 'csv'],
      default: 'table',
      helpGroup: 'QUERY',
    }),
    'fetch-size': Flags.integer({
      description: 'Frame fetch size for CIP paging',
      default: 1000,
      min: 1,
      helpGroup: 'QUERY',
    }),
  };

  protected getCipClient(): CipClient {
    this.validateCipAuthMethods();

    const cipInstance = this.requireTenantId();
    const cipHost = this.flags['cip-host'] ?? this.resolvedConfig.values.cipHost;
    return createCipClient(
      {
        instance: cipInstance,
        host: cipHost,
      },
      this.getOAuthStrategy(),
    );
  }

  protected override getDefaultAuthMethods(): AuthMethod[] {
    return CIP_AUTH_METHODS;
  }

  protected override loadConfiguration(): ResolvedB2CConfig {
    const flags = this.flags as Record<string, unknown>;
    return loadConfig(
      {
        ...extractOAuthFlags(flags),
        cipHost: flags['cip-host'] as string | undefined,
      },
      this.getBaseConfigOptions(),
      this.getPluginSources(),
    );
  }

  protected requireCipCredentials(): void {
    this.validateCipAuthMethods();

    if (!this.hasFullOAuthCredentials()) {
      this.error(
        t(
          'error.oauthClientSecretRequired',
          'CIP requires OAuth client credentials. Provide --client-id and --client-secret, or set SFCC_CLIENT_ID and SFCC_CLIENT_SECRET.',
        ),
      );
    }
  }

  protected validateCipAuthMethods(): void {
    const methods = this.resolvedConfig.values.authMethods;
    if (!methods || methods.length === 0) {
      return;
    }

    const invalidMethods = methods.filter((method) => method !== 'client-credentials');
    if (invalidMethods.length > 0) {
      this.error(
        t(
          'error.cipAuthMethodNotSupported',
          'CIP only supports client-credentials auth. Remove --user-auth/--auth-methods overrides and provide --client-id and --client-secret.',
        ),
      );
    }
  }
}
