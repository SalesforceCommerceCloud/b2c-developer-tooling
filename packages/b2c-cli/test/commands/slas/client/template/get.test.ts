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
import SlasClientTemplateGet from '../../../../../src/commands/slas/client/template/get.js';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('slas client template get', () => {
  let config: Config;

  const baseFlags = {
    'tenant-id': 'abcd_123',
    'site-id': 'RefArch',
    'action-type': 'PWDLESS_LOGIN',
    'template-type': 'EMAIL',
  };

  async function createCommand(flags: Record<string, unknown>) {
    const command: any = new SlasClientTemplateGet([], config);
    stubParse(command, flags, {clientId: 'c1'});
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
    channel_id: 'RefArch',
    action_type: 'PWDLESS_LOGIN',
    link: 'https://example.com/l?t=${token}',
    templates: [
      {name: 'Login', subject: 'Code', templateType: 'EMAIL', locale: 'en-us', template: 'Code ${token}'},
      {name: 'Connexion', subject: 'Code', templateType: 'EMAIL', locale: 'fr-fr', template: 'Code ${token}'},
    ],
  };

  it('returns the template for the locale, matching case-insensitively', async () => {
    const command = await createCommand({...baseFlags, locale: 'FR-FR'});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves({data: [group], error: undefined})});

    const result = await command.run();

    expect(result).to.include({name: 'Connexion', locale: 'fr-fr', channelId: 'RefArch'});
  });

  it('reports a missing locale', async () => {
    const command = await createCommand({...baseFlags, locale: 'de-de'});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves({data: [group], error: undefined})});

    expect(await expectError(command)).to.include('No EMAIL template for PWDLESS_LOGIN in locale de-de');
  });

  it('reports an unknown client as an error, not a missing template', async () => {
    const command = await createCommand({...baseFlags, locale: 'en-us'});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({
        error: {exception_name: 'ClientNotFoundException', message: 'Client for action template not found'},
        response: {status: 404, statusText: 'Not Found'},
      }),
    });

    expect(await expectError(command)).to.include('Client for action template not found');
  });
});
