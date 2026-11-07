/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {createWatchLifecycleTool} from './watch-lifecycle.js';
import {watchLogs, type TailLogsOptions, type TailLogsResult} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogWatchRegistry} from './log-watch-registry.js';

export interface LogsWatchStartInjections {
  tailLogs?: (instance: B2CInstance, options: TailLogsOptions) => Promise<TailLogsResult>;
  /** Override the buffer cap, for tests. */
  bufferCap?: number;
}

const DEFAULT_PREFIXES = ['error', 'customerror'];

interface StartInput {
  last_entries?: number;
  level?: string[];
  poll_interval_ms?: number;
  prefixes?: string[];
  search?: string;
}

interface StartOutput {
  hostname: string;
  prefixes: string[];
  started_at: string;
  watch_id: string;
}

function createLogsWatchStartTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: LogsWatchStartInjections,
): McpTool {
  return createToolAdapter<StartInput, StartOutput>(
    {
      name: 'logs_watch',
      searchHint: 'tail follow stream live server errors exceptions',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description:
        'Start, list, or stop B2C log watches that tail server logs. Start before the target action; read with logs_watch_poll. Stop discards unread entries; safe to repeat.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      requiresInstance: true,
      inputSchema: {
        prefixes: z
          .array(z.string())
          .optional()
          .describe(
            'Log prefixes. Default: ["error", "customerror"]; use ["custom-"] for custom logger files; paths may be subdirs.',
          ),
        last_entries: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Existing entries per file to emit at startup. Default: 0.'),
        poll_interval_ms: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('WebDAV polling interval, in milliseconds. Default: 3000.'),
        level: z.array(z.string()).optional().describe('Keep matching levels before buffering.'),
        search: z.string().optional().describe('Case-insensitive substring filter applied as entries arrive.'),
      },
      async execute(args, context) {
        const registry = getLogWatchRegistry(context);
        const hostname = context.b2cInstance!.config.hostname;
        const existing = registry.findByHostname(hostname);
        if (existing) {
          throw new Error(
            `A log watch already exists for ${hostname} (watch_id: "${existing.watchId}"). ` +
              `Stop it with logs_watch(action: stop) first, or poll the existing watch.`,
          );
        }
        const watch = await watchLogs(context.b2cInstance!, {
          prefixes: args.prefixes ?? DEFAULT_PREFIXES,
          pollInterval: args.poll_interval_ms ?? 3000,
          lastEntries: args.last_entries ?? 0,
          level: args.level,
          search: args.search,
          bufferCap: injections?.bufferCap,
          tail: injections?.tailLogs,
        });
        // registerWatch re-checks the hostname; if two starts raced past the check
        // above, stop the loser's tail so it isn't orphaned.
        let entry;
        try {
          entry = registry.registerWatch({hostname, watch, resolution: structuredClone(context.resolution)});
        } catch (error) {
          await watch.stop();
          throw error;
        }
        return {
          hostname,
          prefixes: watch.prefixes,
          started_at: new Date(watch.info().createdAt).toISOString(),
          watch_id: entry.watchId,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}

export function createLogsWatchTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: LogsWatchStartInjections,
): McpTool {
  const getRegistry = () => {
    if (!serverContext) throw new Error('Server context is required for log watches.');
    return serverContext.logWatches;
  };
  return createWatchLifecycleTool(
    createLogsWatchStartTool(loadServices, serverContext, injections),
    () => {
      return {
        watches: getRegistry()
          .listWatches()
          .map(({watchId, hostname, watch, resolution}) => {
            const info = watch.info();
            return {
              buffered_entries: info.bufferedEntries,
              created_at: new Date(info.createdAt).toISOString(),
              dropped_entries: info.droppedEntries,
              files_discovered: info.filesDiscovered,
              hostname,
              last_activity_at: new Date(info.lastActivityAt).toISOString(),
              prefixes: info.prefixes,
              stopped: info.stopped,
              total_entries_seen: info.totalEntriesSeen,
              watch_id: watchId,
              resolution,
            };
          }),
      };
    },
    async (watchId) => {
      const registry = getRegistry();
      const entry = registry.getWatch(watchId);
      const total = entry?.watch.info().totalEntriesSeen ?? 0;
      if (entry) await registry.destroyWatch(watchId);
      return {watch_id: watchId, stopped_at: new Date().toISOString(), total_entries_seen: total};
    },
  );
}
