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
import SlasClientTemplateSet from '../../../../../src/commands/slas/client/template/set.js';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('slas client template set', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasClientTemplateSet([], config);
    stubParse(command, flags, args);
    await command.init();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    return command;
  }

  async function expectError(command: any): Promise<string> {
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));
    try {
      await command.run();
    } catch {
      // expected
    }
    expect(errorStub.calledOnce).to.equal(true);
    return errorStub.firstCall.args[0] as string;
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
  const keys = {
    'tenant-id': 'abcd_123',
    'site-id': 'RefArch',
    'action-type': 'PWDLESS_LOGIN',
    'template-type': 'EMAIL',
    locale: 'en-US',
  };

  it('updates one field of an existing template', async () => {
    const command = await createCommand({...keys, subject: 'New subject'}, {clientId: 'c1'});
    const putStub = sinon.stub().resolves({data: group, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves({data: [group]}), PUT: putStub});

    await command.run();

    const {body, params} = putStub.firstCall.args[1];
    expect(params.path).to.deep.equal({tenantId: 'abcd_123', clientId: 'c1'});
    expect(body).to.deep.equal({
      channelId: 'RefArch',
      actionType: 'PWDLESS_LOGIN',
      templateType: 'EMAIL',
      locale: 'en-us',
      name: 'Login',
      subject: 'New subject',
      link: 'https://example.com/l?t=${token}',
      template: 'Code ${token}',
    });
  });

  it('lists missing fields for a new template', async () => {
    const command = await createCommand({...keys, name: 'Login'}, {clientId: 'c1'});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves({error: {}, response: {status: 404}})});

    expect(await expectError(command)).to.include('subject, link, template');
  });

  it('requires the template keys', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', 'site-id': 'RefArch'}, {clientId: 'c1'});
    expect(await expectError(command)).to.include('--action-type, --template-type, --locale');
  });
});
