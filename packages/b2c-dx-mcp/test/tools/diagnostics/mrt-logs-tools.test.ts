/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {AuthStrategy, FetchInit} from '@salesforce/b2c-tooling-sdk/auth';
import type {MrtLogEntry, TailMrtLogsOptions, TailMrtLogsResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {Services} from '../../../src/services.js';
import {ServerContext} from '../../../src/server-context.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import {createMrtLogsWatchStartTool} from '../../../src/tools/diagnostics/mrt-logs-watch-start.js';
import {createMrtLogsWatchPollTool} from '../../../src/tools/diagnostics/mrt-logs-watch-poll.js';
import {createMrtLogsWatchStopTool} from '../../../src/tools/diagnostics/mrt-logs-watch-stop.js';
import {createMrtLogsWatchListTool} from '../../../src/tools/diagnostics/mrt-logs-watch-list.js';
import type {ToolResult} from '../../../src/utils/index.js';

function getResultJson<T>(result: ToolResult): T {
  const text = result.content[0];
  if (text?.type !== 'text') throw new Error('Expected text content');
  return JSON.parse(text.text) as T;
}

function getResultText(result: ToolResult): string {
  const text = result.content[0];
  if (text?.type !== 'text') throw new Error('Expected text content');
  return text.text;
}

function makeEntry(opts: {level?: string; message?: string; timestamp?: string} = {}): MrtLogEntry {
  const message = opts.message ?? 'something happened';
  const level = opts.level ?? 'INFO';
  const timestamp = opts.timestamp ?? '2026-05-11T10:00:00.000Z';
  return {
    timestamp,
    requestId: 'abcd1234-0000-0000-0000-000000000000',
    shortRequestId: 'abcd1234',
    level,
    message,
    raw: `${timestamp}\tabcd1234-0000-0000-0000-000000000000\t${level}\t${message}`,
  };
}

class MockAuthStrategy implements AuthStrategy {
  constructor(private token: string = 'test-token') {}

  async fetch(url: string, init?: FetchInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.token}`);
    const {dispatcher: _dispatcher, ...restInit} = init ?? {};
    return fetch(url, {...restInit, headers});
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Bearer ${this.token}`;
  }
}

function createServices(options?: {
  project?: string;
  environment?: string;
  origin?: string;
  auth?: AuthStrategy;
}): Services {
  return new Services({
    mrtConfig: {
      auth: options?.auth ?? new MockAuthStrategy(),
      project: options?.project ?? 'my-storefront',
      environment: options?.environment ?? 'staging',
      origin: options?.origin,
    },
    resolvedConfig: createMockResolvedConfig({}),
  });
}

/** A no-op getProfile injection so start does not attempt a real network call. */
const noProfile = async () => ({email: undefined});

