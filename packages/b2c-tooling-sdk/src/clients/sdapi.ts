/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Script Debugger API (SDAPI) client for B2C Commerce.
 *
 * Provides methods for remotely debugging scripts on B2C Commerce instances,
 * including setting breakpoints and evaluating expressions.
 *
 * @module clients/sdapi
 */
import type {AuthStrategy} from '../auth/types.js';
import {HTTPError} from '../errors/http-error.js';
import {getLogger} from '../logging/logger.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry, type UnifiedMiddleware} from './middleware-registry.js';

/**
 * Breakpoint definition for SDAPI.
 */
export interface Breakpoint {
  /** Unique identifier for the breakpoint */
  id?: number;
  /** Line number (1-based) */
  line_number: number;
  /** Script path relative to cartridge (e.g., "controllers/Default.js") */
  script_path: string;
}

/**
 * Thread information from SDAPI.
 */
export interface ThreadInfo {
  /** Thread ID */
  id: number;
  /** Thread status */
  status: 'halted' | 'running' | 'waiting';
  /** Call stack frames if halted */
  call_stack?: StackFrame[];
}

/**
 * Stack frame information.
 */
export interface StackFrame {
  /** Frame index (0 is top of stack) */
  index: number;
  /** Script path */
  location: {
    script_path: string;
    line_number: number;
  };
  /** Function name */
  function_name?: string;
}

/**
 * Result of evaluating an expression via SDAPI.
 */
export interface EvalResult {
  /** Evaluated result value */
  result?: string;
  /** Error message if evaluation failed */
  error?: string;
}

/**
 * Options for creating an SDAPI client.
 */
export interface SdapiClientOptions {
  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * SDAPI client for B2C Commerce script debugging.
 *
 * Handles SDAPI requests with proper authentication and provides
 * typed methods for debugger operations.
 *
 * @example
 * // Create client with basic auth
 * const auth = new BasicAuthStrategy(username, password);
 * const client = new SdapiClient('sandbox.demandware.net', auth);
 *
 * // Enable debugger and set breakpoint
 * await client.enableDebugger();
 * await client.setBreakpoints([{ script_path: 'controllers/Default.js', line_number: 10 }]);
 *
 * // After triggering the breakpoint, evaluate an expression
 * const threads = await client.getThreads();
 * const halted = threads.find(t => t.status === 'halted');
 * if (halted) {
 *   const result = await client.evaluate(halted.id, 0, 'dw.system.Site.getCurrent().getName()');
 *   console.log(result);
 * }
 *
 * // Cleanup
 * await client.disableDebugger();
 */
export class SdapiClient {
  private baseUrl: string;
  private middlewareRegistry: MiddlewareRegistry;

  /**
   * Creates a new SDAPI client.
   *
   * @param hostname - B2C Commerce instance hostname
   * @param auth - Authentication strategy to use for requests (typically Basic auth)
   * @param options - Optional configuration including middleware registry
   */
  constructor(
    hostname: string,
    private auth: AuthStrategy,
    options?: SdapiClientOptions,
  ) {
    this.baseUrl = `https://${hostname}/s/-/dw/debugger/v2_0`;
    this.middlewareRegistry = options?.middlewareRegistry ?? globalMiddlewareRegistry;
  }

  /**
   * Builds the full URL for an SDAPI path.
   *
   * @param path - Path relative to debugger API base (e.g., "/client", "/breakpoints")
   * @returns Full URL
   */
  buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  /**
   * Collects middleware from the registry for SDAPI client.
   */
  private getMiddleware(): UnifiedMiddleware[] {
    return this.middlewareRegistry.getMiddleware('sdapi');
  }

  /**
   * Makes a raw SDAPI request.
   *
   * @param path - Path relative to debugger API base
   * @param init - Fetch init options
   * @returns Response from the server
   */
  async request(path: string, init?: RequestInit): Promise<Response> {
    const logger = getLogger();
    const url = this.buildUrl(path);

    // Default headers for SDAPI
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('x-dw-client-id', 'SDAPI-Client');

    // Build initial request object
    let request = new Request(url, {...init, headers});

    // Apply onRequest middleware
    const middleware = this.getMiddleware();
    const middlewareParams = {
      request,
      schemaPath: path,
      options: {baseUrl: this.baseUrl},
      params: {},
      id: 'sdapi',
    };

    for (const m of middleware) {
      if (m.onRequest) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await m.onRequest(middlewareParams as any);
        if (result instanceof Request) {
          request = result;
          middlewareParams.request = request;
        }
      }
    }

    // Debug: Log request start
    logger.debug({method: request.method, url: request.url}, `[SDAPI REQ] ${request.method} ${request.url}`);

    // Trace: Log request details
    logger.trace(
      {
        method: request.method,
        url: request.url,
        headers: this.headersToObject(request.headers),
        body: this.formatBody(init?.body),
      },
      `[SDAPI REQ BODY] ${request.method} ${request.url}`,
    );

    const startTime = Date.now();

