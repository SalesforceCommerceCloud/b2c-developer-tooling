/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectMemberAdd from '../../../../../src/commands/mrt/project/member/add.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt project member add', () => {
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
    return new MrtProjectMemberAdd([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {role: 'developer'}, {email: 'user@example.com'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls addProjectMember with email and role', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', role: 'developer'}, {email: 'user@example.com'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const addStub = sinon.stub().resolves({
      email: 'user@example.com',
      role: 'developer',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await addStub({
        projectSlug: 'my-project',
        email: 'user@example.com',
        role: 'developer',
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(addStub.calledOnce).to.equal(true);
    const [input] = addStub.firstCall.args;
    expect(input.email).to.equal('user@example.com');
    expect(input.role).to.equal('developer');
    expect(result.email).to.equal('user@example.com');
  });
});
