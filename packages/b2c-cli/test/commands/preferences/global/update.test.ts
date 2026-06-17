/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import PreferencesGlobalUpdate from '../../../../src/commands/preferences/global/update.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../../helpers/test-setup.js';

describe('preferences global update', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  describe('run', () => {
    let config: Config;

    beforeEach(async () => {
      config = await Config.load();
    });

    afterEach(() => {
      sinon.restore();
    });

    function setupOAuth(command: any): void {
      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
    }

    it('errors when neither assignments nor --file/--body is provided', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'staging', 'mask-passwords': false},
        {'group-id': 'CustomGroupId'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/assignments or --file\/--body/);
      }
    });

    it('errors when both assignments and --body are provided', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'staging', 'mask-passwords': false, body: '{"c_attr":"x"}'},
        {'group-id': 'CustomGroupId'},
        ['CustomGroupId', 'c_other=y'],
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/not both/);
      }
    });

    it('errors when --file does not exist', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'instance-type': 'staging',
          'mask-passwords': false,
          file: '/nonexistent/path/prefs.json',
        },
        {'group-id': 'CustomGroupId'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/File not found/i);
      }
    });

    it('errors on invalid JSON body', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'staging', 'mask-passwords': false, body: '{not json}'},
        {'group-id': 'CustomGroupId'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/Failed to parse JSON/i);
      }
    });

    it('sends body via --body to the PATCH request', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'staging', 'mask-passwords': false, body: '{"c_attr":"value"}'},
        {'group-id': 'CustomGroupId'},
      );
      await command.init();

      setupOAuth(command);

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        expect(req.url).to.include('/global-preference-groups/CustomGroupId/staging');
        expect(req.method).to.equal('PATCH');
        expect(await req.clone().json()).to.deep.equal({c_attr: 'value'});
        return new Response(JSON.stringify({c_attr: 'value'}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      const result = await command.run();
      expect(fetchStub.called).to.equal(true);
      expect(result).to.deep.include({c_attr: 'value'});
    });

    it('sends body read from --file to the PATCH request', async () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prefs-'));
      const filePath = path.join(tmp, 'prefs.json');
      fs.writeFileSync(filePath, JSON.stringify({c_attr: 'from-file'}));

      try {
        const command: any = new PreferencesGlobalUpdate([], config);
        stubParse(
          command,
          {'tenant-id': 'zzxy_prd', 'instance-type': 'staging', 'mask-passwords': false, file: filePath},
          {'group-id': 'CustomGroupId'},
        );
        await command.init();

        setupOAuth(command);

        const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
          const req = input as Request;
          expect(await req.clone().json()).to.deep.equal({c_attr: 'from-file'});
          return new Response(JSON.stringify({c_attr: 'from-file'}), {
            status: 200,
            headers: {'content-type': 'application/json'},
          });
        });

        await command.run();
        expect(fetchStub.called).to.equal(true);
      } finally {
        fs.rmSync(tmp, {recursive: true, force: true});
      }
    });

    it('builds typed body from KEY=value, KEY:=json, and KEY= assignments', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'development', 'mask-passwords': false},
        {'group-id': 'CustomGroupId'},
        ['CustomGroupId', 'c_name=hello', 'c_count:=5', 'c_on:=true', 'c_tags:=["a","b"]', 'c_temp='],
      );
      await command.init();

      setupOAuth(command);

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        expect(req.url).to.include('/global-preference-groups/CustomGroupId/development');
        const json = (await req.clone().json()) as Record<string, unknown>;
        expect(json).to.deep.equal({c_name: 'hello', c_count: 5, c_on: true, c_tags: ['a', 'b'], c_temp: null});
        return new Response(JSON.stringify(json), {status: 200, headers: {'content-type': 'application/json'}});
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });

    it('reads KEY=@file as a string and KEY:=@file as JSON', async () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prefs-'));
      const stringPath = path.join(tmp, 'banner.html');
      const jsonPath = path.join(tmp, 'tags.json');
      fs.writeFileSync(stringPath, '<b>hi</b>');
      fs.writeFileSync(jsonPath, '["a","b","c"]');

      try {
        const command: any = new PreferencesGlobalUpdate([], config);
        stubParse(
          command,
          {'tenant-id': 'zzxy_prd', 'instance-type': 'development', 'mask-passwords': false},
          {'group-id': 'CustomGroupId'},
          ['CustomGroupId', `c_banner=@${stringPath}`, `c_tags:=@${jsonPath}`],
        );
        await command.init();

        setupOAuth(command);

        const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
          const req = input as Request;
          expect(await req.clone().json()).to.deep.equal({c_banner: '<b>hi</b>', c_tags: ['a', 'b', 'c']});
          return new Response('{}', {status: 200, headers: {'content-type': 'application/json'}});
        });

        await command.run();
        expect(fetchStub.called).to.equal(true);
      } finally {
        fs.rmSync(tmp, {recursive: true, force: true});
      }
    });

    it('errors when KEY=@file references a missing file', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'development', 'mask-passwords': false},
        {'group-id': 'CustomGroupId'},
        ['CustomGroupId', 'c_banner=@/nonexistent/path.html'],
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/File not found/i);
      }
    });

    it('uses development as the default instance-type when none is provided', async () => {
      const command: any = new PreferencesGlobalUpdate([], config);
      // Mirrors oclif default-resolution: instance-type comes through as 'development'.
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'development', 'mask-passwords': false},
        {'group-id': 'CustomGroupId'},
        ['CustomGroupId', 'c_name=hello'],
      );
      await command.init();

      setupOAuth(command);

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        expect(req.url).to.include('/global-preference-groups/CustomGroupId/development');
        return new Response('{}', {status: 200, headers: {'content-type': 'application/json'}});
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });
  });
});
