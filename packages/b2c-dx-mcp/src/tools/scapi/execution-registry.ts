/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createHash, createHmac, randomBytes, randomUUID} from 'node:crypto';
import {inputRequired} from '@modelcontextprotocol/server';
import {
  ScapiCodePause,
  ScapiCodePausedError,
  type ScapiCall,
  type ScapiCallInterceptor,
  type ScapiConfirmation,
  type ScapiJournal,
  type ScapiRequestContext,
} from '@salesforce/b2c-tooling-sdk/scapi';
import type {ToolContext, ToolResult} from '../../utils/types.js';

function fingerprint(args: unknown): string {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map((item) => canonical(item));
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, canonical(v)]),
      );
    return value;
  };
  return createHash('sha256')
    .update(JSON.stringify(canonical(args)))
    .digest('hex');
}

function errorResult(message: string): ToolResult {
  return {isError: true, content: [{type: 'text', text: JSON.stringify({error: message})}]};
}

function preview(value: unknown): string {
  const json =
    JSON.stringify(
      value,
      (key, item: unknown) => (/password|secret|token|authorization|credential/i.test(key) ? '[redacted]' : item),
      2,
    ) ?? 'none';
  const excerpt = json.split('\n').slice(0, 5).join('\n');
  if (excerpt.length === json.length && json.length <= 400) return json;
  const notice = ' ... [truncated; approval covers full request]';
  return excerpt.slice(0, 400 - notice.length).trimEnd() + notice;
}

interface OperationRecord {
  kind: 'auth' | 'request';
  method?: string;
  path?: string;
  status: 'awaiting_confirmation' | 'completed' | 'failed' | 'in_flight' | 'not_sent' | 'unknown';
  httpStatus?: number;
  /** Times this request was sent across every run of the program; replayed answers are not sent again. */
  dispatches?: number;
}

/** The request awaiting approval, keyed by the program's own call number. */
interface ApprovalRound {
  state: string;
  key: string;
  callId: number;
  prompt: ToolResult;
  /** Set once the client answered, so duplicate retries coalesce on the same continuation. */
  continuation?: Promise<ToolResult>;
}

/**
 * Runs one program until it finishes or needs approval. An approval ends the run: the program's
 * journal (every answer it received) is kept under a signed `requestState`, and an approved
 * continuation runs the same program again. Recorded answers replay without re-sending, the
 * approved request is sent, and the run continues live. Nothing runs while the user decides.
 */
export class ScapiExecution {
  /** Calls the user approved, by the program's call number. */
  readonly approved = new Set<number>();
  readonly controller = new AbortController();
  done!: Promise<void>;
  readonly id = randomUUID();
  journal: ScapiJournal = {entries: []};
  result?: ToolResult;
  readonly rounds = new Map<string, ApprovalRound>();
  /** Tracks requests and token exports for the result's `operations` list. */
  readonly track: ScapiCallInterceptor = async (call: ScapiCall, next) => {
    if (call.kind !== 'request' && call.kind !== 'auth') return next();
    this.controller.signal.throwIfAborted();
    const args = call.args as undefined | {method?: unknown; path?: unknown};
    const record: OperationRecord = {
      kind: call.kind,
      ...(call.kind === 'request' && typeof args?.method === 'string' ? {method: args.method.toUpperCase()} : {}),
      ...(call.kind === 'request' && typeof args?.path === 'string' ? {path: args.path.slice(0, 500)} : {}),
      status: 'in_flight',
      ...(this.dispatched.has(call.id) ? {dispatches: this.dispatched.get(call.id)} : {}),
    };
    this.operations.set(call.id, record);
    try {
      const result = await next();
      record.status = 'completed';
      if (result && typeof result === 'object' && 'status' in result && typeof result.status === 'number')
        record.httpStatus = result.status;
      return result;
    } catch (error) {
      if (error instanceof ScapiCodePause) record.status = 'awaiting_confirmation';
      else record.status = call.kind === 'auth' ? 'failed' : this.dispatched.has(call.id) ? 'unknown' : 'not_sent';
      throw error;
    }
  };
  private cancellation?: string;
  private cancellationListeners = new Map<AbortSignal, () => void>();
  private readonly clientCancel = () => this.cancel('SCAPI_EXECUTION_CANCELLED: client cancelled the request.');
  private readonly dispatched = new Map<number, number>();
  private readonly operations = new Map<number, OperationRecord>();
  /** Runs of the program: the first, plus one per approved continuation. */
  private passes = 0;
  private pending?: ApprovalRound;

  private run!: (execution: ScapiExecution) => Promise<ToolResult>;

  constructor(
    readonly digest: string,
    private readonly supportsElicitation: boolean,
    private readonly mintState: (round: number) => string,
  ) {}

  /** Starts a pass of the program; resolves with its result or an approval prompt. */
  begin(run: (execution: ScapiExecution) => Promise<ToolResult>, context?: ToolContext): Promise<ToolResult> {
    this.run = run;
    return this.pass(context);
  }

