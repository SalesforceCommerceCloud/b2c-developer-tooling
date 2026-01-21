/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import WebDavPut from '../../../src/commands/webdav/put.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('webdav put', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(WebDavPut, hooks.getConfig(), flags, args);
  }

  function stubErrorToThrow(command: any) {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  it('errors when local file does not exist', async () => {
    const command: any = await createCommand({root: 'impex'}, {local: './missing.zip', remote: '/'});

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(fs, 'existsSync').returns(false);

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('appends local filename when remote is a directory', async () => {
    const command: any = await createCommand({root: 'impex'}, {local: './export.zip', remote: 'src/instance/'});

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns(Buffer.from('abc'));

    const buildPathStub = sinon.stub(command, 'buildPath').callsFake((p: unknown) => {
      const path = String(p);
      return `Impex/${path.startsWith('/') ? path.slice(1) : path}`;
    });

    const mkcolStub = sinon.stub().resolves(void 0);
    const putStub = sinon.stub().resolves(void 0);

    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        mkcol: mkcolStub,
        put: putStub,
      },
    }));

    const result = await command.run();

    expect(buildPathStub.calledOnceWithExactly('src/instance/export.zip')).to.equal(true);

    // Parent dirs: Impex, Impex/src, Impex/src/instance
    expect(mkcolStub.callCount).to.equal(3);
    expect(mkcolStub.getCall(0).args[0]).to.equal('Impex');
    expect(mkcolStub.getCall(1).args[0]).to.equal('Impex/src');
    expect(mkcolStub.getCall(2).args[0]).to.equal('Impex/src/instance');

    expect(putStub.calledOnce).to.equal(true);
    expect(putStub.getCall(0).args[0]).to.equal('Impex/src/instance/export.zip');
    expect(result.remotePath).to.equal('Impex/src/instance/export.zip');
    expect(result.size).to.equal(3);
    expect(result.contentType).to.equal('application/zip');
  });

  it('uses remote path as-is when remote is a file path', async () => {
    const command: any = await createCommand(
      {root: 'impex'},
      {local: './data.xml', remote: 'src/instance/renamed.xml'},
    );

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns(Buffer.from('abc'));

    const buildPathStub = sinon.stub(command, 'buildPath').callsFake((p: unknown) => {
      const path = String(p);
      return `Impex/${path.startsWith('/') ? path.slice(1) : path}`;
    });

    const mkcolStub = sinon.stub().resolves(void 0);
    const putStub = sinon.stub().resolves(void 0);

    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        mkcol: mkcolStub,
        put: putStub,
      },
    }));

    const result = await command.run();

    expect(buildPathStub.calledOnceWithExactly('src/instance/renamed.xml')).to.equal(true);
    expect(putStub.getCall(0).args[0]).to.equal('Impex/src/instance/renamed.xml');
    expect(result.remotePath).to.equal('Impex/src/instance/renamed.xml');
    expect(result.contentType).to.equal('application/xml');
  });
});
