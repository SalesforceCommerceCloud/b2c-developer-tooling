/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {z} from 'zod';
import {B2CDxMcpServer} from '../src/server.js';
import type {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';

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

  sendEvent(name: string, attributes: Record<string, unknown> = {}): void {
    this.events.push({name, attributes});
  }

  async start(): Promise<void> {
    this.started = true;
  }

  stop(): void {
    this.stopped = true;
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

    it('should register a tool without throwing', () => {
      expect(() => {
        server.addTool('test_tool', 'A test tool', {}, simpleHandler);
      }).to.not.throw();
    });

    it('should register multiple tools', () => {
      expect(() => {
        server.addTool('tool_one', 'First tool', {}, toolOneHandler);
        server.addTool('tool_two', 'Second tool', {}, toolTwoHandler);
      }).to.not.throw();
    });

    it('should accept tools with input schema', () => {
      // Use Zod schema (ZodRawShape format)
      const inputSchema = {
        name: z.string().describe('Name parameter'),
        count: z.number().optional().describe('Count parameter'),
      };
      expect(() => {
        server.addTool('parameterized_tool', 'A tool with parameters', inputSchema, paramHandler);
      }).to.not.throw();
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
    });

    it('should send TOOL_CALLED event with isError=true when tool returns error', async () => {
      const server = createServerWithHandlerCapture();

      server.addTool('error_tool', 'Error tool', {}, errorResultHandler);

      await capturedHandler!({}, {});

      expect(mockTelemetry.events).to.have.lengthOf(1);
      expect(mockTelemetry.events[0].name).to.equal('TOOL_CALLED');
      expect(mockTelemetry.events[0].attributes.toolName).to.equal('error_tool');
      expect(mockTelemetry.events[0].attributes.isError).to.equal(true);
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
});
