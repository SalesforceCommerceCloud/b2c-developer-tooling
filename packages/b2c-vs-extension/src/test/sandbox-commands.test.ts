/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import type {OdsClient} from '@salesforce/b2c-tooling-sdk/clients';
import {pollClonesUntilTerminal} from '../sandbox-tree/sandbox-commands.js';

type CloneStatusResponse = {data?: {data?: {status?: string; progressPercentage?: number; lastKnownState?: string}}};

function makeMockOdsClient(
  responsesByCloneId: Record<string, CloneStatusResponse[]>,
  callCountsByCloneId?: Record<string, number>,
): OdsClient {
  const callIndexByCloneId: Record<string, number> = {};
  return {
    GET: async (_path: string, options: {params: {path: {cloneId: string}}}) => {
      const cloneId = options.params.path.cloneId;
      const responses = responsesByCloneId[cloneId] ?? [];
      const callIndex = callIndexByCloneId[cloneId] ?? 0;
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndexByCloneId[cloneId] = callIndex + 1;
      if (callCountsByCloneId) {
        callCountsByCloneId[cloneId] = (callCountsByCloneId[cloneId] ?? 0) + 1;
      }
      return {...response, response: new Response()};
    },
  } as unknown as OdsClient;
}

function makeProgressRecorder() {
  const reports: Array<{message?: string; increment?: number}> = [];
  const progress: vscode.Progress<{message?: string; increment?: number}> = {
    report: (value) => reports.push(value),
  };
  return {progress, reports};
}

suite('pollClonesUntilTerminal', () => {
  test('resolves with completedCloneIds when a single clone reaches COMPLETED', async () => {
    const odsClient = makeMockOdsClient({
      'clone-1': [{data: {data: {status: 'COMPLETED', progressPercentage: 100}}}],
    });
    const {progress, reports} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();

    const result = await pollClonesUntilTerminal(
      odsClient,
      'test-sandbox',
      ['clone-1'],
      progress,
      cts.token,
      () => {},
      {pollIntervalMs: 1, timeoutMs: 5000},
    );

    assert.deepStrictEqual(result, {completedCloneIds: ['clone-1'], failedCloneIds: [], timedOut: false});
    assert.ok(reports.length >= 1);
    assert.ok(reports[reports.length - 1].message?.includes('COMPLETED'));
    cts.dispose();
  });

  test('aggregates progress across a batch and resolves once all siblings are terminal', async () => {
    const odsClient = makeMockOdsClient({
      'clone-1': [
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 50}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
      'clone-2': [
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 30}}},
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 60}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
    });
    const {progress, reports} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();

    const result = await pollClonesUntilTerminal(
      odsClient,
      'test-sandbox',
      ['clone-1', 'clone-2'],
      progress,
      cts.token,
      () => {},
      {pollIntervalMs: 1, timeoutMs: 5000},
    );

    assert.deepStrictEqual(result.failedCloneIds, []);
    assert.deepStrictEqual(new Set(result.completedCloneIds), new Set(['clone-1', 'clone-2']));
    assert.ok(reports.some((r) => r.message?.includes('1/2 complete')));
    assert.ok(reports.some((r) => r.message?.includes('2/2 complete')));
    cts.dispose();
  });

  test('reports failedCloneIds when a clone in the batch fails', async () => {
    const odsClient = makeMockOdsClient({
      'clone-1': [{data: {data: {status: 'COMPLETED', progressPercentage: 100}}}],
      'clone-2': [{data: {data: {status: 'FAILED', progressPercentage: 40}}}],
    });
    const {progress} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();

    const result = await pollClonesUntilTerminal(
      odsClient,
      'test-sandbox',
      ['clone-1', 'clone-2'],
      progress,
      cts.token,
      () => {},
      {pollIntervalMs: 1, timeoutMs: 5000},
    );

    assert.deepStrictEqual(result.completedCloneIds, ['clone-1']);
    assert.deepStrictEqual(result.failedCloneIds, ['clone-2']);
    assert.strictEqual(result.timedOut, false);
    cts.dispose();
  });

  test('returns timedOut when clones never reach a terminal state', async () => {
    const odsClient = makeMockOdsClient({
      'clone-1': [{data: {data: {status: 'IN_PROGRESS', progressPercentage: 10}}}],
    });
    const {progress} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();

    const result = await pollClonesUntilTerminal(
      odsClient,
      'test-sandbox',
      ['clone-1'],
      progress,
      cts.token,
      () => {},
      {pollIntervalMs: 1, timeoutMs: 5},
    );

    assert.deepStrictEqual(result, {completedCloneIds: [], failedCloneIds: [], timedOut: true});
    cts.dispose();
  });

  test('throws CancellationError when the token is cancelled', async () => {
    const odsClient = makeMockOdsClient({
      'clone-1': [{data: {data: {status: 'IN_PROGRESS', progressPercentage: 10}}}],
    });
    const {progress} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();

    const pollPromise = pollClonesUntilTerminal(odsClient, 'test-sandbox', ['clone-1'], progress, cts.token, () => {}, {
      pollIntervalMs: 50,
      timeoutMs: 5000,
    });

    cts.cancel();

    await assert.rejects(pollPromise, (err: unknown) => err instanceof vscode.CancellationError);
    cts.dispose();
  });

  test('calls onTick once per poll iteration', async () => {
    const odsClient = makeMockOdsClient({
      'clone-1': [
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 50}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
    });
    const {progress} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();
    let tickCount = 0;

    await pollClonesUntilTerminal(
      odsClient,
      'test-sandbox',
      ['clone-1'],
      progress,
      cts.token,
      () => {
        tickCount++;
      },
      {pollIntervalMs: 1, timeoutMs: 5000},
    );

    assert.strictEqual(tickCount, 2);
    cts.dispose();
  });

  test('stops polling a clone once it reaches a terminal state', async () => {
    const callCounts: Record<string, number> = {};
    const odsClient = makeMockOdsClient(
      {
        'clone-1': [{data: {data: {status: 'COMPLETED', progressPercentage: 100}}}],
        'clone-2': [
          {data: {data: {status: 'IN_PROGRESS', progressPercentage: 30}}},
          {data: {data: {status: 'IN_PROGRESS', progressPercentage: 60}}},
          {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
        ],
      },
      callCounts,
    );
    const {progress} = makeProgressRecorder();
    const cts = new vscode.CancellationTokenSource();

    const result = await pollClonesUntilTerminal(
      odsClient,
      'test-sandbox',
      ['clone-1', 'clone-2'],
      progress,
      cts.token,
      () => {},
      {pollIntervalMs: 1, timeoutMs: 5000},
    );

    assert.deepStrictEqual(new Set(result.completedCloneIds), new Set(['clone-1', 'clone-2']));
    assert.strictEqual(callCounts['clone-1'], 1);
    assert.strictEqual(callCounts['clone-2'], 3);
    cts.dispose();
  });
});
