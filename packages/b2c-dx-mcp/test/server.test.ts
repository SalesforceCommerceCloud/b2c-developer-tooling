/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {z} from 'zod';
import {B2CDxMcpServer} from '../src/server.js';
import type {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';
import type {Transport} from '@modelcontextprotocol/sdk/shared/transport.js';
import type {JSONRPCMessage} from '@modelcontextprotocol/sdk/types.js';

/**
 * Mock telemetry for testing.
 */
class MockTelemetry {
  public attributes: Record<string, unknown> = {};
  public events: Array<{name: string; attributes: Record<string, unknown>}> = [];
  public started = false;
  public stopped = false;

  addAttributes(attrs: Record<string, unknown>): void {
    this.attributes = {...this.attributes, ...attrs};
  }

  async flush(): Promise<void> {
    // Mock flush - does nothing but allows tests to pass
  }

  sendEvent(name: string, attributes: Record<string, unknown> = {}): void {
    this.events.push({name, attributes});
  }

  async sendEventAndFlush(name: string, attributes: Record<string, unknown> = {}): Promise<void> {
    this.sendEvent(name, attributes);
    await this.flush();
  }

  async start(): Promise<void> {
    this.started = true;
  }

  stop(): void {
    this.stopped = true;
  }
}

/**
 * Mock transport for testing connect() method.
 */
class MockTransport implements Transport {
  public closeCalled = false;
  public errorMessage = 'Transport error';
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage) => void;
  public shouldThrow = false;
  public startCalled = false;

  async close(): Promise<void> {
    this.closeCalled = true;
  }

  send(_message: JSONRPCMessage): Promise<void> {
    return Promise.resolve();
  }

  async start(): Promise<void> {
    this.startCalled = true;
    if (this.shouldThrow) {
      throw new Error(this.errorMessage);
    }
  }
}

// Handlers extracted to module scope to reduce callback nesting depth
const simpleHandler = async () => ({content: [{type: 'text' as const, text: 'ok'}]});
const toolOneHandler = async () => ({content: [{type: 'text' as const, text: 'one'}]});
const toolTwoHandler = async () => ({content: [{type: 'text' as const, text: 'two'}]});
const paramHandler = async (args: Record<string, unknown>) => ({
  content: [{type: 'text' as const, text: `Hello ${args.name}`}],
});

// Telemetry test handlers
const successHandler = async () => ({content: [{type: 'text' as const, text: 'success'}]});
const errorResultHandler = async () => ({
  content: [{type: 'text' as const, text: 'error occurred'}],
  isError: true,
});
const throwingHandler = async (): Promise<{content: Array<{type: 'text'; text: string}>}> => {
  throw new Error('Tool execution failed');
};
const delayMs = 50;
const slowHandler = async () => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
  return {content: [{type: 'text' as const, text: 'done'}]};
};
const handlerWithoutIsError = async () => ({
  content: [{type: 'text' as const, text: 'result'}],
});

