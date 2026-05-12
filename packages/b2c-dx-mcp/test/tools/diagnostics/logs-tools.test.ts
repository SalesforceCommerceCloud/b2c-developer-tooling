/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {LogEntry, LogFile, TailLogsOptions} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {Services} from '../../../src/services.js';
import {ServerContext} from '../../../src/server-context.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import {createLogsListFilesTool} from '../../../src/tools/diagnostics/logs-list-files.js';
import {createLogsGetRecentTool} from '../../../src/tools/diagnostics/logs-get-recent.js';
import {createLogsWatchStartTool} from '../../../src/tools/diagnostics/logs-watch-start.js';
import {createLogsWatchPollTool} from '../../../src/tools/diagnostics/logs-watch-poll.js';
import {createLogsWatchStopTool} from '../../../src/tools/diagnostics/logs-watch-stop.js';
import {createLogsWatchListTool} from '../../../src/tools/diagnostics/logs-watch-list.js';
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

function makeFile(name: string, prefix = 'error'): LogFile {
  return {name, prefix, size: 100, lastModified: new Date('2026-01-01T00:00:00Z'), path: `/Logs/${name}`};
}

function makeEntry(opts: {file?: string; level?: string; message?: string; timestamp?: string} = {}): LogEntry {
  const message = opts.message ?? 'something went wrong';
  return {
    file: opts.file ?? 'error.log',
    level: opts.level ?? 'ERROR',
    message,
    raw: `[${opts.timestamp ?? '2026-05-11 10:00:00.000 GMT'}] ${opts.level ?? 'ERROR'} ${message}`,
    timestamp: opts.timestamp ?? '2026-05-11 10:00:00.000 GMT',
  };
}

function createMockB2CInstance(hostname = 'test.example.com'): B2CInstance {
  return {
    config: {hostname},
    webdav: {} as never,
    ocapi: {} as never,
  } as unknown as B2CInstance;
}

function createServices(b2cInstance: B2CInstance | undefined): Services {
  return new Services({
    b2cInstance,
    resolvedConfig: createMockResolvedConfig({hostname: b2cInstance?.config.hostname}),
  });
}

