/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {createHookContext, invokeHook} from '@salesforce/b2c-tooling-sdk/plugins';

describe('plugins/loader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-plugin-loader-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  describe('createHookContext', () => {
    it('creates context with all required methods', () => {
      const ctx = createHookContext();
      expect(ctx).to.have.property('debug').that.is.a('function');
      expect(ctx).to.have.property('log').that.is.a('function');
      expect(ctx).to.have.property('warn').that.is.a('function');
      expect(ctx).to.have.property('error').that.is.a('function');
      expect(ctx).to.have.property('config').that.is.an('object');
    });

    it('methods do not throw without a logger', () => {
      const ctx = createHookContext();
      expect(() => ctx.debug('test')).to.not.throw();
      expect(() => ctx.log('test')).to.not.throw();
      expect(() => ctx.warn('test')).to.not.throw();
      expect(() => ctx.error('test')).to.not.throw();
    });

    it('routes messages through provided logger', () => {
      const messages: {level: string; msg: string}[] = [];
      const logger = {
        debug(msg: string) {
          messages.push({level: 'debug', msg});
        },
        info(msg: string) {
          messages.push({level: 'info', msg});
        },
        warn(msg: string) {
          messages.push({level: 'warn', msg});
        },
        error(msg: string) {
          messages.push({level: 'error', msg});
        },
        trace() {},
        fatal() {},
        child() {
          return this;
        },
      };

      const ctx = createHookContext({logger: logger as never});
      ctx.debug('d');
      ctx.log('i');
      ctx.warn('w');
      ctx.error('e');

      expect(messages).to.have.length(4);
      expect(messages[0]).to.deep.equal({level: 'debug', msg: 'd'});
      expect(messages[1]).to.deep.equal({level: 'info', msg: 'i'});
      expect(messages[2]).to.deep.equal({level: 'warn', msg: 'w'});
      expect(messages[3]).to.deep.equal({level: 'error', msg: 'e'});
    });

    it('includes custom config properties', () => {
      const ctx = createHookContext({config: {root: '/tmp', name: 'test'}});
      expect(ctx.config).to.deep.equal({root: '/tmp', name: 'test'});
    });
  });

  describe('invokeHook', () => {
    it('invokes a hook file and returns the result', async () => {
      const hookFile = path.join(tempDir, 'hook.mjs');
      fs.writeFileSync(
        hookFile,
        `export default async function(options) {
          return { sources: [{ name: 'test-source', load: () => undefined }], priority: 'before' };
        }`,
      );

      const ctx = createHookContext();
      const result = await invokeHook<{sources: {name: string}[]; priority: string}>(hookFile, ctx, {});

      expect(result).to.not.be.undefined;
      expect(result!.sources).to.have.length(1);
      expect(result!.sources[0].name).to.equal('test-source');
      expect(result!.priority).to.equal('before');
    });

    it('passes options to the hook function', async () => {
      const hookFile = path.join(tempDir, 'echo-hook.mjs');
      fs.writeFileSync(
        hookFile,
        `export default async function(options) {
          return { received: options.instance };
        }`,
      );

      const ctx = createHookContext();
      const result = await invokeHook<{received: string}>(hookFile, ctx, {instance: 'staging'});

      expect(result).to.not.be.undefined;
      expect(result!.received).to.equal('staging');
    });

    it('provides this context to the hook', async () => {
      const hookFile = path.join(tempDir, 'ctx-hook.mjs');
      fs.writeFileSync(
        hookFile,
        `export default async function(options) {
          return { hasDebug: typeof this.debug === 'function', hasConfig: typeof this.config === 'object' };
        }`,
      );

      const ctx = createHookContext();
      const result = await invokeHook<{hasDebug: boolean; hasConfig: boolean}>(hookFile, ctx, {});

      expect(result).to.not.be.undefined;
      expect(result!.hasDebug).to.be.true;
      expect(result!.hasConfig).to.be.true;
    });

    it('returns undefined for non-existent hook file', async () => {
      const ctx = createHookContext();
      const result = await invokeHook(path.join(tempDir, 'missing.mjs'), ctx, {});
      expect(result).to.be.undefined;
    });

    it('returns undefined when hook file does not export a function', async () => {
      const hookFile = path.join(tempDir, 'not-a-fn.mjs');
      fs.writeFileSync(hookFile, `export default "not a function";`);

      const ctx = createHookContext();
      const result = await invokeHook(hookFile, ctx, {});
      expect(result).to.be.undefined;
    });

    it('returns undefined when hook throws an error', async () => {
      const hookFile = path.join(tempDir, 'throwing-hook.mjs');
      fs.writeFileSync(hookFile, `export default async function() { throw new Error('hook error'); }`);

      const ctx = createHookContext();
      const result = await invokeHook(hookFile, ctx, {});
      expect(result).to.be.undefined;
    });
  });
});
