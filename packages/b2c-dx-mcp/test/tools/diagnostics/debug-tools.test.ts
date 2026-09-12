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
import {createDebugControlTool} from '../../../src/tools/diagnostics/debug-control.js';
import {createDebugInspectTool} from '../../../src/tools/diagnostics/debug-inspect.js';
import {createDebugEvaluateTool} from '../../../src/tools/diagnostics/debug-evaluate.js';
import {createDebugSetBreakpointsTool} from '../../../src/tools/diagnostics/debug-set-breakpoints.js';
import {createDebugWaitForStopTool} from '../../../src/tools/diagnostics/debug-wait-for-stop.js';
import {createDebugCaptureAtBreakpointTool} from '../../../src/tools/diagnostics/debug-capture-at-breakpoint.js';
import {createDebugStartSessionTool} from '../../../src/tools/diagnostics/debug-start-session.js';
import {DebugSessionManager} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {SourceMapper} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {ToolResult} from '../../../src/utils/index.js';
import type {ProjectContextInput} from '../../../src/tools/project-context.js';

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
    getSessionCookie: sinon.stub().returns('dwsid-value-123'),
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

function createServices(projectContext?: ProjectContextInput): Services {
  const projectDirectory = projectContext?.projectDirectory ?? process.cwd();
  return new Services({
    resolvedConfig: createMockResolvedConfig({
      hostname: 'test.example.com',
      username: 'user',
      password: 'pass',
      projectDirectory,
      workingDirectory: projectDirectory,
    }),
    resolution: {
      projectDirectory: {path: projectDirectory, source: projectContext?.projectDirectory ? 'argument' : 'cwd'},
    },
  });
}