describe('tools/diagnostics/logs', () => {
  let serverContext: ServerContext;
  let b2cInstance: B2CInstance;
  let loadServices: () => Services;

  beforeEach(() => {
    serverContext = new ServerContext();
    b2cInstance = createMockB2CInstance();
    const services = createServices(b2cInstance);
    loadServices = () => services;
  });

  afterEach(async () => {
    await serverContext.destroyAll();
  });

  describe('logs_list_files', () => {
    it('exposes correct metadata', () => {
      const tool = createLogsListFilesTool(loadServices, serverContext);
      expect(tool.name).to.equal('logs_list_files');
      expect(tool.toolsets).to.have.members(['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI']);
    });

    it('calls listLogFiles and returns count', async () => {
      const stub = sinon.stub().resolves([makeFile('error-1.log'), makeFile('error-2.log')]);
      const tool = createLogsListFilesTool(loadServices, serverContext, {listLogFiles: stub});
      const result = await tool.handler({prefixes: ['error'], sort_by: 'date'});
      const json = getResultJson<{count: number; files: LogFile[]}>(result);
      expect(json.count).to.equal(2);
      expect(stub.firstCall.args[1]).to.deep.include({prefixes: ['error'], sortBy: 'date', sortOrder: 'desc'});
    });
  });

  describe('logs_get_recent', () => {
    it('returns entries trimmed to count', async () => {
      const entries = [makeEntry({message: 'a'}), makeEntry({message: 'b'}), makeEntry({message: 'c'})];
      const stub = sinon.stub().resolves(entries);
      const tool = createLogsGetRecentTool(loadServices, serverContext, {getRecentLogs: stub});
      const result = await tool.handler({count: 2});
      const json = getResultJson<{count: number; entries: LogEntry[]}>(result);
      expect(json.count).to.equal(2);
      expect(json.entries.map((e) => e.message)).to.deep.equal(['a', 'b']);
    });

    it('applies level and search filters client-side', async () => {
      const stub = sinon
        .stub()
        .resolves([
          makeEntry({level: 'ERROR', message: 'OrderMgr failed'}),
          makeEntry({level: 'WARN', message: 'OrderMgr slow'}),
          makeEntry({level: 'ERROR', message: 'PaymentMgr failed'}),
        ]);
      const tool = createLogsGetRecentTool(loadServices, serverContext, {getRecentLogs: stub});
      const result = await tool.handler({level: ['ERROR'], search: 'OrderMgr'});
      const json = getResultJson<{count: number; entries: LogEntry[]}>(result);
      expect(json.count).to.equal(1);
      expect(json.entries[0].message).to.equal('OrderMgr failed');
    });

    it('parses --since', async () => {
      const future = new Date(Date.now() + 60_000);
      const stub = sinon
        .stub()
        .resolves([
          makeEntry({timestamp: future.toISOString().replace('T', ' ').replace('Z', ' GMT').slice(0, 23) + ' GMT'}),
        ]);
      const tool = createLogsGetRecentTool(loadServices, serverContext, {getRecentLogs: stub});
      const result = await tool.handler({since: '5m'});
      expect(result.isError).to.be.undefined;
    });

    it('errors on invalid --since', async () => {
      const tool = createLogsGetRecentTool(loadServices, serverContext, {getRecentLogs: sinon.stub().resolves([])});
      const result = await tool.handler({since: 'nonsense'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Invalid --since value');
    });
  });

  describe('logs_watch_start / poll / stop / list', () => {
    /* eslint-disable camelcase */
    it('logs_watch_start returns watch id and rejects duplicate', async () => {
      const options: TailLogsOptions[] = [];
      const tailLogsStub = sinon.stub().callsFake((_inst: B2CInstance, opts: TailLogsOptions) => {
        options.push(opts);
        return Promise.resolve({stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()});
      });

      const tool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      const result = await tool.handler({prefixes: ['error']});
      expect(result.isError).to.be.undefined;
      const json = getResultJson<{hostname: string; watch_id: string}>(result);
      expect(json.hostname).to.equal('test.example.com');
      expect(json.watch_id).to.match(/^[\da-f-]{36}$/);

      const dup = await tool.handler({});
      expect(dup.isError).to.be.true;
      expect(getResultText(dup)).to.include('already exists');
    });

    it('start → tail emits entry → poll returns it', async () => {
      let onEntry: ((e: LogEntry) => void) | undefined;
      const tailLogsStub = sinon.stub().callsFake((_inst: B2CInstance, opts: TailLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()});
      });
      const startTool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      const startRes = await startTool.handler({});
      const {watch_id} = getResultJson<{watch_id: string}>(startRes);

      // Simulate the tail emitting an entry
      onEntry!(makeEntry({message: 'boom'}));

      const pollTool = createLogsWatchPollTool(loadServices, serverContext);
      const pollRes = await pollTool.handler({watch_id, timeout_ms: 500, max_entries: 50});
      const json = getResultJson<{entries: LogEntry[]; truncated: boolean}>(pollRes);
      expect(json.entries).to.have.lengthOf(1);
      expect(json.entries[0].message).to.equal('boom');
      expect(json.truncated).to.be.false;
    });

    it('poll blocks until entry arrives within timeout', async () => {
      let onEntry: ((e: LogEntry) => void) | undefined;
      const tailLogsStub = sinon.stub().callsFake((_inst: B2CInstance, opts: TailLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()});
      });
      const startTool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const pollTool = createLogsWatchPollTool(loadServices, serverContext);
      const pollPromise = pollTool.handler({watch_id, timeout_ms: 5000});

      setTimeout(() => onEntry!(makeEntry({message: 'late'})), 25);

      const pollRes = await pollPromise;
      const json = getResultJson<{entries: LogEntry[]}>(pollRes);
      expect(json.entries.map((e) => e.message)).to.deep.equal(['late']);
    });

    it('poll respects max_entries and reports truncated', async () => {
      let onEntry: ((e: LogEntry) => void) | undefined;
      const tailLogsStub = sinon.stub().callsFake((_inst: B2CInstance, opts: TailLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()});
      });
      const startTool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      onEntry!(makeEntry({message: 'a'}));
      onEntry!(makeEntry({message: 'b'}));
      onEntry!(makeEntry({message: 'c'}));

      const pollTool = createLogsWatchPollTool(loadServices, serverContext);
      const pollRes = await pollTool.handler({watch_id, max_entries: 2, timeout_ms: 0});
      const json = getResultJson<{entries: LogEntry[]; truncated: boolean}>(pollRes);
      expect(json.entries).to.have.lengthOf(2);
      expect(json.truncated).to.be.true;
    });

    it('start filters by level and search', async () => {
      let onEntry: ((e: LogEntry) => void) | undefined;
      const tailLogsStub = sinon.stub().callsFake((_inst: B2CInstance, opts: TailLogsOptions) => {
        onEntry = opts.onEntry;
        return Promise.resolve({stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()});
      });
      const startTool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      const {watch_id} = getResultJson<{watch_id: string}>(
        await startTool.handler({level: ['ERROR'], search: 'OrderMgr'}),
      );

      onEntry!(makeEntry({level: 'WARN', message: 'OrderMgr slow'})); // dropped (level)
      onEntry!(makeEntry({level: 'ERROR', message: 'PaymentMgr failed'})); // dropped (search)
      onEntry!(makeEntry({level: 'ERROR', message: 'OrderMgr failed'})); // kept

      const pollTool = createLogsWatchPollTool(loadServices, serverContext);
      const pollRes = await pollTool.handler({watch_id, timeout_ms: 0});
      const json = getResultJson<{entries: LogEntry[]}>(pollRes);
      expect(json.entries).to.have.lengthOf(1);
      expect(json.entries[0].message).to.equal('OrderMgr failed');
    });

    it('logs_watch_stop calls stop and removes the watch', async () => {
      const stop = sinon.stub().resolves();
      const tailLogsStub = sinon.stub().resolves({stop, files: [], entries: [], done: Promise.resolve()});
      const startTool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      const {watch_id} = getResultJson<{watch_id: string}>(await startTool.handler({}));

      const stopTool = createLogsWatchStopTool(loadServices, serverContext);
      const result = await stopTool.handler({watch_id});
      expect(result.isError).to.be.undefined;
      expect(stop.calledOnce).to.be.true;
      expect(serverContext.logWatches.getWatch(watch_id)).to.be.undefined;
    });

    it('logs_watch_list returns active watches', async () => {
      const tailLogsStub = sinon
        .stub()
        .resolves({stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()});
      const startTool = createLogsWatchStartTool(loadServices, serverContext, {tailLogs: tailLogsStub});
      await startTool.handler({prefixes: ['error']});

      const listTool = createLogsWatchListTool(loadServices, serverContext);
      const result = await listTool.handler({});
      const json = getResultJson<{
        watches: Array<{hostname: string; prefixes: string[]; watch_id: string}>;
      }>(result);
      expect(json.watches).to.have.lengthOf(1);
      expect(json.watches[0].hostname).to.equal('test.example.com');
      expect(json.watches[0].prefixes).to.deep.equal(['error']);
    });

    it('errors when registry is missing', async () => {
      const pollTool = createLogsWatchPollTool(loadServices, undefined);
      const result = await pollTool.handler({watch_id: 'x'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('not available');
    });

    it('errors on unknown watch_id', async () => {
      const pollTool = createLogsWatchPollTool(loadServices, serverContext);
      const result = await pollTool.handler({watch_id: 'nope'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No log watch found');
    });
  });
});
