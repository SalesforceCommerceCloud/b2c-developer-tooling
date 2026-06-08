/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {LogWatchRegistry} from './tools/diagnostics/log-watch-registry.js';
import {DebugSessionRegistry} from './tools/diagnostics/session-registry.js';

/**
 * Server-scoped persistent state that lives for the lifetime of the MCP
 * server process. Holds registries for stateful resources (debug sessions,
 * log watches) that need to span multiple tool invocations.
 *
 * ## Multi-agent / shared-state caveats
 *
 * One `ServerContext` is created per MCP server process. With the default
 * stdio transport, each MCP client connection spawns its own server
 * subprocess, so this state is naturally isolated per client/agent.
 *
 * If this server is ever wired up to a shared transport (e.g. HTTP with
 * multiple connected clients), `ServerContext` state would be shared
 * across all connected clients. Sub-agents that run within the same MCP
 * client would also share the same context. Tools that mutate registries
 * (like the debug tools) should not assume single-tenant access.
 *
 * Both registries dedup on a stable key (host:client_id for debug,
 * hostname for log watches), so multi-agent use is functional but agents
 * may see each other's sessions/watches via list tools.
 */
export class ServerContext {
  readonly debugSessions: DebugSessionRegistry;
  readonly logWatches: LogWatchRegistry;

  constructor() {
    this.debugSessions = new DebugSessionRegistry();
    this.logWatches = new LogWatchRegistry();
  }

  async destroyAll(): Promise<void> {
    await Promise.allSettled([this.debugSessions.destroyAll(), this.logWatches.destroyAll()]);
  }
}
