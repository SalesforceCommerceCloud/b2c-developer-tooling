/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {ux} from '@oclif/core';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import ContentList from '../../../src/commands/content/list.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

function createMockLibrary() {
  return {
    tree: {
      id: 'TestLib',
      type: 'LIBRARY',
      children: [
        {
          id: 'homepage',
          type: 'PAGE',
          typeId: 'page.storePage',
          hidden: false,
          children: [{id: 'hero', type: 'COMPONENT'}],
        },
        {id: 'about-us', type: 'PAGE', typeId: 'page.storePage', hidden: false, children: []},
        {id: 'footer', type: 'CONTENT', typeId: null, hidden: false, children: []},
      ],
    },
    getTreeString: sinon.stub().returns('homepage (typeId: page.storePage)\nabout-us (typeId: page.storePage)'),
  };
}

function stubCommon(command: any) {
  sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
  sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
  sinon.stub(command, 'log').returns(void 0);
}

describe('content list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(ContentList, hooks.getConfig(), flags, args);
  }

  it('lists all content', async () => {
    const command: any = await createCommand({library: 'TestLib'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockLibrary = createMockLibrary();
    sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    const result = await command.run();

    expect(result.data).to.have.lengthOf(3);
    expect(result.data[0].id).to.equal('homepage');
    expect(result.data[1].id).to.equal('about-us');
    expect(result.data[2].id).to.equal('footer');
  });

  it('filters by type=page', async () => {
    const command: any = await createCommand({library: 'TestLib', type: 'page'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockLibrary = createMockLibrary();
    sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    const result = await command.run();

    expect(result.data).to.have.lengthOf(2);
    expect(result.data.every((item: any) => item.type === 'PAGE')).to.equal(true);
  });

  it('shows tree structure when --tree is set', async () => {
    const command: any = await createCommand({library: 'TestLib', tree: true});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    const stdoutStub = sinon.stub(ux, 'stdout');

    const mockLibrary = createMockLibrary();
    sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    await command.run();

    expect(mockLibrary.getTreeString.calledOnce).to.equal(true);
    expect(stdoutStub.calledWith('homepage (typeId: page.storePage)\nabout-us (typeId: page.storePage)')).to.equal(
      true,
    );
  });

  it('returns JSON result with data array', async () => {
    const command: any = await createCommand({library: 'TestLib'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockLibrary = createMockLibrary();
    sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    const result = await command.run();

    expect(result).to.have.property('data');
    expect(result.data).to.be.an('array');
    expect(result.data[0]).to.have.keys('id', 'type', 'typeId', 'children');
  });

  it('calls requireOAuthCredentials when no library-file', async () => {
    const command: any = await createCommand({library: 'TestLib'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockLibrary = createMockLibrary();
    sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    await command.run();

    expect((command.requireOAuthCredentials as sinon.SinonStub).calledOnce).to.equal(true);
  });

  it('skips requireOAuthCredentials when library-file is set', async () => {
    const command: any = await createCommand({library: 'TestLib', 'library-file': '/tmp/library.xml'});
    const requireStub = sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockLibrary = createMockLibrary();
    sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    await command.run();

    expect(requireStub.called).to.equal(false);
  });

  it('calls fetchContentLibrary with correct arguments', async () => {
    const command: any = await createCommand({library: 'TestLib', 'site-library': true});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockLibrary = createMockLibrary();
    const fetchStub = sinon.stub(command.operations, 'fetchContentLibrary').resolves({library: mockLibrary});

    await command.run();

    expect(fetchStub.calledOnce).to.equal(true);
    const [instance, libraryId, options] = fetchStub.firstCall.args;
    expect(instance).to.deep.equal({config: {hostname: 'example.com'}});
    expect(libraryId).to.equal('TestLib');
    expect(options.isSiteLibrary).to.equal(true);
  });
});
