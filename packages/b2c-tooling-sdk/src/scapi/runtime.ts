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
import {createScapiSnippetResolver, loadBuiltinScapiSnippets, type ScapiSnippet} from './snippets.js';

export interface ScapiCodeOptions {
  code: string;
  input?: unknown;
  snippets?: ScapiSnippet[];
  documents?: ScapiSchemaDocument[];
  authType?: ScapiAuthType;
  request?: (options: unknown, signal: AbortSignal) => Promise<unknown>;
  auth?: (operation: string, options: unknown, signal: AbortSignal) => Promise<unknown>;
  organizationId?: string;
  siteId?: string;
  cwd?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxOutputBytes?: number;
}

/** Execute one JavaScript async function in a disposable Node process. */
export async function runScapiCode(options: ScapiCodeOptions): Promise<unknown> {
  const timeoutMs = Math.min(options.timeoutMs ?? 30_000, 60_000);
  if (!options.code.trim() || Buffer.byteLength(options.code) > 32_768)
    throw new Error('Code must contain 1-32768 bytes.');
  if (options.signal?.aborted) throw new Error('SCAPI_EXECUTION_CANCELLED');
  const documents = describeScapiSchemas(options.documents ?? [], options.authType);
  const resolveSnippet = createScapiSnippetResolver(options.snippets ?? loadBuiltinScapiSnippets());
  if (options.authType && !documents.length)
    throw new Error(
      `No ${options.authType} operations match this search. Omit authType to inspect all authentication requirements.`,
    );
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const child = spawn(
      process.execPath,
      ['--permission', '--max-old-space-size=128', '--input-type=commonjs', '--eval', SCAPI_WORKER_SOURCE],
      {
        cwd: options.cwd,
        // Credentials stay in the parent; explicit token helpers return only tokens and metadata.
        env: {PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, TEMP: process.env.TEMP},
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        windowsHide: true,
      },
    );
    let settled = false;
    let outputBytes = 0;
    let calls = 0;
    let active = 0;
    let snippetCalls = 0;
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
    const timer = setTimeout(
      () => finish(undefined, new Error('SCAPI_EXECUTION_TIMEOUT: check any in-flight write before retrying.')),
      timeoutMs,
    );
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
    child.send(
      {
        type: 'run',
        ...options,
        documents,
        request: undefined,
        auth: undefined,
        snippets: undefined,
        signal: undefined,
        maxOutputBytes: Math.min(options.maxOutputBytes ?? 24_000, 65_536),
      },
      (error) => {
        if (error) finish(undefined, error);
      },
    );
  });
}