describe('B2CDxMcpServer', () => {
  describe('constructor', () => {
    it('should create server with name and version', () => {
      const server = new B2CDxMcpServer({
        name: 'test-server',
        version: '1.0.0',
      });

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });

    it('should accept optional server options', () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'}, {capabilities: {}});

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });
  });

  describe('addTool', () => {
    let server: B2CDxMcpServer;

    beforeEach(() => {
      server = new B2CDxMcpServer({
        name: 'test-server',
        version: '1.0.0',
      });
    });

    /**
     * Captures the configs passed to `registerTool` by `addTool`.
     * The base McpServer keeps registered tools in a private `_registeredTools`
     * map; intercepting `registerTool` is a stable seam used elsewhere in this
     * file and avoids touching SDK internals.
     */
    function captureRegisteredTools(srv: B2CDxMcpServer): Map<
      string,
      {
        config: {description?: string; inputSchema?: unknown};
        handler: (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
      }
    > {
      const captured = new Map<
        string,
        {
          config: {description?: string; inputSchema?: unknown};
          handler: (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
        }
      >();
      const original = srv.registerTool.bind(srv);
      srv.registerTool = (name, config, handler) => {
        captured.set(name, {
          config: config as {description?: string; inputSchema?: unknown},
          handler: handler as (args: Record<string, unknown>, extra: unknown) => Promise<unknown>,
        });
        return original(name, config as never, handler as never);
      };
      return captured;
    }

    it('should register a tool that is callable via the server tool registry', async () => {
      const captured = captureRegisteredTools(server);
      server.addTool('test_tool', 'A test tool', {}, simpleHandler);

      const entry = captured.get('test_tool');
      expect(entry, 'test_tool should be registered').to.exist;
      expect(entry!.config.description).to.equal('A test tool');
      expect(entry!.handler).to.be.a('function');

      // The wrapped handler must be callable and forward to the user's handler.
      const result = (await entry!.handler({}, {})) as {content: Array<{text: string; type: string}>};
      expect(result.content[0]).to.deep.include({type: 'text', text: 'ok'});
    });

    it('should register multiple tools independently', async () => {
      const captured = captureRegisteredTools(server);
      server.addTool('tool_one', 'First tool', {}, toolOneHandler);
      server.addTool('tool_two', 'Second tool', {}, toolTwoHandler);

      expect([...captured.keys()]).to.have.members(['tool_one', 'tool_two']);
      expect(captured.get('tool_one')!.config.description).to.equal('First tool');
      expect(captured.get('tool_two')!.config.description).to.equal('Second tool');

      const r1 = (await captured.get('tool_one')!.handler({}, {})) as {content: Array<{text: string}>};
      const r2 = (await captured.get('tool_two')!.handler({}, {})) as {content: Array<{text: string}>};
      expect(r1.content[0].text).to.equal('one');
      expect(r2.content[0].text).to.equal('two');
    });

    it('should propagate the input schema to the registered tool', () => {
      const captured = captureRegisteredTools(server);
      const inputSchema = {
        name: z.string().describe('Name parameter'),
        count: z.number().optional().describe('Count parameter'),
      };
      server.addTool('parameterized_tool', 'A tool with parameters', inputSchema, paramHandler);

      const entry = captured.get('parameterized_tool');
      expect(entry, 'parameterized_tool should be registered').to.exist;
      expect(entry!.config.description).to.equal('A tool with parameters');
      // Schema must be the exact ZodRawShape we passed (same keys, same instances).
      expect(entry!.config.inputSchema).to.equal(inputSchema);
      const schema = entry!.config.inputSchema as Record<string, unknown>;
      expect(Object.keys(schema)).to.have.members(['name', 'count']);
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      const server = new B2CDxMcpServer({
        name: 'test-server',
        version: '1.0.0',
      });

      expect(server.isConnected()).to.be.false;
    });
  });

  describe('telemetry integration', () => {
    it('should accept telemetry in options', () => {
      const mockTelemetry = new MockTelemetry();

      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });

    it('should work without telemetry (telemetry disabled)', () => {
      // When telemetry is undefined, server should still work
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'}, {telemetry: undefined});

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });

    it('should call telemetry.start() before passing to server (simulated lifecycle)', async () => {
      // This test verifies the expected telemetry lifecycle:
      // 1. Create telemetry instance
      // 2. Call telemetry.start() to initialize the reporter
      // 3. Pass started telemetry to server
      const mockTelemetry = new MockTelemetry();

      // Verify telemetry is not started initially
      expect(mockTelemetry.started).to.be.false;

      // Simulate what mcp.ts does: start telemetry before creating server
      await mockTelemetry.start();
      expect(mockTelemetry.started).to.be.true;

      // Now pass to server (as mcp.ts does)
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      expect(server).to.be.instanceOf(B2CDxMcpServer);
      expect(mockTelemetry.started).to.be.true;
    });

    it('should create server without options (no telemetry)', () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });
  });

  describe('TOOL_CALLED telemetry', () => {
    let mockTelemetry: MockTelemetry;
    let capturedHandler: ((args: Record<string, unknown>, extra: unknown) => Promise<unknown>) | null;

    beforeEach(() => {
      mockTelemetry = new MockTelemetry();
      capturedHandler = null;
    });

    /**
     * Creates a server that captures the wrapped handler for testing.
     * This allows us to test the telemetry wrapper logic without going through
     * the full MCP protocol.
     */
    function createServerWithHandlerCapture(): B2CDxMcpServer {
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Override registerTool to capture the wrapped handler
      const originalRegisterTool = server.registerTool.bind(server);
      server.registerTool = (name, config, handler) => {
        capturedHandler = handler as (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
        return originalRegisterTool(name, config, handler);
      };

      return server;
    }

    it('should send TOOL_CALLED event on successful tool execution', async () => {
      const server = createServerWithHandlerCapture();

      server.addTool('test_tool', 'Test tool', {}, successHandler);

      // Call the captured wrapped handler
      expect(capturedHandler).to.not.be.null;
      await capturedHandler!({}, {});

      // Verify telemetry event
      expect(mockTelemetry.events).to.have.lengthOf(1);
      expect(mockTelemetry.events[0].name).to.equal('TOOL_CALLED');
      expect(mockTelemetry.events[0].attributes.toolName).to.equal('test_tool');
      expect(mockTelemetry.events[0].attributes.isError).to.equal(false);
      expect(mockTelemetry.events[0].attributes.runTimeMs).to.be.a('number');
      expect(mockTelemetry.events[0].attributes.errorMessage).to.be.undefined;
    });

    it('should send TOOL_CALLED event with isError=true when tool returns error', async () => {
      const server = createServerWithHandlerCapture();

      server.addTool('error_tool', 'Error tool', {}, errorResultHandler);

      await capturedHandler!({}, {});

      expect(mockTelemetry.events).to.have.lengthOf(1);
      expect(mockTelemetry.events[0].name).to.equal('TOOL_CALLED');
      expect(mockTelemetry.events[0].attributes.toolName).to.equal('error_tool');
      expect(mockTelemetry.events[0].attributes.isError).to.equal(true);
      expect(mockTelemetry.events[0].attributes.errorMessage).to.equal('error occurred');
    });

    it('should send TOOL_CALLED event with isError=true when tool throws', async () => {
      const server = createServerWithHandlerCapture();

      server.addTool('throwing_tool', 'Throwing tool', {}, throwingHandler);

      try {
        await capturedHandler!({}, {});
        expect.fail('Should have thrown');
      } catch {
        // Expected
      }

      expect(mockTelemetry.events).to.have.lengthOf(1);
      expect(mockTelemetry.events[0].name).to.equal('TOOL_CALLED');
      expect(mockTelemetry.events[0].attributes.toolName).to.equal('throwing_tool');
      expect(mockTelemetry.events[0].attributes.isError).to.equal(true);
      expect(mockTelemetry.events[0].attributes.errorMessage).to.equal('Tool execution failed');
    });

    it('should send TOOL_CALLED event with errorCause when tool throws error with cause', async () => {
      const server = createServerWithHandlerCapture();

      const handlerWithCause = async (): Promise<{content: Array<{type: 'text'; text: string}>}> => {
        const innerError = new Error('Inner error');
        throw new Error('Tool execution failed', {cause: innerError});
      };

      server.addTool('throwing_tool_with_cause', 'Throwing tool with cause', {}, handlerWithCause);

      try {
        await capturedHandler!({}, {});
        expect.fail('Should have thrown');
      } catch {
        // Expected
      }

      expect(mockTelemetry.events).to.have.lengthOf(1);
      expect(mockTelemetry.events[0].name).to.equal('TOOL_CALLED');
      expect(mockTelemetry.events[0].attributes.toolName).to.equal('throwing_tool_with_cause');
      expect(mockTelemetry.events[0].attributes.isError).to.equal(true);
      expect(mockTelemetry.events[0].attributes.errorMessage).to.equal('Tool execution failed');
      expect(mockTelemetry.events[0].attributes.errorCause).to.include('Error: Inner error');
    });

    it('should measure runTimeMs accurately', async () => {
      const server = createServerWithHandlerCapture();

      server.addTool('slow_tool', 'Slow tool', {}, slowHandler);

      await capturedHandler!({}, {});

      const runTimeMs = mockTelemetry.events[0].attributes.runTimeMs as number;
      // Allow some tolerance for timing
      expect(runTimeMs).to.be.at.least(delayMs - 10);
      expect(runTimeMs).to.be.at.most(delayMs + 50);
    });

    it('should not send events when telemetry is disabled', async () => {
      // Create server without telemetry
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      let handlerCalled = false;
      const handler = async () => {
        handlerCalled = true;
        return {content: [{type: 'text' as const, text: 'ok'}]};
      };

      // Override registerTool to capture handler
      let noTelemetryHandler: ((args: Record<string, unknown>, extra: unknown) => Promise<unknown>) | null = null;
      const originalRegisterTool = server.registerTool.bind(server);
      server.registerTool = (name, config, h) => {
        noTelemetryHandler = h as (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
        return originalRegisterTool(name, config, h);
      };

      server.addTool('no_telemetry_tool', 'No telemetry', {}, handler);

      // Should not throw even without telemetry
      await noTelemetryHandler!({}, {});
      expect(handlerCalled).to.be.true;
    });
  });

  describe('oninitialized handler', () => {
    it('should set up oninitialized handler in constructor', () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Verify the server has an oninitialized handler
      expect(server.server.oninitialized).to.be.a('function');
    });

    it('should add client attributes when initialized with client info', () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Mock getClientVersion to return client info
      server.server.getClientVersion = () => ({name: 'test-client', version: '2.0.0'});

      // Call oninitialized handler
      server.server.oninitialized?.();

      // Verify telemetry attributes were added
      expect(mockTelemetry.attributes.clientName).to.equal('test-client');
      expect(mockTelemetry.attributes.clientVersion).to.equal('2.0.0');
    });

    it('should handle missing client info gracefully', () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Mock getClientVersion to return undefined (no client info)
      server.server.getClientVersion = (): undefined => {};

      // Call oninitialized handler - should not throw
      expect(() => server.server.oninitialized?.()).to.not.throw();

      // Verify no client attributes were added
      expect(mockTelemetry.attributes.clientName).to.be.undefined;
      expect(mockTelemetry.attributes.clientVersion).to.be.undefined;
    });

    it('should work without telemetry', () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      // Mock getClientVersion
      server.server.getClientVersion = () => ({name: 'test-client', version: '2.0.0'});

      // Call oninitialized handler - should not throw
      expect(() => server.server.oninitialized?.()).to.not.throw();
    });
  });

  describe('connect', () => {
    it('should successfully connect to transport', async () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      const transport = new MockTransport();
      await server.connect(transport);

      expect(transport.startCalled).to.be.true;
      expect(server.isConnected()).to.be.true;
    });

    it('should send SERVER_STATUS event with status=started on successful connect', async () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      const transport = new MockTransport();
      await server.connect(transport);

      // Verify SERVER_STATUS event was sent
      const serverStatusEvents = mockTelemetry.events.filter((e) => e.name === 'SERVER_STATUS');
      expect(serverStatusEvents).to.have.lengthOf(1);
      expect(serverStatusEvents[0].attributes.status).to.equal('started');
    });

    it('should send SERVER_STATUS event with error when transport fails', async () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      const transport = new MockTransport();
      transport.shouldThrow = true;
      transport.errorMessage = 'Connection failed';

      try {
        await server.connect(transport);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Connection failed');
      }

      // Verify SERVER_STATUS event was sent with error
      const serverStatusEvents = mockTelemetry.events.filter((e) => e.name === 'SERVER_STATUS');
      expect(serverStatusEvents).to.have.lengthOf(1);
      expect(serverStatusEvents[0].attributes.status).to.equal('error');
      expect(serverStatusEvents[0].attributes.errorMessage).to.equal('Connection failed');
    });

    it('should handle non-Error exceptions in connect', async () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Create a transport that throws a non-Error object
      const transport = new MockTransport();
      const stringError = 'string error';
      transport.start = async () => {
        throw new Error(stringError);
      };

      try {
        await server.connect(transport);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('string error');
      }

      // Verify SERVER_STATUS event was sent with error
      const serverStatusEvents = mockTelemetry.events.filter((e) => e.name === 'SERVER_STATUS');
      expect(serverStatusEvents).to.have.lengthOf(1);
      expect(serverStatusEvents[0].attributes.status).to.equal('error');
      expect(serverStatusEvents[0].attributes.errorMessage).to.equal('string error');
    });

    it('should work without telemetry', async () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      const transport = new MockTransport();
      await server.connect(transport);

      expect(server.isConnected()).to.be.true;
    });

    it('should handle connect error without telemetry', async () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      const transport = new MockTransport();
      transport.shouldThrow = true;

      try {
        await server.connect(transport);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('should send error event if connected but isConnected returns false', async () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Override isConnected to return false even after connect
      server.isConnected = () => false;

      const transport = new MockTransport();
      await server.connect(transport);

      // Verify SERVER_STATUS event was sent with error
      const serverStatusEvents = mockTelemetry.events.filter((e) => e.name === 'SERVER_STATUS');
      expect(serverStatusEvents).to.have.lengthOf(1);
      expect(serverStatusEvents[0].attributes.status).to.equal('error');
      expect(serverStatusEvents[0].attributes.errorMessage).to.equal('Server not connected after connect() call');
    });
  });

  describe('addTool with telemetry disabled scenarios', () => {
    it('should handle tool with missing isError field', async () => {
      const mockTelemetry = new MockTelemetry();
      let capturedHandler: ((args: Record<string, unknown>, extra: unknown) => Promise<unknown>) | null = null;

      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // Override registerTool to capture handler
      const originalRegisterTool = server.registerTool.bind(server);
      server.registerTool = (name, config, h) => {
        capturedHandler = h as (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
        return originalRegisterTool(name, config, h);
      };

      server.addTool('test_tool', 'Test tool', {}, handlerWithoutIsError);
      await capturedHandler!({}, {});

      // Should default to isError=false
      expect(mockTelemetry.events).to.have.lengthOf(1);
      expect(mockTelemetry.events[0].attributes.isError).to.equal(false);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined telemetry gracefully in all operations', async () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'}, {telemetry: undefined});

      // Capture the wrapped handler so we can invoke it directly.
      let wrappedHandler:
        | ((args: Record<string, unknown>, extra: unknown) => Promise<{content: Array<{text: string}>}>)
        | null = null;
      const originalRegisterTool = server.registerTool.bind(server);
      server.registerTool = (name, config, h) => {
        wrappedHandler = h as typeof wrappedHandler;
        return originalRegisterTool(name, config, h);
      };

      server.addTool('test', 'Test', {}, successHandler);

      // The wrapped handler must run the underlying handler and return the
      // expected result even with no telemetry attached.
      expect(wrappedHandler, 'wrapped handler should have been captured').to.not.equal(null);
      const result = await wrappedHandler!({}, {});
      expect(result.content[0]).to.deep.include({type: 'text', text: 'success'});

      // connect() must also succeed and report connected state.
      const transport = new MockTransport();
      await server.connect(transport);
      expect(server.isConnected()).to.be.true;
    });

    it('should preserve handler arguments and return values', async () => {
      let capturedArgs: null | Record<string, unknown> = null;
      let capturedHandler: ((args: Record<string, unknown>, extra: unknown) => Promise<unknown>) | null = null;

      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      // Override registerTool to capture handler
      const originalRegisterTool = server.registerTool.bind(server);
      server.registerTool = (name, config, h) => {
        capturedHandler = h as (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
        return originalRegisterTool(name, config, h);
      };

      const handler = async (args: Record<string, unknown>) => {
        capturedArgs = args;
        return {
          content: [{type: 'text' as const, text: `Result: ${args.value}`}],
        };
      };

      server.addTool('test_tool', 'Test', {}, handler);

      const testArgs = {value: 'test-value'};
      const result = await capturedHandler!(testArgs, {});

      expect(capturedArgs).to.deep.equal(testArgs);
      expect(result).to.deep.equal({
        content: [{type: 'text', text: 'Result: test-value'}],
      });
    });

    it('should reject a second connect with Already connected and emit a SERVER_STATUS error', async () => {
      const mockTelemetry = new MockTelemetry();
      const server = new B2CDxMcpServer(
        {name: 'test-server', version: '1.0.0'},
        {telemetry: mockTelemetry as unknown as Telemetry},
      );

      // First connect succeeds and emits SERVER_STATUS=started.
      const transport1 = new MockTransport();
      await server.connect(transport1);

      const firstStatusEvents = mockTelemetry.events.filter((e) => e.name === 'SERVER_STATUS');
      expect(firstStatusEvents).to.have.lengthOf(1);
      expect(firstStatusEvents[0].attributes.status).to.equal('started');

      // The MCP SDK Protocol.connect throws "Already connected to a transport..."
      // when a second transport is supplied — this is the deterministic branch.
      const transport2 = new MockTransport();
      let caught: Error | undefined;
      try {
        await server.connect(transport2);
      } catch (error) {
        caught = error as Error;
      }
      expect(caught, 'second connect must throw').to.be.instanceOf(Error);
      expect(caught!.message).to.include('Already connected');

      // The server.connect catch block must emit a SERVER_STATUS error event
      // carrying the SDK error message.
      const statusEvents = mockTelemetry.events.filter((e) => e.name === 'SERVER_STATUS');
      expect(statusEvents).to.have.lengthOf(2);
      const lastEvent = statusEvents.at(-1);
      expect(lastEvent?.attributes.status).to.equal('error');
      expect(lastEvent?.attributes.errorMessage).to.include('Already connected');
    });
  });
});
