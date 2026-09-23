/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createHash, createHmac, randomBytes, randomUUID} from 'node:crypto';
import {inputRequired} from '@modelcontextprotocol/server';
import type {ScapiConfirmation, ScapiRuntimeControl} from '@salesforce/b2c-tooling-sdk/scapi';
import type {ToolContext, ToolResult} from '../../utils/types.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return {promise, resolve, reject};
}

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
    JSON.stringify(value, (key, item: unknown) =>
      /password|secret|token|authorization|credential/i.test(key) ? '[redacted]' : item,
    ) ?? 'none';
  return json.length > 2000 ? `${json.slice(0, 2000)}... [truncated]` : json;
}

interface OperationRecord {
  kind: 'auth' | 'request';
  method?: string;
  path?: string;
  status: 'awaiting_confirmation' | 'completed' | 'failed' | 'in_flight' | 'not_sent' | 'unknown';
  httpStatus?: number;
}

interface ApprovalRound {
  state: string;
  key: string;
  prompt: ToolResult;
  decision: ReturnType<typeof deferred<void>>;
  responded?: boolean;
}

/** One worker survives protocol round trips; none of its code is replayed. */
export class ScapiExecution {
  control?: ScapiRuntimeControl;
  readonly controller = new AbortController();
  done!: Promise<void>;
  readonly id = randomUUID();
  readonly operations: OperationRecord[] = [];
  result?: ToolResult;
  readonly rounds = new Map<string, ApprovalRound>();
  private cancellation?: string;
  private cancellationListeners = new Map<AbortSignal, () => void>();
  private dispatched = new WeakSet<OperationRecord>();
  private event = deferred<ToolResult>();
  private pending?: ApprovalRound;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    readonly digest: string,
    private readonly supportsElicitation: boolean,
    private readonly mintState: (round: number) => string,
  ) {}

  cancel(reason = 'SCAPI_EXECUTION_CANCELLED: explicitly cancelled.'): void {
    if (this.result || this.cancellation) return;
    this.cancellation = reason;
    const error = new Error(reason);
    this.controller.abort(error);
    this.pending?.decision.reject(error);
  }

  async confirm(request: ScapiConfirmation): Promise<void> {
    this.controller.signal.throwIfAborted();
    const record = this.operations.at(-1);
    if (record) record.status = 'awaiting_confirmation';
    if (!this.supportsElicitation) {
      this.cancel(
        'SCAPI_CONFIRMATION_UNSUPPORTED: Confirmation required; this client does not support form elicitation.',
      );
      this.controller.signal.throwIfAborted();
    }
    const roundNumber = this.rounds.size + 1;
    const state = this.mintState(roundNumber);
    const key = `approve_${roundNumber}`;
    const message = [
      `Approve this SCAPI request? Execution: ${this.id}. Approval has no server deadline.`,
      `${request.method} ${request.url} (${request.operationId})`,
      `Query: ${preview(request.query)}\nBody: ${preview(request.body)}`,
      request.reason,
      `${this.operations.filter((item) => item.status === 'completed').length} earlier operations completed. Decline cancels the execution; completed writes are not rolled back.`,
      'To cancel explicitly: scapi_execute({action:"cancel", executionId:"' + this.id + '", skillRead:true}).',
    ].join('\n');
    const prompt: ToolResult = {
      ...inputRequired({
        requestState: state,
        inputRequests: {
          [key]: inputRequired.elicit({
            message,
            requestedSchema: {
              type: 'object',
              properties: {approve: {type: 'boolean', title: 'Approve this request', default: false}},
              required: ['approve'],
            },
          }),
        },
      }),
      // Keep the local tool result shape; the SDK dispatches by resultType before content.
      content: [],
      _meta: {
        executionId: this.id,
        status: 'awaiting_confirmation',
        operations: structuredClone(this.operations),
      },
    };
    const round: ApprovalRound = {state, key, prompt, decision: deferred<void>()};
    this.pending = round;
    this.rounds.set(state, round);
    this.control?.pauseTimeout();
    this.event.resolve(prompt);
    try {
      await round.decision.promise;
      this.controller.signal.throwIfAborted();
      if (record) record.status = 'in_flight';
    } finally {
      this.pending = undefined;
      this.control?.resumeTimeout();
    }
  }

  finish(result: ToolResult): void {
    this.controller.abort(new Error('SCAPI_EXECUTION_FINISHED'));
    for (const [signal, listener] of this.cancellationListeners) signal.removeEventListener('abort', listener);
    this.cancellationListeners.clear();
    this.pending?.decision.reject(new Error('SCAPI_EXECUTION_FINISHED'));
    for (const record of this.operations) {
      if (record.status === 'awaiting_confirmation') record.status = 'not_sent';
      else if (record.status === 'in_flight') record.status = this.dispatched.has(record) ? 'unknown' : 'not_sent';
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
            operations: this.operations,
          }),
        },
      ],
    };
    this.event.resolve(this.result);
  }

  markDispatched(): void {
    const record = this.operations.at(-1);
    if (record) this.dispatched.add(record);
  }

  async retry(state: string, context: ToolContext): Promise<ToolResult> {
    const round = this.rounds.get(state);
    if (!round) throw new Error('SCAPI_CONTINUATION_INVALID: unknown or altered continuation.');
    if (this.cancellation) await this.done;
    if (this.result) return this.result;
    if (round.responded) return this.wait(context);
    if (round !== this.pending) throw new Error('SCAPI_CONTINUATION_STALE: approval round is no longer pending.');
    const response = context.inputResponses?.[round.key] as
      | undefined
      | {action?: unknown; content?: {approve?: unknown}};
    if (!response) return this.wait(context);
    this.event = deferred<ToolResult>();
    round.responded = true;
    const result = this.wait(context);
    if (!context.supportsElicitation || response.action !== 'accept' || response.content?.approve !== true) {
      this.cancel('SCAPI_APPROVAL_DECLINED: execution cancelled without sending the pending request.');
    } else {
      round.decision.resolve();
    }
    return result;
  }

  async runCall<T>(kind: OperationRecord['kind'], input: unknown, operation: () => Promise<T>): Promise<T> {
    const previous = this.queue;
    const call = previous.then(async () => {
      this.controller.signal.throwIfAborted();
      const args = input as undefined | {method?: unknown; path?: unknown};
      const record: OperationRecord = {
        kind,
        ...(typeof args?.method === 'string' ? {method: args.method.toUpperCase()} : {}),
        ...(typeof args?.path === 'string' ? {path: args.path.slice(0, 500)} : {}),
        status: 'in_flight',
      };
      this.operations.push(record);
      try {
        const result = await operation();
        record.status = 'completed';
        if (result && typeof result === 'object' && 'status' in result && typeof result.status === 'number')
          record.httpStatus = result.status;
        return result;
      } catch (error) {
        record.status = kind === 'auth' ? 'failed' : this.dispatched.has(record) ? 'unknown' : 'not_sent';
        throw error;
      }
    });
    this.queue = call.catch(() => {});
    return call;
  }

  async wait(context?: ToolContext): Promise<ToolResult> {
    const signal = context?.signal;
    if (signal && !this.cancellationListeners.has(signal)) {
      const cancel = () => this.cancel('SCAPI_EXECUTION_CANCELLED: client cancelled the request.');
      this.cancellationListeners.set(signal, cancel);
      signal.addEventListener('abort', cancel, {once: true});
      if (signal.aborted) cancel();
    }
    try {
      return this.result ?? (await this.event.promise);
    } finally {
      if (signal && (!context?.keepCancellation || this.result)) {
        signal.removeEventListener('abort', this.cancellationListeners.get(signal)!);
        this.cancellationListeners.delete(signal);
      }
    }
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
    return execution.retry(state, context);
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
    execution.done = Promise.resolve()
      .then(() => run(execution))
      .then(
        (result) => execution.finish(result),
        (error: unknown) => execution.finish(errorResult(error instanceof Error ? error.message : String(error))),
      )
      .then(() => {
        const terminal = [...this.executions.values()].filter((item) => item.result);
        for (const item of terminal.slice(0, Math.max(0, terminal.length - 50))) this.executions.delete(item.id);
      });
    return execution.wait(context);
  }
}
