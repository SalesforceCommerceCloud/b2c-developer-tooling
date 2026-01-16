/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import readline from 'node:readline';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import WebDavRm from '../../../src/commands/webdav/rm.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('webdav rm', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('deletes when --force is set (no prompt)', async () => {
    const command: any = new WebDavRm([], config);

    stubParse(command, {root: 'impex', force: true}, {path: 'src/instance/old.zip'});
    await command.init();

    sinon.stub(command, 'ensureWebDavAuth').returns(undefined);
    sinon.stub(command, 'buildPath').returns('Impex/src/instance/old.zip');

    sinon.stub(command, 'log').returns(undefined);

    const deleteStub = sinon.stub().resolves(undefined);
    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        delete: deleteStub,
      },
    }));

    const result = await command.run();

    expect(deleteStub.calledOnceWithExactly('Impex/src/instance/old.zip')).to.equal(true);
    expect(result.deleted).to.equal(true);
  });

  it('does not delete when user declines confirmation', async () => {
    const command: any = new WebDavRm([], config);

    stubParse(command, {root: 'impex', force: false}, {path: 'src/instance/old.zip'});
    await command.init();

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'buildPath').returns('Impex/src/instance/old.zip');

    const deleteStub = sinon.stub().resolves(void 0);
    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        delete: deleteStub,
      },
    }));

    const rl = {
      question(_prompt: string, cb: (answer: string) => void) {
        cb('n');
      },
      close() {},
    };
    sinon.stub(readline, 'createInterface').returns(rl as any);

    const result = await command.run();

    expect(deleteStub.called).to.equal(false);
    expect(result.deleted).to.equal(false);
  });
});
