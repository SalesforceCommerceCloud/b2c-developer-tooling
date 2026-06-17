/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {getProfile, tailMrtLogs} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {MrtLogEntry, TailMrtLogsOptions, TailMrtLogsResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getMrtLogWatchRegistry} from './mrt-log-watch-registry.js';

export interface MrtLogsWatchStartInjections {
  tailMrtLogs?: (options: TailMrtLogsOptions, auth: AuthStrategy) => Promise<TailMrtLogsResult>;
  getProfile?: (options: {origin?: string}, auth: AuthStrategy) => Promise<{email?: string}>;
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

/**
 * Case-insensitive substring match against an entry's message and raw text.
 * Mirrors the SFCC `matchesSearch` semantics. The CLI `mrt tail-logs` command
 * treats `search` as a regex, but MCP tool consumers get the safer substring
 * filter (no ReDoS surface, predictable behavior).
 */
function matchesSearch(entry: MrtLogEntry, search: string): boolean {
  const lower = search.toLowerCase();
  return entry.message.toLowerCase().includes(lower) || entry.raw.toLowerCase().includes(lower);
}

function matchesLevel(entry: MrtLogEntry, levels: Set<string>): boolean {
  return Boolean(entry.level && levels.has(entry.level.toUpperCase()));
}

export function createMrtLogsWatchStartTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: MrtLogsWatchStartInjections,
): McpTool {
  const tailMrtLogsFn = injections?.tailMrtLogs ?? tailMrtLogs;
  const getProfileFn = injections?.getProfile ?? getProfile;
  return createToolAdapter<StartInput, StartOutput>(
    {
      name: 'mrt_logs_watch_start',
      description:
        "Start a background tail of a Managed Runtime (MRT) environment's application logs over a WebSocket. " +
        'Returns a watch_id immediately. MRT logs are always a live stream — there is no historical fetch — so ' +
        'call mrt_logs_watch_start BEFORE triggering the request/SSR action you want to capture, then call ' +
        'mrt_logs_watch_poll to drain buffered entries (it blocks up to timeout_ms). Always call ' +
        'mrt_logs_watch_stop when done. Requires MRT project + environment (from --project/--environment flags, ' +
        'MRT_PROJECT/MRT_ENVIRONMENT env vars, or dw.json). Only one active watch per project/environment/origin ' +
        '— use mrt_logs_watch_list to find an existing one.',
      toolsets: ['DIAGNOSTICS', 'PWAV3', 'STOREFRONTNEXT'],
      requiresMrtAuth: true,
      inputSchema: {
        level: z
          .array(z.string())
          .optional()
          .describe(
            'Filter by log level (ERROR, WARN, INFO, DEBUG, etc.). Entries not matching are dropped before buffering.',
          ),
        search: z
          .string()
          .optional()
          .describe('Case-insensitive substring filter applied to message and raw text as entries arrive.'),
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
              `Stop it with mrt_logs_watch_stop first, or poll the existing watch.`,
          );
        }

        const levelFilter =
          args.level && args.level.length > 0 ? new Set(args.level.map((l) => l.toUpperCase())) : null;
        const searchFilter = args.search;

        // Best-effort user email for the WebSocket connection (matches the CLI).
        let user: string | undefined;
        try {
          const profile = await getProfileFn({origin}, auth);
          user = profile.email;
        } catch {
          // Non-fatal: proceed without user email.
        }

        // The callbacks need the watchId, but it is only minted by registerWatch
        // (which itself needs the tailResult). Close over a mutable holder filled
        // in after registration.
        const ref: {id?: string} = {};

        const tailResult = await tailMrtLogsFn(
          {
            projectSlug: project,
            environmentSlug: environment,
            origin,
            user,
            onEntry(entry) {
              if (!ref.id) return;
              if (levelFilter && !matchesLevel(entry, levelFilter)) return;
              if (searchFilter && !matchesSearch(entry, searchFilter)) return;
              registry.appendEntry(ref.id, entry);
            },
            onError(err) {
              if (!ref.id) return;
              registry.appendError(ref.id, err);
            },
            onClose() {
              if (!ref.id) return;
              registry.markStreamClosed(ref.id);
            },
          },
          auth,
        );

        // tailMrtLogs rejects `done` on a non-clean WebSocket close. Attach a
        // no-op catch up front so neither the registration-failure path below
        // nor a later connection drop produces an unhandled rejection.
        // destroyWatch awaits the same promise for real cleanup.
        tailResult.done.catch(() => {});

        // registerWatch re-checks the dedup key and throws on a duplicate. If two
        // starts race past findByKey above, the loser's WebSocket is already open
        // — stop it so it isn't orphaned (it would otherwise stream until process
        // exit).
        let entry;
        try {
          entry = registry.registerWatch({project, environment, origin, tailResult});
        } catch (error) {
          tailResult.stop();
          throw error;
        }
        ref.id = entry.watchId;

        return {
          environment,
          project,
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
