/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {ExperiencesUnavailableError} from '@salesforce/b2c-tooling-sdk/operations/content';
import ContentTypesGet from '../../../../src/commands/content/types/get.js';
import ContentTypesList from '../../../../src/commands/content/types/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

const PAGE_TYPES = [{id: 'homePage', name: {default: 'Home'}, regionDefinitions: [{id: 'main'}], archType: 'headless'}];
const COMPONENT_TYPES = [
  {
    id: 'Content.hero',
    name: {default: 'Hero'},
    group: {id: 'Content'},
    attributeDefinitionGroups: [{attributeDefinitions: [{id: 'title'}, {id: 'height'}]}],
  },
];

describe('content types', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(Cmd: any, flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = await createTestCommand(Cmd, hooks.getConfig(), flags, args);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => ({config: {}}));
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command.operations, 'listPageTypes').resolves(PAGE_TYPES);
    sinon.stub(command.operations, 'listComponentTypes').resolves(COMPONENT_TYPES);
    return command;
  }

  describe('list', () => {
    it('lists page and component types', async () => {
      const command = await createCommand(ContentTypesList, {'site-id': 'RefArch'});
      const result = await command.run();
      expect(result.data).to.deep.equal([
        {id: 'homePage', kind: 'page', name: 'Home', group: '', regions: ['main'], attributes: 0, archType: 'headless'},
        {
          id: 'Content.hero',
          kind: 'component',
          name: 'Hero',
          group: 'Content',
          regions: [],
          attributes: 2,
          archType: '',
        },
      ]);
      expect(command.operations.listPageTypes.firstCall.args[1]).to.deep.equal({siteId: 'RefArch'});
    });

    it('filters by kind', async () => {
      const command = await createCommand(ContentTypesList, {'site-id': 'RefArch', kind: 'component'});
      const result = await command.run();
      expect(command.operations.listPageTypes.called).to.equal(false);
      expect(result.data.map((t: {id: string}) => t.id)).to.deep.equal(['Content.hero']);
    });

    it('reports a clear error when the Experiences API is unavailable', async () => {
      const command = await createCommand(ContentTypesList, {'site-id': 'RefArch'});
      command.operations.listPageTypes.rejects(
        new ExperiencesUnavailableError('needs sfcc.experiences', 'missing-scope'),
      );
      try {
        await runSilent(() => command.run());
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('sfcc.experiences');
      }
    });
  });

  describe('get', () => {
    it('finds component types and accepts the library prefix', async () => {
      const command = await createCommand(ContentTypesGet, {'site-id': 'RefArch'}, {typeId: 'component.Content.hero'});
      const result = await command.run();
      expect(result).to.include({id: 'Content.hero', kind: 'component'});
    });

    it('fails for unknown types', async () => {
      const command = await createCommand(ContentTypesGet, {'site-id': 'RefArch'}, {typeId: 'nope'});
      try {
        await runSilent(() => command.run());
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('not deployed for site RefArch');
      }
    });
  });
});
