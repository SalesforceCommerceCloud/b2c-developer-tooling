/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtOrgMemberAdd from '../../../../../src/commands/mrt/org/member/add.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt org member add', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    return new MrtOrgMemberAdd([], config);
  }

  function stubAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {}}));
  }

  it('maps the role name to its numeric value when calling addOrgMember', async () => {
    const command = createCommand();
    stubParse(command, {org: 'my-org', role: 'owner'}, {email: 'alice@example.com'});
    await command.init();
    stubAuth(command);

    const addStub = sinon.stub().resolves({user: 'alice@example.com', email: 'alice@example.com', role: 0} as any);
    command.operations = {addOrgMember: addStub};

    await command.run();

    expect(addStub.calledOnce).to.equal(true);
    expect(addStub.firstCall.args[0].role).to.equal(0);
  });

  it('passes through view-all-projects and cert-permission flags', async () => {
    const command = createCommand();
    stubParse(
      command,
      {org: 'my-org', role: 'member', 'view-all-projects': true, 'cert-permission': false},
      {email: 'bob@example.com'},
    );
    await command.init();
    stubAuth(command);

    const addStub = sinon.stub().resolves({} as any);
    command.operations = {addOrgMember: addStub};

    await command.run();

    const [input] = addStub.firstCall.args;
    expect(input.canViewAllProjects).to.equal(true);
    expect(input.customDomainCertPermission).to.equal(1);
  });
});