describe('tools/diagnostics/mrt-logs', () => {
  let serverContext: ServerContext;
  let loadServices: () => Services;

  beforeEach(() => {
    serverContext = new ServerContext();
    const services = createServices();
    loadServices = () => services;
  });

  afterEach(async () => {
    await serverContext.destroyAll();
  });

  /* eslint-disable camelcase */
  describe('mrt_logs_watch_start', () => {
    it('exposes correct metadata', () => {
      const tool = createMrtLogsWatchStartTool(loadServices, serverContext);
      expect(tool.name).to.equal('mrt_logs_watch_start');
      expect(tool.toolsets).to.have.members(['DIAGNOSTICS', 'PWAV3', 'STOREFRONTNEXT']);
    });

    it('returns watch id + project/environment and rejects duplicate', async () => {
      const tailStub = sinon.stub().resolves({stop: sinon.stub(), done: Promise.resolve()} as TailMrtLogsResult);
      const tool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });

      const result = await tool.handler({});
      expect(result.isError).to.be.undefined;
      const json = getResultJson<{environment: string; project: string; watch_id: string}>(result);
      expect(json.project).to.equal('my-storefront');
      expect(json.environment).to.equal('staging');
      expect(json.watch_id).to.match(/^[\da-f-]{36}$/);

      const dup = await tool.handler({});
      expect(dup.isError).to.be.true;
      expect(getResultText(dup)).to.include('already exists');
    });

    it('passes project/environment/origin/user to tailMrtLogs', async () => {
      const captured: TailMrtLogsOptions[] = [];
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        captured.push(opts);
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const services = createServices({origin: 'https://cloud-soak.mrt-soak.com'});
      const tool = createMrtLogsWatchStartTool(() => services, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: async () => ({email: 'dev@example.com'}),
      });

      await tool.handler({});
      expect(captured[0].projectSlug).to.equal('my-storefront');
      expect(captured[0].environmentSlug).to.equal('staging');
      expect(captured[0].origin).to.equal('https://cloud-soak.mrt-soak.com');
      expect(captured[0].user).to.equal('dev@example.com');
    });

    it('proceeds when getProfile fails (user omitted)', async () => {
      const captured: TailMrtLogsOptions[] = [];
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        captured.push(opts);
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const tool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        async getProfile() {
          throw new Error('profile lookup failed');
        },
      });

      const result = await tool.handler({});
      expect(result.isError).to.be.undefined;
      expect(captured[0].user).to.be.undefined;
    });

    it('errors when project is missing', async () => {
      // Build Services directly so project stays undefined (createServices defaults it).
      const services = new Services({
        mrtConfig: {auth: new MockAuthStrategy(), environment: 'staging'},
        resolvedConfig: createMockResolvedConfig({}),
      });
      const tool = createMrtLogsWatchStartTool(() => services, serverContext, {
        tailMrtLogs: sinon.stub(),
        getProfile: noProfile,
      });
      const result = await tool.handler({});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('MRT project is required');
    });

    it('errors when MRT auth is missing', async () => {
      const services = new Services({
        mrtConfig: {project: 'p', environment: 'e'},
        resolvedConfig: createMockResolvedConfig({}),
      });
      const tool = createMrtLogsWatchStartTool(() => services, serverContext, {
        tailMrtLogs: sinon.stub(),
        getProfile: noProfile,
      });
      const result = await tool.handler({});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('MRT auth error');
    });

    it('filters by level and search before buffering', async () => {
      let onEntry: ((e: MrtLogEntry) => void) | undefined;
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(
        await startTool.handler({level: ['ERROR'], search: 'OrderMgr'}),
      );

      onEntry!(makeEntry({level: 'WARN', message: 'OrderMgr slow'})); // dropped (level)
      onEntry!(makeEntry({level: 'ERROR', message: 'PaymentMgr failed'})); // dropped (search)
      onEntry!(makeEntry({level: 'ERROR', message: 'OrderMgr failed'})); // kept

      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const json = getResultJson<{entries: MrtLogEntry[]}>(await pollTool.handler({watch_id, timeout_ms: 0}));
      expect(json.entries).to.have.lengthOf(1);
      expect(json.entries[0].message).to.equal('OrderMgr failed');
    });

    it('stops the orphaned stream if registration loses a key race', async () => {
      const racedStop = sinon.stub();
      const tailStub = sinon.stub().callsFake(() => {
        // A competing start wins the race during the tailMrtLogs await.
        serverContext.mrtLogWatches.registerWatch({
          project: 'my-storefront',
          environment: 'staging',
          tailResult: {stop: sinon.stub(), done: Promise.resolve()},
        });
        return Promise.resolve({stop: racedStop, done: Promise.resolve()});
      });
      const tool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });

      const result = await tool.handler({});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('already exists');
      expect(racedStop.calledOnce).to.be.true;
    });
  });

  describe('mrt_logs_watch_poll', () => {
    it('start → entry → poll returns it', async () => {
      let onEntry: ((e: MrtLogEntry) => void) | undefined;
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      onEntry!(makeEntry({message: 'boom'}));

      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const json = getResultJson<{entries: MrtLogEntry[]; truncated: boolean; stopped: boolean}>(
        await pollTool.handler({watch_id, timeout_ms: 500, max_entries: 50}),
      );
      expect(json.entries).to.have.lengthOf(1);
      expect(json.entries[0].message).to.equal('boom');
      expect(json.truncated).to.be.false;
      expect(json.stopped).to.be.false;
    });

    it('blocks until an entry arrives within timeout', async () => {
      let onEntry: ((e: MrtLogEntry) => void) | undefined;
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const pollPromise = pollTool.handler({watch_id, timeout_ms: 5000});
      setTimeout(() => onEntry!(makeEntry({message: 'late'})), 25);

      const json = getResultJson<{entries: MrtLogEntry[]}>(await pollPromise);
      expect(json.entries.map((e) => e.message)).to.deep.equal(['late']);
    });

    it('respects max_entries and reports truncated', async () => {
      let onEntry: ((e: MrtLogEntry) => void) | undefined;
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      onEntry!(makeEntry({message: 'a'}));
      onEntry!(makeEntry({message: 'b'}));
      onEntry!(makeEntry({message: 'c'}));

      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const json = getResultJson<{entries: MrtLogEntry[]; truncated: boolean}>(
        await pollTool.handler({watch_id, max_entries: 2, timeout_ms: 0}),
      );
      expect(json.entries).to.have.lengthOf(2);
      expect(json.truncated).to.be.true;
    });

    it('surfaces errors and reports stopped when the stream closes', async () => {
      let onError: ((e: Error) => void) | undefined;
      let onClose: ((code: number, reason: string) => void) | undefined;
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        onError = opts.onError;
        onClose = opts.onClose;
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      onError!(new Error('socket blew up'));
      onClose!(1006, 'abnormal');

      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const first = getResultJson<{errors: Array<{at: string; message: string}>; stopped: boolean}>(
        await pollTool.handler({watch_id, timeout_ms: 0}),
      );
      expect(first.errors.map((e) => e.message)).to.deep.equal(['socket blew up']);
      expect(first.errors[0].at).to.be.a('string');
      expect(first.stopped).to.be.true;

      // Errors are drained — a subsequent poll does not re-report them.
      const second = getResultJson<{errors: unknown[]}>(await pollTool.handler({watch_id, timeout_ms: 0}));
      expect(second.errors).to.deep.equal([]);
    });

    it('reports dropped_entries once then resets to 0', async () => {
      let onEntry: ((e: MrtLogEntry) => void) | undefined;
      const tailStub = sinon.stub().callsFake((opts: TailMrtLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub(), done: Promise.resolve()});
      });
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const watch = serverContext.mrtLogWatches.getWatch(watch_id)!;
      watch.bufferCap = 2;
      onEntry!(makeEntry({message: 'a'}));
      onEntry!(makeEntry({message: 'b'}));
      onEntry!(makeEntry({message: 'c'})); // evicts 'a'

      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const first = getResultJson<{dropped_entries: number}>(await pollTool.handler({watch_id, timeout_ms: 0}));
      expect(first.dropped_entries).to.equal(1);

      const second = getResultJson<{dropped_entries: number}>(await pollTool.handler({watch_id, timeout_ms: 0}));
      expect(second.dropped_entries).to.equal(0);
    });

    it('errors when registry is missing', async () => {
      const pollTool = createMrtLogsWatchPollTool(loadServices, undefined);
      const result = await pollTool.handler({watch_id: 'x'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('not available');
    });

    it('errors on unknown watch_id', async () => {
      const pollTool = createMrtLogsWatchPollTool(loadServices, serverContext);
      const result = await pollTool.handler({watch_id: 'nope'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No MRT log watch found');
    });
  });

  describe('mrt_logs_watch_stop', () => {
    it('calls stop and removes the watch', async () => {
      const stop = sinon.stub();
      const tailStub = sinon.stub().resolves({stop, done: Promise.resolve()} as TailMrtLogsResult);
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const stopTool = createMrtLogsWatchStopTool(loadServices, serverContext);
      const result = await stopTool.handler({watch_id});
      expect(result.isError).to.be.undefined;
      expect(stop.calledOnce).to.be.true;
      expect(serverContext.mrtLogWatches.getWatch(watch_id)).to.be.undefined;
    });

    it('is idempotent (second stop returns success, not error)', async () => {
      const stop = sinon.stub();
      const tailStub = sinon.stub().resolves({stop, done: Promise.resolve()} as TailMrtLogsResult);
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const stopTool = createMrtLogsWatchStopTool(loadServices, serverContext);
      const first = await stopTool.handler({watch_id});
      expect(first.isError).to.be.undefined;

      const second = await stopTool.handler({watch_id});
      expect(second.isError).to.be.undefined;
      const json = getResultJson<{stopped_at: string; watch_id: string}>(second);
      expect(json.watch_id).to.equal(watch_id);
      expect(json.stopped_at).to.be.a('string');
      expect(stop.calledOnce).to.be.true;
    });

    it('swallows a rejected done promise on stop (no unhandled rejection)', async () => {
      const stop = sinon.stub();
      const rejectedDone = Promise.reject(new Error('WebSocket connection failed: close code 1006'));
      const tailStub = sinon.stub().resolves({stop, done: rejectedDone} as TailMrtLogsResult);
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const stopTool = createMrtLogsWatchStopTool(loadServices, serverContext);
      const result = await stopTool.handler({watch_id});
      expect(result.isError).to.be.undefined;
      expect(serverContext.mrtLogWatches.getWatch(watch_id)).to.be.undefined;
    });
  });

  describe('mrt_logs_watch_list', () => {
    it('returns active watches', async () => {
      const tailStub = sinon.stub().resolves({stop: sinon.stub(), done: Promise.resolve()} as TailMrtLogsResult);
      const startTool = createMrtLogsWatchStartTool(loadServices, serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      await startTool.handler({});

      const listTool = createMrtLogsWatchListTool(loadServices, serverContext);
      const json = getResultJson<{
        watches: Array<{environment: string; project: string; watch_id: string; stopped: boolean}>;
      }>(await listTool.handler({}));
      expect(json.watches).to.have.lengthOf(1);
      expect(json.watches[0].project).to.equal('my-storefront');
      expect(json.watches[0].environment).to.equal('staging');
      expect(json.watches[0].stopped).to.be.false;
    });

    it('lists distinct project/environment watches separately', async () => {
      const tailStub = sinon.stub().resolves({stop: sinon.stub(), done: Promise.resolve()} as TailMrtLogsResult);
      const startStaging = createMrtLogsWatchStartTool(() => createServices({environment: 'staging'}), serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      const startProd = createMrtLogsWatchStartTool(() => createServices({environment: 'production'}), serverContext, {
        tailMrtLogs: tailStub,
        getProfile: noProfile,
      });
      await startStaging.handler({});
      await startProd.handler({});

      const listTool = createMrtLogsWatchListTool(loadServices, serverContext);
      const json = getResultJson<{watches: Array<{environment: string}>}>(await listTool.handler({}));
      expect(json.watches.map((w) => w.environment).sort()).to.deep.equal(['production', 'staging']);
    });
  });
  /* eslint-enable camelcase */
});
