/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux, Config} from '@oclif/core';
import {expect} from 'chai';
import sinon from 'sinon';
import CodeList from '../../../src/commands/code/list.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('code list', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>) {
    const command: any = new CodeList([], config);
    stubParse(command, flags, {});
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

  it('returns data in json mode', async () => {
    const command: any = await createCommand({json: true});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'jsonEnabled').returns(true);

    const getStub = sinon.stub().resolves({data: {data: [{id: 'v1', active: true}]}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        GET: getStub,
      },
    }));

    const uxStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.total).to.equal(1);
    expect(uxStub.called).to.equal(false);
  });

  it('prints a message when no code versions are returned in non-json mode', async () => {
    const command: any = await createCommand({});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'jsonEnabled').returns(false);

    const getStub = sinon.stub().resolves({data: {data: []}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        GET: getStub,
      },
    }));

    const uxStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.total).to.equal(0);
    expect(uxStub.calledOnce).to.equal(true);
  });
});
