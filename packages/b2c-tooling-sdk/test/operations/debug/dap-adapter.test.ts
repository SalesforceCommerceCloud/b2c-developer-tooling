/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {PassThrough} from 'node:stream';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {B2CScriptDebugAdapter} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {DebugSessionConfig} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {DebugProtocol} from '@vscode/debugprotocol';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/s/-/dw/debugger/v2_0`;

const CARTRIDGE_SRC = '/workspace/cartridges/app_storefront';

const server = setupServer();

// ---------------------------------------------------------------------------
// Minimal DAP protocol framing over Node streams
// ---------------------------------------------------------------------------

type DAPMessage = DebugProtocol.ProtocolMessage;

/** Encode a DAP message into Content-Length framed bytes and write to stream. */
function sendDAP(stream: PassThrough, message: DAPMessage | DebugProtocol.Request): void {
  const json = JSON.stringify(message);
  const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
  stream.write(header + json);
}

/** Read DAP messages from a stream, calling handler for each complete message. */
function createDAPReader(stream: PassThrough, handler: (msg: DAPMessage) => void): void {
  let buffer = '';

  stream.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = buffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) break;

      const contentLength = Number.parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (buffer.length < bodyStart + contentLength) break;

      const body = buffer.slice(bodyStart, bodyStart + contentLength);
      buffer = buffer.slice(bodyStart + contentLength);

      handler(JSON.parse(body));
    }
  });
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface DAPClient {
  /** Send a DAP request and return a promise that resolves with the matching response. */
  send(command: string, args?: Record<string, unknown>): Promise<DebugProtocol.Response>;
  /** Wait for a DAP event by name. */
  waitForEvent(event: string, timeoutMs?: number): Promise<DebugProtocol.Event>;
  /** Wait for a DAP event matching a custom predicate. */
  waitForEventMatching(predicate: (msg: DAPMessage) => boolean, timeoutMs?: number): Promise<DebugProtocol.Event>;
  /** Tear down streams so mocha can exit cleanly. */
  dispose(): void;
}

function createDAPClient(adapter: B2CScriptDebugAdapter): DAPClient {
  const input = new PassThrough();
  const output = new PassThrough();
  const waiters: Array<{predicate: (msg: DAPMessage) => boolean; resolve: (msg: DAPMessage) => void}> = [];
  let seq = 1;

  createDAPReader(output, (msg) => {
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].predicate(msg)) {
        waiters[i].resolve(msg);
        waiters.splice(i, 1);
      }
    }
  });

  adapter.start(input, output);

  function waitFor(predicate: (msg: DAPMessage) => boolean, timeoutMs = 2000): Promise<DAPMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for DAP message')), timeoutMs);
      waiters.push({
        predicate,
        resolve: (msg) => {
          clearTimeout(timer);
          resolve(msg);
        },
      });
    });
  }

  return {
    dispose() {
      input.destroy();
      output.destroy();
    },
    send(command: string, args?: Record<string, unknown>): Promise<DebugProtocol.Response> {
      const seqNum = seq++;
      // Register waiter BEFORE writing — the adapter may process synchronously
      const promise = waitFor(
        (m) => m.type === 'response' && (m as DebugProtocol.Response).request_seq === seqNum,
      ) as Promise<DebugProtocol.Response>;
      sendDAP(input, {seq: seqNum, type: 'request', command, arguments: args});
      return promise;
    },
    waitForEvent(event: string, timeoutMs = 2000): Promise<DebugProtocol.Event> {
      return waitFor(
        (m) => m.type === 'event' && (m as DebugProtocol.Event).event === event,
        timeoutMs,
      ) as Promise<DebugProtocol.Event>;
    },
    waitForEventMatching(predicate: (msg: DAPMessage) => boolean, timeoutMs = 2000): Promise<DebugProtocol.Event> {
      return waitFor(predicate, timeoutMs) as Promise<DebugProtocol.Event>;
    },
  };
}

function makeConfig(overrides?: Partial<DebugSessionConfig>): DebugSessionConfig {
  return {
    hostname: TEST_HOST,
    username: 'admin',
    password: 'password',
    cartridgeRoots: [{name: 'app_storefront', src: CARTRIDGE_SRC, dest: 'app_storefront'}],
    pollInterval: 100_000,
    keepaliveInterval: 100_000,
    ...overrides,
  };
}

// Standard SDAPI mock handlers for a connected session
function sdapiHandlers() {
  return [
    http.delete(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
    http.post(`${BASE_URL}/client`, () => new HttpResponse(null, {status: 204})),
    http.get(`${BASE_URL}/threads`, () => HttpResponse.json({_v: '2.0', script_threads: []})),
    http.delete(`${BASE_URL}/breakpoints`, () => new HttpResponse(null, {status: 204})),
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('operations/debug/dap-adapter (integration)', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  describe('initialize', () => {
    it('responds with capabilities', async () => {
      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      const response = await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      expect(response.success).to.be.true;
      expect(response.body.supportsConditionalBreakpoints).to.be.true;
      expect(response.body.supportsEvaluateForHovers).to.be.true;
      expect(response.body.supportsConfigurationDoneRequest).to.be.true;

      client.dispose();
    });
  });

  describe('launch + disconnect lifecycle', () => {
    it('connects to SDAPI, sends InitializedEvent after launch', async () => {
      server.use(...sdapiHandlers());

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});

      // Register event waiters before launch — events fire during/after connect()
      const outputPromise = client.waitForEvent('output');
      const initializedPromise = client.waitForEvent('initialized');

      const launchResponse = await client.send('launch', {});
      expect(launchResponse.success).to.be.true;

      const outputEvent = await outputPromise;
      expect((outputEvent as DebugProtocol.OutputEvent).body.output).to.include('Connected');

      // InitializedEvent fires after launch (SDAPI client must exist before breakpoints)
      const initializedEvent = await initializedPromise;
      expect(initializedEvent.event).to.equal('initialized');

      const disconnectResponse = await client.send('disconnect', {});
      expect(disconnectResponse.success).to.be.true;

      client.dispose();
    });

    it('returns error when credentials are missing (launch-configured mode)', async () => {
      const adapter = new B2CScriptDebugAdapter(); // No pre-config
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});

      // Launch without hostname/username/password
      const response = await client.send('launch', {});
      expect(response.success).to.be.false;
      expect(response.message).to.include('required');

      client.dispose();
    });
  });

  describe('breakpoints', () => {
    it('sets breakpoints and returns verified results', async () => {
      server.use(
        ...sdapiHandlers(),
        http.post(`${BASE_URL}/breakpoints`, () =>
          HttpResponse.json({
            _v: '2.0',
            breakpoints: [
              {id: 1, line_number: 10, script_path: '/app_storefront/cartridge/controllers/Cart.js'},
              {id: 2, line_number: 25, script_path: '/app_storefront/cartridge/controllers/Cart.js'},
            ],
          }),
        ),
      );

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      const bpResponse = await client.send('setBreakpoints', {
        source: {path: `${CARTRIDGE_SRC}/cartridge/controllers/Cart.js`},
        breakpoints: [{line: 10}, {line: 25}],
      });
      expect(bpResponse.success).to.be.true;
      expect(bpResponse.body.breakpoints).to.have.length(2);
      expect(bpResponse.body.breakpoints[0].verified).to.be.true;
      expect(bpResponse.body.breakpoints[0].line).to.equal(10);
      expect(bpResponse.body.breakpoints[1].verified).to.be.true;
      expect(bpResponse.body.breakpoints[1].line).to.equal(25);

      await client.send('disconnect', {});
      client.dispose();
    });

    it('returns unverified breakpoints for unmapped source paths', async () => {
      server.use(...sdapiHandlers());

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      const bpResponse = await client.send('setBreakpoints', {
        source: {path: '/unknown/path/file.js'},
        breakpoints: [{line: 5}],
      });
      expect(bpResponse.success).to.be.true;
      expect(bpResponse.body.breakpoints[0].verified).to.be.false;

      await client.send('disconnect', {});
      client.dispose();
    });
  });

  describe('threads', () => {
    it('returns a default main thread when no threads exist', async () => {
      server.use(...sdapiHandlers());

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      const response = await client.send('threads');
      expect(response.success).to.be.true;
      expect(response.body.threads).to.have.length(1);
      expect(response.body.threads[0].name).to.equal('Main Thread');

      await client.send('disconnect', {});
      client.dispose();
    });
  });

  describe('halted thread workflow', () => {
    it('handles stackTrace, scopes, variables, and evaluate on a halted thread', async () => {
      server.use(
        ...sdapiHandlers(),
        http.get(`${BASE_URL}/threads/1`, () =>
          HttpResponse.json({
            _v: '2.0',
            id: 1,
            status: 'halted',
            call_stack: [
              {
                index: 0,
                location: {
                  function_name: 'doGet',
                  line_number: 42,
                  script_path: '/app_storefront/cartridge/controllers/Cart.js',
                },
              },
              {
                index: 1,
                location: {
                  function_name: 'execute',
                  line_number: 10,
                  script_path: '/app_storefront/cartridge/scripts/helper.js',
                },
              },
            ],
          }),
        ),
        http.get(`${BASE_URL}/threads/1/frames/0/variables`, () =>
          HttpResponse.json({
            _v: '2.0',
            count: 2,
            start: 0,
            total: 2,
            object_members: [
              {name: 'basket', parent: '', type: 'dw.order.Basket', value: '[Basket uuid=abc]', scope: 'local'},
              {name: 'count', parent: '', type: 'number', value: '3', scope: 'local'},
            ],
          }),
        ),
        http.get(`${BASE_URL}/threads/1/frames/0/members`, () =>
          HttpResponse.json({
            _v: '2.0',
            count: 1,
            start: 0,
            total: 1,
            object_members: [{name: 'UUID', parent: 'basket', type: 'string', value: 'abc-123'}],
          }),
        ),
        http.get(`${BASE_URL}/threads/1/frames/0/eval`, ({request}) => {
          const url = new URL(request.url);
          return HttpResponse.json({
            _v: '2.0',
            expression: url.searchParams.get('expr'),
            result: '42',
          });
        }),
      );

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      // --- stackTrace ---
      const stackResponse = await client.send('stackTrace', {threadId: 1});
      expect(stackResponse.success).to.be.true;
      expect(stackResponse.body.stackFrames).to.have.length(2);

      const topFrame = stackResponse.body.stackFrames[0];
      expect(topFrame.name).to.equal('doGet');
      expect(topFrame.line).to.equal(42);
      expect(topFrame.source?.path).to.include('app_storefront');

      // --- scopes ---
      const scopesResponse = await client.send('scopes', {frameId: topFrame.id});
      expect(scopesResponse.success).to.be.true;
      expect(scopesResponse.body.scopes).to.have.length(3);
      expect(scopesResponse.body.scopes[0].name).to.equal('Local');

      const localRef = scopesResponse.body.scopes[0].variablesReference;

      // --- variables ---
      const varsResponse = await client.send('variables', {variablesReference: localRef});
      expect(varsResponse.success).to.be.true;
      expect(varsResponse.body.variables).to.have.length(2);

      const basketVar = varsResponse.body.variables.find((v: {name: string}) => v.name === 'basket');
      expect(basketVar).to.exist;
      expect(basketVar.variablesReference).to.be.greaterThan(0); // expandable (non-primitive)

      const countVar = varsResponse.body.variables.find((v: {name: string}) => v.name === 'count');
      expect(countVar).to.exist;
      expect(countVar.variablesReference).to.equal(0); // primitive

      // --- expand object members ---
      const membersResponse = await client.send('variables', {variablesReference: basketVar.variablesReference});
      expect(membersResponse.success).to.be.true;
      expect(membersResponse.body.variables).to.have.length(1);
      expect(membersResponse.body.variables[0].name).to.equal('UUID');

      // --- evaluate ---
      const evalResponse = await client.send('evaluate', {expression: '1 + 1', frameId: topFrame.id});
      expect(evalResponse.success).to.be.true;
      expect(evalResponse.body.result).to.equal('42');

      await client.send('disconnect', {});
      client.dispose();
    });
  });

  describe('execution control', () => {
    it('sends continue, stepOver, stepInto, stepOut', async () => {
      const threadResponse = {_v: '2.0', id: 1, status: 'halted' as const, call_stack: []};

      server.use(
        ...sdapiHandlers(),
        http.post(`${BASE_URL}/threads/1/resume`, () => HttpResponse.json(threadResponse)),
        http.post(`${BASE_URL}/threads/1/over`, () => HttpResponse.json(threadResponse)),
        http.post(`${BASE_URL}/threads/1/into`, () => HttpResponse.json(threadResponse)),
        http.post(`${BASE_URL}/threads/1/out`, () => HttpResponse.json(threadResponse)),
      );

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      expect((await client.send('continue', {threadId: 1})).success).to.be.true;
      expect((await client.send('next', {threadId: 1})).success).to.be.true;
      expect((await client.send('stepIn', {threadId: 1})).success).to.be.true;
      expect((await client.send('stepOut', {threadId: 1})).success).to.be.true;

      await client.send('disconnect', {});
      client.dispose();
    });
  });

  describe('configurationDone', () => {
    it('responds successfully', async () => {
      server.use(...sdapiHandlers());

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      const response = await client.send('configurationDone');
      expect(response.success).to.be.true;

      await client.send('disconnect', {});
      client.dispose();
    });
  });

  describe('terminate', () => {
    it('disconnects session and sends TerminatedEvent', async () => {
      server.use(...sdapiHandlers());

      const adapter = new B2CScriptDebugAdapter(makeConfig());
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      const terminatedPromise = client.waitForEvent('terminated');
      const response = await client.send('terminate');
      expect(response.success).to.be.true;

      const event = await terminatedPromise;
      expect(event.event).to.equal('terminated');

      client.dispose();
    });
  });

  describe('logpoints', () => {
    it('emits output and auto-resumes instead of stopping', async () => {
      let resumeCalled = false;
      server.use(
        // Override handlers must come before sdapiHandlers() — MSW matches first handler
        http.get(`${BASE_URL}/threads`, () =>
          HttpResponse.json({
            _v: '2.0',
            script_threads: [
              {
                id: 1,
                status: 'halted',
                call_stack: [
                  {
                    index: 0,
                    location: {
                      function_name: 'doGet',
                      line_number: 10,
                      script_path: '/app_storefront/cartridge/controllers/Cart.js',
                    },
                  },
                ],
              },
            ],
          }),
        ),
        http.post(`${BASE_URL}/breakpoints`, () =>
          HttpResponse.json({
            _v: '2.0',
            breakpoints: [{id: 1, line_number: 10, script_path: '/app_storefront/cartridge/controllers/Cart.js'}],
          }),
        ),
        http.get(`${BASE_URL}/threads/1/frames/0/eval`, ({request}) => {
          const url = new URL(request.url);
          const expr = url.searchParams.get('expr');
          return HttpResponse.json({_v: '2.0', expression: expr, result: 'hello'});
        }),
        http.post(`${BASE_URL}/threads/1/resume`, () => {
          resumeCalled = true;
          return HttpResponse.json({_v: '2.0', id: 1, status: 'running', call_stack: []});
        }),
        ...sdapiHandlers(),
      );

      const adapter = new B2CScriptDebugAdapter(makeConfig({pollInterval: 50, keepaliveInterval: 100_000}));
      const client = createDAPClient(adapter);

      await client.send('initialize', {adapterID: 'b2c-script', pathFormat: 'path'});
      await client.send('launch', {});

      // Set a logpoint (breakpoint with logMessage)
      await client.send('setBreakpoints', {
        source: {path: `${CARTRIDGE_SRC}/cartridge/controllers/Cart.js`},
        breakpoints: [{line: 10, logMessage: 'value is {myVar}'}],
      });

      // Wait for the logpoint output (poller will detect halted thread)
      // Use a predicate to skip the "Connected" and "Set breakpoints" OutputEvents
      const outputEvent = await client.waitForEventMatching(
        (m) =>
          m.type === 'event' &&
          (m as DebugProtocol.Event).event === 'output' &&
          (m as DebugProtocol.OutputEvent).body.output === 'value is hello\n',
        3000,
      );
      expect((outputEvent as DebugProtocol.OutputEvent).body.output).to.equal('value is hello\n');

      // Wait a tick for the async resume to complete after the output event
      await new Promise((r) => setTimeout(r, 100));

      // Verify auto-resume was called (thread should not stop)
      expect(resumeCalled).to.be.true;

      await client.send('disconnect', {});
      client.dispose();
    });
  });
});
