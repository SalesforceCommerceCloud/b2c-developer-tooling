/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import ContentExport from '../../../src/commands/content/export.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('content export', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, argv: string[] = []) {
    return createTestCommand(ContentExport, hooks.getConfig(), flags, {}, argv);
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);
  }

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
            children: [
              {
                id: 'hero',
                type: 'COMPONENT',
                typeId: 'component.hero',
                hidden: false,
                children: [{id: '/images/hero.jpg', type: 'STATIC', typeId: null, hidden: false, children: []}],
              },
            ],
            xml: {},
          },
        ],
      },
      filter: sinon.stub().returnsThis(),
      *nodes(opts: any) {
        const walk = function* (node: any): Generator<any> {
          for (const child of node.children) {
            yield* walk(child);
          }
          if (!node.hidden || opts?.callbackHidden) {
            yield node;
          }
        };
        for (const child of (this as any).tree.children) {
          yield* walk(child);
        }
      },
      traverse(cb: any, opts: any) {
        const walk = (node: any) => {
          for (const child of node.children) {
            walk(child);
          }
          if (!node.hidden || opts?.callbackHidden) {
            cb(node);
          }
        };
        for (const child of this.tree.children) {
          walk(child);
        }
        return this;
      },
      promoteToRoot: sinon.stub().returnsThis(),
      getTreeString: sinon
        .stub()
        .returns('homepage (typeId: page.storePage)\n\u251C\u2500\u2500 component.hero (hero)'),
    };
  }

  it('parses flags correctly', async () => {
    const command: any = await createCommand(
      {
        library: 'SharedLibrary',
        output: './my-export',
        'site-library': true,
        'asset-query': ['image.path', 'video.url'],
        regex: true,
        folder: ['seasonal'],
        offline: true,
        'library-file': './library.xml',
        'keep-orphans': true,
        'show-tree': false,
        timeout: 120,
        'dry-run': false,
      },
      ['homepage', 'about'],
    );
    stubCommon(command);

    const exportStub = sinon.stub().resolves({
      library: createMockLibrary(),
      outputPath: './my-export',
      downloadedAssets: [],
      failedAssets: [],
      pageCount: 1,
      contentCount: 0,
      componentCount: 1,
    });
    command.operations = {...command.operations, exportContent: exportStub};

    await command.run();

    expect(exportStub.calledOnce).to.equal(true);
    const args = exportStub.getCall(0).args;
    expect(args[1]).to.deep.equal(['homepage', 'about']);
    expect(args[2]).to.equal('SharedLibrary');
    expect(args[3]).to.equal('./my-export');
    expect(args[4].isSiteLibrary).to.equal(true);
    expect(args[4].assetQuery).to.deep.equal(['image.path', 'video.url']);
    expect(args[4].regex).to.equal(true);
    expect(args[4].folders).to.deep.equal(['seasonal']);
    expect(args[4].offline).to.equal(true);
    expect(args[4].libraryFile).to.equal('./library.xml');
    expect(args[4].keepOrphans).to.equal(true);
    expect(args[4].waitOptions).to.deep.equal({timeout: 120_000});
  });

  it('calls exportContent with correct arguments', async () => {
    const command: any = await createCommand(
      {
        library: 'RefArch',
        output: './export',
      },
      ['homepage'],
    );
    const instance = {config: {hostname: 'example.com'}};
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);

    const mockResult = {
      library: createMockLibrary(),
      outputPath: './export',
      downloadedAssets: ['/images/hero.jpg'],
      failedAssets: [],
      pageCount: 1,
      componentCount: 1,
    };
    const exportStub = sinon.stub().resolves(mockResult);
    command.operations = {...command.operations, exportContent: exportStub};

    await command.run();

    expect(exportStub.calledOnce).to.equal(true);
    const args = exportStub.getCall(0).args;
    expect(args[0]).to.equal(instance);
    expect(args[1]).to.deep.equal(['homepage']);
    expect(args[2]).to.equal('RefArch');
    expect(args[3]).to.equal('./export');
    expect(args[4]).to.have.property('isSiteLibrary');
    expect(args[4]).to.have.property('assetQuery');
    expect(args[4]).to.have.property('offline');
    expect(args[4]).to.have.property('regex');
    expect(args[4]).to.have.property('keepOrphans');
    expect(args[4]).to.have.property('onAssetProgress').that.is.a('function');
  });

  it('returns result for JSON output', async () => {
    const command: any = await createCommand(
      {
        library: 'SharedLibrary',
        output: './export',
        json: true,
      },
      ['homepage'],
    );
    stubCommon(command);

    const mockLibrary = createMockLibrary();
    const mockResult = {
      library: mockLibrary,
      outputPath: './export',
      downloadedAssets: ['/images/hero.jpg'],
      failedAssets: [{path: '/images/missing.jpg', error: 'Not found'}],
      pageCount: 1,
      componentCount: 1,
    };
    const exportStub = sinon.stub().resolves(mockResult);
    command.operations = {...command.operations, exportContent: exportStub};

    const result = await command.run();

    expect(result).to.equal(mockResult);
    expect(result.library).to.equal(mockLibrary);
    expect(result.outputPath).to.equal('./export');
    expect(result.downloadedAssets).to.deep.equal(['/images/hero.jpg']);
    expect(result.failedAssets).to.deep.equal([{path: '/images/missing.jpg', error: 'Not found'}]);
    expect(result.pageCount).to.equal(1);
    expect(result.componentCount).to.equal(1);
  });

  it('dry-run mode fetches library and does not call exportContent', async () => {
    const command: any = await createCommand(
      {
        library: 'SharedLibrary',
        output: './export',
        'dry-run': true,
      },
      ['homepage'],
    );
    stubCommon(command);

    const mockLibrary = createMockLibrary();
    const fetchStub = sinon.stub().resolves({library: mockLibrary});
    const exportStub = sinon.stub().rejects(new Error('Should not be called'));
    command.operations = {...command.operations, fetchContentLibrary: fetchStub, exportContent: exportStub};

    const result = await command.run();

    expect(fetchStub.calledOnce).to.equal(true);
    expect(exportStub.called).to.equal(false);
    expect(result.pageCount).to.equal(1);
    expect(result.componentCount).to.equal(1);
    expect(result.downloadedAssets).to.deep.equal([]);
    expect(result.failedAssets).to.deep.equal([]);
    expect(result.outputPath).to.equal('./export');
  });

  it('calls requireOAuthCredentials when no library-file', async () => {
    const command: any = await createCommand(
      {
        library: 'SharedLibrary',
        output: './export',
      },
      ['homepage'],
    );
    const requireOAuthStub = sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const exportStub = sinon.stub().resolves({
      library: createMockLibrary(),
      outputPath: './export',
      downloadedAssets: [],
      failedAssets: [],
      pageCount: 1,
      contentCount: 0,
      componentCount: 1,
    });
    command.operations = {...command.operations, exportContent: exportStub};

    await command.run();

    expect(requireOAuthStub.calledOnce).to.equal(true);
  });

  it('skips requireOAuthCredentials when library-file is set', async () => {
    const command: any = await createCommand(
      {
        library: 'SharedLibrary',
        output: './export',
        'library-file': './library.xml',
      },
      ['homepage'],
    );
    const requireOAuthStub = sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const exportStub = sinon.stub().resolves({
      library: createMockLibrary(),
      outputPath: './export',
      downloadedAssets: [],
      failedAssets: [],
      pageCount: 1,
      contentCount: 0,
      componentCount: 1,
    });
    command.operations = {...command.operations, exportContent: exportStub};

    await command.run();

    expect(requireOAuthStub.called).to.equal(false);
  });
});