    // Use auth.fetch with the (potentially modified) request
    let response = await this.auth.fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: init?.body,
    });

    const duration = Date.now() - startTime;

    // Apply onResponse middleware
    const responseParams = {
      ...middlewareParams,
      request,
      response,
    };
    for (const m of middleware) {
      if (m.onResponse) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await m.onResponse(responseParams as any);
        if (result instanceof Response) {
          response = result;
          responseParams.response = response;
        }
      }
    }

    // Debug: Log response summary
    logger.debug(
      {method: request.method, url: request.url, status: response.status, duration},
      `[SDAPI RESP] ${request.method} ${request.url} ${response.status} ${duration}ms`,
    );

    // Trace: Log response body (clone to read body without consuming it)
    // We always clone/read since pino will skip logging if trace isn't enabled
    const clonedResponse = response.clone();
    try {
      const responseBody = await clonedResponse.text();
      logger.trace(
        {
          method: request.method,
          url: request.url,
          status: response.status,
          body: responseBody,
        },
        `[SDAPI RESP BODY] ${request.method} ${request.url}`,
      );
    } catch {
      // Ignore errors reading body for logging
    }

    return response;
  }

  /**
   * Converts Headers to a plain object for logging.
   */
  private headersToObject(headers?: RequestInit['headers'] | Headers): Record<string, string> | undefined {
    if (!headers) return undefined;

    const result: Record<string, string> = {};
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        result[key] = value;
      }
    } else {
      Object.assign(result, headers);
    }
    return result;
  }

  /**
   * Formats body for logging.
   */
  private formatBody(body?: RequestInit['body']): string | undefined {
    if (!body) return undefined;
    if (typeof body === 'string') {
      return body;
    }
    return '[Body]';
  }

  /**
   * Enables the debugger on the instance.
   *
   * This creates a debugger client session. Must be called before
   * setting breakpoints or evaluating expressions.
   *
   * @throws HTTPError if the request fails
   */
  async enableDebugger(): Promise<void> {
    const logger = getLogger();
    logger.debug('Enabling SDAPI debugger');

    const response = await this.request('/client', {method: 'POST'});

    // 200 or 204 = success, 409 = already enabled (acceptable)
    if (!response.ok && response.status !== 409) {
      throw new HTTPError(`Failed to enable debugger: ${response.status} ${response.statusText}`, response, 'POST');
    }

    logger.debug('SDAPI debugger enabled');
  }

  /**
   * Disables the debugger on the instance.
   *
   * This terminates the debugger client session and resumes any
   * halted threads.
   *
   * @throws HTTPError if the request fails
   */
  async disableDebugger(): Promise<void> {
    const logger = getLogger();
    logger.debug('Disabling SDAPI debugger');

    const response = await this.request('/client', {method: 'DELETE'});

    // 204 = success, 404 = already disabled (acceptable)
    if (!response.ok && response.status !== 404) {
      throw new HTTPError(`Failed to disable debugger: ${response.status} ${response.statusText}`, response, 'DELETE');
    }

    logger.debug('SDAPI debugger disabled');
  }

  /**
   * Sets breakpoints on the instance.
   *
   * This replaces any existing breakpoints with the provided list.
   *
   * @param breakpoints - Array of breakpoints to set
   * @returns Array of breakpoints with assigned IDs
   * @throws HTTPError if the request fails
   */
  async setBreakpoints(breakpoints: Breakpoint[]): Promise<Breakpoint[]> {
    const logger = getLogger();
    logger.debug({count: breakpoints.length}, `Setting ${breakpoints.length} breakpoint(s)`);

    const response = await this.request('/breakpoints', {
      method: 'POST',
      body: JSON.stringify({breakpoints}),
    });

    if (!response.ok) {
      throw new HTTPError(`Failed to set breakpoints: ${response.status} ${response.statusText}`, response, 'POST');
    }

    const data = (await response.json()) as {breakpoints?: Breakpoint[]};
    logger.debug({breakpoints: data.breakpoints}, 'Breakpoints set');
    return data.breakpoints ?? [];
  }

  /**
   * Deletes all breakpoints on the instance.
   *
   * @throws HTTPError if the request fails
   */
  async deleteBreakpoints(): Promise<void> {
    const logger = getLogger();
    logger.debug('Deleting all breakpoints');

    const response = await this.request('/breakpoints', {method: 'DELETE'});

    // 204 = success, 404 = none to delete (acceptable)
    if (!response.ok && response.status !== 404) {
      throw new HTTPError(
        `Failed to delete breakpoints: ${response.status} ${response.statusText}`,
        response,
        'DELETE',
      );
    }

    logger.debug('Breakpoints deleted');
  }

  /**
   * Gets all threads on the instance.
   *
   * Use this to find halted threads after triggering a breakpoint.
   *
   * @returns Array of thread information
   * @throws HTTPError if the request fails
   */
  async getThreads(): Promise<ThreadInfo[]> {
    const logger = getLogger();
    logger.debug('Getting threads');

    const response = await this.request('/threads', {method: 'GET'});

    if (!response.ok) {
      throw new HTTPError(`Failed to get threads: ${response.status} ${response.statusText}`, response, 'GET');
    }

    const data = (await response.json()) as {script_threads?: ThreadInfo[]};
    const threads = data.script_threads ?? [];
    logger.debug({count: threads.length}, `Found ${threads.length} thread(s)`);
    return threads;
  }

  /**
   * Evaluates an expression in the context of a halted thread.
   *
   * @param threadId - ID of the halted thread
   * @param frameIndex - Stack frame index (0 = top of stack)
   * @param expression - Script expression to evaluate
   * @returns Evaluation result or error
   * @throws HTTPError if the request fails
   */
  async evaluate(threadId: number, frameIndex: number, expression: string): Promise<EvalResult> {
    const logger = getLogger();
    logger.debug({threadId, frameIndex, expressionLength: expression.length}, 'Evaluating expression');

    // SDAPI eval uses GET with expression as query parameter
    const encodedExpr = encodeURIComponent(expression);
    const path = `/threads/${threadId}/frames/${frameIndex}/eval?expr=${encodedExpr}`;

    const response = await this.request(path, {method: 'GET'});

    if (!response.ok) {
      throw new HTTPError(`Failed to evaluate expression: ${response.status} ${response.statusText}`, response, 'GET');
    }

    const data = (await response.json()) as {result?: string; error_message?: string};
    logger.debug({hasResult: !!data.result, hasError: !!data.error_message}, 'Expression evaluated');

    // Check if the result contains a runtime error (SDAPI returns these in the result field)
    // Common error patterns: ReferenceError, TypeError, SyntaxError, Error, etc.
    const errorPattern = /^(ReferenceError|TypeError|SyntaxError|Error|RangeError|URIError|EvalError):/;
    const resultIsError = data.result && errorPattern.test(data.result);

    return {
      result: resultIsError ? undefined : data.result,
      error: data.error_message ?? (resultIsError ? data.result : undefined),
    };
  }

  /**
   * Resumes a halted thread.
   *
   * @param threadId - ID of the thread to resume
   * @throws HTTPError if the request fails
   */
  async resumeThread(threadId: number): Promise<void> {
    const logger = getLogger();
    logger.debug({threadId}, `Resuming thread ${threadId}`);

    const response = await this.request(`/threads/${threadId}/resume`, {method: 'POST'});

    if (!response.ok) {
      throw new HTTPError(`Failed to resume thread: ${response.status} ${response.statusText}`, response, 'POST');
    }

    logger.debug({threadId}, `Thread ${threadId} resumed`);
  }

  /**
   * Resets thread timeout counters.
   *
   * Call this periodically during long debugging sessions to prevent
   * threads from timing out (60 second limit).
   *
   * @throws HTTPError if the request fails
   */
  async resetThreadTimeouts(): Promise<void> {
    const logger = getLogger();
    logger.debug('Resetting thread timeouts');

    const response = await this.request('/threads/reset', {method: 'POST'});

    if (!response.ok) {
      throw new HTTPError(
        `Failed to reset thread timeouts: ${response.status} ${response.statusText}`,
        response,
        'POST',
      );
    }

    logger.debug('Thread timeouts reset');
  }

  /**
   * Steps into the next statement in a halted thread.
   *
   * @param threadId - ID of the thread
   * @throws HTTPError if the request fails
   */
  async stepInto(threadId: number): Promise<void> {
    const logger = getLogger();
    logger.debug({threadId}, `Stepping into thread ${threadId}`);

    const response = await this.request(`/threads/${threadId}/into`, {method: 'POST'});

    if (!response.ok) {
      throw new HTTPError(`Failed to step into: ${response.status} ${response.statusText}`, response, 'POST');
    }

    logger.debug({threadId}, 'Step into completed');
  }

  /**
   * Steps over the next statement in a halted thread.
   *
   * @param threadId - ID of the thread
   * @throws HTTPError if the request fails
   */
  async stepOver(threadId: number): Promise<void> {
    const logger = getLogger();
    logger.debug({threadId}, `Stepping over thread ${threadId}`);

    const response = await this.request(`/threads/${threadId}/over`, {method: 'POST'});

    if (!response.ok) {
      throw new HTTPError(`Failed to step over: ${response.status} ${response.statusText}`, response, 'POST');
    }

    logger.debug({threadId}, 'Step over completed');
  }

  /**
   * Steps out of the current function in a halted thread.
   *
   * @param threadId - ID of the thread
   * @throws HTTPError if the request fails
   */
  async stepOut(threadId: number): Promise<void> {
    const logger = getLogger();
    logger.debug({threadId}, `Stepping out of thread ${threadId}`);

    const response = await this.request(`/threads/${threadId}/out`, {method: 'POST'});

    if (!response.ok) {
      throw new HTTPError(`Failed to step out: ${response.status} ${response.statusText}`, response, 'POST');
    }

    logger.debug({threadId}, 'Step out completed');
  }
}
