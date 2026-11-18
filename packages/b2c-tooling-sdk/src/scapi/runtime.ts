/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomInt} from 'node:crypto';
import {
  CodemodeSandbox,
  type CodemodeHostCall,
  type CodemodeOutcome,
  type CodemodeWasmModule,
} from '@earendil-works/pi-codemode';
import {getLogger} from '../logging/logger.js';
import type {ScapiSchemaDocument} from './catalog.js';
import {describeScapiSchemas, type ScapiAuthType} from './authentication.js';
import {createScapiSnippetResolver, loadBuiltinScapiSnippets, type ScapiSnippet} from './snippets.js';
import type {SafetyConfig} from '../safety/index.js';
import {filterScapiDocumentsBySafety} from './safety-filter.js';
import {ScapiCodeError, ScapiCodePause, toScapiCodeError} from './errors.js';
import {toOrganizationId} from '../clients/custom-apis.js';
import {createScapiSpecHost} from './spec.js';
import {buildScapiScript} from './runtime-source.js';

/** Host-only controls for an execution retained while awaiting user input. */
export interface ScapiRuntimeControl {
  pauseTimeout(): void;
  resumeTimeout(): void;
}

/** What a program asked the host for. Every capability a program has arrives as one of these. */
export type ScapiCallKind = 'auth' | 'request' | 'search' | 'sleep' | 'snippet' | 'spec';

/** One call a program made, as interceptors see it. */
export interface ScapiCall {
  /** The VM's own number for the call: `1`, `2`, ... in the order the program made its calls. */
  readonly id: number;
  readonly kind: ScapiCallKind;
  /** What the program passed, after a JSON round trip. */
  readonly args: unknown;
  /** Aborted when the execution ends. */
  readonly signal: AbortSignal;
}

/**
 * Wraps the handling of every live call (calls answered from a journal are not handled again).
 * Call `next()` to let the call proceed, return a value to answer it without proceeding, or throw
 * to fail it; the program sees the thrown message. Throw {@link ScapiCodePause} to end the
 * execution so it can resume later with the journal. Interceptors run in array order, outermost first.
 */
export type ScapiCallInterceptor = (call: ScapiCall, next: () => Promise<unknown>) => Promise<unknown>;

/** One answered call, in the order the program received the answers. */
export interface ScapiJournalEntry {
  id: number;
  kind: ScapiCallKind;
  /** JSON of the call's arguments; a replayed program must make the same call. */
  args: string;
  /** VM clock while the program processed the answer. */
  now: number;
  /**
   * `started` is written before a live call is handled and replaced when it is answered. A
   * `started` request or auth call in a journal was interrupted: it may have taken effect.
   */
  state: 'answered' | 'started';
  outcome?: CodemodeOutcome;
}

/**
 * Everything needed to run a program again with the same behavior: the VM's start time, its
 * random seed and fingerprint, and the answers it received. Pass the same object back to
 * {@link runScapiCode} to replay it: recorded answers are delivered without handling the call
 * again, and the program continues live from where the journal ends.
 */
export interface ScapiJournal {
  startedAt?: number;
  seed?: number;
  fingerprint?: string;
  entries: ScapiJournalEntry[];
}

/** The execution paused; `journal` resumes it and `detail` is what the pausing call threw with. */
export class ScapiCodePausedError extends ScapiCodeError {
  constructor(
    readonly journal: ScapiJournal,
    readonly detail: unknown,
    message: string,
  ) {
    super('SCAPI_EXECUTION_PAUSED', message);
    this.name = 'ScapiCodePausedError';
  }
}

export interface ScapiCodeOptions {
  code: string;
  input?: unknown;
  snippets?: ScapiSnippet[];
  documents?: ScapiSchemaDocument[];
  authType?: ScapiAuthType;
  /** Answers `scapi.request()`; usually `createScapiRequest`. `call` identifies the program's call. */
  request?: (options: unknown, signal: AbortSignal, call: ScapiCall) => Promise<unknown>;
  /** SLAS token export behind `auth.slas()`; the program has no `auth` global when omitted. */
  auth?: (operation: string, options: unknown, signal: AbortSignal, call: ScapiCall) => Promise<unknown>;
  /** Tenant (`zzzz_001`) or organization ID (`f_ecom_zzzz_001`); programs always see the `f_ecom_` form. */
  organizationId?: string;
  siteId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxOutputBytes?: number;
  /**
   * How much prose `spec` operations carry. `outline` keeps each operation's own summary, description and tags but
   * drops nested descriptions and examples, keeping discovery results within the output cap. Defaults to `full`.
   */
  detail?: 'full' | 'outline';
  /** The host owns cancellation and cleanup while paused; approval may wait indefinitely. Never exposed to the program. */
  onControl?: (control: ScapiRuntimeControl) => void;
  /**
   * Hide operations this safety policy always blocks from `spec` and
   * `spec.search`, so programs only see what they can call. Pass the same
   * config given to `createScapiRequest`, which still enforces it.
   */
  safety?: SafetyConfig;
  /** Wrap every live call; see {@link ScapiCallInterceptor}. */
  interceptors?: ScapiCallInterceptor[];
  /** Record answers here, and replay those already recorded. See {@link ScapiJournal}. */
  journal?: ScapiJournal;
  /** Called after each journal change, for hosts that persist it. */
  onJournal?: (journal: ScapiJournal) => void;
  /** Compiled `quickjs-wasi/quickjs.wasm`, for bundled hosts where the file is not on disk. */
  wasm?: CodemodeWasmModule | Promise<CodemodeWasmModule>;
  /** Worker entry importing `@earendil-works/pi-codemode/worker`, for bundled hosts. */
  workerUrl?: string | URL;
}

