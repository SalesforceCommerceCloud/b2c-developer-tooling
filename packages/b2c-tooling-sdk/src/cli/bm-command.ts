/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {createUsersBackend, type UsersBackend} from '../operations/bm-users/index.js';
import {createRolesBackend, type RolesBackend} from '../operations/bm-roles/index.js';

/**
 * Base command for Business Manager (instance-level) operations.
 *
 * Provides backend factories that select between OCAPI and SCAPI based on
 * `--api-backend`. In auto mode, prefers SCAPI when shortCode + tenantId are
 * configured, falling back to OCAPI on `invalid_scope`.
 */
export abstract class BmCommand<T extends typeof Command> extends InstanceCommand<T> {
  protected createUsersBackend(): UsersBackend {
    return this.createBackend(createUsersBackend);
  }

  protected createRolesBackend(): RolesBackend {
    return this.createBackend(createRolesBackend);
  }
}
