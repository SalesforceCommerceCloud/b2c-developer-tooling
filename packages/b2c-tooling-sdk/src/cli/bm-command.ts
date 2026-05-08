/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {createUsersBackend, type UsersBackend} from '../operations/bm-users/index.js';

/**
 * Base command for Business Manager (instance-level) operations.
 *
 * Provides backend factories that select between OCAPI and SCAPI based on
 * `--api-backend`. In auto mode, prefers SCAPI when shortCode + tenantId are
 * configured, falling back to OCAPI on `invalid_scope`.
 */
export abstract class BmCommand<T extends typeof Command> extends InstanceCommand<T> {
  /**
   * Creates a Users backend for `bm users *` commands.
   */
  protected createUsersBackend(): UsersBackend {
    const preference = this.resolvedConfig.values.apiBackend ?? 'auto';
    return createUsersBackend({
      preference,
      instance: this.instance,
      shortCode: this.resolvedConfig.values.shortCode,
      tenantId: this.resolvedConfig.values.tenantId,
      auth: this.hasOAuthCredentials() ? this.getOAuthStrategy() : undefined,
    });
  }
}
