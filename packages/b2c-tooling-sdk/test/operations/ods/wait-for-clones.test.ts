/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {
  waitForClones,
  CloneBatchPollingTimeoutError,
  CloneBatchPollingError,
  CloneBatchFailedError,
} from '../../../src/index.js';

type CloneResponse = {data?: {data?: {status?: string; progressPercentage?: number}}};

function makeMockClient(
  responsesByCloneId: Record<string, CloneResponse[]>,
  callCountsByCloneId?: Record<string, number>,
) {
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
  } as unknown as Parameters<typeof waitForClones>[0];
}

describe('waitForClones', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should resolve when all clones reach COMPLETED', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient({
      'clone-1': [
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 50}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
      'clone-2': [
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 30}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
    });

    const promise = waitForClones(client, {
      sandboxId: 'test-sandbox',
      cloneIds: ['clone-1', 'clone-2'],
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);
    const statuses = await promise;
    clock.restore();

    expect(statuses).to.have.length(2);
    expect(statuses.every((s) => s.status === 'COMPLETED')).to.be.true;
  });

  it('should throw CloneBatchFailedError when any clone fails', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient({
      'clone-1': [{data: {data: {status: 'COMPLETED'}}}],
      'clone-2': [{data: {data: {status: 'FAILED'}}}],
    });

    const promise = waitForClones(client, {
      sandboxId: 'test-sandbox',
      cloneIds: ['clone-1', 'clone-2'],
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(CloneBatchFailedError);
      expect((error as CloneBatchFailedError).failedCloneIds).to.deep.equal(['clone-2']);
    } finally {
      clock.restore();
    }
  });

  it('should throw CloneBatchPollingTimeoutError on timeout', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient({
      'clone-1': [{data: {data: {status: 'IN_PROGRESS'}}}],
      'clone-2': [{data: {data: {status: 'IN_PROGRESS'}}}],
    });

    const promise = waitForClones(client, {
      sandboxId: 'test-sandbox',
      cloneIds: ['clone-1', 'clone-2'],
      pollIntervalSeconds: 0,
      timeoutSeconds: 1,
    });

    await clock.tickAsync(2000);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(CloneBatchPollingTimeoutError);
      expect((error as CloneBatchPollingTimeoutError).cloneIds).to.deep.equal(['clone-1', 'clone-2']);
    } finally {
      clock.restore();
    }
  });

  it('should throw CloneBatchPollingError when API returns no data for a clone', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient({
      'clone-1': [{data: {data: {status: 'COMPLETED'}}}],
      'clone-2': [{data: undefined}],
    });

    const promise = waitForClones(client, {
      sandboxId: 'test-sandbox',
      cloneIds: ['clone-1', 'clone-2'],
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(CloneBatchPollingError);
      expect((error as CloneBatchPollingError).cloneId).to.equal('clone-2');
    } finally {
      clock.restore();
    }
  });

  it('should call onPoll callback with aggregate progress info', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient({
      'clone-1': [
        {data: {data: {status: 'IN_PROGRESS', progressPercentage: 50}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
      'clone-2': [
        {data: {data: {status: 'PENDING', progressPercentage: 0}}},
        {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
      ],
    });

    const pollInfos: Array<{completed: number; total: number}> = [];

    const promise = waitForClones(client, {
      sandboxId: 'test-sandbox',
      cloneIds: ['clone-1', 'clone-2'],
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
      onPoll: (info) => {
        pollInfos.push({completed: info.completed, total: info.total});
      },
    });

    await clock.tickAsync(100);
    await promise;
    clock.restore();

    expect(pollInfos).to.have.length(2);
    expect(pollInfos[0]).to.deep.equal({completed: 0, total: 2});
    expect(pollInfos[1]).to.deep.equal({completed: 2, total: 2});
  });

  it('should stop polling a clone once it reaches a terminal state', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const callCounts: Record<string, number> = {};
    const client = makeMockClient(
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

    const promise = waitForClones(client, {
      sandboxId: 'test-sandbox',
      cloneIds: ['clone-1', 'clone-2'],
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);
    const statuses = await promise;
    clock.restore();

    expect(statuses.every((s) => s.status === 'COMPLETED')).to.be.true;
    // clone-1 completes on the first poll; it should not be polled again on
    // the subsequent two ticks needed for clone-2 to complete.
    expect(callCounts['clone-1']).to.equal(1);
    expect(callCounts['clone-2']).to.equal(3);
  });
});
