/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import readline from 'node:readline';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import WebDavRm from '../../../src/commands/webdav/rm.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('webdav rm', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(WebDavRm, hooks.getConfig(), flags, args);
  }

  it('deletes when --force is set (no prompt)', async () => {
    const command: any = await createCommand({root: 'impex', force: true}, {path: 'src/instance/old.zip'});

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
    const command: any = await createCommand({root: 'impex', force: false}, {path: 'src/instance/old.zip'});

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
