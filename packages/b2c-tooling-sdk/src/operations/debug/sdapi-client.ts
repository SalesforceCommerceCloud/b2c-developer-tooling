/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Stateless HTTP client for the B2C Commerce Script Debugger API (SDAPI 2.0).
 *
 * All methods use global `fetch()` with Basic auth and the required
 * `x-dw-client-id` header. The client is stateless — callers are responsible
 * for session lifecycle (create/delete client, polling, keepalive).
 *
 * @module operations/debug/sdapi-client
 */
import {getLogger} from '../../logging/logger.js';
import type {
  SdapiBreakpoint,
  SdapiBreakpoints,
  SdapiEvalResult,
  SdapiFault,
  SdapiObjectMembers,
  SdapiScriptThread,
  SdapiScriptThreads,
  BreakpointInput,
} from './types.js';

/**
 * Converts a Headers object to a plain object for trace logging.
 */
function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Error thrown when the SDAPI returns a fault response.
 */
export class SdapiError extends Error {
  readonly fault: SdapiFault;
  readonly status: number;

  constructor(fault: SdapiFault, status: number) {
    super(`${fault.type}: ${fault.message}`);
    this.name = 'SdapiError';
    this.fault = fault;
    this.status = status;
  }
}

export interface SdapiClientConfig {
  hostname: string;
  username: string;
  password: string;
  clientId?: string;
}

/**
 * Creates a new SDAPI client.
 */
export function createSdapiClient(config: SdapiClientConfig): SdapiClient {
  return new SdapiClient(config);
}

