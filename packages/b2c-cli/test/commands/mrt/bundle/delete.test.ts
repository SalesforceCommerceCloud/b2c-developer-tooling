/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleDelete from '../../../../src/commands/mrt/bundle/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

describe('mrt bundle delete', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(argv: string[]): any {
    return new MrtBundleDelete(argv, config);
  }

  function stubAuthAndConfig(command: any, project = 'p'): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: project}}));
  }

  it('uses single-bundle DELETE when one ID is provided', async () => {
    const command = createCommand(['42', '--project', 'p', '--force']);
    stubAuthAndConfig(command);

    const deleteStub = sinon.stub().resolves();
    const bulkStub = sinon.stub();
    command.operations = {deleteBundle: deleteStub, bulkDeleteBundles: bulkStub};

    const result = await command.run();

    expect(deleteStub.calledOnce).to.equal(true);
    expect(bulkStub.notCalled).to.equal(true);
    expect(deleteStub.firstCall.args[0].bundleId).to.equal(42);
    expect(result.queued).to.deep.equal([42]);
  });

  it('uses bulk-delete when multiple IDs are provided', async () => {
    const command = createCommand(['1', '2', '3', '--project', 'p', '--force']);
    stubAuthAndConfig(command);

    const deleteStub = sinon.stub();
    const bulkStub = sinon.stub().resolves({queued: [1, 3], rejected: [{bundleId: 2, reason: 'in use'}]});
    command.operations = {deleteBundle: deleteStub, bulkDeleteBundles: bulkStub};

    const result = await command.run();

    expect(bulkStub.calledOnce).to.equal(true);
    expect(deleteStub.notCalled).to.equal(true);
    expect(bulkStub.firstCall.args[0].bundleIds).to.deep.equal([1, 2, 3]);
    expect(result.queued).to.deep.equal([1, 3]);
    expect(result.rejected).to.have.lengthOf(1);
  });
});
