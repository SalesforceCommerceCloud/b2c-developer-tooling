/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  runScapiCode,
  ScapiCodePause,
  ScapiCodePausedError,
  type ScapiCallInterceptor,
  type ScapiJournal,
} from '@salesforce/b2c-tooling-sdk/scapi';

async function caught(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected a rejection');
}

/** Pauses every PUT until `approved` holds its call id. */
function gate(approved: Set<number>): ScapiCallInterceptor {
  return async (call, next) => {
    if (call.kind === 'request' && (call.args as {method?: string}).method === 'PUT' && !approved.has(call.id))
      throw new ScapiCodePause({id: call.id, args: call.args});
    return next();
  };
}

describe('SCAPI code mode journal and replay', function () {
  this.timeout(10_000);

  it('pauses at a gated write and resumes without re-sending earlier requests', async () => {
    const sent: unknown[] = [];
    const request = async (options: unknown) => {
      sent.push(options);
      return {n: sent.length};
    };
    const approved = new Set<number>();
    const code = `async () => {
      const a = await scapi.request({method: 'GET', path: '/a'});
      const nonce = Math.random();
      const at = Date.now();
      const b = await scapi.request({method: 'PUT', path: '/b'});
      return {a, b, nonce, at};
    }`;
    const journal: ScapiJournal = {entries: []};
    const paused = await caught(() => runScapiCode({code, request, journal, interceptors: [gate(approved)]}));
    expect(paused).to.be.instanceOf(ScapiCodePausedError);
    const {detail} = paused as ScapiCodePausedError;
    expect(detail).to.deep.equal({id: 2, args: {method: 'PUT', path: '/b'}});
    expect(sent).to.have.length(1);
    expect(journal.entries.map((entry) => entry.state)).to.deep.equal(['answered']);

    approved.add(2);
    const first = (await runScapiCode({code, request, journal, interceptors: [gate(approved)]})) as Record<
      string,
      unknown
    >;
    expect(sent).to.have.length(2);
    expect(first).to.deep.include({a: {n: 1}, b: {n: 2}});

    // A completed journal replays the whole run, with the same randomness and clock.
    const again = await runScapiCode({code, request, journal});
    expect(again).to.deep.equal(first);
    expect(sent).to.have.length(2);
  });

  it('fails closed when the program diverges from the recorded calls', async () => {
    const journal: ScapiJournal = {entries: []};
    await runScapiCode({
      code: "async () => scapi.request({method: 'GET', path: '/a'})",
      request: async () => 1,
      journal,
    });
    const error = await caught(() =>
      runScapiCode({code: "async () => scapi.request({method: 'GET', path: '/z'})", request: async () => 2, journal}),
    );
    expect(error.message).to.include('SCAPI_REPLAY_DIVERGED');
  });

  it('stops at a request whose response was lost instead of sending it again', async () => {
    const journal: ScapiJournal = {
      entries: [{id: 1, kind: 'request', args: JSON.stringify({method: 'PUT', path: '/b'}), now: 0, state: 'started'}],
    };
    let sent = 0;
    const error = await caught(() =>
      runScapiCode({
        code: "async () => scapi.request({method: 'PUT', path: '/b'})",
        request: async () => ++sent,
        journal,
      }),
    );
    expect(error.message).to.include('SCAPI_REPLAY_UNCERTAIN');
    expect(sent).to.equal(0);
  });

  it('repeats interrupted discovery and replays sleep without waiting', async () => {
    const journal: ScapiJournal = {entries: []};
    const code = 'async () => { await sleep(300); return scapi.request({}); }';
    await runScapiCode({code, request: async () => 'ok', journal});
    const started = performance.now();
    expect(await runScapiCode({code, request: async () => 'live', journal})).to.equal('ok');
    expect(performance.now() - started).to.be.lessThan(250);
  });

  it('lets in-flight requests finish and journals them before pausing', async () => {
    const approved = new Set<number>();
    const sent: string[] = [];
    const request = async (options: unknown) => {
      const {path} = options as {path: string};
      await new Promise((resolve) => setTimeout(resolve, 20));
      sent.push(path);
      return path;
    };
    const code = `async () => Promise.all([
      scapi.request({method: 'GET', path: '/slow'}),
      scapi.request({method: 'PUT', path: '/write'}),
    ])`;
    const journal: ScapiJournal = {entries: []};
    const paused = (await caught(() =>
      runScapiCode({code, request, journal, interceptors: [gate(approved)]}),
    )) as ScapiCodePausedError;
    expect(sent).to.deep.equal(['/slow']);
    expect(paused.journal.entries).to.have.length(1);
    approved.add(2);
    expect(await runScapiCode({code, request, journal, interceptors: [gate(approved)]})).to.deep.equal([
      '/slow',
      '/write',
    ]);
    expect(sent).to.deep.equal(['/slow', '/write']);
  });

  it('runs interceptors outermost first and lets them answer or refuse a call', async () => {
    const order: string[] = [];
    const result = await runScapiCode({
      code: "async () => [await scapi.request({path: '/a'}), await scapi.request({path: '/b'}).catch((e) => e.message)]",
      request: async () => 'sent',
      interceptors: [
        async (call, next) => {
          order.push(`outer ${call.id}`);
          return next();
        },
        async (call, next) => {
          order.push(`inner ${call.id}`);
          if ((call.args as {path: string}).path === '/b') throw new Error('refused by host');
          return next();
        },
      ],
    });
    expect(result).to.deep.equal(['sent', 'refused by host']);
    expect(order).to.deep.equal(['outer 1', 'inner 1', 'outer 2', 'inner 2']);
  });
});
