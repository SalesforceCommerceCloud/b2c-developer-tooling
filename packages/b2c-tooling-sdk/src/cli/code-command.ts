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
  protected createScriptsBackend(): ScriptsBackend {
    return this.createBackend(createScriptsBackend);
  }
}
