/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createDebugListSessionsTool} from './debug-list-sessions.js';
import {createDebugStartSessionTool} from './debug-start-session.js';
import {createDebugEndSessionTool} from './debug-end-session.js';
import {createDebugSetBreakpointsTool} from './debug-set-breakpoints.js';
import {createDebugWaitForStopTool} from './debug-wait-for-stop.js';
import {createDebugGetStackTool} from './debug-get-stack.js';
import {createDebugGetVariablesTool} from './debug-get-variables.js';
import {createDebugEvaluateTool} from './debug-evaluate.js';
import {createDebugContinueTool} from './debug-continue.js';
import {createDebugStepTools} from './debug-step.js';
import {createDebugCaptureAtBreakpointTool} from './debug-capture-at-breakpoint.js';

export function createDiagnosticsTools(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool[] {
  return [
    createDebugListSessionsTool(loadServices, serverContext),
    createDebugStartSessionTool(loadServices, serverContext),
    createDebugEndSessionTool(loadServices, serverContext),
    createDebugSetBreakpointsTool(loadServices, serverContext),
    createDebugWaitForStopTool(loadServices, serverContext),
    createDebugGetStackTool(loadServices, serverContext),
    createDebugGetVariablesTool(loadServices, serverContext),
    createDebugEvaluateTool(loadServices, serverContext),
    createDebugContinueTool(loadServices, serverContext),
    ...createDebugStepTools(loadServices, serverContext),
    createDebugCaptureAtBreakpointTool(loadServices, serverContext),
  ];
}
