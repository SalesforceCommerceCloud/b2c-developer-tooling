/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import WebDavZip from '../../../src/commands/webdav/zip.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('webdav zip', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(WebDavZip, hooks.getConfig(), flags, args);
  }

  it('posts ZIP request and returns source/archive paths', async () => {
    const command = (await createCommand({root: 'impex'}, {path: 'src/instance/data'})) as unknown as {
      ensureWebDavAuth: () => void;
      buildPath: (p: string) => string;
      instance: unknown;
      run: () => Promise<{archivePath: string; sourcePath: string}>;
    };

    sinon.stub(command, 'ensureWebDavAuth').returns();
    const buildPathStub = sinon.stub(command, 'buildPath').callsFake((p: unknown) => {
      const path = String(p);
      return `Impex/${path.startsWith('/') ? path.slice(1) : path}`;
    });

    const requestStub = sinon.stub().resolves({
      ok: true,
      status: 200,
      async text() {
        return '';
      },
    });

    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        request: requestStub,
      },
    }));

    const result = await command.run();

    expect(buildPathStub.calledOnceWithExactly('src/instance/data')).to.equal(true);
    expect(requestStub.calledOnce).to.equal(true);

    const [, init] = requestStub.getCall(0).args as [string, {body?: unknown; method?: string}];
    expect(init.method).to.equal('POST');
    expect(String(init.body)).to.include('method=ZIP');

    expect(result.sourcePath).to.equal('Impex/src/instance/data');
    expect(result.archivePath).to.equal('Impex/src/instance/data.zip');
  });

  it('calls command.error when response is not ok', async () => {
    const command = (await createCommand({root: 'impex'}, {path: 'src/instance/data'})) as unknown as {
      ensureWebDavAuth: () => void;
      buildPath: (p: string) => string;
      error: (message: string) => never;
      instance: unknown;
      run: () => Promise<unknown>;
    };

    sinon.stub(command, 'ensureWebDavAuth').returns();
    sinon.stub(command, 'buildPath').returns('Impex/src/instance/data');

    const requestStub = sinon.stub().resolves({
      ok: false,
      status: 500,
      text: async () => 'boom',
    });

    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        request: requestStub,
      },
    }));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
