/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {detectAgentContext, type AgentDetector} from '@salesforce/b2c-tooling-sdk/ux';

describe('ux/agent-context', () => {
  describe('detectAgentContext', () => {
    it('returns a non-agentic context for an empty environment', () => {
      const context = detectAgentContext({});
      expect(context.isAgentic).to.equal(false);
      expect(context.harness).to.equal(null);
      expect(context.sessionId).to.equal(null);
      expect(context.matches).to.deep.equal([]);
    });

    const cases: Array<{env: Record<string, string>; id: string; sessionId?: string}> = [
      {env: {OPENCODE: '1'}, id: 'opencode'},
      {env: {QWEN_CODE_SESSION_ID: 'q1'}, id: 'qwen-code', sessionId: 'q1'},
      {env: {PI_CODING_AGENT: 'true', PI_SESSION_ID: 'p1'}, id: 'pi', sessionId: 'p1'},
      {env: {AI_AGENT: 'pi'}, id: 'pi'},
      {env: {CURSOR_AGENT: '1', CURSOR_CONVERSATION_ID: 'c1'}, id: 'cursor-agent', sessionId: 'c1'},
      {env: {CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 's1'}, id: 'claude-code', sessionId: 's1'},
      {env: {CODEX_THREAD_ID: 't1'}, id: 'codex', sessionId: 't1'},
      {env: {AMP_CURRENT_THREAD_ID: 'a1'}, id: 'amp', sessionId: 'a1'},
      {env: {GEMINI_CLI: '1'}, id: 'gemini-cli'},
      {env: {AUGMENT_AGENT: '1'}, id: 'auggie'},
      {env: {CRUSH: '1'}, id: 'crush'},
      {env: {AI_AGENT: 'crush'}, id: 'crush'},
      {env: {AI_AGENT: 'github_copilot_vscode_agent'}, id: 'vscode-copilot-agent'},
      {env: {COPILOT_AGENT: '1'}, id: 'vscode-copilot-agent'},
      {env: {OZ_RUN_ID: 'w1'}, id: 'warp', sessionId: 'w1'},
    ];

    for (const {env, id, sessionId} of cases) {
      it(`detects ${id} from ${Object.keys(env).join(', ')}`, () => {
        const context = detectAgentContext(env);
        expect(context.isAgentic).to.equal(true);
        expect(context.harness?.id).to.equal(id);
        expect(context.sessionId).to.equal(sessionId ?? null);
      });
    }

    it('treats false-like values as unset', () => {
      for (const v of ['', '0', 'false', 'no', 'off', ' OFF ']) {
        expect(detectAgentContext({CODEX_THREAD_ID: v}).isAgentic, `CODEX_THREAD_ID=${v}`).to.equal(false);
      }
    });

    it('requires exact marker values', () => {
      expect(detectAgentContext({CLAUDECODE: 'true'}).isAgentic).to.equal(false);
      expect(detectAgentContext({CURSOR_AGENT: 'yes'}).isAgentic).to.equal(false);
    });

    it('prefers direct agents over host surfaces and keeps all matches', () => {
      const context = detectAgentContext({OZ_RUN_ID: 'warp-run', CLAUDECODE: '1'});
      expect(context.harness?.id).to.equal('claude-code');
      expect(context.matches.map((m) => m.harness.id)).to.deep.equal(['claude-code', 'warp']);
      // Session falls back to the first match that exposes one.
      expect(context.sessionId).to.equal('warp-run');
    });

    it('records the signals that produced a match', () => {
      const context = detectAgentContext({CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 's1'});
      expect(context.matches[0].signals).to.deep.equal(['CLAUDECODE', 'CLAUDE_CODE_SESSION_ID']);
    });

    it('swallows detector errors', () => {
      const throwing: AgentDetector = () => {
        throw new Error('boom');
      };
      const ok: AgentDetector = () => ({harness: {id: 'ok', name: 'OK'}, signals: []});
      const context = detectAgentContext({}, [throwing, ok]);
      expect(context.harness?.id).to.equal('ok');
    });

    describe('SFCC_AGENT override', () => {
      it('disables detection with a false-like value', () => {
        expect(detectAgentContext({SFCC_AGENT: '0', CLAUDECODE: '1'}).isAgentic).to.equal(false);
        expect(detectAgentContext({SFCC_AGENT: 'false', CLAUDECODE: '1'}).isAgentic).to.equal(false);
      });

      it('forces agent mode with a named harness', () => {
        const context = detectAgentContext({SFCC_AGENT: 'My Agent'});
        expect(context.isAgentic).to.equal(true);
        expect(context.harness).to.deep.equal({id: 'my-agent', name: 'My Agent'});
      });

      it('forces agent mode with a generic truthy value', () => {
        const context = detectAgentContext({SFCC_AGENT: '1'});
        expect(context.isAgentic).to.equal(true);
        expect(context.harness?.id).to.equal('unknown');
      });
    });
  });
});
