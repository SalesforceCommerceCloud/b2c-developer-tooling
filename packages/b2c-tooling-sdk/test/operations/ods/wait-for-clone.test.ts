/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {waitForClone, ClonePollingTimeoutError, ClonePollingError, CloneFailedError} from '../../../src/index.js';

function makeMockClient(responses: Array<{data?: {data?: {status?: string; progressPercentage?: number}}}>) {
  let callIndex = 0;
  return {
    GET: async () => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      return {...response, response: new Response()};
    },
  } as unknown as Parameters<typeof waitForClone>[0];
}

describe('waitForClone', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should resolve when clone reaches COMPLETED', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient([
      {data: {data: {status: 'IN_PROGRESS', progressPercentage: 50}}},
      {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
    ]);

    const promise = waitForClone(client, {
      sandboxId: 'test-sandbox',
      cloneId: 'test-clone',
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);
    await promise;
    clock.restore();
  });

  it('should throw CloneFailedError when clone fails', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient([{data: {data: {status: 'FAILED'}}}]);

    const promise = waitForClone(client, {
      sandboxId: 'test-sandbox',
      cloneId: 'test-clone',
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(CloneFailedError);
      expect((error as CloneFailedError).cloneId).to.equal('test-clone');
    } finally {
      clock.restore();
    }
  });

  it('should throw ClonePollingTimeoutError on timeout', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient([{data: {data: {status: 'IN_PROGRESS'}}}]);

    const promise = waitForClone(client, {
      sandboxId: 'test-sandbox',
      cloneId: 'test-clone',
      pollIntervalSeconds: 0,
      timeoutSeconds: 1,
    });

    await clock.tickAsync(2000);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(ClonePollingTimeoutError);
      expect((error as ClonePollingTimeoutError).cloneId).to.equal('test-clone');
    } finally {
      clock.restore();
    }
  });

  it('should throw ClonePollingError when API returns no data', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient([{data: undefined}]);

    const promise = waitForClone(client, {
      sandboxId: 'test-sandbox',
      cloneId: 'test-clone',
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
    });

    await clock.tickAsync(100);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(ClonePollingError);
    } finally {
      clock.restore();
    }
  });

  it('should call onPoll callback with status info', async () => {
    const clock = sinon.useFakeTimers({now: 0});
    const client = makeMockClient([
      {data: {data: {status: 'PENDING', progressPercentage: 0}}},
      {data: {data: {status: 'IN_PROGRESS', progressPercentage: 50}}},
      {data: {data: {status: 'COMPLETED', progressPercentage: 100}}},
    ]);

    const pollInfos: Array<{status: string; progressPercentage?: number}> = [];

    const promise = waitForClone(client, {
      sandboxId: 'test-sandbox',
      cloneId: 'test-clone',
      pollIntervalSeconds: 0,
      timeoutSeconds: 60,
      onPoll: (info) => {
        pollInfos.push({status: info.status, progressPercentage: info.progressPercentage});
      },
    });

    await clock.tickAsync(100);
    await promise;
    clock.restore();

    expect(pollInfos).to.have.length(3);
    expect(pollInfos[0]!.status).to.equal('PENDING');
    expect(pollInfos[1]!.status).to.equal('IN_PROGRESS');
    expect(pollInfos[2]!.status).to.equal('COMPLETED');
  });
});
