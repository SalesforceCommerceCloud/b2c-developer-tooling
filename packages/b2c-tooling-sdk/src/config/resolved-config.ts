/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Resolved configuration implementation.
 *
 * @module config/resolved-config
 */
import type {AuthStrategy, AuthCredentials} from '../auth/types.js';
import {BasicAuthStrategy} from '../auth/basic.js';
import {ApiKeyStrategy} from '../auth/api-key.js';
import {resolveAuthStrategy} from '../auth/resolve.js';
import type {B2CInstance} from '../instance/index.js';
import {MrtClient} from '../platform/mrt.js';
import {createInstanceFromConfig} from './mapping.js';
import type {
  NormalizedConfig,
  ConfigWarning,
  ConfigSourceInfo,
  ResolvedB2CConfig,
  CreateOAuthOptions,
  CreateMrtClientOptions,
} from './types.js';

/**
 * Implementation of ResolvedB2CConfig.
 *
 * Provides validation methods and factory methods for creating SDK objects
 * from resolved configuration.
 */
export class ResolvedConfigImpl implements ResolvedB2CConfig {
  constructor(
    readonly values: NormalizedConfig,
    readonly warnings: ConfigWarning[],
    readonly sources: ConfigSourceInfo[],
  ) {}

  // Validation methods

  hasB2CInstanceConfig(): boolean {
    return Boolean(this.values.hostname);
  }

  hasMrtConfig(): boolean {
    return Boolean(this.values.mrtApiKey);
  }

  hasOAuthConfig(): boolean {
    return Boolean(this.values.clientId);
  }

  hasBasicAuthConfig(): boolean {
    return Boolean(this.values.username && this.values.password);
  }

  // Factory methods

  createB2CInstance(): B2CInstance {
    if (!this.hasB2CInstanceConfig()) {
      throw new Error('B2C instance requires hostname');
    }
    return createInstanceFromConfig(this.values);
  }

  createBasicAuth(): AuthStrategy {
    if (!this.hasBasicAuthConfig()) {
      throw new Error('Basic auth requires username and password');
    }
    return new BasicAuthStrategy(this.values.username!, this.values.password!);
  }

  createOAuth(options?: CreateOAuthOptions): AuthStrategy {
    if (!this.hasOAuthConfig()) {
      throw new Error('OAuth requires clientId');
    }
    const credentials: AuthCredentials = {
      clientId: this.values.clientId,
      clientSecret: this.values.clientSecret,
      scopes: this.values.scopes,
      accountManagerHost: this.values.accountManagerHost,
    };
    return resolveAuthStrategy(credentials, {allowedMethods: options?.allowedMethods});
  }

  createMrtAuth(): AuthStrategy {
    if (!this.hasMrtConfig()) {
      throw new Error('MRT auth requires mrtApiKey');
    }
    return new ApiKeyStrategy(this.values.mrtApiKey!, 'Authorization');
  }

  createWebDavAuth(): AuthStrategy {
    // Prefer basic auth if available (simpler, no token refresh)
    if (this.hasBasicAuthConfig()) {
      return this.createBasicAuth();
    }
    // Fall back to OAuth
    if (this.hasOAuthConfig()) {
      return this.createOAuth();
    }
    throw new Error('WebDAV auth requires basic auth (username/password) or OAuth (clientId)');
  }

  createMrtClient(options?: CreateMrtClientOptions): MrtClient {
    return new MrtClient(
      {
        org: options?.org ?? '',
        project: options?.project ?? this.values.mrtProject ?? '',
        env: options?.env ?? this.values.mrtEnvironment ?? '',
      },
      this.createMrtAuth(),
    );
  }
}
