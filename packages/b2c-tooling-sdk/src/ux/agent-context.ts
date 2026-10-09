/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Best-effort detection of AI coding agent harnesses (Claude Code, Cursor,
 * Codex, etc.) from the environment of the current process.
 *
 * Detection is advisory: it tailors help output, disables interactive prompts,
 * and attributes telemetry. It must never block or fail a command.
 *
 * Detection relies only on environment variables that harnesses set for their
 * child processes. Users can override detection with `SFCC_AGENT`:
 *
 * - `SFCC_AGENT=<name>` forces agent mode and reports `<name>` as the harness
 * - `SFCC_AGENT=0` (or `false`/`no`/`off`) disables detection entirely
 *
 * @module ux/agent-context
 */

/** An AI coding agent harness (the tool driving the CLI). */
export interface AgentHarness {
  /** Stable identifier (e.g. `claude-code`). */
  id: string;
  /** Human-readable name (e.g. `Claude Code`). */
  name: string;
}

/** A single detector match. */
export interface AgentMatch {
  harness: AgentHarness;
  /** Harness session/thread/conversation identifier, when exposed. */
  sessionId?: string;
  /** Environment variable names that produced the match. */
  signals: readonly string[];
}

/** Result of agent detection. */
export interface AgentContext {
  /** True when any harness was detected (or forced via `SFCC_AGENT`). */
  isAgentic: boolean;
  /** Highest-precedence harness, or null. */
  harness: AgentHarness | null;
  /** First available session identifier across matches, or null. */
  sessionId: null | string;
  /** All matches in precedence order. */
  matches: readonly AgentMatch[];
}

export type AgentEnvironment = Readonly<Record<string, string | undefined>>;
export type AgentDetector = (env: AgentEnvironment) => AgentMatch | null;

const FALSE_LIKE_VALUES = new Set(['', '0', 'false', 'no', 'off']);

/** Returns the trimmed value, treating false-like values as unset. */
function value(env: AgentEnvironment, name: string): string | undefined {
  const raw = env[name];
  if (typeof raw !== 'string') return undefined;
  const normalized = raw.trim();
  return FALSE_LIKE_VALUES.has(normalized.toLowerCase()) ? undefined : normalized;
}

/**
 * Builds a detector that matches when any marker env var equals its expected
 * value (or is set to any truthy value when `expected` is omitted).
 */
function markerDetector(
  harness: AgentHarness,
  markers: Array<{expected?: string; name: string}>,
  sessionVars: string[] = [],
): AgentDetector {
  return (env) => {
    const signals: string[] = [];
    for (const {name, expected} of markers) {
      const matched = expected === undefined ? value(env, name) !== undefined : env[name] === expected;
      if (matched) signals.push(name);
    }
    if (signals.length === 0) return null;

    let sessionId: string | undefined;
    for (const name of sessionVars) {
      const v = value(env, name);
      if (v) {
        signals.push(name);
        sessionId ??= v;
      }
    }
    return {harness, sessionId, signals};
  };
}

/**
 * Detectors in precedence order. Direct agents precede host surfaces so that,
 * for example, Claude Code launched inside Warp is reported as Claude Code
 * while the Warp match is retained in `matches`.
 */
