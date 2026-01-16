/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import WebDavMkdir from '../../../src/commands/webdav/mkdir.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('webdav mkdir', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('creates all directories in the path (mkdir -p behavior)', async () => {
    const command: any = new WebDavMkdir([], config);

    stubParse(command, {root: 'impex'}, {path: 'src/instance/my-folder'});
    await command.init();

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);

    const buildPathStub = sinon.stub(command, 'buildPath').returns('Impex/src/instance/my-folder');

    const mkcolStub = sinon.stub().resolves(void 0);
    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        mkcol: mkcolStub,
      },
    }));

    const result = await command.run();

    expect(buildPathStub.calledOnceWithExactly('src/instance/my-folder')).to.equal(true);

    expect(mkcolStub.callCount).to.equal(4);
    expect(mkcolStub.getCall(0).args[0]).to.equal('Impex');
    expect(mkcolStub.getCall(1).args[0]).to.equal('Impex/src');
    expect(mkcolStub.getCall(2).args[0]).to.equal('Impex/src/instance');
    expect(mkcolStub.getCall(3).args[0]).to.equal('Impex/src/instance/my-folder');

    expect(result.path).to.equal('Impex/src/instance/my-folder');
    expect(result.created).to.equal(true);
  });
});
