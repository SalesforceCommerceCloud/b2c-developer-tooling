/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DebugSessionRegistry} from './tools/diagnostics/session-registry.js';

export class ServerContext {
  readonly debugSessions: DebugSessionRegistry;

  constructor() {
    this.debugSessions = new DebugSessionRegistry();
  }

  async destroyAll(): Promise<void> {
    await this.debugSessions.destroyAll();
  }
}
