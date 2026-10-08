/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export {confirm, ConfirmationRequiredError, type ConfirmOptions} from './confirm.js';
export {
  agentDetectors,
  detectAgentContext,
  getAgentContext,
  isInteractive,
  resetAgentContext,
  type AgentContext,
  type AgentDetector,
  type AgentEnvironment,
  type AgentHarness,
  type AgentMatch,
} from './agent-context.js';
