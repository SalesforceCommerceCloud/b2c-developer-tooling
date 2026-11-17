/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {ExperiencesRequestError, ExperiencesUnavailableError} from '@salesforce/b2c-tooling-sdk/operations/content';
import ContentAssetDelete from '../../../src/commands/content/asset/delete.js';
import ContentAssetGet from '../../../src/commands/content/asset/get.js';
import ContentAssetPut from '../../../src/commands/content/asset/put.js';
import ContentAssetUpdate from '../../../src/commands/content/asset/update.js';
import ContentFolderAssign from '../../../src/commands/content/folder/assign.js';
import ContentFolderDelete from '../../../src/commands/content/folder/delete.js';
import ContentFolderList from '../../../src/commands/content/folder/list.js';
import ContentFolderPut from '../../../src/commands/content/folder/put.js';
import ContentFolderUnassign from '../../../src/commands/content/folder/unassign.js';
import {buildLibraryItemInput} from '../../../src/utils/content/library.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../helpers/test-setup.js';

const ASSET = {id: 'banner', name: {default: 'Banner'}, online: {default: true}};

describe('content asset and folder', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(
    Cmd: any,
    flags: Record<string, unknown>,
    args: Record<string, unknown> = {},
    json = true,
  ) {
    const command: any = await createTestCommand(Cmd, hooks.getConfig(), flags, args);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => ({config: {}}));
    sinon.stub(command, 'jsonEnabled').returns(json);
    return command;
  }

  async function expectError(command: any, text: string) {
    try {
      await runSilent(() => command.run());
      expect.fail('expected error');
    } catch (error) {
      expect((error as Error).message).to.include(text);
    }
  }

  describe('asset get', () => {
    it('includes folders with --folders', async () => {
      const command = await createCommand(
        ContentAssetGet,
        {library: 'SharedLibrary', folders: true},
        {contentId: 'banner'},
      );
      sinon.stub(command.operations, 'getContentAsset').resolves(ASSET);
      sinon.stub(command.operations, 'getContentAssetFolders').resolves([{id: 'promos'}]);
      expect(await command.run()).to.deep.equal({...ASSET, folders: ['promos']});
    });

    it('requires a library', async () => {
      const command = await createCommand(ContentAssetGet, {}, {contentId: 'banner'});
      await expectError(command, 'Library is required');
    });

    it('reports a missing scope', async () => {
      const command = await createCommand(ContentAssetGet, {library: 'SharedLibrary'}, {contentId: 'banner'});
      sinon
        .stub(command.operations, 'getContentAsset')
        .rejects(new ExperiencesUnavailableError('needs sfcc.experiences', 'missing-scope'));
      await expectError(command, 'sfcc.experiences');
    });
  });

  describe('asset put', () => {
    it('builds a localized body and assigns the classification folder', async () => {
      const command = await createCommand(
        ContentAssetPut,
        {library: 'SharedLibrary', name: 'Banner', online: true, markup: ['c_body=<p>Hi</p>'], folder: 'promos'},
        {contentId: 'banner'},
      );
      const put = sinon.stub(command.operations, 'putContentAsset').resolves({status: 'created', item: ASSET});
      const assign = sinon.stub(command.operations, 'assignContentToFolder').resolves({});
      await command.run();
      expect(put.firstCall.args.slice(1)).to.deep.equal([
        'SharedLibrary',
        'banner',
        {name: {default: 'Banner'}, online: {default: true}, c_body: {default: {source: '<p>Hi</p>'}}},
      ]);
      expect(assign.firstCall.args.slice(1)).to.deep.equal(['SharedLibrary', 'banner', 'promos', {default: true}]);
    });

    it('reports that the asset was saved when the folder assignment fails', async () => {
      const command = await createCommand(
        ContentAssetPut,
        {library: 'SharedLibrary', name: 'Banner', folder: 'missing'},
        {contentId: 'banner'},
      );
      sinon.stub(command.operations, 'putContentAsset').resolves({status: 'created', item: ASSET});
      sinon
        .stub(command.operations, 'assignContentToFolder')
        .rejects(new ExperiencesRequestError('Failed to assign: not found', 404));
      await expectError(command, 'Content asset banner was created, but assigning it to folder missing failed');
    });
  });

  describe('asset update', () => {
    it('rejects an empty update', async () => {
      const command = await createCommand(ContentAssetUpdate, {library: 'SharedLibrary'}, {contentId: 'banner'});
      await expectError(command, 'Nothing to update');
    });
  });

  describe('asset delete', () => {
    it('deletes with --force', async () => {
      const command = await createCommand(
        ContentAssetDelete,
        {library: 'SharedLibrary', force: true},
        {contentId: 'banner'},
        false,
      );
      sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
      const del = sinon.stub(command.operations, 'deleteContentAsset').resolves();
      const result = await runSilent(() => command.run());
      expect(result).to.deep.equal({contentId: 'banner', libraryId: 'SharedLibrary', deleted: true});
      expect(del.calledOnce).to.equal(true);
    });
  });

  describe('folder list', () => {
    it('flattens the walked tree', async () => {
      const command = await createCommand(ContentFolderList, {library: 'SharedLibrary', folder: 'root'});
      sinon.stub(command.operations, 'walkContentFolder').resolves({
        folder: {id: 'root'},
        content: [],
        folders: [{folder: {id: 'promos', name: {default: 'Promos'}, online: true}, content: [ASSET], folders: []}],
      });
      const result = await command.run();
      expect(result.data).to.deep.equal([
        {
          id: 'promos',
          kind: 'folder',
          name: 'Promos',
          names: {default: 'Promos'},
          folder: 'root',
          path: 'root',
          online: true,
        },
        {
          id: 'banner',
          kind: 'asset',
          name: 'Banner',
          names: {default: 'Banner'},
          folder: 'promos',
          path: 'root/promos',
          online: true,
        },
      ]);
      expect(command.operations.walkContentFolder.firstCall.args[2]).to.deep.equal({
        folderId: 'root',
        depth: undefined,
        includeContent: true,
      });
    });
  });

  describe('folder put', () => {
    it('sends a plain boolean online and the parent', async () => {
      const command = await createCommand(
        ContentFolderPut,
        {library: 'SharedLibrary', name: 'Summer', online: false, parent: 'promos'},
        {folderId: 'summer'},
      );
      const put = sinon.stub(command.operations, 'putContentFolder').resolves({status: 'created', item: {}});
      await command.run();
      expect(put.firstCall.args[3]).to.deep.equal({name: {default: 'Summer'}, online: false, parentFolderId: 'promos'});
    });
  });

  describe('folder delete', () => {
    it('refuses to delete root', async () => {
      const command = await createCommand(
        ContentFolderDelete,
        {library: 'SharedLibrary', force: true},
        {folderId: 'root'},
      );
      sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
      await expectError(command, 'root folder cannot be deleted');
    });
  });

  describe('folder assign', () => {
    it('passes default and position', async () => {
      const command = await createCommand(
        ContentFolderAssign,
        {library: 'SharedLibrary', default: true, position: 2},
        {folderId: 'promos', contentId: 'banner'},
      );
      const assign = sinon.stub(command.operations, 'assignContentToFolder').resolves({});
      await command.run();
      expect(assign.firstCall.args.slice(1)).to.deep.equal([
        'SharedLibrary',
        'banner',
        'promos',
        {default: true, position: 2},
      ]);
    });
  });

  describe('folder unassign', () => {
    it('checks the destructive-operation guard', async () => {
      const command = await createCommand(
        ContentFolderUnassign,
        {library: 'SharedLibrary'},
        {folderId: 'promos', contentId: 'banner'},
      );
      const guard = sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
      const unassign = sinon.stub(command.operations, 'unassignContentFromFolder').resolves();
      await command.run();
      expect(guard.calledOnce).to.equal(true);
      expect(unassign.firstCall.args.slice(1)).to.deep.equal(['SharedLibrary', 'banner', 'promos']);
    });
  });

  describe('buildLibraryItemInput', () => {
    let tmp: string;

    beforeEach(() => {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
    });

    afterEach(() => {
      fs.rmSync(tmp, {recursive: true, force: true});
    });

    it('merges locale flags into localized maps from the file', async () => {
      const file = path.join(tmp, 'asset.json');
      fs.writeFileSync(file, JSON.stringify({name: {default: 'Banner'}, template: 'a.isml'}));
      const input = await buildLibraryItemInput(
        {file, locale: 'fr', name: 'Bannière', attribute: ['c_tag=a=b']},
        {localizedOnline: true},
      );
      expect(input).to.deep.equal({name: {default: 'Banner', fr: 'Bannière'}, template: 'a.isml', c_tag: {fr: 'a=b'}});
    });

    it('rejects attributes without the c_ prefix', async () => {
      try {
        await buildLibraryItemInput({attribute: ['c_=x']}, {localizedOnline: true});
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('c_<id>=<value>');
      }
    });
  });
});
