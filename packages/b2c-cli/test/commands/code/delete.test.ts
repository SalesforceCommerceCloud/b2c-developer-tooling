/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import CodeDelete from '../../../src/commands/code/delete.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('code delete', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new CodeDelete([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('deletes without prompting when --force is set', async () => {
    const command: any = await createCommand({force: true}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().resolves({data: {}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        DELETE: deleteStub,
      },
    }));

    await command.run();
    expect(deleteStub.calledOnce).to.equal(true);
  });

  it('does not delete when prompt is declined', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().rejects(new Error('Unexpected delete'));
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        DELETE: deleteStub,
      },
    }));

    const confirmStub = sinon.stub(command, 'confirm').resolves(false);

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(deleteStub.called).to.equal(false);
  });

  it('deletes when prompt is accepted', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().resolves({data: {}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        DELETE: deleteStub,
      },
    }));

    const confirmStub = sinon.stub(command, 'confirm').resolves(true);

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(deleteStub.calledOnce).to.equal(true);
  });
});
