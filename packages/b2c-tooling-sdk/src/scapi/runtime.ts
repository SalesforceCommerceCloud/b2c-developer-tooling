/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {spawn} from 'node:child_process';
import {getLogger} from '../logging/logger.js';
import type {ScapiSchemaDocument} from './catalog.js';
import {SCAPI_WORKER_SOURCE} from './worker-source.js';
import {describeScapiSchemas, type ScapiAuthType} from './authentication.js';
import {createScapiOperationSearch, type ScapiOperationSearchOptions} from './search.js';
import {createScapiSnippetResolver, loadBuiltinScapiSnippets, type ScapiSnippet} from './snippets.js';
import type {SafetyConfig} from '../safety/index.js';
import {filterScapiDocumentsBySafety} from './safety-filter.js';
import {toScapiCodeError} from './errors.js';
import {toOrganizationId} from '../clients/custom-apis.js';

/**
 * How to start the code-mode worker. Defaults to `process.execPath` with no extra arguments.
 *
 * In Electron, `process.execPath` is the app binary. The SDK detects Electron (including
 * its main process and a process already running with `ELECTRON_RUN_AS_NODE=1`) and starts
 * the worker with `ELECTRON_RUN_AS_NODE=1`, so no option is needed.
 */
export interface ScapiWorkerCommand {
  /** Executable to start. */
  command: string;
  /** Arguments placed before the SDK's own flags (`--permission`, `--eval <worker>`, …). */
  args?: string[];
  /**
   * Extra environment variables, merged over the minimal worker environment
   * (`PATH`, `SYSTEMROOT`, `TEMP`). Names that look like credentials are rejected.
   */
  env?: Record<string, string>;
}

const CREDENTIAL_ENV_NAME = /pass(word|wd)?|secret|token|auth|credential|api[-_]?key|private[-_]?key|cookie|session/i;

/** Build the worker's argv and environment. Exported for tests. @internal */
export function resolveScapiWorkerSpawn(
  worker?: ScapiWorkerCommand,
  versions: Partial<Record<string, string>> = process.versions,
): {
  command: string;
  args: string[];
  env: Record<string, string | undefined>;
} {
  const env: Record<string, string | undefined> = {
    PATH: process.env.PATH,
    SYSTEMROOT: process.env.SYSTEMROOT,
    TEMP: process.env.TEMP,
  };
  // Inside Electron (main, utility or a process already running as Node), process.execPath is
  // the app binary; without this the worker would start the app instead of running the script.
  if (versions.electron || process.env.ELECTRON_RUN_AS_NODE === '1') env.ELECTRON_RUN_AS_NODE = '1';
  for (const [name, value] of Object.entries(worker?.env ?? {})) {
    if (CREDENTIAL_ENV_NAME.test(name))
      throw new Error(`SCAPI worker environment must not carry credentials; remove ${name}.`);
    if (typeof value !== 'string') throw new Error(`SCAPI worker environment value for ${name} must be a string.`);
    env[name] = value;
  }
  return {
    command: worker?.command ?? process.execPath,
    args: [
      ...(worker?.args ?? []),
      '--permission',
      '--max-old-space-size=128',
      '--input-type=commonjs',
      '--eval',
      SCAPI_WORKER_SOURCE,
    ],
    env,
  };
}

/** Host-only controls for an execution retained while awaiting user input. */
export interface ScapiRuntimeControl {
  pauseTimeout(): void;
  resumeTimeout(): void;
}

