/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import protobuf from 'protobufjs';
import {fileURLToPath} from 'node:url';
import {CipClient, type CipFrame} from '../../src/clients/cip.js';

function frame(offset: number, values: number[], done: boolean): CipFrame {
  return {offset, done, columns: [{label: 'n'}], rows: values.map((n) => ({n}))};
}

describe('bounded CIP queries', () => {
  let sandbox: sinon.SinonSandbox;
  let client: CipClient;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    client = new CipClient(
      {instance: 'abcd_prd'},
      {
        fetch: async () => {
          throw new Error('Unexpected network');
        },
      },
    );
  });
  afterEach(() => sandbox.restore());

  function stubQuery() {
    sandbox.stub(client, 'openConnection').resolves();
    const create = sandbox.stub(client, 'createStatement').resolves(1);
    const execute = sandbox.stub(client, 'execute');
    const fetch = sandbox.stub(client, 'fetch');
    const closeStatement = sandbox.stub(client, 'closeStatement').resolves();
    const closeConnection = sandbox.stub(client, 'closeConnection').resolves();
    return {create, execute, fetch, closeStatement, closeConnection};
  }

  it('fetches only enough rows to detect truncation, then closes resources', async () => {
    const s = stubQuery();
    s.execute.resolves({statementId: 2, frame: frame(0, [1, 2], false)});
    s.fetch.resolves({frame: frame(2, [3, 4], false)});
    const result = await client.query('SELECT n FROM test', {maxRows: 3, fetchSize: 2});
    expect(result).to.deep.equal({columns: ['n'], rows: [{n: 1}, {n: 2}, {n: 3}], rowCount: 3, truncated: true});
    expect(s.execute.firstCall.args).to.deep.equal([1, 'SELECT n FROM test', 2, 4]);
    expect(s.fetch.callCount).to.equal(1);
    expect(s.closeStatement.firstCall.args[0]).to.equal(2);
    expect(s.closeConnection.calledOnce).to.equal(true);
  });

  it('distinguishes an exact complete result from truncation', async () => {
    const s = stubQuery();
    s.execute.resolves({statementId: 1, frame: frame(0, [1, 2], true)});
    expect(await client.query('SELECT n FROM test', {maxRows: 2})).to.include({rowCount: 2, truncated: false});
    expect(s.fetch.called).to.equal(false);
  });

  it('closes the connection if statement creation fails and preserves the original error', async () => {
    const s = stubQuery();
    s.create.rejects(new Error('create failed'));
    s.closeConnection.rejects(new Error('cleanup failed'));
    let error;
    try {
      await client.query('SELECT 1');
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('create failed');
    expect(s.closeConnection.calledOnce).to.equal(true);
    expect(s.closeStatement.called).to.equal(false);
  });

  it('does not close a caller-owned connection when opening the query connection fails', async () => {
    sandbox.stub(client, 'openConnection').rejects(new Error('CIP connection is already open'));
    const close = sandbox.stub(client, 'closeConnection').resolves();
    let error;
    try {
      await client.query('SELECT 1');
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('already open');
    expect(close.called).to.equal(false);
  });

  it('stops non-advancing frames instead of looping', async () => {
    const s = stubQuery();
    s.execute.resolves({statementId: 1, frame: frame(0, [], false)});
    let error;
    try {
      await client.query('SELECT 1', {maxRows: 10});
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('cannot advance');
    expect(s.fetch.called).to.equal(false);
    expect(s.closeConnection.calledOnce).to.equal(true);
  });

  it('preserves full-query behavior when no bound is specified', async () => {
    const s = stubQuery();
    s.execute.resolves({statementId: 1, frame: frame(0, [1], false)});
    s.fetch.resolves({frame: frame(1, [2], true)});
    expect(await client.query('SELECT n FROM test')).to.deep.equal({
      columns: ['n'],
      rows: [{n: 1}, {n: 2}],
      rowCount: 2,
    });
  });

  it('rejects incomplete or repeated frames instead of returning misleading results', async () => {
    const s = stubQuery();
    s.execute.resolves({statementId: 1, frame: frame(0, [1], false)});
    s.fetch.onFirstCall().resolves({});
    s.fetch.onSecondCall().resolves({frame: frame(0, [1], false)});
    for (let attempt = 0; attempt < 2; attempt++) {
      let error;
      try {
        // Each call tests a different invalid continuation supplied by the server.

        await client.query('SELECT n FROM test', {maxRows: 10});
      } catch (caught) {
        error = caught;
      }
      expect(String(error)).to.include('query is incomplete');
    }
    expect(s.closeConnection.callCount).to.equal(2);
  });

  it('bounds accumulation when a server ignores the requested frame size', async () => {
    const s = stubQuery();
    s.execute.resolves({
      statementId: 1,
      frame: frame(
        0,
        Array.from({length: 150_000}, (_, i) => i),
        true,
      ),
    });
    const result = await client.query('SELECT n FROM test', {maxRows: 2});
    expect(result).to.include({rowCount: 2, truncated: true});
    expect(result.rows).to.deep.equal([{n: 0}, {n: 1}]);
    expect(s.fetch.called).to.equal(false);
  });
});

describe('CIP transport cancellation and response limits', () => {
  let root: protobuf.Root;
  before(async () => {
    root = await protobuf.load(
      ['common', 'requests', 'responses'].map((name) =>
        fileURLToPath(new URL(`../../data/cip-proto/${name}.proto`, import.meta.url)),
      ),
    );
  });

  function response(name: string, payload: object = {}) {
    const type = root.lookupType(name);
    const wire = root.lookupType('WireMessage');
    const bytes = wire
      .encode(
        wire.create({
          name: `org.apache.calcite.avatica.proto.Responses$${name}`,
          wrappedMessage: type.encode(type.create(payload)).finish(),
        }),
      )
      .finish();
    return new Response(new Uint8Array(bytes));
  }

  it('cancels an in-flight execution but still attempts bounded cleanup', async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    const client = new CipClient(
      {instance: 'abcd_prd', signal: controller.signal},
      {
        fetch: async (_url, init) => {
          const wire = root.lookupType('WireMessage').decode(new Uint8Array(init!.body as ArrayBuffer)) as unknown as {
            name: string;
          };
          const name = wire.name.split('$').pop()!;
          calls.push(name);
          expect(init!.redirect).to.equal('error');
          if (name === 'PrepareAndExecuteRequest') {
            return new Promise((_resolve, reject) => {
              init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), {once: true});
              controller.abort(new Error('cancelled query'));
            });
          }
          if (name.startsWith('Close')) expect(init!.signal!.aborted).to.equal(false);
          return response(
            name.replace('Request', 'Response'),
            name === 'CreateStatementRequest' ? {statementId: 1} : {},
          );
        },
      },
    );
    let error;
    try {
      await client.query('SELECT 1', {maxRows: 10});
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('cancelled query');
    expect(calls).to.deep.equal([
      'OpenConnectionRequest',
      'CreateStatementRequest',
      'PrepareAndExecuteRequest',
      'CloseStatementRequest',
      'CloseConnectionRequest',
    ]);
  });

  it('bounds a response even without Content-Length', async () => {
    const client = new CipClient(
      {instance: 'abcd_prd', maxResponseBytes: 32},
      {fetch: async () => new Response(new Uint8Array(33))},
    );
    let error;
    try {
      await client.openConnection();
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('byte limit');
  });
});
