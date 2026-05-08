/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {createScriptsBackend, type ScriptsBackend} from '../operations/code/index.js';

/**
 * Base command for code-version (Scripts) operations.
 *
 * Provides `createScriptsBackend()` which selects between OCAPI and SCAPI
 * based on the `--api-backend` flag and `apiBackend` config field. In auto
 * mode, prefers SCAPI when shortCode + tenantId are configured, falling
 * back to OCAPI on `invalid_scope`.
 */
export abstract class CodeCommand<T extends typeof Command> extends InstanceCommand<T> {
  /**
   * Creates a Scripts backend based on the resolved configuration.
   */
  protected createScriptsBackend(): ScriptsBackend {
    const preference = this.resolvedConfig.values.apiBackend ?? 'auto';
    return createScriptsBackend({
      preference,
      instance: this.instance,
      shortCode: this.resolvedConfig.values.shortCode,
      tenantId: this.resolvedConfig.values.tenantId,
      auth: this.hasOAuthCredentials() ? this.getOAuthStrategy() : undefined,
    });
  }
}
