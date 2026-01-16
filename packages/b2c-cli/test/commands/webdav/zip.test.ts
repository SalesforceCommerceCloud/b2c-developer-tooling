/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import WebDavZip from '../../../src/commands/webdav/zip.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('webdav zip', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('posts ZIP request and returns source/archive paths', async () => {
    const command = new WebDavZip([], config) as unknown as {
      ensureWebDavAuth: () => void;
      buildPath: (p: string) => string;
      init: () => Promise<void>;
      instance: unknown;
      run: () => Promise<{archivePath: string; sourcePath: string}>;
    };

    stubParse(command, {root: 'impex'}, {path: 'src/instance/data'});
    await command.init();

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
    const command = new WebDavZip([], config) as unknown as {
      ensureWebDavAuth: () => void;
      buildPath: (p: string) => string;
      error: (message: string) => never;
      init: () => Promise<void>;
      instance: unknown;
      run: () => Promise<unknown>;
    };

    stubParse(command, {root: 'impex'}, {path: 'src/instance/data'});
    await command.init();

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
