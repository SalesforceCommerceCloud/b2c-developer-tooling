/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  SafetyGuard,
  extractJobIdFromPath,
  SafetyBlockedError,
  SafetyConfirmationRequired,
  type SafetyOperation,
} from '@salesforce/b2c-tooling-sdk';

describe('safety/safety-guard', () => {
  describe('extractJobIdFromPath', () => {
    it('extracts job ID from OCAPI job execution URL', () => {
      expect(extractJobIdFromPath('/s/-/dw/data/v24_5/jobs/sfcc-site-archive-import/executions')).to.equal(
        'sfcc-site-archive-import',
      );
    });

    it('extracts job ID from short path', () => {
      expect(extractJobIdFromPath('/jobs/my-custom-job/executions')).to.equal('my-custom-job');
    });

    it('returns undefined for non-job paths', () => {
      expect(extractJobIdFromPath('/items/123')).to.be.undefined;
      expect(extractJobIdFromPath('/jobs')).to.be.undefined;
      expect(extractJobIdFromPath('/jobs/my-job')).to.be.undefined;
    });
  });

  describe('SafetyGuard.evaluate', () => {
    describe('rule matching — command rules', () => {
      it('matches exact command ID', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{command: 'sandbox:delete', action: 'block'}],
        });

        const result = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
        expect(result.action).to.equal('block');
        expect(result.rule).to.deep.include({command: 'sandbox:delete'});
      });

      it('matches command ID with glob pattern', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{command: 'sandbox:*', action: 'confirm'}],
        });

        expect(guard.evaluate({type: 'command', commandId: 'sandbox:delete'}).action).to.equal('confirm');
        expect(guard.evaluate({type: 'command', commandId: 'sandbox:create'}).action).to.equal('confirm');
      });

      it('does not match unrelated command', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{command: 'sandbox:*', action: 'block'}],
        });

        const result = guard.evaluate({type: 'command', commandId: 'job:run'});
        expect(result.action).to.equal('allow');
      });

      it('does not match command rule when no commandId on operation', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{command: 'sandbox:delete', action: 'block'}],
        });

        const result = guard.evaluate({type: 'http', method: 'DELETE', path: '/items/1'});
        expect(result.action).to.equal('allow');
      });
    });

    describe('rule matching — job rules', () => {
      it('matches exact job ID', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{job: 'sfcc-site-archive-import', action: 'block'}],
        });

        const result = guard.evaluate({type: 'job', jobId: 'sfcc-site-archive-import'});
        expect(result.action).to.equal('block');
      });

      it('matches job ID with glob', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{job: 'sfcc-site-archive-*', action: 'confirm'}],
        });

        expect(guard.evaluate({type: 'job', jobId: 'sfcc-site-archive-import'}).action).to.equal('confirm');
        expect(guard.evaluate({type: 'job', jobId: 'sfcc-site-archive-export'}).action).to.equal('confirm');
      });

      it('extracts job ID from HTTP operation path', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{job: 'sfcc-site-archive-import', action: 'block'}],
        });

        const result = guard.evaluate({
          type: 'http',
          method: 'POST',
          path: '/s/-/dw/data/v24_5/jobs/sfcc-site-archive-import/executions',
        });
        expect(result.action).to.equal('block');
      });

      it('does not match job rule when no jobId available', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{job: 'sfcc-site-archive-import', action: 'block'}],
        });

        const result = guard.evaluate({type: 'http', method: 'GET', path: '/items'});
        expect(result.action).to.equal('allow');
      });
    });

    describe('rule matching — HTTP method+path rules', () => {
      it('matches path with glob', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{path: '/code_versions/*', action: 'block'}],
        });

        const result = guard.evaluate({type: 'http', method: 'DELETE', path: '/code_versions/v1'});
        expect(result.action).to.equal('block');
      });

      it('matches method and path together', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{method: 'DELETE', path: '/code_versions/*', action: 'block'}],
        });

        // DELETE matches
        expect(guard.evaluate({type: 'http', method: 'DELETE', path: '/code_versions/v1'}).action).to.equal('block');
        // GET does not match — method doesn't match
        expect(guard.evaluate({type: 'http', method: 'GET', path: '/code_versions/v1'}).action).to.equal('allow');
      });

      it('matches method-only rule', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{method: 'DELETE', action: 'block'}],
        });

        expect(guard.evaluate({type: 'http', method: 'DELETE', path: '/anything'}).action).to.equal('block');
        expect(guard.evaluate({type: 'http', method: 'GET', path: '/anything'}).action).to.equal('allow');
      });

      it('method matching is case-insensitive', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{method: 'delete', path: '/items/*', action: 'block'}],
        });

        expect(guard.evaluate({type: 'http', method: 'DELETE', path: '/items/1'}).action).to.equal('block');
      });
    });

    describe('first-match wins', () => {
      it('uses the first matching rule', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [
            {job: 'sfcc-site-archive-export', action: 'allow'},
            {job: 'sfcc-site-archive-*', action: 'block'},
          ],
        });

        // Export matches first rule (allow)
        expect(guard.evaluate({type: 'job', jobId: 'sfcc-site-archive-export'}).action).to.equal('allow');
        // Import matches second rule (block)
        expect(guard.evaluate({type: 'job', jobId: 'sfcc-site-archive-import'}).action).to.equal('block');
      });
    });

    describe('allow rules override level', () => {
      it('allows explicitly allowed operation even when level would block', () => {
        const guard = new SafetyGuard({
          level: 'READ_ONLY',
          rules: [{job: 'sfcc-site-archive-export', action: 'allow'}],
        });

        const result = guard.evaluate({type: 'job', jobId: 'sfcc-site-archive-export'});
        expect(result.action).to.equal('allow');
      });

      it('allows explicitly allowed HTTP path even when level would block', () => {
        const guard = new SafetyGuard({
          level: 'NO_DELETE',
          rules: [{method: 'DELETE', path: '/code_versions/*', action: 'allow'}],
        });

        const result = guard.evaluate({type: 'http', method: 'DELETE', path: '/code_versions/v1'});
        expect(result.action).to.equal('allow');
      });
    });

    describe('level-based evaluation (no rules)', () => {
      it('allows GET at NO_DELETE level', () => {
        const guard = new SafetyGuard({level: 'NO_DELETE'});
        const result = guard.evaluate({type: 'http', method: 'GET', path: '/items'});
        expect(result.action).to.equal('allow');
      });

      it('blocks DELETE at NO_DELETE level', () => {
        const guard = new SafetyGuard({level: 'NO_DELETE'});
        const result = guard.evaluate({type: 'http', method: 'DELETE', path: '/items/1'});
        expect(result.action).to.equal('block');
      });

      it('blocks write operations at READ_ONLY level', () => {
        const guard = new SafetyGuard({level: 'READ_ONLY'});

        for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
          const result = guard.evaluate({type: 'http', method, path: '/items'});
          expect(result.action).to.equal('block', `Expected ${method} to be blocked`);
        }
      });

      it('allows all operations at NONE level', () => {
        const guard = new SafetyGuard({level: 'NONE'});

        for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
          const result = guard.evaluate({type: 'http', method, path: '/items'});
          expect(result.action).to.equal('allow', `Expected ${method} to be allowed`);
        }
      });

      it('allows command operations (levels are HTTP-level only)', () => {
        const guard = new SafetyGuard({level: 'READ_ONLY'});
        const result = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
        expect(result.action).to.equal('allow');
      });
    });

    describe('confirm mode', () => {
      it('softens level blocks into confirm when confirm is true', () => {
        const guard = new SafetyGuard({level: 'NO_DELETE', confirm: true});
        const result = guard.evaluate({type: 'http', method: 'DELETE', path: '/items/1'});
        expect(result.action).to.equal('confirm');
      });

      it('does not affect operations the level would allow', () => {
        const guard = new SafetyGuard({level: 'NO_DELETE', confirm: true});
        const result = guard.evaluate({type: 'http', method: 'GET', path: '/items'});
        expect(result.action).to.equal('allow');
      });

      it('does not affect rule-based blocks (only level-based)', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          confirm: true,
          rules: [{command: 'sandbox:delete', action: 'block'}],
        });

        const result = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
        expect(result.action).to.equal('block');
      });

      it('returns confirm for rule-based confirm action', () => {
        const guard = new SafetyGuard({
          level: 'NONE',
          rules: [{command: 'sandbox:delete', action: 'confirm'}],
        });

        const result = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
        expect(result.action).to.equal('confirm');
      });
    });
  });

  describe('SafetyGuard.assert', () => {
    it('does not throw for allowed operations', () => {
      const guard = new SafetyGuard({level: 'NONE'});
      expect(() => guard.assert({type: 'http', method: 'DELETE', path: '/items/1'})).to.not.throw();
    });

    it('throws SafetyBlockedError for blocked operations', () => {
      const guard = new SafetyGuard({level: 'NO_DELETE'});

      try {
        guard.assert({type: 'http', method: 'DELETE', url: 'https://example.com/items/1', path: '/items/1'});
        throw new Error('Expected SafetyBlockedError');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyBlockedError);
      }
    });

    it('throws SafetyConfirmationRequired for confirm operations', () => {
      const guard = new SafetyGuard({level: 'NO_DELETE', confirm: true});

      try {
        guard.assert({type: 'http', method: 'DELETE', path: '/items/1'});
        throw new Error('Expected SafetyConfirmationRequired');
      } catch (error) {
        expect(error).to.be.instanceOf(SafetyConfirmationRequired);
        expect((error as SafetyConfirmationRequired).evaluation.action).to.equal('confirm');
      }
    });
  });

  describe('SafetyGuard.temporarilyAllow', () => {
    it('allows previously blocked operation after temporary allow', () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{command: 'sandbox:delete', action: 'block'}],
      });

      // Blocked before temporary allow
      expect(guard.evaluate({type: 'command', commandId: 'sandbox:delete'}).action).to.equal('block');

      // Temporarily allow
      const cleanup = guard.temporarilyAllow({type: 'command', commandId: 'sandbox:delete'});

      // Now allowed
      expect(guard.evaluate({type: 'command', commandId: 'sandbox:delete'}).action).to.equal('allow');

      // Clean up
      cleanup();

      // Blocked again
      expect(guard.evaluate({type: 'command', commandId: 'sandbox:delete'}).action).to.equal('block');
    });

    it('creates temporary allow for HTTP operations', () => {
      const guard = new SafetyGuard({level: 'NO_DELETE'});
      const operation: SafetyOperation = {type: 'http', method: 'DELETE', path: '/items/1'};

      expect(guard.evaluate(operation).action).to.equal('block');

      const cleanup = guard.temporarilyAllow(operation);
      expect(guard.evaluate(operation).action).to.equal('allow');

      cleanup();
      expect(guard.evaluate(operation).action).to.equal('block');
    });

    it('creates temporary allow for job operations', () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{job: 'sfcc-site-archive-import', action: 'block'}],
      });
      const operation: SafetyOperation = {type: 'job', jobId: 'sfcc-site-archive-import'};

      expect(guard.evaluate(operation).action).to.equal('block');

      const cleanup = guard.temporarilyAllow(operation);
      expect(guard.evaluate(operation).action).to.equal('allow');

      cleanup();
      expect(guard.evaluate(operation).action).to.equal('block');
    });
  });

  describe('SafetyGuard.evaluate — evaluation reasons', () => {
    it('includes rule info in reason for rule matches', () => {
      const guard = new SafetyGuard({
        level: 'NONE',
        rules: [{command: 'sandbox:delete', action: 'block'}],
      });

      const result = guard.evaluate({type: 'command', commandId: 'sandbox:delete'});
      expect(result.reason).to.include('sandbox:delete');
      expect(result.reason).to.include('block');
    });

    it('includes level info in reason for level-based blocks', () => {
      const guard = new SafetyGuard({level: 'NO_DELETE'});

      const result = guard.evaluate({type: 'http', method: 'DELETE', path: '/items/1'});
      expect(result.reason).to.include('NO_DELETE');
    });

    it('returns operation in evaluation', () => {
      const guard = new SafetyGuard({level: 'NONE'});
      const operation: SafetyOperation = {type: 'http', method: 'GET', path: '/items'};

      const result = guard.evaluate(operation);
      expect(result.operation).to.equal(operation);
    });
  });

  describe('SafetyConfirmationRequired', () => {
    it('stores evaluation and has correct name', () => {
      const evaluation = {
        action: 'confirm' as const,
        reason: 'Test reason',
        operation: {type: 'command' as const, commandId: 'sandbox:delete'},
      };

      const error = new SafetyConfirmationRequired(evaluation);
      expect(error.name).to.equal('SafetyConfirmationRequired');
      expect(error.evaluation).to.equal(evaluation);
      expect(error.message).to.include('Test reason');
    });
  });

  describe('resolveEffectiveSafetyConfig', () => {
    it('merges global and instance configs — level uses max', async () => {
      const {resolveEffectiveSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');

      const result = resolveEffectiveSafetyConfig({level: 'NO_DELETE'}, {level: 'NO_UPDATE'});
      expect(result.level).to.equal('NO_UPDATE');
    });

    it('merges confirm with OR', async () => {
      const {resolveEffectiveSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');

      expect(resolveEffectiveSafetyConfig({confirm: false}, {confirm: true}).confirm).to.be.true;
      expect(resolveEffectiveSafetyConfig({confirm: true}, {confirm: false}).confirm).to.be.true;
      expect(resolveEffectiveSafetyConfig({confirm: false}, {confirm: false}).confirm).to.be.false;
    });

    it('concatenates rules — instance first, then global', async () => {
      const {resolveEffectiveSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');

      const instanceRule = {command: 'sandbox:delete', action: 'allow' as const};
      const globalRule = {command: 'sandbox:*', action: 'block' as const};

      const result = resolveEffectiveSafetyConfig({rules: [instanceRule]}, {rules: [globalRule]});
      expect(result.rules).to.have.length(2);
      expect(result.rules![0]).to.deep.equal(instanceRule);
      expect(result.rules![1]).to.deep.equal(globalRule);
    });

    it('works with only global config', async () => {
      const {resolveEffectiveSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');

      const result = resolveEffectiveSafetyConfig(undefined, {level: 'NO_DELETE', confirm: true});
      expect(result.level).to.equal('NO_DELETE');
      expect(result.confirm).to.be.true;
    });

    it('works with no configs', async () => {
      const {resolveEffectiveSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');

      const result = resolveEffectiveSafetyConfig();
      expect(result.level).to.equal('NONE');
      expect(result.confirm).to.be.false;
      expect(result.rules).to.be.undefined;
    });
  });

  describe('loadGlobalSafetyConfig', () => {
    it('returns undefined when no config dir provided', async () => {
      const {loadGlobalSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');
      expect(loadGlobalSafetyConfig()).to.be.undefined;
    });

    it('returns undefined when config dir does not contain safety.json', async () => {
      const {loadGlobalSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');
      const fs = await import('node:fs');
      const os = await import('node:os');
      const path = await import('node:path');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'safety-test-'));
      expect(loadGlobalSafetyConfig(tmpDir)).to.be.undefined;
      fs.rmSync(tmpDir, {recursive: true});
    });

    it('loads safety.json from config dir', async () => {
      const {loadGlobalSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');
      const fs = await import('node:fs');
      const os = await import('node:os');
      const path = await import('node:path');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'safety-test-'));
      fs.writeFileSync(
        path.join(tmpDir, 'safety.json'),
        JSON.stringify({
          level: 'NO_DELETE',
          confirm: true,
          rules: [{job: 'sfcc-site-archive-import', action: 'block'}],
        }),
      );

      const result = loadGlobalSafetyConfig(tmpDir);
      expect(result).to.deep.equal({
        level: 'NO_DELETE',
        confirm: true,
        rules: [{job: 'sfcc-site-archive-import', action: 'block'}],
      });

      fs.rmSync(tmpDir, {recursive: true});
    });

    it('loads from SFCC_SAFETY_CONFIG env var', async () => {
      const {loadGlobalSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');
      const fs = await import('node:fs');
      const os = await import('node:os');
      const path = await import('node:path');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'safety-test-'));
      const configPath = path.join(tmpDir, 'custom-safety.json');
      fs.writeFileSync(configPath, JSON.stringify({level: 'READ_ONLY'}));

      const originalEnv = process.env['SFCC_SAFETY_CONFIG'];
      try {
        process.env['SFCC_SAFETY_CONFIG'] = configPath;
        const result = loadGlobalSafetyConfig();
        expect(result?.level).to.equal('READ_ONLY');
      } finally {
        if (originalEnv !== undefined) {
          process.env['SFCC_SAFETY_CONFIG'] = originalEnv;
        } else {
          delete process.env['SFCC_SAFETY_CONFIG'];
        }
        fs.rmSync(tmpDir, {recursive: true});
      }
    });

    it('skips rules with invalid actions', async () => {
      const {loadGlobalSafetyConfig} = await import('@salesforce/b2c-tooling-sdk');
      const fs = await import('node:fs');
      const os = await import('node:os');
      const path = await import('node:path');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'safety-test-'));
      fs.writeFileSync(
        path.join(tmpDir, 'safety.json'),
        JSON.stringify({
          rules: [
            {job: 'valid-job', action: 'block'},
            {job: 'invalid-job', action: 'invalid_action'},
          ],
        }),
      );

      const result = loadGlobalSafetyConfig(tmpDir);
      expect(result?.rules).to.have.length(1);
      expect(result?.rules![0].job).to.equal('valid-job');

      fs.rmSync(tmpDir, {recursive: true});
    });
  });

  describe('maxSafetyLevel', () => {
    it('is accessible from the main export', async () => {
      const {maxSafetyLevel} = await import('@salesforce/b2c-tooling-sdk');
      expect(maxSafetyLevel('NONE', 'NO_DELETE')).to.equal('NO_DELETE');
      expect(maxSafetyLevel('READ_ONLY', 'NO_DELETE')).to.equal('READ_ONLY');
      expect(maxSafetyLevel('NONE', 'NONE')).to.equal('NONE');
    });
  });
});