describe('tools/diagnostics', () => {
  let serverContext: ServerContext;
  let loadServices: (projectContext?: ProjectContextInput) => Services;

  beforeEach(() => {
    serverContext = new ServerContext();
    loadServices = (projectContext) => createServices(projectContext);
  });

  afterEach(async () => {
    await serverContext.destroyAll();
  });

  describe('combined debugger operations', () => {
    it('returns stack and all variable scopes by default, fetching only requested views', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });
      const tool = createDebugInspectTool(loadServices, serverContext);
      const args = {session_id: entry.sessionId, thread_id: 1};
      const result = getResultJson<{stack: unknown[]; variables: {scope: string}[]}>(await tool.handler(args));
      expect(result.stack).to.have.length(1);
      expect(result.variables.map((variable) => variable.scope)).to.include.members(['local', 'global']);
      (manager.client.getThread as sinon.SinonStub).resetHistory();
      (manager.client.getVariables as sinon.SinonStub).resetHistory();
      await tool.handler({...args, include: ['variables'], frame_index: 2});
      expect((manager.client.getThread as sinon.SinonStub).called).to.equal(false);
      expect((manager.client.getVariables as sinon.SinonStub).calledWith(1, 2)).to.equal(true);
      (manager.client.getVariables as sinon.SinonStub).resetHistory();
      const stackOnly = await tool.handler({...args, include: ['stack'], frame_index: 0});
      expect(stackOnly.isError).not.to.equal(true);
      expect(getResultJson<{stack: unknown[]}>(stackOnly).stack).to.have.length(1);
      expect((manager.client.getVariables as sinon.SinonStub).called).to.equal(false);
    });

    it('rejects incompatible inspection selectors before remote calls', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });
      const tool = createDebugInspectTool(loadServices, serverContext);
      const args = {session_id: entry.sessionId, thread_id: 1};
      expect((await tool.handler({...args, include: ['stack'], scope: 'local'})).isError).to.equal(true);
      expect((await tool.handler({...args, scope: 'local', object_path: 'request'})).isError).to.equal(true);
      expect((await tool.handler({...args, include: []})).isError).to.equal(true);
      expect((manager.client.getThread as sinon.SinonStub).called).to.equal(false);
      expect((manager.client.getVariables as sinon.SinonStub).called).to.equal(false);
      expect((manager.client.getMembers as sinon.SinonStub).called).to.equal(false);
    });

    it('requires an explicit valid execution action before loading services', async () => {
      const load = sinon.stub().throws(new Error('Must not load services'));
      const tool = createDebugControlTool(load, serverContext);
      const args = {session_id: 'x', thread_id: 1};
      expect((await tool.handler(args)).isError).to.equal(true);
      expect((await tool.handler({...args, action: 'unknown'})).isError).to.equal(true);
      expect(load.called).to.equal(false);
    });
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host.example.com',
        clientId: 'c1',
        manager,
        sourceMapper,
        cartridges: [],
        resolution: {
          projectDirectory: {path: '/workspace/storefront', source: 'argument'},
          configuration: {
            hostname: 'host.example.com',
            instanceName: 'sandbox',
            path: '/workspace/storefront/dw.json',
            source: 'projectDirectory',
          },
        },
      });
      entry.breakpoints = [{id: 1, line_number: 42, script_path: '/app_test/cartridge/controllers/Cart.js'}];

      const tool = createDebugListSessionsTool(loadServices, serverContext);
      const result = await tool.handler({});
      const json = getResultJson<{
        sessions: Array<{
          session_id: string;
          halted_threads: number[];
          breakpoints: unknown[];
          session_cookie: null | {name: string; value: string};
          resolution?: {configuration?: {instanceName?: string}};
        }>;
      }>(result);

      expect(json.sessions).to.have.lengthOf(1);
      expect(json.sessions[0].session_id).to.equal(entry.sessionId);
      expect(json.sessions[0].halted_threads).to.deep.equal([5]);
      expect(json.sessions[0].breakpoints).to.have.lengthOf(1);
      expect(json.sessions[0].session_cookie).to.deep.equal({name: 'dwsid', value: 'dwsid-value-123'});
      expect(json.sessions[0].resolution?.configuration?.instanceName).to.equal('sandbox');
    });

    it('should report session_cookie as null when no dwsid is set', async () => {
      const manager = createMockManager({getSessionCookie: sinon.stub().returns(undefined)});
      serverContext.debugSessions.registerSession({
        hostname: 'host.example.com',
        clientId: 'c1',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugListSessionsTool(loadServices, serverContext);
      const result = await tool.handler({});
      const json = getResultJson<{sessions: Array<{session_cookie: unknown}>}>(result);
      expect(json.sessions[0].session_cookie).to.be.null;
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugEndSessionTool(loadServices, serverContext);
      await tool.handler({session_id: entry.sessionId, clear_breakpoints: true});

      expect((manager.client.deleteBreakpoints as sinon.SinonStub).calledOnce).to.be.true;
    });

    it('should handle deleteBreakpoints failure silently', async () => {
      const manager = createMockManager();
      (manager.client.deleteBreakpoints as sinon.SinonStub).rejects(new Error('SDAPI down'));
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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

  describe('debug_control continue', () => {
    it('should resume the specified thread', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugControlTool(loadServices, serverContext);
      const result = await tool.handler({action: 'continue', session_id: entry.sessionId, thread_id: 5});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{thread_id: number; action: string}>(result);
      expect(json.thread_id).to.equal(5);
      expect(json.action).to.equal('continue');
      expect((manager.resume as sinon.SinonStub).calledWith(5)).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugControlTool(loadServices, undefined);
      const result = await tool.handler({action: 'continue', session_id: 'x', thread_id: 1});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_inspect stack', () => {
    it('should return mapped stack frames', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugInspectTool(loadServices, serverContext);
      const result = await tool.handler({include: ['stack'], session_id: entry.sessionId, thread_id: 1});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{stack: Array<{function_name: string; file: string; line: number}>}>(result);
      expect(json.stack).to.have.lengthOf(1);
      expect(json.stack[0].function_name).to.equal('show');
      expect(json.stack[0].line).to.equal(42);
      expect(json.stack[0].file).to.equal('/local/app_test/cartridge/controllers/Cart.js');
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugInspectTool(loadServices, undefined);
      const result = await tool.handler({include: ['stack'], session_id: 'x', thread_id: 1});
      expect(result.isError).to.be.true;
    });
  });

  describe('debug_evaluate', () => {
    it('should evaluate expression and return result', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugEvaluateTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, thread_id: 1, expression: 'x'});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{expression: string; result: string}>(result);
      expect(json.expression).to.equal('x');
      expect(json.result).to.equal('42');
    });

    it('should use frame_index 0 by default', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugEvaluateTool(loadServices, serverContext);
      await tool.handler({session_id: entry.sessionId, thread_id: 1, expression: 'x'});

      expect((manager.client.evaluate as sinon.SinonStub).calledWith(1, 0, 'x')).to.be.true;
    });

    it('should use specified frame_index', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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

  describe('debug_inspect variables', () => {
    it('should return variables with has_children flag based on type', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugInspectTool(loadServices, serverContext);
      const result = await tool.handler({include: ['variables'], session_id: entry.sessionId, thread_id: 1});

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugInspectTool(loadServices, serverContext);
      const result = await tool.handler({
        include: ['variables'],
        session_id: entry.sessionId,
        thread_id: 1,
        scope: 'global',
      });

      const json = getResultJson<{variables: Array<{name: string}>}>(result);
      expect(json.variables).to.have.lengthOf(1);
      expect(json.variables[0].name).to.equal('g');
    });

    it('should use getMembers when object_path is provided', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugInspectTool(loadServices, serverContext);
      const result = await tool.handler({
        include: ['variables'],
        session_id: entry.sessionId,
        thread_id: 1,
        object_path: 'obj',
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugInspectTool(loadServices, serverContext);
      const result = await tool.handler({include: ['variables'], session_id: entry.sessionId, thread_id: 1});

      const json = getResultJson<{variables: Array<{value: string}>}>(result);
      expect(json.variables[0].value).to.have.lengthOf(203); // 200 + '...'
      expect(json.variables[0].value.endsWith('...')).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugInspectTool(loadServices, undefined);
      const result = await tool.handler({include: ['variables'], session_id: 'x', thread_id: 1});
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugSetBreakpointsTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        breakpoints: [{file: '/app_test/cartridge/controllers/Cart.js', line: 42}],
      });

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{breakpoints: Array<{id: number; verified: boolean; file: string}>}>(result);
      expect(json.breakpoints).to.have.lengthOf(1);
      expect(json.breakpoints[0].verified).to.be.true;
      expect(json).not.to.have.property('skillReferences');
    });

    it('should warn when path cannot be round-trip mapped', async () => {
      const manager = createMockManager({
        setBreakpoints: sinon.stub().resolves([{id: 1, line_number: 10, script_path: '/unknown/cartridge/foo.js'}]),
      });
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugSetBreakpointsTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        breakpoints: [{file: '/unknown/cartridge/foo.js', line: 10}],
      });

      const json = getResultJson<{
        breakpoints: Array<{verified: boolean}>;
        warnings?: string[];
        skillReferences: {uri: string; section: string}[];
      }>(result);
      expect(json.breakpoints[0].verified).to.be.false;
      expect(json.skillReferences).to.deep.equal([{uri: 'skill://mcp/debugger/SKILL.md', section: 'prerequisites'}]);
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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

  describe('debug_control stepping', () => {
    it('step_over should call manager.stepOver', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });
      const stepOver = createDebugControlTool(loadServices, serverContext);

      const result = await stepOver.handler({action: 'over', session_id: entry.sessionId, thread_id: 3});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{action: string}>(result);
      expect(json.action).to.equal('over');
      expect((manager.stepOver as sinon.SinonStub).calledWith(3)).to.be.true;
    });

    it('step_into should call manager.stepInto', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });
      const stepInto = createDebugControlTool(loadServices, serverContext);

      await stepInto.handler({action: 'into', session_id: entry.sessionId, thread_id: 3});

      expect((manager.stepInto as sinon.SinonStub).calledWith(3)).to.be.true;
    });

    it('step_out should call manager.stepOut', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });
      const stepOut = createDebugControlTool(loadServices, serverContext);

      await stepOut.handler({action: 'out', session_id: entry.sessionId, thread_id: 3});

      expect((manager.stepOut as sinon.SinonStub).calledWith(3)).to.be.true;
    });

    it('should error when server context is missing', async () => {
      const stepOver = createDebugControlTool(loadServices, undefined);
      const result = await stepOver.handler({action: 'over', session_id: 'x', thread_id: 1});
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugWaitForStopTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId});

      const json = getResultJson<{halted: boolean; location?: unknown}>(result);
      expect(json.halted).to.be.true;
      expect(json.location).to.be.undefined;
    });

    it('should time out when no halt occurs', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugWaitForStopTool(loadServices, serverContext);
      const result = await tool.handler({session_id: entry.sessionId, timeout_ms: 50});

      const json = getResultJson<{halted: boolean; timed_out?: boolean}>(result);
      expect(json.halted).to.be.false;
      expect(json.timed_out).to.be.true;
      expect(json).not.to.have.property('hint');
    });

    it('should resolve when onThreadStopped callback fires', async () => {
      const manager = createMockManager();
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
    it('returns a halted capture while its HTTP trigger is still waiting for resume', async () => {
      const manager = createMockManager({
        getKnownThreads: sinon.stub().returns([{id: 5, status: 'halted', call_stack: []}]),
      });
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });
      let finishRequest!: (response: Response) => void;
      const fetchStub = sinon.stub(globalThis, 'fetch').returns(
        new Promise<Response>((resolve) => {
          finishRequest = resolve;
        }),
      );
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          createDebugCaptureAtBreakpointTool(loadServices, serverContext).handler({
            session_id: entry.sessionId,
            file: '/app_test/cartridge/x.js',
            line: 1,
            trigger_url: 'https://example.com/trigger',
            auto_continue: false,
          }),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Capture waited for the halted request')), 200);
          }),
        ]);
        const json = getResultJson<{halted: boolean; auto_continued: boolean; trigger_pending: boolean}>(result);
        expect(json).to.include({halted: true, auto_continued: false, trigger_pending: true});
        expect((manager.resume as sinon.SinonStub).called).to.equal(false);
      } finally {
        clearTimeout(timer);
        finishRequest(new Response('', {status: 200}));
        fetchStub.restore();
      }
    });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      expect(json).not.to.have.property('skillReferences');
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

      const tool = createDebugCaptureAtBreakpointTool(loadServices, serverContext);
      const result = await tool.handler({
        session_id: entry.sessionId,
        file: '/app_test/cartridge/controllers/Cart.js',
        line: 42,
        timeout_ms: 50,
      });

      const json = getResultJson<{
        halted: boolean;
        timed_out?: boolean;
        warnings: string[];
        skillReferences: {uri: string; section: string}[];
      }>(result);
      expect(json.halted).to.be.false;
      expect(json.timed_out).to.be.true;
      expect(json.warnings[0]).to.include('breakpoint remains armed');
      expect(json.skillReferences).to.deep.equal([{uri: 'skill://mcp/debugger/SKILL.md', section: 'recovery'}]);
      expect(json).not.to.have.property('hint');
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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      const entry = serverContext.debugSessions.registerSession({
        hostname: 'host',
        clientId: 'c',
        manager,
        sourceMapper: createMockSourceMapper(),
        cartridges: [],
      });

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
      sinon.stub(DebugSessionManager.prototype, 'getSessionCookie').returns('dwsid-abc');
    });

    afterEach(() => {
      fs.rmSync(tmpDir, {recursive: true, force: true});
      sinon.restore();
    });

    it('should start a session and return session_id, hostname, cartridges, and mappings', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      const result = await tool.handler({projectDirectory: tmpDir});

      expect(result.isError).to.be.undefined;
      const json = getResultJson<{
        session_id: string;
        hostname: string;
        cartridges: string[];
        cartridge_mappings: Record<string, string>;
        session_cookie: null | {name: string; value: string};
        warnings: string[];
        cartridgeDirectory: string;
        resolution: {projectDirectory: {path: string; source: string}};
      }>(result);

      expect(json.session_id).to.be.a('string');
      expect(json.hostname).to.equal('test.example.com');
      expect(json.cartridges).to.deep.equal(['app_test']);
      expect(json.cartridge_mappings).to.have.property('app_test');
      expect(json.session_cookie).to.deep.equal({name: 'dwsid', value: 'dwsid-abc'});
      expect(json.resolution.projectDirectory).to.deep.equal({path: tmpDir, source: 'argument'});
      expect(json).to.not.have.own.property('projectDirectory');
      expect(json.cartridgeDirectory).to.equal(tmpDir);
      expect(connectStub.calledOnce).to.be.true;
    });

    it('should use cartridgeDirectory only for cartridge discovery and source mapping', async () => {
      const projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'debug-project-'));
      try {
        const tool = createDebugStartSessionTool(loadServices, serverContext);
        const result = await tool.handler({projectDirectory, cartridgeDirectory: tmpDir});
        const json = getResultJson<{
          cartridges: string[];
          cartridgeDirectory: string;
          resolution: {projectDirectory: {path: string; source: string}};
        }>(result);

        expect(json.resolution.projectDirectory).to.deep.equal({path: projectDirectory, source: 'argument'});
        expect(json).to.not.have.own.property('projectDirectory');
        expect(json.cartridgeDirectory).to.equal(tmpDir);
        expect(json.cartridges).to.deep.equal(['app_test']);
      } finally {
        fs.rmSync(projectDirectory, {recursive: true, force: true});
      }
    });

    it('keeps cwd provenance when only cartridgeDirectory is supplied', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      const result = await tool.handler({cartridgeDirectory: tmpDir});
      const json = getResultJson<{
        resolution: {projectDirectory: {path: string; source: string}};
      }>(result);

      expect(json.resolution.projectDirectory).to.deep.equal({path: process.cwd(), source: 'cwd'});
      expect(json).to.not.have.own.property('projectDirectory');
    });

    it('should return null session_cookie without warning when no dwsid is set', async () => {
      (DebugSessionManager.prototype.getSessionCookie as sinon.SinonStub).returns(undefined);
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      const result = await tool.handler({projectDirectory: tmpDir});

      const json = getResultJson<{session_cookie: unknown; warnings: string[]}>(result);
      expect(json.session_cookie).to.be.null;
      expect(json.warnings).to.be.empty;
    });

    it('should warn when no cartridges found', async () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
      try {
        const tool = createDebugStartSessionTool(loadServices, serverContext);
        const result = await tool.handler({projectDirectory: emptyDir});

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
      const result = await tool.handler({projectDirectory: tmpDir});

      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('Basic auth credentials');
    });

    it('should error when server context is missing', async () => {
      const tool = createDebugStartSessionTool(loadServices, undefined);
      const result = await tool.handler({projectDirectory: tmpDir});
      expect(result.isError).to.be.true;
    });

    it('should expose project/config/cartridge context and keep the debugger client ID internal', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      expect(tool.inputSchema).to.have.property('projectDirectory');
      expect(tool.inputSchema).to.have.property('configPath');
      expect(tool.inputSchema).to.have.property('cartridgeDirectory');
      expect(tool.inputSchema).to.not.have.property('cartridge_directory');
      expect(tool.inputSchema).to.not.have.property('client_id');

      await tool.handler({projectDirectory: tmpDir});

      const sessions = serverContext.debugSessions.listSessions();
      expect(sessions[0].clientId).to.match(/^b2c-dx-mcp-/);
    });

    it('should resolve halt waiters via onThreadStopped callback', async () => {
      const tool = createDebugStartSessionTool(loadServices, serverContext);
      await tool.handler({projectDirectory: tmpDir});

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
