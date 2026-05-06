/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
import {createDebugGetVariablesTool} from '../../../src/tools/diagnostics/debug-get-variables.js';
import {createDebugSetBreakpointsTool} from '../../../src/tools/diagnostics/debug-set-breakpoints.js';
import {createDebugStepTools} from '../../../src/tools/diagnostics/debug-step.js';
import {createDebugWaitForStopTool} from '../../../src/tools/diagnostics/debug-wait-for-stop.js';
import {createDebugCaptureAtBreakpointTool} from '../../../src/tools/diagnostics/debug-capture-at-breakpoint.js';
import {createDebugStartSessionTool} from '../../../src/tools/diagnostics/debug-start-session.js';
import {DebugSessionManager} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {SourceMapper} from '@salesforce/b2c-tooling-sdk/operations/debug';
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

type MockDebugSessionManager = InstanceType<typeof DebugSessionManager>;

function createMockManager(overrides?: Record<string, unknown>): MockDebugSessionManager {
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
      getVariables: sinon.stub().resolves({
        object_members: [
          {name: 'x', type: 'number', value: '42', scope: 'local'},
          {name: 'obj', type: 'Object', value: '[object Object]', scope: 'local'},
          {name: 'g', type: 'string', value: 'hi', scope: 'global'},
        ],
        count: 3,
        start: 0,
        total: 3,
        _v: '2.0',
      }),
      getMembers: sinon.stub().resolves({
        object_members: [{name: 'foo', type: 'string', value: 'bar'}],
        count: 1,
        start: 0,
        total: 1,
        _v: '2.0',
      }),
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
  } as unknown as MockDebugSessionManager;
}

