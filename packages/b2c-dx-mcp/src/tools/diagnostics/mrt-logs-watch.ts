/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {createWatchLifecycleTool} from './watch-lifecycle.js';
import {getProfile, watchMrtLogs} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {TailMrtLogsOptions, TailMrtLogsResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getMrtLogWatchRegistry} from './mrt-log-watch-registry.js';

export interface MrtLogsWatchStartInjections {
  tailMrtLogs?: (options: TailMrtLogsOptions, auth: AuthStrategy) => Promise<TailMrtLogsResult>;
  getProfile?: (options: {origin?: string}, auth: AuthStrategy) => Promise<{email?: string}>;
  /** Override the buffer cap, for tests. */
  bufferCap?: number;
}

interface StartInput {
  level?: string[];
  search?: string;
}

interface StartOutput {
  environment: string;
  project: string;
  started_at: string;
  watch_id: string;
}

function createMrtLogsWatchStartTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: MrtLogsWatchStartInjections,
): McpTool {
  const getProfileFn = injections?.getProfile ?? getProfile;
  return createToolAdapter<StartInput, StartOutput>(
    {
      name: 'mrt_logs_watch',
      searchHint: 'managed runtime mrt pwa kit storefront next server logs tail',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description:
        'Start, list, or stop live Managed Runtime (MRT) log watches for PWA Kit or Storefront Next storefront servers. Requires project/environment to start; read with mrt_logs_watch_poll. Stop discards unread entries; safe to repeat.',
      toolsets: ['DIAGNOSTICS', 'MRT', 'PWAV3', 'STOREFRONTNEXT'],
      requiresMrtAuth: true,
      inputSchema: {
        level: z.array(z.string()).optional().describe('Keep matching levels before buffering (e.g. ERROR, WARN).'),
        search: z
          .string()
          .optional()
          .describe('Case-insensitive substring in message or raw text; filters before buffering.'),
      },
      async execute(args, context) {
        const registry = getMrtLogWatchRegistry(context);
        const project = context.mrtConfig?.project;
        const environment = context.mrtConfig?.environment;
        const origin = context.mrtConfig?.origin;
        const auth = context.mrtConfig!.auth!;

        if (!project) {
          throw new Error(
            'MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.',
          );
        }
        if (!environment) {
          throw new Error(
            'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
          );
        }

        // Fail fast on a duplicate before opening a WebSocket.
        const existing = registry.findByKey(project, environment, origin);
        if (existing) {
          throw new Error(
            `An MRT log watch already exists for ${project}/${environment} (watch_id: "${existing.watchId}"). ` +
              `Stop it with mrt_logs_watch(action: stop) first, or poll the existing watch.`,
          );
        }

        // Best-effort user email for the WebSocket connection (matches the CLI).
        let user: string | undefined;
        try {
          const profile = await getProfileFn({origin}, auth);
          user = profile.email;
        } catch {
          // Non-fatal: proceed without user email.
        }

        const watch = await watchMrtLogs(
          {
            projectSlug: project,
            environmentSlug: environment,
            origin,
            user,
            level: args.level,
            search: args.search,
            bufferCap: injections?.bufferCap,
            tail: injections?.tailMrtLogs,
          },
          auth,
        );

        // registerWatch re-checks the key; if two starts raced past the check above,
        // close the loser's stream so it isn't orphaned.
        let entry;
        try {
          entry = registry.registerWatch({
            project,
            environment,
            origin,
            watch,
            resolution: structuredClone(context.resolution),
          });
        } catch (error) {
          await watch.stop();
          throw error;
        }

        return {
          environment,
          project,
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

export function createMrtLogsWatchTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: MrtLogsWatchStartInjections,
): McpTool {
  const getRegistry = () => {
    if (!serverContext) throw new Error('Server context is required for log watches.');
    return serverContext.mrtLogWatches;
  };
  return createWatchLifecycleTool(
    createMrtLogsWatchStartTool(loadServices, serverContext, injections),
    () => {
      return {
        watches: getRegistry()
          .listWatches()
          .map(({watchId, project, environment, origin, watch, resolution}) => {
            const info = watch.info();
            return {
              buffered_entries: info.bufferedEntries,
              created_at: new Date(info.createdAt).toISOString(),
              dropped_entries: info.droppedEntries,
              environment,
              last_activity_at: new Date(info.lastActivityAt).toISOString(),
              origin,
              project,
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
