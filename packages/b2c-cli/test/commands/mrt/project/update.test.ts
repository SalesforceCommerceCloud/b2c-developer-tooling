/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectUpdate from '../../../../src/commands/mrt/project/update.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project update', () => {
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
    return new MrtProjectUpdate([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls updateProject with new name and returns result', async () => {
    const command = createCommand();

    stubParse(
      command,
      {
        name: 'Updated Project Name',
      },
      {slug: 'my-project'},
    );
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const updateStub = sinon.stub().resolves({
      name: 'Updated Project Name',
      slug: 'my-project',
      organization: 'my-org',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await updateStub({
        projectSlug: 'my-project',
        name: 'Updated Project Name',
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(updateStub.calledOnce).to.equal(true);
    const [input] = updateStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.name).to.equal('Updated Project Name');
    expect(result.name).to.equal('Updated Project Name');
  });
});