  cancel(reason = 'SCAPI_EXECUTION_CANCELLED: explicitly cancelled.'): void {
    if (this.result || this.cancellation) return;
    this.cancellation = reason;
    this.controller.abort(new Error(reason));
    // A paused execution has nothing running; settle it now.
    if (this.pending) this.finish(errorResult(reason));
  }

  /**
   * The SDK's `confirm` hook. An approved call proceeds; any other pauses the execution so the
   * client can be asked, without sending the request.
   */
  async confirm(request: ScapiConfirmation): Promise<void> {
    this.controller.signal.throwIfAborted();
    const callId = request.callId;
    if (callId !== undefined && this.approved.has(callId)) return;
    const record = callId === undefined ? undefined : this.operations.get(callId);
    if (record) record.status = 'awaiting_confirmation';
    if (!this.supportsElicitation) {
      this.cancel(
        'SCAPI_CONFIRMATION_UNSUPPORTED: Confirmation required; this client does not support form elicitation.',
      );
      this.controller.signal.throwIfAborted();
    }
    throw new ScapiCodePause(request);
  }

  finish(result: ToolResult): void {
    if (this.result) return;
    this.controller.abort(new Error('SCAPI_EXECUTION_FINISHED'));
    for (const [signal, listener] of this.cancellationListeners) signal.removeEventListener('abort', listener);
    this.cancellationListeners.clear();
    this.pending = undefined;
    for (const record of this.operations.values()) {
      if (record.status === 'awaiting_confirmation') record.status = 'not_sent';
      else if (record.status === 'in_flight') record.status = 'unknown';
    }
    const output = this.cancellation ? {...result, isError: true} : result;
    const first = output.content[0];
    const data = first?.type === 'text' ? JSON.parse(first.text) : {};
    if (this.cancellation) {
      delete data.result;
      data.error = this.cancellation + ' Check earlier writes before retrying; no rollback is performed.';
    }
    this.result = {
      ...output,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...data,
            executionId: this.id,
            status: this.cancellation ? 'cancelled' : output.isError ? 'failed' : 'completed',
            passes: this.passes,
            operations: this.records(),
          }),
        },
      ],
    };
  }

  markDispatched(call?: ScapiRequestContext): void {
    if (call?.id === undefined) return;
    this.dispatched.set(call.id, (this.dispatched.get(call.id) ?? 0) + 1);
    const record = this.operations.get(call.id);
    if (record) record.dispatches = this.dispatched.get(call.id);
  }

  async retry(state: string, context: ToolContext): Promise<ToolResult> {
    const round = this.rounds.get(state);
    if (!round) throw new Error('SCAPI_CONTINUATION_INVALID: unknown or altered continuation.');
    if (this.result) return this.result;
    if (round.continuation) return round.continuation;
    if (round !== this.pending) throw new Error('SCAPI_CONTINUATION_STALE: approval round is no longer pending.');
    const response = context.inputResponses?.[round.key] as undefined | {action?: unknown};
    if (!response) return round.prompt;
    if (context.supportsElicitation && response.action === 'accept') {
      this.approved.add(round.callId);
      this.pending = undefined;
      round.continuation = this.pass(context);
      return round.continuation;
    }
    this.cancel(
      response.action === 'cancel'
        ? 'SCAPI_APPROVAL_CANCELLED: approval dismissed; execution cancelled without sending the pending request.'
        : 'SCAPI_APPROVAL_DECLINED: execution cancelled without sending the pending request.',
    );
    round.continuation = Promise.resolve(this.result!);
    return round.continuation;
  }

  /** Runs the program once; pauses become approval prompts, everything else finishes the execution. */
  private async pass(context?: ToolContext): Promise<ToolResult> {
    const cancel = this.clientCancel;
    const signal = context?.signal;
    if (signal && !this.cancellationListeners.has(signal)) {
      this.cancellationListeners.set(signal, cancel);
      signal.addEventListener('abort', cancel, {once: true});
      if (signal.aborted) cancel();
    }
    try {
      let result: ToolResult;
      try {
        this.passes++;
        result = await this.run(this);
      } catch (error) {
        if (error instanceof ScapiCodePausedError) return this.prompt(error);
        result = errorResult(error instanceof Error ? error.message : String(error));
      }
      this.finish(result);
      return this.result!;
    } finally {
      // Modern clients end the request with each round; legacy ones keep it open and cancel through it.
      if (signal && (!context?.keepCancellation || this.result)) {
        signal.removeEventListener('abort', this.cancellationListeners.get(signal)!);
        this.cancellationListeners.delete(signal);
      }
    }
  }

  private prompt(paused: ScapiCodePausedError): ToolResult {
    this.journal = paused.journal;
    const request = paused.detail as ScapiConfirmation;
    const callId = request.callId!;
    const roundNumber = this.rounds.size + 1;
    const state = this.mintState(roundNumber);
    const key = `approve_${roundNumber}`;
    const path = new URL(request.url).pathname;
    const organizationId = path.match(/\/organizations\/([^/]+)/)?.[1];
    const earlierWrites = [...this.operations.entries()].filter(
      ([id, item]) =>
        item.kind === 'request' && !['GET', 'HEAD', 'OPTIONS'].includes(item.method ?? '') && this.dispatched.has(id),
    ).length;
    const message = [
      `Approve SCAPI operation: ${request.operationId}`,
      ...(organizationId ? [`Organization: ${organizationId}`] : []),
      `${request.method} ${path}`,
      ...(Object.keys(request.query).length > 0 ? [`Query:\n${preview(request.query)}`] : []),
      ...(request.body === undefined ? [] : [`Body:\n${preview(request.body)}`]),
      'Safety Mode requires approval. Accept sends this request only; declining stops this execution.',
      earlierWrites ? `Earlier write requests sent: ${earlierWrites}; no rollback.` : 'No earlier writes.',
      `Execution: ${this.id}`,
    ].join('\n');
    const prompt: ToolResult = {
      ...inputRequired({
        requestState: state,
        inputRequests: {
          [key]: inputRequired.elicit({
            message,
            // No fields: the client's own accept/decline/cancel buttons carry the decision.
            requestedSchema: {type: 'object', properties: {}},
          }),
        },
      }),
      // Keep the local tool result shape; the SDK dispatches by resultType before content.
      content: [],
      _meta: {
        executionId: this.id,
        status: 'awaiting_confirmation',
        passes: this.passes,
        operations: this.records(),
      },
    };
    const round: ApprovalRound = {state, key, callId, prompt};
    this.pending = round;
    this.rounds.set(state, round);
    return prompt;
  }

  private records(): OperationRecord[] {
    return [...this.operations.entries()].sort(([a], [b]) => a - b).map(([, record]) => ({...record}));
  }
}

