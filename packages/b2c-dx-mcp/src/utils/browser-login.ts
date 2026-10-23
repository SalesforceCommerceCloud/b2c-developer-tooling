/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Account Manager browser logins started by tool calls.
 *
 * A tool call that needs a login (the built-in WebDAV client, or an API client
 * configured without a secret) blocks until the user signs in. When the client
 * supports URL elicitation, the call returns `inputRequired.elicitUrl(...)`
 * instead of opening a browser itself: 2026-07-28 clients get an input-required
 * result and retry the call; the SDK's legacy shim sends 2025-era clients an
 * `elicitation/create` request in URL mode and re-invokes the handler. Either
 * way the retry resumes the original call, which completes once the redirect
 * arrives. Other clients keep the system browser.
 */

import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID} from 'node:crypto';
import {inputRequired} from '@modelcontextprotocol/server';
import {openUrlInBrowser, type BrowserLogin} from '@salesforce/b2c-tooling-sdk/auth';
import type {ToolResult} from './types.js';

/** How long a browser login may stay pending before the waiting tool call fails. */
export const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const STATE_PREFIX = 'am-login.';
const INPUT_KEY = 'account_manager_login';
/** Pending entries whose client never retries are dropped this long after the call settles. */
const RETENTION_MS = 10 * 60 * 1000;
const LOGIN_MESSAGE =
  'Sign in to Account Manager so the B2C DX MCP server can access your B2C Commerce instance. ' +
  'Your Business Manager role on the instance decides what you can access.';

interface StartedLogin {
  url: string;
  login?: BrowserLogin;
}

interface LoginScope {
  started(login: StartedLogin): void;
}

type Outcome = {error: unknown; ok: false} | {ok: true; result: ToolResult};

const loginScope = new AsyncLocalStorage<LoginScope>();

/**
 * `openBrowser` hook for logins started by MCP tools. Hands the URL to the
 * calling tool when its client can open it; otherwise opens the system browser.
 * The login fails after {@link LOGIN_TIMEOUT_MS}.
 */
export async function openBrowserForTool(url: string, login?: BrowserLogin): Promise<void> {
  if (login) {
    const minutes = LOGIN_TIMEOUT_MS / 60_000;
    setTimeout(
      () => login.cancel(`Timed out after ${minutes} minutes waiting for the Account Manager login.`),
      LOGIN_TIMEOUT_MS,
    ).unref();
  }
  const scope = loginScope.getStore();
  if (scope) {
    scope.started({url, login});
    return;
  }
  await openUrlInBrowser(url);
}

/** Tool calls waiting on a browser login, keyed by the `requestState` handed to the client. */
export class BrowserLoginContinuations {
  private readonly pending = new Map<string, {login?: BrowserLogin; outcome: Promise<Outcome>}>();

  /** Whether `requestState` resumes a call waiting on a browser login. */
  isContinuation(requestState: unknown): requestState is string {
    return typeof requestState === 'string' && requestState.startsWith(STATE_PREFIX);
  }

  /**
   * Resumes a call after the client handled the login URL. Accepting waits for
   * the login to finish; declining or cancelling the request ends it.
   */
  async resume(
    requestState: string,
    inputResponses?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    const entry = this.pending.get(requestState);
    if (!entry) {
      return {
        isError: true,
        content: [
          {type: 'text', text: 'The Account Manager login for this call is no longer pending. Call the tool again.'},
        ],
      };
    }
    this.pending.delete(requestState);

    const action = (inputResponses?.[INPUT_KEY] as undefined | {action?: unknown})?.action;
    if (action === 'decline' || action === 'cancel') entry.login?.cancel('Account Manager login declined.');
    const onAbort = () => entry.login?.cancel('Account Manager login cancelled.');
    signal?.addEventListener('abort', onAbort, {once: true});
    try {
      const outcome = await entry.outcome;
      if (!outcome.ok) throw outcome.error;
      return outcome.result;
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  }

  /**
   * Runs a tool handler. When it starts a browser login and the client
   * supports URL elicitation, returns a URL elicitation while the handler
   * keeps waiting for the login in the background.
   */
  async run(supportsUrlElicitation: boolean, handler: () => Promise<ToolResult>): Promise<ToolResult> {
    if (!supportsUrlElicitation) return handler();

    let started!: (login: StartedLogin) => void;
    const loginStarted = new Promise<StartedLogin>((resolve) => {
      started = resolve;
    });
    const outcome: Promise<Outcome> = loginScope.run({started}, handler).then(
      (result) => ({ok: true, result}),
      (error: unknown) => ({ok: false, error}),
    );

    const first = await Promise.race([outcome, loginStarted.then((login) => ({login}))]);
    if (!('login' in first)) {
      if (!first.ok) throw first.error;
      return first.result;
    }

    const requestState = `${STATE_PREFIX}${randomUUID()}`;
    this.pending.set(requestState, {login: first.login.login, outcome});
    outcome.then(() => setTimeout(() => this.pending.delete(requestState), RETENTION_MS).unref());
    return {
      ...inputRequired({
        requestState,
        inputRequests: {[INPUT_KEY]: inputRequired.elicitUrl({message: LOGIN_MESSAGE, url: first.login.url})},
      }),
      // Keep the local tool result shape; the SDK dispatches by resultType before content.
      content: [],
    };
  }
}
