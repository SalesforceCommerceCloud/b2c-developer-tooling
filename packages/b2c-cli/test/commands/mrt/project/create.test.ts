/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectCreate from '../../../../src/commands/mrt/project/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project create', () => {
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
    return new MrtProjectCreate([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls command.error when organization is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {name: 'My Project'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls createProject with correct parameters and returns result', async () => {
    const command = createCommand();

    // slug is no longer its own flag — it comes from the shared --project/--storefront
    // (-p/-s) flag, resolved into resolvedConfig.values.mrtProject during init().
    stubParse(command, {organization: 'my-org', region: 'us-east-1'}, {name: 'My Project'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtOrigin: 'https://example.com', mrtProject: 'my-project'},
    }));

    const createStub = sinon.stub().resolves({
      name: 'My Project',
      slug: 'my-project',
      organization: 'my-org',
      ssr_region: 'us-east-1',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await createStub({
        name: this.args.name,
        organization: this.flags.organization,
        slug: this.resolvedConfig.values.mrtProject,
        ssrRegion: this.flags.region,
        origin: this.resolvedConfig.values.mrtOrigin,
      });
      return result;
    };

    const result = await command.run();

    expect(createStub.calledOnce).to.equal(true);
    const [input] = createStub.firstCall.args;
    expect(input.name).to.equal('My Project');
    expect(input.slug).to.equal('my-project');
    expect(input.organization).to.equal('my-org');
    expect(result.slug).to.equal('my-project');
  });
});