/** Stdio-server-owned continuations. Terminal records are bounded; tokens never start new work. */
export class ScapiExecutionRegistry {
  private readonly executions = new Map<string, ScapiExecution>();
  private readonly secret = randomBytes(32);

  constructor(private readonly options: {maxActive?: number} = {}) {}

  async cancel(id: string): Promise<ToolResult> {
    const execution = this.executions.get(id);
    if (!execution) throw new Error('SCAPI_EXECUTION_NOT_FOUND: execution is unavailable in this server session.');
    execution.cancel();
    await execution.done;
    return execution.result!;
  }

  async destroyAll(): Promise<void> {
    for (const execution of this.executions.values())
      execution.cancel('SCAPI_EXECUTION_CANCELLED: server shutting down.');
    await Promise.allSettled([...this.executions.values()].map((execution) => execution.done));
    this.executions.clear();
  }

  async retry(args: unknown, context: ToolContext): Promise<ToolResult> {
    const state = context.requestState;
    if (typeof state !== 'string') throw new Error('SCAPI_CONTINUATION_INVALID: expected server-issued requestState.');
    const execution = this.executions.get(state.split('.')[0]);
    // Exact server-side lookup validates the MAC and binds state to this server, round and original arguments.
    if (!execution || !execution.rounds.has(state))
      throw new Error('SCAPI_CONTINUATION_INVALID: execution unavailable, server restarted, or state was altered.');
    if (execution.digest !== fingerprint(args))
      throw new Error(
        'SCAPI_CONTINUATION_MISMATCH: original code, input and target arguments must be unchanged. Start new code with a fresh call.',
      );
    const result = execution.retry(state, context);
    execution.done = result.then(
      () => {},
      () => {},
    );
    return result.finally(() => this.prune());
  }

  async start(
    args: unknown,
    context: ToolContext | undefined,
    run: (execution: ScapiExecution) => Promise<ToolResult>,
  ): Promise<ToolResult> {
    if ([...this.executions.values()].filter((execution) => !execution.result).length >= (this.options.maxActive ?? 4))
      throw new Error('SCAPI_EXECUTION_LIMIT: cancel an existing execution or wait for it to finish.');
    const digest = fingerprint(args);
    const execution: ScapiExecution = new ScapiExecution(digest, context?.supportsElicitation === true, (round) => {
      const prefix = `${execution.id}.${round}`;
      return `${prefix}.${createHmac('sha256', this.secret).update(`${prefix}.${digest}`).digest('base64url')}`;
    });
    this.executions.set(execution.id, execution);
    const result = execution.begin(run, context).catch((error: unknown) => {
      execution.finish(errorResult(error instanceof Error ? error.message : String(error)));
      return execution.result!;
    });
    execution.done = result.then(() => {});
    return result.finally(() => this.prune());
  }

  private prune(): void {
    const terminal = [...this.executions.values()].filter((item) => item.result);
    for (const item of terminal.slice(0, Math.max(0, terminal.length - 50))) this.executions.delete(item.id);
  }
}