function createMockSourceMapper(): SourceMapper {
  return {
    toServerPath: sinon.stub().callsFake((p: string) => {
      if (p.includes('/app_test/')) {
        const idx = p.indexOf('/app_test/');
        return p.slice(idx);
      }
      return undefined;
    }),
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

    it('should error when server context is missing', async () => {
      const tool = createDebugListSessionsTool(loadServices, undefined);
      const result = await tool.handler({});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Debug session registry not available');
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

    it('should handle deleteBreakpoints failure silently', async () => {
      const manager = createMockManager();
      (manager.client.deleteBreakpoints as sinon.SinonStub).rejects(new Error('SDAPI down'));
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugEndSessionTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, clear_breakpoints: true});

      expect(result.isError).to.be.undefined;
    });

    it('should return error for unknown session', async () => {
      const tool = createDebugEndSessionTool(loadServices, serverContext);
      const result = await tool.handler({session_id: 'nonexistent'});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No debug session found');
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugEndSessionTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'anything'});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_continue', () => {
    it('should resume the specified thread', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugContinueTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 5});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{thread_id: number; status: string}>(result);
      expect(json.thread_id).to.equal(5);
      expect(json.status).to.equal('resumed');
      expect((manager.resume as sinon.SinonStub).calledWith(5)).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugContinueTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x', thread_id: 1});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_get_stack', () => {
    it('should return mapped stack frames', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugGetStackTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{frames: Array<{function_name: string; file: string; line: number}>}>(result);
      expect(json.frames).to.have.lengthOf(1);
      expect(json.frames[0].function_name).to.equal('show');
      expect(json.frames[0].line).to.equal(42);
      expect(json.frames[0].file).to.equal('/local/app_test/cartridge/controllers/Cart.js');
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugGetStackTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x', thread_id: 1});
      expect(result.isError).to.be.true;
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

    it('should error when server context is missing', async () => {
      const tool = createDebugEvaluateTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x', thread_id: 1, expression: 'y'});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_get_variables', () => {
    it('should return variables with has_children flag based on type', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugGetVariablesTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{
        variables: Array<{name: string; type: string; has_children: boolean; scope?: string}>;
      }>(result);
      expect(json.variables).to.have.lengthOf(3);
      const x = json.variables.find((v) => v.name === 'x')!;
      expect(x.has_children).to.be.false;
      const obj = json.variables.find((v) => v.name === 'obj')!;
      expect(obj.has_children).to.be.true;
    });

    it('should filter by scope', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugGetVariablesTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1, scope: 'global'});

      const json = getResultJson<{variables: Array<{name: string}>}>(result);
      expect(json.variables).to.have.lengthOf(1);
      expect(json.variables[0].name).to.equal('g');
    });

    it('should use getMembers when object_path is provided', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugGetVariablesTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1, object_path: 'obj'});

      expect((manager.client.getMembers as sinon.SinonStub).calledOnce).to.be.true;
      const json = getResultJson<{variables: Array<{name: string}>}>(result);
      expect(json.variables).to.have.lengthOf(1);
      expect(json.variables[0].name).to.equal('foo');
    });

    it('should truncate long values', async () => {
      const longValue = 'x'.repeat(300);
      const manager = createMockManager({
        client: {
          getVariables: sinon.stub().resolves({
            object_members: [{name: 'big', type: 'string', value: longValue, scope: 'local'}],
            count: 1,
            start: 0,
            total: 1,
            _v: '2.0',
          }),
          getMembers: sinon.stub(),
          evaluate: sinon.stub(),
          getThread: sinon.stub(),
          deleteBreakpoints: sinon.stub(),
        },
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugGetVariablesTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1});

      const json = getResultJson<{variables: Array<{value: string}>}>(result);
      expect(json.variables[0].value).to.have.lengthOf(203); // 200 + '...'
      expect(json.variables[0].value.endsWith('...')).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugGetVariablesTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x', thread_id: 1});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_set_breakpoints', () => {
    it('should set breakpoints and map paths', async () => {
      const manager = createMockManager({
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugSetBreakpointsTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        breakpoints: [{file: '/app_test/cartridge/controllers/Cart.js', line: 42}],
      });

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{breakpoints: Array<{id: number; verified: boolean; file: string}>}>(result);
      expect(json.breakpoints).to.have.lengthOf(1);
      expect(json.breakpoints[0].verified).to.be.true;
    });

    it('should warn when path cannot be round-trip mapped', async () => {
      const manager = createMockManager({
        setBreakpoints: sinon.stub().resolves([{id: 1, line_number: 10, script_path: '/unknown/cartridge/foo.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugSetBreakpointsTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        breakpoints: [{file: '/unknown/cartridge/foo.js', line: 10}],
      });

      const json = getResultJson<{breakpoints: Array<{verified: boolean}>; warnings?: string[]}>(result);
      expect(json.breakpoints[0].verified).to.be.false;
      expect(json.warnings).to.exist;
      expect(json.warnings![0]).to.include('could not be mapped back to a local file');
    });

    it('should support breakpoint conditions', async () => {
      const setBreakpointsStub = sinon
        .stub()
        .resolves([
          {id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js', condition: 'x > 5'},
        ]);
      const manager = createMockManager({setBreakpoints: setBreakpointsStub});
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugSetBreakpointsTool(loadServices, serverContext);
      await tool.handler({
        session_id: entry.sessionId,
        breakpoints: [{file: '/app_test/cartridge/controllers/Cart.js', line: 42, condition: 'x > 5'}],
      });

      const [bpInputs] = setBreakpointsStub.firstCall.args;
      expect(bpInputs[0].condition).to.equal('x > 5');
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugSetBreakpointsTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x', breakpoints: [{file: '/a/b.js', line: 1}]});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_step_* tools', () => {
    it('should create three step tools', () => {
      const tools = createDebugStepTools(loadServices, serverContext);
      expect(tools).to.have.lengthOf(3);
      expect(tools.map((t) => t.name)).to.deep.equal(['debug_step_over', 'debug_step_into', 'debug_step_out']);
    });

    it('step_over should call manager.stepOver', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);
      const [stepOver] = createDebugStepTools(loadServices, serverContext);

      const result = await stepOver.handler({session_id: entry.sessionId, thread_id: 3});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{action: string}>(result);
      expect(json.action).to.equal('step_over');
      expect((manager.stepOver as sinon.SinonStub).calledWith(3)).to.be.true;
    });

    it('step_into should call manager.stepInto', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);
      const [, stepInto] = createDebugStepTools(loadServices, serverContext);

      await stepInto.handler({session_id: entry.sessionId, thread_id: 3});

      expect((manager.stepInto as sinon.SinonStub).calledWith(3)).to.be.true;
    });

    it('step_out should call manager.stepOut', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);
      const stepOut = createDebugStepTools(loadServices, serverContext)[2];

      await stepOut.handler({session_id: entry.sessionId, thread_id: 3});

      expect((manager.stepOut as sinon.SinonStub).calledWith(3)).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const [stepOver] = createDebugStepTools(loadServices, undefined);
      const result = await stepOver.handler({session_id: 'x', thread_id: 1});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_wait_for_stop', () => {
    it('should return immediately if a thread is already halted', async () => {
      const haltedThread = {
        id: 5,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'show', line_number: 10, script_path: '/app_test/cartridge/controllers/Cart.js'},
          },
        ],
      };
      const manager = createMockManager({getKnownThreads: sinon.stub().returns([haltedThread])});
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugWaitForStopTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{halted: boolean; thread_id: number; location: {line: number}}>(result);
      expect(json.halted).to.be.true;
      expect(json.thread_id).to.equal(5);
      expect(json.location.line).to.equal(10);
    });

    it('should handle halted thread with no call stack', async () => {
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([{id: 5, status: 'halted', call_stack: []}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugWaitForStopTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId});

      const json = getResultJson<{halted: boolean; location?: unknown}>(result);
      expect(json.halted).to.be.true;
      expect(json.location).to.be.undefined;
    });

    it('should time out when no halt occurs', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugWaitForStopTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, timeout_ms: 50});

      const json = getResultJson<{halted: boolean; timed_out?: boolean}>(result);
      expect(json.halted).to.be.false;
      expect(json.timed_out).to.be.true;
    });

    it('should resolve when onThreadStopped callback fires', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugWaitForStopTool(loadServices, serverContext);
      const promise = tool.handler({session_id: entry.sessionId, timeout_ms: 5000});

      // Simulate thread halt via the waiter mechanism
      setTimeout(() => {
        const waiter = entry.haltWaiters.shift()!;
        clearTimeout(waiter.timer);
        waiter.resolve({
          id: 7,
          status: 'halted',
          call_stack: [
            {
              index: 0,
              location: {function_name: 'foo', line_number: 5, script_path: '/app_test/cartridge/foo.js'},
            },
          ],
        });
      }, 10);

      const result = await promise;
      const json = getResultJson<{halted: boolean; thread_id: number}>(result);
      expect(json.halted).to.be.true;
      expect(json.thread_id).to.equal(7);
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugWaitForStopTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x'});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_capture_at_breakpoint', () => {
    it('should set breakpoint, wait, capture, and optionally continue', async () => {
      const haltedThread = {
        id: 5,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'show', line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'},
          },
        ],
      };
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([haltedThread]),
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        file: '/app_test/cartridge/controllers/Cart.js',
        line: 42,
        expressions: ['x', 'y'],
        auto_continue: true,
      });

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{
        halted: boolean;
        thread_id: number;
        stack: unknown[];
        variables: unknown[];
        evaluations: Array<{expression: string}>;
        auto_continued: boolean;
      }>(result);
      expect(json.halted).to.be.true;
      expect(json.thread_id).to.equal(5);
      expect(json.stack).to.have.lengthOf(1);
      expect(json.variables).to.have.lengthOf(3);
      expect(json.evaluations).to.have.lengthOf(2);
      expect(json.auto_continued).to.be.true;
      expect((manager.resume as sinon.SinonStub).calledOnce).to.be.true;
    });

    it('should handle evaluation errors gracefully', async () => {
      const haltedThread = {
        id: 5,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'f', line_number: 1, script_path: '/app_test/cartridge/x.js'},
          },
        ],
      };
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([haltedThread]),
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      (manager.client.evaluate as sinon.SinonStub).rejects(new Error('bad expression'));
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        file: '/app_test/cartridge/controllers/Cart.js',
        line: 42,
        expressions: ['broken'],
      });

      const json = getResultJson<{evaluations: Array<{result: string}>}>(result);
      expect(json.evaluations[0].result).to.include('Error: bad expression');
    });

    it('should time out when no halt occurs', async () => {
      const manager = createMockManager({
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        file: '/app_test/cartridge/controllers/Cart.js',
        line: 42,
        timeout_ms: 50,
      });

      const json = getResultJson<{halted: boolean; timed_out?: boolean}>(result);
      expect(json.halted).to.be.false;
      expect(json.timed_out).to.be.true;
    });

    it('should fire trigger_url in background', async () => {
      const haltedThread = {
        id: 5,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'f', line_number: 1, script_path: '/app_test/cartridge/x.js'},
          },
        ],
      };
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([haltedThread]),
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('', {status: 200}));

      try {
        const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
        const result = await tool.handler({
          session_id: entry.sessionId,
          file: '/app_test/cartridge/controllers/Cart.js',
          line: 42,
          trigger_url: 'https://example.com/trigger',
        });

        const json = getResultJson<{trigger_status?: number}>(result);
        expect(json.trigger_status).to.equal(200);
        expect(fetchStub.calledWith('https://example.com/trigger')).to.be.true;
      } finally {
        fetchStub.restore();
      }
    });

    it('should handle trigger_url fetch failure', async () => {
      const haltedThread = {
        id: 5,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'f', line_number: 1, script_path: '/app_test/cartridge/x.js'},
          },
        ],
      };
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([haltedThread]),
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new Error('network'));

      try {
        const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
        const result = await tool.handler({
          session_id: entry.sessionId,
          file: '/app_test/cartridge/controllers/Cart.js',
          line: 42,
          trigger_url: 'https://example.com/trigger',
        });

        const json = getResultJson<{trigger_status?: number}>(result);
        expect(json.trigger_status).to.be.undefined;
      } finally {
        fetchStub.restore();
      }
    });

    it('should wait via waiter when no thread is already halted', async () => {
      const manager = createMockManager({
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
      const promise = tool.handler({
        session_id: entry.sessionId,
        file: '/app_test/cartridge/controllers/Cart.js',
        line: 42,
        timeout_ms: 5000,
      });

      setTimeout(() => {
        const waiter = entry.haltWaiters.shift()!;
        clearTimeout(waiter.timer);
        waiter.resolve({
          id: 9,
          status: 'halted',
          call_stack: [
            {
              index: 0,
              location: {function_name: 'foo', line_number: 5, script_path: '/app_test/cartridge/foo.js'},
            },
          ],
        });
      }, 10);

      const result = await promise;
      const json = getResultJson<{halted: boolean; thread_id: number}>(result);
      expect(json.halted).to.be.true;
      expect(json.thread_id).to.equal(9);
    });

    it('should truncate long variable values in capture', async () => {
      const longValue = 'y'.repeat(300);
      const haltedThread = {
        id: 5,
        status: 'halted',
        call_stack: [
          {
            index: 0,
            location: {function_name: 'f', line_number: 1, script_path: '/app_test/cartridge/x.js'},
          },
        ],
      };
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([haltedThread]),
        setBreakpoints: sinon
          .stub()
          .resolves([{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}]),
      });
      (manager.client.getVariables as sinon.SinonStub).resolves({
        object_members: [{name: 'big', type: 'string', value: longValue, scope: 'local'}],
        count: 1,
        start: 0,
        total: 1,
        _v: '2.0',
      });
      const entry = serverContext.debugSessions.registerSession('host', 'c', manager, createMockSourceMapper(), []);

      const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        file: '/app_test/cartridge/controllers/Cart.js',
        line: 42,
      });

      const json = getResultJson<{variables: Array<{value: string}>}>(result);
      expect(json.variables[0].value.endsWith('...')).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugCaptureAtBreakpointTool(loadServices, undefined);
      const result = await tool.handler({session_id: 'x', file: '/a.js', line: 1});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_start_session', () => {
    let tmpDir: string;
    let connectStub: sinon.SinonStub;

    beforeEach(() => {
      // Create a real cartridge fixture so findCartridges works
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debug-start-'));
      const cartridgeDir = path.join(tmpDir, 'app_test');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<project/>');

      // Stub the manager's network calls
      connectStub = sinon.stub(DebugSessionManager.prototype, 'connect').resolves();
      sinon.stub(DebugSessionManager.prototype, 'disconnect').resolves();
    });

    afterEach(() => {
      fs.rmSync(tmpDir, {recursive: true, force: true});
      sinon.restore();
    });

    it('should start a session and return session_id, hostname, cartridges, and mappings', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      const result = await tool.handler({cartridge_directory: tmpDir});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{
        session_id: string;
        hostname: string;
        cartridges: string[];
        cartridge_mappings: Record<string, string>;
        warnings: string[];
      }>(result);

      expect(json.session_id).to.be.a('string');
      expect(json.hostname).to.equal('test.example.com');
      expect(json.cartridges).to.deep.equal(['app_test']);
      expect(json.cartridge_mappings).to.have.property('app_test');
      expect(connectStub.calledOnce).to.be.true;
    });

    it('should warn when no cartridges found', async () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
      try {
        const tool = createDebugStartSessionTool(loadServices, serverContext);
        const result = await tool.handler({cartridge_directory: emptyDir});

        const json = getResultJson<{warnings: string[]}>(result);
        expect(json.warnings).to.not.be.empty;
      } finally {
        fs.rmSync(emptyDir, {recursive: true, force: true});
      }
    });

    it('should error when credentials are missing', async () => {
      const servicesNoAuth = new Services({
        resolvedConfig: createMockResolvedConfig({}),
      });
      const tool = createDebugStartSessionTool(() => servicesNoAuth, serverContext);
      const result = await tool.handler({cartridge_directory: tmpDir});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Basic auth credentials');
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugStartSessionTool(loadServices, undefined);
      const result = await tool.handler({cartridge_directory: tmpDir});
      expect(result.isError).to.be.true;
    });

    it('should use custom client_id', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      await tool.handler({cartridge_directory: tmpDir, client_id: 'custom-client'});

      const sessions = serverContext.debugSessions.listSessions();
      expect(sessions[0].clientId).to.equal('custom-client');
    });

    it('should resolve halt waiters via onThreadStopped callback', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      await tool.handler({cartridge_directory: tmpDir});

      const entry = serverContext.debugSessions.listSessions()[0];
      // Register a halt waiter
      const halted = new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 1000);
        entry.haltWaiters.push({
          resolve(t) {
            clearTimeout(timer);
            resolve(t.id);
          },
          reject,
          timer,
        });
      });

      // Fire the callback registered by start_session
      const callbacks = (entry.manager as unknown as {callbacks: {onThreadStopped: (t: unknown) => void}}).callbacks;
      callbacks.onThreadStopped({
        id: 42,
        status: 'halted',
        call_stack: [],
      });

      const id = await halted;
      expect(id).to.equal(42);
    });
  });
});
