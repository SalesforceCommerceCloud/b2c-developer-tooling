/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Services} from '../../../src/services.js';
import {ServerContext} from '../../../src/server-context.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import {createDebugListSessionsTool} from '../../../src/tools/diagnostics/debug-list-sessions.js';
import {createDebugEndSessionTool} from '../../../src/tools/diagnostics/debug-end-session.js';
import {createDebugContinueTool} from '../../../src/tools/diagnostics/debug-continue.js';
import {createDebugGetStackTool} from '../../../src/tools/diagnostics/debug-get-stack.js';
import {createDebugEvaluateTool} from '../../../src/tools/diagnostics/debug-evaluate.js';
import type {DebugSessionManager, SourceMapper} from '@salesforce/b2c-tooling-sdk/operations/debug';
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

function createMockManager(overrides?: Record<string, unknown>): DebugSessionManager {
  return {
    client: {
      getThread: sinon.stub().resolves({
        id: 1,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'show', line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'},
          },
        ],
      }),
      getVariables: sinon.stub().resolves({object_members: [], count: 0, start: 0, total: 0, _v: '2.0'}),
      getMembers: sinon.stub().resolves({object_members: [], count: 0, start: 0, total: 0, _v: '2.0'}),
      evaluate: sinon.stub().resolves({_v: '2.0', expression: 'x', result: '42'}),
      deleteBreakpoints: sinon.stub().resolves(),
    },
    connect: sinon.stub().resolves(),
    disconnect: sinon.stub().resolves(),
    setBreakpoints: sinon.stub().resolves([]),
    resume: sinon.stub().resolves(),
    stepOver: sinon.stub().resolves(),
    stepInto: sinon.stub().resolves(),
    stepOut: sinon.stub().resolves(),
    getKnownThreads: sinon.stub().returns([]),
    ...overrides,
  } as unknown as DebugSessionManager;
}

function createMockSourceMapper(): SourceMapper {
  return {
    toServerPath: sinon.stub().returns(undefined),
    toLocalPath: sinon.stub().callsFake((p: string) => (p.startsWith('/app_test') ? `/local${p}` : undefined)),
  };
}

function createServices(): Services {
  return new Services({
    resolvedConfig: createMockResolvedConfig({hostname: 'test.example.com', username: 'user', password: 'pass'}),
  });
}

describe('tools/diagnostics', () => {
  let serverContext: ServerContext;
  let loadServices: () => Services;

  beforeEach(() => {
    serverContext = new ServerContext();
    loadServices = () => createServices();
  });

  afterEach(async () => {
    await serverContext.destroyAll();
  });

  describe('debug_list_sessions', () => {
    it('should have correct metadata', () => {
      const tool = createDebugListSessionsTool(loadServices, serverContext);
      expect(tool.name).to.equal('debug_list_sessions');
      expect(tool.toolsets).to.include('CARTRIDGES');
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
      expect(tool.toolsets).to.include('SCAPI');
    });

    it('should return empty sessions array when none exist', async () => {
      const tool = createDebugListSessionsTool(loadServices, serverContext);
      const result = await tool.handler({});
      const json = getResultJson<{sessions: unknown[]}>(result);
      expect(json.sessions).to.deep.equal([]);
    });

    it('should list sessions with breakpoints and halted threads', async () => {
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([{id: 5, status: 'halted', call_stack: []}]),
      });
      const sourceMapper = createMockSourceMapper();
      const entry = serverContext.debugSessions.registerSession('host.example.com', 'c1', manager, sourceMapper, []);
      entry.breakpoints = [{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}];

      const tool = createDebugListSessionsTool(loadServices, serverContext);
      const result = await tool.handler({});
      const json = getResultJson<{
        sessions: Array<{session_id: string; halted_threads: number[]; breakpoints: unknown[]}>;
      }>(result);

      expect(json.sessions).to.have.lengthOf(1);
      expect(json.sessions[0].session_id).to.equal(entry.sessionId);
      expect(json.sessions[0].halted_threads).to.deep.equal([5]);
      expect(json.sessions[0].breakpoints).to.have.lengthOf(1);
    });
  });

  describe('debug_end_session', () => {
    it('should disconnect and remove the session', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugEndSessionTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{status: string}>(result);
      expect(json.status).to.equal('disconnected');
      expect(serverContext.debugSessions.getSession(entry.sessionId)).to.be.undefined;
      expect((manager.disconnect as sinon.SinonStub).calledOnce).to.be.true;
    });

    it('should clear breakpoints when requested', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugEndSessionTool(loadServices, serverContext);
      await tool.handler({session_id: entry.sessionId, clear_breakpoints: true});

      expect((manager.client.deleteBreakpoints as sinon.SinonStub).calledOnce).to.be.true;
    });

    it('should return error for unknown session', async () => {
      const tool = createDebugEndSessionTool(loadServices, serverContext);
      const result = await tool.handler({session_id: 'nonexistent'});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No debug session found');
    });
  });

  describe('debug_continue', () => {
    it('should resume the specified thread', async () => {
      const manager = createMockManager();
      serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);
      const entry = serverContext.debugSessions.listSessions()[0];

      const tool = createDebugContinueTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 5});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{thread_id: number; status: string}>(result);
      expect(json.thread_id).to.equal(5);
      expect(json.status).to.equal('resumed');
      expect((manager.resume as sinon.SinonStub).calledWith(5)).to.be.true;
    });
  });

  describe('debug_get_stack', () => {
    it('should return mapped stack frames', async () => {
      const manager = createMockManager();
      const sourceMapper = createMockSourceMapper();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, sourceMapper, []);

      const tool = createDebugGetStackTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{frames: Array<{function_name: string; file: string; line: number}>}>(result);
      expect(json.frames).to.have.lengthOf(1);
      expect(json.frames[0].function_name).to.equal('show');
      expect(json.frames[0].line).to.equal(42);
      expect(json.frames[0].file).to.equal('/local/app_test/cartridge/controllers/Cart.js');
    });
  });

  describe('debug_evaluate', () => {
    it('should evaluate expression and return result', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugEvaluateTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1, expression: 'x'});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{expression: string; result: string}>(result);
      expect(json.expression).to.equal('x');
      expect(json.result).to.equal('42');
    });

    it('should use frame_index 0 by default', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugEvaluateTool(loadServices, serverContext);
      await tool.handler({session_id: entry.sessionId, thread_id: 1, expression: 'x'});

      expect((manager.client.evaluate as sinon.SinonStub).calledWith(1, 0, 'x')).to.be.true;
    });

    it('should use specified frame_index', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugEvaluateTool(loadServices, serverContext);
      await tool.handler({session_id: entry.sessionId, thread_id: 1, frame_index: 2, expression: 'y'});

      expect((manager.client.evaluate as sinon.SinonStub).calledWith(1, 2, 'y')).to.be.true;
    });
  });
});
