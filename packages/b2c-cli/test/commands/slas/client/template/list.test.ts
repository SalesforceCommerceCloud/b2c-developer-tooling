/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-template-curly-in-string -- SLAS template placeholders */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasClientTemplateList from '../../../../../src/commands/slas/client/template/list.js';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('slas client template list', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasClientTemplateList([], config);
    stubParse(command, flags, args);
    await command.init();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
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

  const group = {
    client_id: 'c1',
    tenant_id: 'abcd_123',
    channel_id: 'RefArch',
    action_type: 'PWDLESS_LOGIN',
    link: 'https://example.com/l?t=${token}',
    templates: [{name: 'Login', subject: 'Code', templateType: 'EMAIL', locale: 'en-us', template: 'Code ${token}'}],
  };

  it('queries each action type and template type and flattens the results', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', 'site-id': 'RefArch'}, {clientId: 'c1'});
    const getStub = sinon
      .stub()
      .callsFake(async (_path: string, options: any) =>
        options.params.query.actionType === 'PWDLESS_LOGIN' && options.params.query.templateType === 'EMAIL'
          ? {data: [group], error: undefined}
          : {error: {exception_name: 'PasswordActionTemplateNotFoundException'}, response: {status: 404}},
      );
    sinon.stub(command, 'getSlasClient').returns({GET: getStub});

    const result = await command.run();

    expect(getStub.callCount).to.equal(8);
    expect(result.templates).to.have.length(1);
    expect(result.templates[0]).to.include({
      actionType: 'PWDLESS_LOGIN',
      templateType: 'EMAIL',
      locale: 'en-us',
      channelId: 'RefArch',
      clientId: 'c1',
    });
  });

  it('narrows the queries with --action-type and --template-type', async () => {
    const command = await createCommand(
      {'tenant-id': 'abcd_123', 'site-id': 'RefArch', 'action-type': 'PWD_RESET_ACTION', 'template-type': 'SMS'},
      {clientId: 'c1'},
    );
    const getStub = sinon.stub().resolves({error: {}, response: {status: 404}});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub});

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(getStub.firstCall.args[1].params.query).to.deep.equal({
      channelId: 'RefArch',
      actionType: 'PWD_RESET_ACTION',
      templateType: 'SMS',
    });
    expect(result.templates).to.deep.equal([]);
  });
});