export class SdapiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly logger = getLogger();
  /**
   * Cookies (name -> value) returned by the SDAPI via Set-Cookie, replayed on
   * subsequent requests. The debugger establishes a session (e.g. `dwsid`) on
   * the first request that must be honored for the lifetime of this client.
   *
   * Replaying these cookies is required for server affinity: in multi-app
   * server instances/environments the `dwsid` pins the session to the app
   * server that holds the debugger state, so without it subsequent requests may
   * be routed to a different app server with no knowledge of the session.
   */
  private readonly cookies = new Map<string, string>();

  constructor(config: SdapiClientConfig) {
    this.baseUrl = `https://${config.hostname}/s/-/dw/debugger/v2_0`;
    const credentials = btoa(`${config.username}:${config.password}`);
    this.headers = {
      Authorization: `Basic ${credentials}`,
      'x-dw-client-id': config.clientId ?? 'b2c-cli',
      'Content-Type': 'application/json',
    };
  }

  // -----------------------------------------------------------------------
  // Client resource (debugger lifecycle)
  // -----------------------------------------------------------------------

  async createClient(): Promise<void> {
    await this.request('POST', '/client', {expect204: true});
  }

  async deleteClient(): Promise<void> {
    await this.request('DELETE', '/client', {expect204: true});
  }

  // -----------------------------------------------------------------------
  // Breakpoints
  // -----------------------------------------------------------------------

  /**
   * Retrieves all currently set breakpoints for the debugger session.
   * @returns Promise resolving to array of breakpoints, or empty array if none are set.
   */
  async getBreakpoints(): Promise<SdapiBreakpoint[]> {
    const data = await this.request<SdapiBreakpoints>('GET', '/breakpoints');
    return data.breakpoints ?? [];
  }

  /**
   * Sets or replaces breakpoints for the debugger.
   * @param breakpoints Array of breakpoint definitions to set.
   * @returns Promise resolving to array of confirmed breakpoints from the server.
   */
  async setBreakpoints(breakpoints: BreakpointInput[]): Promise<SdapiBreakpoint[]> {
    const data = await this.request<SdapiBreakpoints>('POST', '/breakpoints', {
      body: {breakpoints},
    });
    return data.breakpoints ?? [];
  }

  async deleteBreakpoints(): Promise<void> {
    await this.request('DELETE', '/breakpoints', {expect204: true});
  }

  async deleteBreakpoint(id: number): Promise<void> {
    await this.request('DELETE', `/breakpoints/${id}`, {expect204: true});
  }

  // -----------------------------------------------------------------------
  // Threads
  // -----------------------------------------------------------------------

  /**
   * Gets all active script threads.
   * @returns Promise resolving to array of script threads, or empty array if none are active.
   */
  async getThreads(): Promise<SdapiScriptThread[]> {
    const data = await this.request<SdapiScriptThreads>('GET', '/threads');
    return data.script_threads ?? [];
  }

  /**
   * Retrieves a specific thread by ID.
   * @param threadId The thread identifier.
   * @returns Promise resolving to the thread object with its current state.
   */
  async getThread(threadId: number): Promise<SdapiScriptThread> {
    return this.request<SdapiScriptThread>('GET', `/threads/${threadId}`);
  }

  async resetThreads(): Promise<void> {
    await this.request('POST', '/threads/reset', {expect204: true});
  }

  // -----------------------------------------------------------------------
  // Execution control
  // -----------------------------------------------------------------------

  async resume(threadId: number): Promise<SdapiScriptThread> {
    return this.request<SdapiScriptThread>('POST', `/threads/${threadId}/resume`);
  }

  async stepOver(threadId: number): Promise<SdapiScriptThread> {
    return this.request<SdapiScriptThread>('POST', `/threads/${threadId}/over`);
  }

  async stepInto(threadId: number): Promise<SdapiScriptThread> {
    return this.request<SdapiScriptThread>('POST', `/threads/${threadId}/into`);
  }

  async stepOut(threadId: number): Promise<SdapiScriptThread> {
    return this.request<SdapiScriptThread>('POST', `/threads/${threadId}/out`);
  }

  async stopThread(threadId: number): Promise<void> {
    await this.request('DELETE', `/threads/${threadId}/stop`, {expect204: true});
  }

  // -----------------------------------------------------------------------
  // Variables & evaluation
  // -----------------------------------------------------------------------

  async getVariables(threadId: number, frameIndex: number): Promise<SdapiObjectMembers> {
    return this.request<SdapiObjectMembers>('GET', `/threads/${threadId}/frames/${frameIndex}/variables`);
  }

  async getMembers(
    threadId: number,
    frameIndex: number,
    objectPath?: string,
    start?: number,
    count?: number,
  ): Promise<SdapiObjectMembers> {
    const params = new URLSearchParams();
    if (objectPath) params.set('object_path', objectPath);
    if (start !== undefined) params.set('start', String(start));
    if (count !== undefined) params.set('count', String(count));
    const qs = params.toString();
    const suffix = qs ? `?${qs}` : '';
    return this.request<SdapiObjectMembers>('GET', `/threads/${threadId}/frames/${frameIndex}/members${suffix}`);
  }

  /**
   * Evaluates a JavaScript expression in a frame context.
   * @param threadId The thread ID of the halted thread.
   * @param frameIndex The stack frame index (0 = topmost frame).
   * @param expr The JavaScript expression to evaluate.
   * @returns Promise resolving to the evaluation result.
   */
  async evaluate(threadId: number, frameIndex: number, expr: string): Promise<SdapiEvalResult> {
    const params = new URLSearchParams({expr});
    return this.request<SdapiEvalResult>('GET', `/threads/${threadId}/frames/${frameIndex}/eval?${params.toString()}`);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async request<T>(method: string, path: string, options?: {body?: unknown; expect204?: boolean}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {...this.headers, ...this.cookieHeader()};
    this.logger.trace({method, url, headers, body: options?.body}, `[SDAPI REQ] ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    this.storeCookies(response.headers);
    this.logger.trace(
      {method, url, status: response.status, headers: headersToObject(response.headers)},
      `[SDAPI RESP] ${method} ${url} ${response.status}`,
    );

    if (options?.expect204) {
      if (!response.ok) {
        await this.throwSdapiError(response);
      }
      return undefined as T;
    }

    if (!response.ok) {
      await this.throwSdapiError(response);
    }

    return (await response.json()) as T;
  }

  private async throwSdapiError(response: Response): Promise<never> {
    let fault: SdapiFault;
    try {
      const body = (await response.json()) as Record<string, unknown>;
      // SDAPI may return fault at top level or nested under a "fault" property
      const faultData = (body.fault as Record<string, unknown>) ?? body;
      fault = {
        _v: String(faultData._v ?? body._v ?? '2.0'),
        type: String(faultData.type ?? 'UnknownError'),
        message: String(faultData.message ?? `HTTP ${response.status} ${response.statusText}`),
      };
    } catch {
      fault = {_v: '2.0', type: 'UnknownError', message: `HTTP ${response.status} ${response.statusText}`};
    }
    throw new SdapiError(fault, response.status);
  }

  /**
   * Builds the `Cookie` request header from stored session cookies, or an empty
   * object if none have been set yet.
   */
  private cookieHeader(): Record<string, string> {
    if (this.cookies.size === 0) {
      return {};
    }
    const cookie = Array.from(this.cookies, ([name, value]) => `${name}=${value}`).join('; ');
    return {Cookie: cookie};
  }

  /**
   * Parses `Set-Cookie` headers from a response and stores them for replay on
   * subsequent requests (only the name=value pair is retained, attributes are
   * ignored). Uses `Headers.getSetCookie()` so multiple cookies are not
   * collapsed into a single comma-joined value.
   */
  private storeCookies(headers: Headers): void {
    const setCookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : ([] as string[]);
    for (const setCookie of setCookies) {
      const pair = setCookie.split(';', 1)[0]?.trim();
      if (!pair) {
        continue;
      }
      const eq = pair.indexOf('=');
      if (eq <= 0) {
        continue;
      }
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      this.cookies.set(name, value);
    }
  }
}
