/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Command} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AuthMethod} from '@salesforce/b2c-tooling-sdk/auth';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Base for Data API commands whose endpoints state "A valid user is required"
 * in the OCAPI documentation — i.e. the OAuth token must resolve to a real
 * Business Manager user, not a service client. Examples: `bm whoami`
 * (`/users/this`) and the access-key endpoints under
 * `/users/{login}/access_key`.
 *
 * Defaults `authMethods` to `['user']` so the underlying
 * {@link InstanceCommand}'s `B2CInstance` chooses browser-based user-auth
 * (Authorization Code + PKCE) rather than client-credentials. The default is
 * applied *after* config resolution and only when the user has not specified
 * `authMethods` via `--auth-methods`, `--user-auth`, dw.json, or
 * `SFCC_AUTH_METHODS`.
 */
export abstract class BmUserAuthCommand<T extends typeof Command> extends InstanceCommand<T> {
  protected override getDefaultAuthMethods(): AuthMethod[] {
    return ['user'];
  }

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const resolved = await super.loadConfiguration();
    if (!resolved.values.authMethods) {
      // Patch in our default so B2CInstance's auth selection (which doesn't
      // consult getDefaultAuthMethods()) prefers user-auth too.
      // ResolvedB2CConfig.values is typed readonly but not frozen.
      (resolved.values as {authMethods?: AuthMethod[]}).authMethods = this.getDefaultAuthMethods();
    }
    return resolved;
  }
}
