/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {
  matchesLevel,
  matchesSearch,
  tailLogs,
  type TailLogsOptions,
  type TailLogsResult,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogWatchRegistry} from './log-watch-registry.js';

export interface LogsWatchStartInjections {
  tailLogs?: (instance: B2CInstance, options?: TailLogsOptions) => Promise<TailLogsResult>;
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

export function createLogsWatchStartTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: LogsWatchStartInjections,
): McpTool {
  const tailLogsFn = injections?.tailLogs ?? tailLogs;
  return createToolAdapter<StartInput, StartOutput>(
    {
      name: 'logs_watch_start',
      description:
        'Start a background log watch on the configured B2C Commerce instance. Returns a watch_id immediately. ' +
        'Recommended workflow: call logs_watch_start BEFORE triggering the action that should produce logs ' +
        '(e.g., a storefront request, a job, a debug session). Then call logs_watch_poll to drain buffered ' +
        'entries (it blocks up to timeout_ms). Always call logs_watch_stop when done. ' +
        'Only one active watch per hostname at a time — use logs_watch_list to find an existing one.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      requiresInstance: true,
      inputSchema: {
        prefixes: z
          .array(z.string())
          .optional()
          .describe(
            'Log prefixes to watch. Defaults to ["error", "customerror"]. Use a path like "internal/server" to watch logs in a subdirectory.',
          ),
        last_entries: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe(
            'Number of pre-existing entries per file to emit on startup. Defaults to 0 so a fresh ' +
              'watch only captures NEW entries (matches the recommended "start before triggering" workflow). ' +
              'Set >0 to include recent context.',
          ),
        poll_interval_ms: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('How often the underlying tail polls the WebDAV server. Defaults to 3000ms.'),
        level: z
          .array(z.string())
          .optional()
          .describe('Server-side filter by log level. Entries not matching are dropped before buffering.'),
        search: z.string().optional().describe('Case-insensitive substring filter applied as entries arrive.'),
      },
      async execute(args, context) {
        const registry = getLogWatchRegistry(context);
        const prefixes = args.prefixes ?? DEFAULT_PREFIXES;
        const hostname = context.b2cInstance!.config.hostname;

        // Reserve the watchId on the registry by tracking the hostname check first
        const existing = registry.findByHostname(hostname);
        if (existing) {
          throw new Error(
            `A log watch already exists for ${hostname} (watch_id: "${existing.watchId}"). ` +
              `Stop it with logs_watch_stop first, or poll the existing watch.`,
          );
        }

        const levelFilter = args.level;
        const searchFilter = args.search;

        // We need the watchId before tailLogs starts emitting, but we can only mint
        // the id after registerWatch (which itself needs the tailResult). Use a holder
        // so the callbacks below close over a mutable slot that we fill in after register.
        const ref: {id?: string} = {};

        const tailResult = await tailLogsFn(context.b2cInstance!, {
          prefixes,
          pollInterval: args.poll_interval_ms ?? 3000,
          lastEntries: args.last_entries ?? 0,
          onEntry(entry) {
            if (!ref.id) return;
            if (levelFilter && levelFilter.length > 0 && !matchesLevel(entry, levelFilter)) {
              return;
            }
            if (searchFilter && !matchesSearch(entry, searchFilter)) {
              return;
            }
            registry.appendEntry(ref.id, entry);
          },
          onFileDiscovered(file) {
            if (!ref.id) return;
            registry.appendFileDiscovered(ref.id, file);
          },
          onFileRotated(file) {
            if (!ref.id) return;
            registry.appendRotation(ref.id, file);
          },
          onError(err) {
            if (!ref.id) return;
            registry.appendError(ref.id, err);
          },
        });

        // registerWatch re-checks the hostname and throws on a duplicate. If two
        // logs_watch_start calls race past the findByHostname check above, the
        // loser's tailLogs poll is already running in the background — stop it so
        // it isn't orphaned (it would otherwise poll WebDAV until process exit).
        let entry;
        try {
          entry = registry.registerWatch({hostname, prefixes, tailResult});
        } catch (error) {
          await tailResult.stop().catch(() => {});
          throw error;
        }
        ref.id = entry.watchId;

        return {
          hostname,
          prefixes,
          started_at: new Date(entry.createdAt).toISOString(),
          watch_id: entry.watchId,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