const MEMORY_LIMIT_BYTES = 256 * 1024 * 1024;
const SIDE_EFFECTS = new Set<ScapiCallKind>(['auth', 'request']);
const CALL_KINDS = new Set<ScapiCallKind>(['auth', 'request', 'search', 'sleep', 'snippet', 'spec']);

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Execute one JavaScript async function in a disposable QuickJS VM. */
export async function runScapiCode(options: ScapiCodeOptions): Promise<unknown> {
  try {
    return await runScapiCodeUnchecked(options);
  } catch (error) {
    throw toScapiCodeError(error);
  }
}

async function runScapiCodeUnchecked(options: ScapiCodeOptions): Promise<unknown> {
  const timeoutMs = Math.min(options.timeoutMs ?? 30_000, 60_000);
  const maxOutputBytes = Math.min(options.maxOutputBytes ?? 24_000, 65_536);
  if (!options.code.trim() || Buffer.byteLength(options.code) > 32_768)
    throw new Error('Code must contain 1-32768 bytes.');
  if (options.signal?.aborted) throw new Error('SCAPI_EXECUTION_CANCELLED');
  const organizationId = options.organizationId ? toOrganizationId(options.organizationId) : undefined;
  const documents = filterScapiDocumentsBySafety(
    describeScapiSchemas(options.documents ?? [], options.authType),
    options.safety,
    organizationId,
  );
  if (options.safety && options.documents?.length && !documents.length)
    throw new Error('SCAPI_SAFETY_BLOCKED: the safety policy blocks every operation in these schemas.');
  if (options.authType && !documents.length)
    throw new Error(
      `No ${options.authType} operations match this search. Omit authType to inspect all authentication requirements.`,
    );
  const snippets = options.snippets ?? loadBuiltinScapiSnippets();
  const resolveSnippet = createScapiSnippetResolver(snippets);
  const spec = createScapiSpecHost(documents, options.detail);
  const script = buildScapiScript(
    options.code,
    {input: options.input ?? null, organizationId, siteId: options.siteId, auth: Boolean(options.auth)},
    snippets.map((snippet) => ({key: snippet.name, code: snippet.code})),
  );

  const journal = options.journal ?? {entries: []};
  // Interrupted reads and discovery are safe to repeat; drop them so they run live.
  let cursor = 0;
  const replay = journal.entries.filter((entry) => entry.state === 'answered' || SIDE_EFFECTS.has(entry.kind));
  const recorded = new Set(replay.map((entry) => entry.id));
  // Rebuilt in delivery order as the program receives answers, so the next replay sees the same order.
  journal.entries = [];
  const remaining = () => [...journal.entries, ...replay.slice(cursor)];
  const snapshot = (): ScapiJournal => ({...journal, entries: remaining()});
  journal.startedAt ??= Date.now();
  journal.seed ??= randomInt(0, 2 ** 32);
  const changed = () => options.onJournal?.(snapshot());

  const controller = new AbortController();
  let failure: Error | undefined;
  const stop = (error: Error) => {
    failure ??= error;
    controller.abort(failure);
  };
  let remainingMs = timeoutMs;
  let startedAt = performance.now();
  const timedOut = () => stop(new Error('SCAPI_EXECUTION_TIMEOUT: check any in-flight write before retrying.'));
  let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(timedOut, remainingMs);
  const control: ScapiRuntimeControl = {
    pauseTimeout() {
      if (controller.signal.aborted || !timer) return;
      remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
      clearTimeout(timer);
      timer = undefined;
    },
    resumeTimeout() {
      if (controller.signal.aborted || timer) return;
      startedAt = performance.now();
      timer = setTimeout(timedOut, remainingMs);
    },
  };
  const cancel = () => stop(new Error('SCAPI_EXECUTION_CANCELLED: check any in-flight write before retrying.'));
  options.signal?.addEventListener('abort', cancel, {once: true});

  let calls = 0;
  let active = 0;
  let snippetCalls = 0;
  let searchCalls = 0;
  let specCalls = 0;
  let seq = 0;
  // The lowest-numbered pausing call wins, so concurrent pauses resolve the same way on every run.
  let pause: ScapiCodePause | undefined;
  let pauseId = Infinity;
  const pending = new Map<number, {kind: ScapiCallKind; args: unknown; json: string}>();
  // Live answers wait until the recorded ones are delivered: the recorded run received them first.
  const held: Array<() => void> = [];
  let live = 0;
  let settlePause: (() => void) | undefined;

  const deliver = (id: number, outcome: CodemodeOutcome, now: number) => {
    if (controller.signal.aborted) return;
    pending.delete(id);
    try {
      run.deliver(++seq, now, id, outcome);
    } catch (error) {
      // A value JSON cannot carry, or a call the VM no longer waits for.
      stop(new Error(`SCAPI_EXECUTION_FAILED: ${message(error)}`));
    }
  };

  const limit = (kind: ScapiCallKind) => {
    if (kind === 'request' || kind === 'auth') {
      if (++calls > 20) throw new Error('SCAPI_CALL_LIMIT: at most 20 requests per execution.');
    } else if (kind === 'snippet') {
      if (++snippetCalls > 100) throw new Error('SCAPI_SNIPPET_LIMIT: at most 100 snippet operations per execution.');
    } else if (kind === 'search') {
      if (++searchCalls > 50) throw new Error('SCAPI_SEARCH_LIMIT: at most 50 spec.search calls per execution.');
    } else if (kind === 'spec' && ++specCalls > 500) {
      throw new Error('SCAPI_SPEC_LIMIT: at most 500 spec calls per execution.');
    }
  };

  const handle = async (call: ScapiCall): Promise<unknown> => {
    const {kind, args, signal} = call;
    const value = (args ?? {}) as Record<string, unknown>;
    switch (kind) {
      case 'auth':
        if (!options.auth)
          throw new Error('Schema search cannot make SCAPI or authentication requests. Use scapi_execute.');
        return options.auth(String(value.operation ?? ''), value.options, signal, call);
      case 'request':
        if (!options.request)
          throw new Error('Schema search cannot make SCAPI or authentication requests. Use scapi_execute.');
        return options.request(args, signal, call);
      case 'search':
        return spec({op: 'search', query: value.query, options: value.options});
      case 'sleep': {
        const ms = Number(value.ms);
        if (!Number.isFinite(ms) || ms < 0) throw new Error('sleep(ms) needs a non-negative number of milliseconds.');
        await new Promise<void>((resolve, reject) => {
          const done = () => {
            clearTimeout(wait);
            reject(new Error('SCAPI_EXECUTION_CANCELLED'));
          };
          const wait = setTimeout(() => {
            signal.removeEventListener('abort', done);
            resolve();
          }, ms);
          signal.addEventListener('abort', done, {once: true});
        });
        return null;
      }
      case 'snippet': {
        const operation = String(value.operation ?? '');
        if (operation === 'run' && !options.request) throw new Error('Use scapi_execute to run snippets.');
        const resolved = resolveSnippet(operation, String(value.name ?? ''), value.input);
        // The program runs the source compiled into its script; the host only validates and counts.
        return operation === 'run' ? String(value.name) : resolved;
      }
      case 'spec':
        return spec(args);
    }
  };

  const startLive = (id: number) => {
    const call = pending.get(id);
    if (!call) return;
    // Calls made after a pause never start; the execution ends once in-flight calls settle.
    if (pause) return;
    const {kind, args, json} = call;
    const concurrent = kind === 'request' || kind === 'auth';
    let entry: ScapiJournalEntry | undefined;
    const answer = (outcome: CodemodeOutcome) => {
      if (controller.signal.aborted) return;
      if (entry) journal.entries.splice(journal.entries.indexOf(entry), 1);
      entry = {id, kind, args: json, now: Date.now(), state: 'answered', outcome};
      const send = () => {
        journal.entries.push(entry!);
        changed();
        deliver(id, outcome, entry!.now);
      };
      if (cursor < replay.length) held.push(send);
      else send();
    };
    try {
      limit(kind);
      if (concurrent && active >= 4) throw new Error('SCAPI_CONCURRENCY_LIMIT: at most four concurrent requests.');
    } catch (error) {
      answer({ok: false, message: message(error)});
      return;
    }
    if (concurrent) active++;
    live++;
    entry = {id, kind, args: json, now: Date.now(), state: 'started'};
    journal.entries.push(entry);
    changed();
    const callInfo: ScapiCall = {id, kind, args, signal: controller.signal};
    const chain = [...(options.interceptors ?? [])].reduceRight<() => Promise<unknown>>(
      (next, interceptor) => () => interceptor(callInfo, next),
      () => handle(callInfo),
    );
    void Promise.resolve()
      .then(chain)
      .then(
        (value) => answer({ok: true, value: value === undefined ? null : value}),
        (error: unknown) => {
          if (error instanceof ScapiCodePause) {
            if (id < pauseId) {
              pause = error;
              pauseId = id;
            }
            journal.entries.splice(journal.entries.indexOf(entry!), 1);
            changed();
            return;
          }
          answer({ok: false, message: message(error)});
        },
      )
      .finally(() => {
        if (concurrent) active--;
        live--;
        if (pause && live === 0) settlePause?.();
      });
  };

  // Deliver recorded answers strictly in journal order, once the program has made each call.
  const advance = () => {
    while (cursor < replay.length && !controller.signal.aborted) {
      const entry = replay[cursor];
      const call = pending.get(entry.id);
      if (!call) return;
      if (call.kind !== entry.kind || call.json !== entry.args) {
        stop(
          new Error(
            `SCAPI_REPLAY_DIVERGED: call ${entry.id} differs from the recorded run (${entry.kind} expected, ${call.kind} made). Start a new execution.`,
          ),
        );
        return;
      }
      if (entry.state !== 'answered') {
        stop(
          new Error(
            'SCAPI_REPLAY_UNCERTAIN: a request was sent but its response was lost; it may have taken effect. Check its result before running again.',
          ),
        );
        return;
      }
      cursor++;
      journal.entries.push(entry);
      try {
        limit(call.kind);
      } catch (error) {
        stop(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      deliver(entry.id, entry.outcome!, entry.now);
    }
    if (cursor >= replay.length) for (const send of held.splice(0)) send();
  };

  const sandbox = new CodemodeSandbox({
    memoryLimitBytes: MEMORY_LIMIT_BYTES,
    ...(options.wasm ? {wasm: options.wasm} : {}),
    ...(options.workerUrl ? {workerUrl: options.workerUrl} : {}),
  });
  const run = sandbox.start(script, {
    startedAt: journal.startedAt,
    seed: journal.seed,
    globals: [{name: '__b2c', spread: true}],
    signal: controller.signal,
    onStarted(fingerprint) {
      if (journal.fingerprint && journal.fingerprint !== fingerprint && replay.length)
        stop(
          new Error(
            'SCAPI_REPLAY_DIVERGED: the code-mode runtime changed since the recorded run. Start a new execution.',
          ),
        );
      journal.fingerprint = fingerprint;
    },
    onCall(call: CodemodeHostCall) {
      const [kind, args] = (Array.isArray(call.args) ? call.args : []) as [ScapiCallKind, unknown];
      if (!CALL_KINDS.has(kind)) {
        pending.set(call.id, {kind: 'spec', args, json: ''});
        deliver(call.id, {ok: false, message: 'Unknown host call.'}, Date.now());
        return;
      }
      pending.set(call.id, {kind, args, json: JSON.stringify(args ?? null)});
      if (recorded.has(call.id)) advance();
      else startLive(call.id);
    },
  });
  try {
    options.onControl?.(control);
  } catch (error) {
    stop(error instanceof Error ? error : new Error(String(error)));
  }
  if (options.signal?.aborted) cancel();
  getLogger().debug({replayed: replay.length}, 'SCAPI code VM started');

  const paused = new Promise<void>((resolve) => {
    settlePause = resolve;
  });
  const outcome = await Promise.race([
    run.result,
    paused.then(() => {
      stop(new ScapiCodePausedError(snapshot(), pause!.detail, pause!.message));
      return run.result;
    }),
  ]);
  clearTimeout(timer);
  options.signal?.removeEventListener('abort', cancel);
  controller.abort(failure);
  await sandbox.close();
  // Leave the caller's journal resumable: what was delivered, then what was not reached.
  journal.entries = remaining();
  changed();
  if (failure) throw failure;
  // The program finished without making every recorded call.
  if (cursor < replay.length)
    throw new Error('SCAPI_REPLAY_DIVERGED: the program no longer makes the recorded calls. Start a new execution.');
  if (!outcome.ok) {
    if (outcome.error.kind === 'timeout')
      throw new Error('SCAPI_EXECUTION_TIMEOUT: check any in-flight write before retrying.');
    throw new Error(String(outcome.error.message || 'Code mode failed.').slice(0, 4000));
  }
  const json = JSON.stringify(outcome.value ?? null);
  if (Buffer.byteLength(json) > maxOutputBytes)
    throw new Error(
      'SCAPI_RESULT_TOO_LARGE: return fewer fields or a smaller page. Whole operations include every parameter and schema description; return operationId, method, path and summary to list candidates, and only the parts you need (parameters, requestBody) for one.',
    );
  return JSON.parse(json);
}