export interface ScapiCodeOptions {
  code: string;
  input?: unknown;
  snippets?: ScapiSnippet[];
  documents?: ScapiSchemaDocument[];
  authType?: ScapiAuthType;
  request?: (options: unknown, signal: AbortSignal) => Promise<unknown>;
  /** SLAS token export behind `auth.slas()`; the program has no `auth` global when omitted. */
  auth?: (operation: string, options: unknown, signal: AbortSignal) => Promise<unknown>;
  /** Tenant (`zzzz_001`) or organization ID (`f_ecom_zzzz_001`); programs always see the `f_ecom_` form. */
  organizationId?: string;
  siteId?: string;
  cwd?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxOutputBytes?: number;
  /**
   * How much prose `spec` operations carry. `outline` keeps each operation's own summary, description and tags but
   * drops nested descriptions and examples, keeping discovery results within the output cap. Defaults to `full`.
   */
  detail?: 'outline' | 'full';
  /** The host owns cancellation and cleanup while paused; approval may wait indefinitely. Never exposed to the child. */
  onControl?: (control: ScapiRuntimeControl) => void;
  /** How to start the worker process. See {@link ScapiWorkerCommand}. */
  worker?: ScapiWorkerCommand;
  /**
   * Hide operations this safety policy always blocks from `spec.paths` and
   * `spec.search`, so programs only see what they can call. Pass the same
   * config given to `createScapiRequest`, which still enforces it.
   */
  safety?: SafetyConfig;
}

/** Execute one JavaScript async function in a disposable Node process. */
export async function runScapiCode(options: ScapiCodeOptions): Promise<unknown> {
  try {
    return await runScapiCodeUnchecked(options);
  } catch (error) {
    throw toScapiCodeError(error);
  }
}

