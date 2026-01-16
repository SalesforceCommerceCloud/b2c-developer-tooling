/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import WebDavUnzip from '../../../src/commands/webdav/unzip.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('webdav unzip', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('posts UNZIP request and returns archive/extract paths', async () => {
    const command = new WebDavUnzip([], config) as unknown as {
      ensureWebDavAuth: () => void;
      buildPath: (p: string) => string;
      init: () => Promise<void>;
      instance: unknown;
      run: () => Promise<{archivePath: string; extractPath: string}>;
    };

    stubParse(command, {root: 'impex'}, {path: 'src/instance/export.zip'});
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

    expect(buildPathStub.calledOnceWithExactly('src/instance/export.zip')).to.equal(true);
    expect(requestStub.calledOnce).to.equal(true);

    const [, init] = requestStub.getCall(0).args as [string, {body?: unknown; method?: string}];
    expect(init.method).to.equal('POST');
    expect(String(init.body)).to.include('method=UNZIP');

    expect(result.archivePath).to.equal('Impex/src/instance/export.zip');
    expect(result.extractPath).to.equal('Impex/src/instance/export');
  });

  it('calls command.error when response is not ok', async () => {
    const command = new WebDavUnzip([], config) as unknown as {
      ensureWebDavAuth: () => void;
      buildPath: (p: string) => string;
      error: (message: string) => never;
      init: () => Promise<void>;
      instance: unknown;
      run: () => Promise<unknown>;
    };

    stubParse(command, {root: 'impex'}, {path: 'src/instance/export.zip'});
    await command.init();

    sinon.stub(command, 'ensureWebDavAuth').returns();
    sinon.stub(command, 'buildPath').returns('Impex/src/instance/export.zip');

    const requestStub = sinon.stub().resolves({
      ok: false,
      status: 500,
      async text() {
        return 'boom';
      },
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
