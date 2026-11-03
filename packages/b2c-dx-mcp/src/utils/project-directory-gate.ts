/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Bounds the per-call `projectDirectory` tool argument.
 *
 * The model chooses `projectDirectory`, so on its own it could point local
 * file access anywhere. The folders the user chose are the configured
 * `--project-directory` and the client's MCP roots (the open workspace). The
 * server's working directory never counts: plugin installs start the server
 * in the plugin's own folder or the home directory.
 *
 * When one of those folders is known, a `projectDirectory` outside all of them
 * needs the user's approval through form elicitation, remembered for the life
 * of the server. Clients without elicitation get an error instead. When none
 * is known (no configured directory, and no usable roots), the argument is
 * accepted as before, so the tools can still be pointed at the project.
 */

import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {inputRequired} from '@modelcontextprotocol/server';
import {isPathWithin} from './paths.js';
import type {ToolContext, ToolResult} from './types.js';

const STATE_PREFIX = 'project-directory.';
const ROOTS_KEY = 'project_roots';
const APPROVAL_KEY = 'project_directory_approval';
/** Unanswered prompts kept for a retry; older ones are dropped. */
const MAX_PENDING = 20;

/** How the calling client exposes its roots. */
export interface ClientRoots {
  /** Whether the client declared the `roots` capability. */
  declared: boolean;
  /**
   * Fetches `roots/list` on a 2025-era connection. Absent on 2026-07-28
   * connections, which request roots through an input-required round.
   */
  fetch?: () => Promise<unknown>;
}

export type ProjectDirectoryDecision = {context: ToolContext; ok: true} | {ok: false; result: ToolResult};

/**
 * Local folders from a `roots/list` result. Accepts `file://` URIs and, since
 * some clients send them, bare absolute paths; ignores anything else.
 */
export function parseRoots(result: unknown): string[] {
  const roots = (result as undefined | {roots?: unknown})?.roots;
  if (!Array.isArray(roots)) return [];
  const directories: string[] = [];
  for (const root of roots) {
    const uri = (root as undefined | {uri?: unknown})?.uri;
    if (typeof uri !== 'string') continue;
    if (uri.startsWith('file://')) {
      try {
        directories.push(fileURLToPath(uri));
      } catch {
        // Not a local file URI.
      }
    } else if (path.isAbsolute(uri)) {
      directories.push(uri);
    }
  }
  return directories;
}

/** Resolved and symlink-free forms; a client may report either. */
function forms(directory: string): string[] {
  const resolved = path.resolve(directory);
  try {
    const real = fs.realpathSync(resolved);
    return real === resolved ? [resolved] : [resolved, real];
  } catch {
    return [resolved];
  }
}

function within(roots: string[], directory: string): boolean {
  const targets = forms(directory);
  return roots.some((root) => forms(root).some((base) => targets.some((target) => isPathWithin(base, target))));
}

function errorResult(text: string): ToolResult {
  return {isError: true, content: [{type: 'text', text}]};
}

/** One per server instance; approvals last until the server stops. */
export class ProjectDirectoryGate {
  private readonly approved: string[] = [];
  private readonly configured?: string;
  private readonly pending = new Map<string, string>();
  /** Roots received through an input-required round (2026-07-28 connections). */
  private roots?: string[];

  /** @param configured - `--project-directory` / `SFCC_PROJECT_DIRECTORY`, if set */
  public constructor(configured?: string) {
    this.configured = configured ? path.resolve(configured) : undefined;
  }

  /**
   * Decides whether a call may use `directory`. On success, returns the tool
   * context to run the handler with, minus any input this gate consumed.
   */
  public async check(directory: string, context: ToolContext, client: ClientRoots): Promise<ProjectDirectoryDecision> {
    const state = typeof context.requestState === 'string' ? context.requestState : undefined;
    const ours = state?.startsWith(STATE_PREFIX) ?? false;
    const passed = (): ProjectDirectoryDecision => ({
      ok: true,
      context: ours ? {...context, requestState: undefined, inputResponses: undefined} : context,
    });

    const configured = this.configured ? [this.configured] : [];
    if (within(configured, directory) || within(this.approved, directory)) return passed();

    let roots: string[] = [];
    if (client.declared) {
      if (client.fetch) {
        roots = parseRoots(await client.fetch().catch(() => null));
      } else {
        if (ours && context.inputResponses?.[ROOTS_KEY] !== undefined) {
          this.roots = parseRoots(context.inputResponses[ROOTS_KEY]);
        }
        if (!this.roots) {
          return {ok: false, result: this.prompt(directory, {[ROOTS_KEY]: inputRequired.listRoots()})};
        }
        roots = this.roots;
      }
    }

    const known = [...configured, ...roots];
    if (known.length === 0 || within(roots, directory)) return passed();

    const target = path.resolve(directory);
    const response = ours ? (context.inputResponses?.[APPROVAL_KEY] as undefined | {action?: unknown}) : undefined;
    if (response && this.pending.get(state!) === target) {
      this.pending.delete(state!);
      if (response.action !== 'accept') {
        return {ok: false, result: errorResult(`Use of ${target} as the project directory was declined.`)};
      }
      this.approved.push(target);
      return passed();
    }

    const folders = known.join(', ');
    if (!context.supportsElicitation) {
      return {
        ok: false,
        result: errorResult(
          `projectDirectory ${target} is outside the project folders known to this server (${folders}), ` +
            'and this client cannot ask the user to approve it. Open it as a workspace folder in the client, ' +
            'or start the server with --project-directory set to a folder that contains it.',
        ),
      };
    }
    return {
      ok: false,
      result: this.prompt(target, {
        [APPROVAL_KEY]: inputRequired.elicit({
          message:
            `Allow B2C tools to use ${target} as the project directory? ` +
            `It is outside the project folders known to this server (${folders}). ` +
            'Tools may read and write files there. Approval lasts until the server restarts.',
          // No fields: the client's own accept/decline/cancel buttons carry the decision.
          requestedSchema: {type: 'object', properties: {}},
        }),
      }),
    };
  }

  private prompt(directory: string, inputRequests: Parameters<typeof inputRequired>[0]['inputRequests']): ToolResult {
    const requestState = `${STATE_PREFIX}${randomUUID()}`;
    this.pending.set(requestState, path.resolve(directory));
    if (this.pending.size > MAX_PENDING) this.pending.delete(this.pending.keys().next().value!);
    return {
      ...inputRequired({requestState, inputRequests}),
      // Keep the local tool result shape; the SDK dispatches by resultType before content.
      content: [],
    };
  }
}
