/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import {
  watchLogs,
  type LogEntry,
  type LogFile,
  type TailLogsOptions,
  type TailLogsResult,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {watchMrtLogs, type MrtLogEntry, type TailMrtLogsOptions} from '@salesforce/b2c-tooling-sdk/operations/mrt';

const instance = {config: {hostname: 'my-sandbox.example.com'}} as unknown as B2CInstance;
const entry = (message: string, level = 'ERROR'): LogEntry => ({file: 'error.log', level, message, raw: message});
const file = (name: string): LogFile => ({
  name,
  prefix: 'error',
  size: 1,
  lastModified: new Date(0),
  path: `/Logs/${name}`,
});

function fakeTail() {
  let callbacks: TailLogsOptions = {};
  const result: TailLogsResult = {stop: sinon.stub().resolves(), files: [], entries: [], done: Promise.resolve()};
  const tail = sinon.stub().callsFake(async (_instance: B2CInstance, options: TailLogsOptions) => {
    callbacks = options;
    return result;
  });
  return {tail, result, emit: () => callbacks};
}

describe('operations/logs/watch', () => {
  it('passes tail options and buffers entries until polled', async () => {
    const {tail, emit} = fakeTail();
    const watch = await watchLogs(instance, {prefixes: ['customerror'], pollInterval: 10, tail});
    const options = tail.firstCall.args[1] as TailLogsOptions;
    expect(options).to.include({pollInterval: 10, lastEntries: 0});
    expect(options.prefixes).to.deep.equal(['customerror']);
    emit().onEntry!(entry('a'));
    emit().onEntry!(entry('b'));
    const batch = await watch.poll({maxEntries: 1});
    expect(batch.entries.map((e) => e.message)).to.deep.equal(['a']);
    expect(batch).to.include({truncated: true, bufferedRemaining: 1, droppedEntries: 0, stopped: false});
    expect((await watch.poll()).entries.map((e) => e.message)).to.deep.equal(['b']);
    await watch.stop();
  });

  it('filters by level and search before buffering', async () => {
    const {tail, emit} = fakeTail();
    const watch = await watchLogs(instance, {level: ['error'], search: 'ORDER', tail});
    emit().onEntry!(entry('order failed'));
    emit().onEntry!(entry('order info', 'INFO'));
    emit().onEntry!(entry('cart failed'));
    expect((await watch.poll()).entries.map((e) => e.message)).to.deep.equal(['order failed']);
    expect(watch.info().totalEntriesSeen).to.equal(1);
    await watch.stop();
  });

  it('drops the oldest entries over the count or byte cap and reports drops once', async () => {
    const {tail, emit} = fakeTail();
    const watch = await watchLogs(instance, {bufferCap: 2, bufferBytesCap: 1000, tail});
    for (const message of ['a', 'b', 'c']) emit().onEntry!(entry(message));
    emit().onEntry!(entry('x'.repeat(2000)));
    const first = await watch.poll();
    // The oversized entry evicts everything before it but is still delivered.
    expect(first.entries.map((e) => e.message.length)).to.deep.equal([2000]);
    expect(first.droppedEntries).to.equal(3);
    expect((await watch.poll()).droppedEntries).to.equal(0);
    await watch.stop();
  });

  it('waits for activity, and returns early on rotations and errors', async () => {
    const {tail, emit} = fakeTail();
    const watch = await watchLogs(instance, {tail});
    const started = Date.now();
    expect((await watch.poll({timeoutMs: 30})).entries).to.deep.equal([]);
    expect(Date.now() - started).to.be.at.least(25);
    setTimeout(() => emit().onEntry!(entry('late')), 10);
    expect((await watch.poll({timeoutMs: 5000})).entries).to.have.length(1);
    setTimeout(() => emit().onFileRotated!(file('error-1.log')), 10);
    const rotated = await watch.poll({timeoutMs: 5000});
    expect(rotated.filesRotated.map((f) => f.name)).to.deep.equal(['error-1.log']);
    emit().onError!(new Error('webdav 500'));
    expect((await watch.poll({timeoutMs: 5000})).errors.map((e) => e.message)).to.deep.equal(['webdav 500']);
    await watch.stop();
  });

  it('reports each discovered file once per poll and keeps the cumulative list', async () => {
    const {tail, emit} = fakeTail();
    const watch = await watchLogs(instance, {tail});
    emit().onFileDiscovered!(file('a.log'));
    emit().onFileDiscovered!(file('a.log'));
    expect((await watch.poll()).filesDiscovered.map((f) => f.name)).to.deep.equal(['a.log']);
    emit().onFileDiscovered!(file('b.log'));
    expect((await watch.poll()).filesDiscovered.map((f) => f.name)).to.deep.equal(['b.log']);
    expect(watch.info().filesDiscovered.map((f) => f.name)).to.deep.equal(['a.log', 'b.log']);
    await watch.stop();
  });

  it('stops once, releases a waiting poll and keeps unread entries', async () => {
    const {tail, result, emit} = fakeTail();
    const watch = await watchLogs(instance, {tail});
    emit().onEntry!(entry('unread'));
    await watch.poll({maxEntries: 0});
    const waiting = watch.poll({timeoutMs: 5000, maxEntries: 0});
    await Promise.all([watch.stop(), watch.stop()]);
    expect((await waiting).stopped).to.equal(true);
    expect((result.stop as sinon.SinonStub).calledOnce).to.equal(true);
    emit().onEntry!(entry('after stop'));
    expect((await watch.poll()).entries.map((e) => e.message)).to.deep.equal(['unread']);
  });
});

describe('operations/mrt/watch-logs', () => {
  const mrtEntry = (message: string, level?: string): MrtLogEntry => ({message, raw: message, level});

  it('buffers stream entries, records close-time errors and reports stopped', async () => {
    let callbacks: TailMrtLogsOptions | undefined;
    let close!: () => void;
    const done = new Promise<void>((_resolve, reject) => {
      close = () => reject(new Error('closed'));
    });
    const stop = sinon.stub();
    const tail = sinon.stub().callsFake(async (options: TailMrtLogsOptions) => {
      callbacks = options;
      return {stop, done};
    });
    const watch = await watchMrtLogs(
      {projectSlug: 'my-project', environmentSlug: 'staging', user: 'a@example.com', level: ['ERROR'], tail},
      {} as never,
    );
    expect(tail.firstCall.args[0]).to.include({
      projectSlug: 'my-project',
      environmentSlug: 'staging',
      user: 'a@example.com',
    });
    callbacks!.onEntry!(mrtEntry('kept', 'ERROR'));
    callbacks!.onEntry!(mrtEntry('filtered', 'INFO'));
    // tailMrtLogs reports a failed connection as an error, then the close.
    callbacks!.onError!(new Error('WebSocket connection failed: close code 1006'));
    callbacks!.onClose!(1006, '');
    close();
    callbacks!.onError!(new Error('late error after close'));
    const batch = await watch.poll({timeoutMs: 5000});
    expect(batch.stopped).to.equal(true);
    expect(batch.entries.map((e) => e.message)).to.deep.equal(['kept']);
    expect(batch.errors.map((e) => e.message)).to.deep.equal([
      'WebSocket connection failed: close code 1006',
      'late error after close',
    ]);
    expect(watch.info()).to.include({projectSlug: 'my-project', stopped: true});
    await watch.stop();
    expect(stop.calledOnce).to.equal(true);
  });
});
