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

    it('should create server without options (no telemetry)', () => {
      const server = new B2CDxMcpServer({name: 'test-server', version: '1.0.0'});

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });
  });
});
