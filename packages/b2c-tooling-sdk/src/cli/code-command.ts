/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';

/**
 * Base command for code-version (Scripts) operations.
 *
 * `createScriptsBackend()` (from {@link InstanceCommand}) selects between
 * OCAPI and SCAPI based on the `--api-backend` flag and `apiBackend` config
 * field, or uses WebDAV without an API client. In auto mode, it prefers SCAPI
 * when its coordinates and supported auth are available, falling back to OCAPI
 * on safe capability/auth/request rejections.
 */
export abstract class CodeCommand<T extends typeof Command> extends InstanceCommand<T> {
  /** Listing, creating, and deleting code versions also work over WebDAV with a browser login. */
  protected override supportsDefaultWebDavClient(): boolean {
    return true;
  }
}
