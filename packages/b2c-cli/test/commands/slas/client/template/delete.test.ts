/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasClientTemplateDelete from '../../../../../src/commands/slas/client/template/delete.js';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('slas client template delete', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasClientTemplateDelete([], config);
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

  it('deletes the template identified by site, action, type and locale', async () => {
    const command = await createCommand(
      {
        'tenant-id': 'abcd_123',
        'site-id': 'RefArch',
        'action-type': 'PWDLESS_LOGIN',
        'template-type': 'SMS',
        locale: 'de-DE',
        force: true,
      },
      {clientId: 'c1'},
    );
    const delStub = sinon.stub().resolves({error: undefined, response: {status: 204}});
    sinon.stub(command, 'getSlasClient').returns({DELETE: delStub});

    const result = await command.run();

    expect(delStub.firstCall.args[1].params.query).to.deep.equal({
      channelId: 'RefArch',
      actionType: 'PWDLESS_LOGIN',
      templateType: 'SMS',
      locale: 'de-de',
    });
    expect(result.deleted).to.equal(true);
  });
});
