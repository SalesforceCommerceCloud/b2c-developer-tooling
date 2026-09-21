/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createConfigInspectTool} from './config-inspect.js';
import {createDebugListSessionsTool} from './debug-list-sessions.js';
import {createDebugStartSessionTool} from './debug-start-session.js';
import {createDebugEndSessionTool} from './debug-end-session.js';
import {createDebugSetBreakpointsTool} from './debug-set-breakpoints.js';
import {createDebugWaitForStopTool} from './debug-wait-for-stop.js';
import {createDebugInspectTool} from './debug-inspect.js';
import {createDebugEvaluateTool} from './debug-evaluate.js';
import {createDebugControlTool} from './debug-control.js';
import {createDebugCaptureAtBreakpointTool} from './debug-capture-at-breakpoint.js';
import {createLogsListFilesTool, type LogsListFilesInjections} from './logs-list-files.js';
import {createLogsGetRecentTool, type LogsGetRecentInjections} from './logs-get-recent.js';
import {createLogsWatchTool, type LogsWatchStartInjections} from './logs-watch.js';
import {createLogsWatchPollTool} from './logs-watch-poll.js';
import {createMrtLogsWatchTool, type MrtLogsWatchStartInjections} from './mrt-logs-watch.js';
import {createMrtLogsWatchPollTool} from './mrt-logs-watch-poll.js';

export interface DiagnosticsToolInjections
  extends LogsGetRecentInjections, LogsListFilesInjections, LogsWatchStartInjections, MrtLogsWatchStartInjections {}

export function createDiagnosticsTools(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: DiagnosticsToolInjections,
): McpTool[] {
  return [
    createConfigInspectTool(loadServices),
    createDebugListSessionsTool(loadServices, serverContext),
    createDebugStartSessionTool(loadServices, serverContext),
    createDebugEndSessionTool(loadServices, serverContext),
    createDebugSetBreakpointsTool(loadServices, serverContext),
    createDebugWaitForStopTool(loadServices, serverContext),
    createDebugInspectTool(loadServices, serverContext),
    createDebugEvaluateTool(loadServices, serverContext),
    createDebugControlTool(loadServices, serverContext),
    createDebugCaptureAtBreakpointTool(loadServices, serverContext),
    createLogsListFilesTool(loadServices, serverContext, injections),
    createLogsGetRecentTool(loadServices, serverContext, injections),
    createLogsWatchTool(loadServices, serverContext, injections),
    createLogsWatchPollTool(loadServices, serverContext),
    createMrtLogsWatchTool(loadServices, serverContext, injections),
    createMrtLogsWatchPollTool(loadServices, serverContext),
  ];
}