async function runScapiCodeUnchecked(options: ScapiCodeOptions): Promise<unknown> {
  const timeoutMs = Math.min(options.timeoutMs ?? 30_000, 60_000);
  if (!options.code.trim() || Buffer.byteLength(options.code) > 32_768)
    throw new Error('Code must contain 1-32768 bytes.');
  if (options.signal?.aborted) throw new Error('SCAPI_EXECUTION_CANCELLED');
  const documents = filterScapiDocumentsBySafety(
    describeScapiSchemas(options.documents ?? [], options.authType),
    options.safety,
    options.organizationId ? toOrganizationId(options.organizationId) : undefined,
  );
  const resolveSnippet = createScapiSnippetResolver(options.snippets ?? loadBuiltinScapiSnippets());
  // Built on first spec.search so runs that only filter spec.paths pay nothing.
  let searchOperations: ReturnType<typeof createScapiOperationSearch> | undefined;
  if (options.safety && options.documents?.length && !documents.length)
    throw new Error('SCAPI_SAFETY_BLOCKED: the safety policy blocks every operation in these schemas.');
  if (options.authType && !documents.length)
    throw new Error(
      `No ${options.authType} operations match this search. Omit authType to inspect all authentication requirements.`,
    );
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    let spawnSpec: ReturnType<typeof resolveScapiWorkerSpawn>;
    try {
      spawnSpec = resolveScapiWorkerSpawn(options.worker);
    } catch (error) {
      reject(error);
      return;
    }
    const child = spawn(spawnSpec.command, spawnSpec.args, {
      cwd: options.cwd,
      // Credentials stay in the parent; auth.slas() returns only shopper tokens and metadata.
      env: spawnSpec.env,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      windowsHide: true,
    });
    let settled = false;
    let outputBytes = 0;
    let calls = 0;
    let active = 0;
    let snippetCalls = 0;
    let searchCalls = 0;
    let outcome: {value?: unknown; error?: Error} | undefined;
    const finish = (value?: unknown, error?: Error) => {
      if (settled) return;
      settled = true;
      outcome = {value, error};
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
      controller.abort();
      child.kill('SIGKILL');
    };
    const cancel = () =>
      finish(undefined, new Error('SCAPI_EXECUTION_CANCELLED: check any in-flight write before retrying.'));
    let remainingMs = timeoutMs;
    let startedAt = performance.now();
    const timedOut = () =>
      finish(undefined, new Error('SCAPI_EXECUTION_TIMEOUT: check any in-flight write before retrying.'));
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(timedOut, remainingMs);
    const control: ScapiRuntimeControl = {
      pauseTimeout() {
        if (settled || !timer) return;
        remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
        clearTimeout(timer);
        timer = undefined;
      },
      resumeTimeout() {
        if (settled || timer) return;
        startedAt = performance.now();
        timer = setTimeout(timedOut, remainingMs);
      },
    };
    options.signal?.addEventListener('abort', cancel, {once: true});
    const drain = (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > 65_536) finish(undefined, new Error('SCAPI_CONSOLE_LIMIT: return results instead of logging.'));
    };
    child.stdout?.on('data', drain);
    child.stderr?.on('data', drain);
    child.on('spawn', () => getLogger().debug({workerPid: child.pid}, 'SCAPI code worker started'));
    child.on('error', (error) => finish(undefined, error));
    child.on('close', (code) => {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
      controller.abort();
      if (outcome?.error) reject(outcome.error);
      else if (outcome) resolve(outcome.value);
      else reject(new Error(`SCAPI_EXECUTION_EXITED: ${code}. Check writes before retrying.`));
    });
    child.on('message', async (raw: unknown) => {
      if (settled || !raw || typeof raw !== 'object') return;
      const message = raw as {
        type: string;
        id: number;
        value?: unknown;
        error?: string;
        options?: unknown;
        operation?: string;
        name?: string;
        input?: unknown;
        query?: unknown;
      };
      if (message.type === 'result') return finish(message.value);
      if (message.type === 'error') return finish(undefined, new Error(message.error));
      const reply = (value?: unknown, error?: string) => {
        if (!settled && child.connected) child.send({type: 'reply', id: message.id, value, error}, () => {});
      };
      if (message.type === 'snippet') {
        try {
          if (++snippetCalls > 100)
            throw new Error('SCAPI_SNIPPET_LIMIT: at most 100 snippet operations per execution.');
          if (message.operation === 'run' && !options.request) throw new Error('Use scapi_execute to run snippets.');
          reply(resolveSnippet(message.operation ?? '', message.name ?? '', message.input));
        } catch (error) {
          reply(undefined, error instanceof Error ? error.message : String(error));
        }
        return;
      }
      if (message.type === 'search') {
        try {
          if (++searchCalls > 50) throw new Error('SCAPI_SEARCH_LIMIT: at most 50 spec.search calls per execution.');
          searchOperations ??= createScapiOperationSearch(documents);
          reply(searchOperations(String(message.query ?? ''), message.options as ScapiOperationSearchOptions));
        } catch (error) {
          reply(undefined, error instanceof Error ? error.message : String(error));
        }
        return;
      }
      if (message.type !== 'request' && message.type !== 'auth') return;
      if (message.type === 'auth' ? !options.auth : !options.request)
        return reply(undefined, 'Schema search cannot make SCAPI or authentication requests. Use scapi_execute.');
      if (++calls > 20) return reply(undefined, 'SCAPI_CALL_LIMIT: at most 20 requests per execution.');
      if (active >= 4) return reply(undefined, 'SCAPI_CONCURRENCY_LIMIT: at most four concurrent requests.');
      active++;
      try {
        reply(
          message.type === 'auth'
            ? await options.auth!(message.operation ?? '', message.options, controller.signal)
            : await options.request!(message.options, controller.signal),
        );
      } catch (error) {
        reply(undefined, error instanceof Error ? error.message : String(error));
      } finally {
        active--;
      }
    });
    try {
      options.onControl?.(control);
    } catch (error) {
      finish(undefined, error instanceof Error ? error : new Error(String(error)));
      return;
    }
    if (options.signal?.aborted) {
      cancel();
      return;
    }
    child.send(
      {
        type: 'run',
        ...options,
        // Programs build paths from this; match the f_ecom_ form the request check uses.
        organizationId: options.organizationId ? toOrganizationId(options.organizationId) : undefined,
        documents,
        request: undefined,
        auth: Boolean(options.auth),
        snippets: undefined,
        signal: undefined,
        onControl: undefined,
        worker: undefined,
        safety: undefined,
        maxOutputBytes: Math.min(options.maxOutputBytes ?? 24_000, 65_536),
      },
      (error) => {
        if (error) finish(undefined, error);
      },
    );
  });
}