export const agentDetectors: readonly AgentDetector[] = [
  markerDetector({id: 'opencode', name: 'OpenCode'}, [{name: 'OPENCODE', expected: '1'}]),
  markerDetector({id: 'qwen-code', name: 'Qwen Code'}, [{name: 'QWEN_CODE_SESSION_ID'}], ['QWEN_CODE_SESSION_ID']),
  markerDetector(
    {id: 'pi', name: 'Pi'},
    [
      {name: 'PI_CODING_AGENT', expected: 'true'},
      {name: 'AI_AGENT', expected: 'pi'},
    ],
    ['PI_SESSION_ID'],
  ),
  markerDetector(
    {id: 'cursor-agent', name: 'Cursor Agent'},
    [{name: 'CURSOR_AGENT', expected: '1'}],
    ['CURSOR_CONVERSATION_ID'],
  ),
  markerDetector(
    {id: 'claude-code', name: 'Claude Code'},
    [{name: 'CLAUDECODE', expected: '1'}],
    ['CLAUDE_CODE_SESSION_ID'],
  ),
  markerDetector({id: 'codex', name: 'OpenAI Codex'}, [{name: 'CODEX_THREAD_ID'}], ['CODEX_THREAD_ID']),
  markerDetector({id: 'amp', name: 'Amp'}, [{name: 'AMP_CURRENT_THREAD_ID'}], ['AMP_CURRENT_THREAD_ID']),
  markerDetector({id: 'gemini-cli', name: 'Gemini CLI'}, [{name: 'GEMINI_CLI', expected: '1'}]),
  markerDetector({id: 'auggie', name: 'Auggie'}, [{name: 'AUGMENT_AGENT', expected: '1'}]),
  markerDetector({id: 'crush', name: 'Crush'}, [
    {name: 'CRUSH', expected: '1'},
    {name: 'AI_AGENT', expected: 'crush'},
  ]),
  markerDetector({id: 'vscode-copilot-agent', name: 'GitHub Copilot in VS Code'}, [
    {name: 'AI_AGENT', expected: 'github_copilot_vscode_agent'},
    {name: 'COPILOT_AGENT', expected: '1'},
  ]),
  markerDetector({id: 'warp', name: 'Warp'}, [{name: 'OZ_RUN_ID'}], ['OZ_RUN_ID']),
];

const NOT_AGENTIC: AgentContext = {isAgentic: false, harness: null, sessionId: null, matches: []};

/** Normalizes a user-supplied agent name into an id (lowercase, dash-separated). */
function toAgentId(name: string): string {
  return (
    name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-|-$/g, '') || 'custom'
  );
}

/**
 * Detects whether the current process is being driven by an AI coding agent.
 *
 * @param env - Environment to inspect (defaults to `process.env`)
 * @param detectors - Detectors in precedence order (defaults to {@link agentDetectors})
 */
export function detectAgentContext(
  env: AgentEnvironment = process.env,
  detectors: readonly AgentDetector[] = agentDetectors,
): AgentContext {
  const override = env.SFCC_AGENT;
  if (override !== undefined) {
    const forced = value(env, 'SFCC_AGENT');
    if (!forced) return NOT_AGENTIC;
    // Values like "1"/"true" force agent mode without naming a harness.
    const generic = ['1', 'true', 'yes', 'on'].includes(forced.toLowerCase());
    const harness = generic ? {id: 'unknown', name: 'Unknown agent'} : {id: toAgentId(forced), name: forced};
    const match: AgentMatch = {harness, signals: ['SFCC_AGENT']};
    return {isAgentic: true, harness, sessionId: null, matches: [match]};
  }

  const matches: AgentMatch[] = [];
  for (const detector of detectors) {
    try {
      const match = detector(env);
      if (match) matches.push(match);
    } catch {
      // Detection is advisory and must never prevent a command from running.
    }
  }

  return {
    isAgentic: matches.length > 0,
    harness: matches[0]?.harness ?? null,
    sessionId: matches.find((m) => m.sessionId)?.sessionId ?? null,
    matches,
  };
}

let cached: AgentContext | undefined;

/**
 * Cached {@link detectAgentContext} for `process.env`. The environment of a
 * process does not change in ways relevant to detection, so detect once.
 */
export function getAgentContext(): AgentContext {
  cached ??= detectAgentContext();
  return cached;
}

/** Clears the cached agent context (for tests). */
export function resetAgentContext(): void {
  cached = undefined;
}

/**
 * Whether interactive prompts can be shown: stdin is a TTY and the process is
 * not driven by an AI agent (agents typically cannot answer prompts, and
 * hanging on one wastes the agent's turn).
 */
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY) && !getAgentContext().isAgentic;
}
