/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {ExperiencesRequestError, ExperiencesUnavailableError} from '@salesforce/b2c-tooling-sdk/operations/content';
import ContentSlotConfigDelete from '../../../../src/commands/content/slot/config/delete.js';
import ContentSlotConfigList from '../../../../src/commands/content/slot/config/list.js';
import ContentSlotConfigPut from '../../../../src/commands/content/slot/config/put.js';
import ContentSlotConfigUpdate from '../../../../src/commands/content/slot/config/update.js';
import ContentSlotGet from '../../../../src/commands/content/slot/get.js';
import ContentSlotList from '../../../../src/commands/content/slot/list.js';
import {buildSlotConfigurationInput} from '../../../../src/utils/content/slots.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

const CONFIG = {
  slotId: 'home-main',
  configurationId: 'summer',
  context: 'global',
  enabled: true,
  default: false,
  assignmentInformation: {active: true, enabled: true},
  slotContent: {type: 'content_assets', contentAssetIds: ['banner-1', 'banner-2']},
  template: 'slots/content/htmlslotcontainer.isml',
  schedule: {startDate: '2026-06-01T00:00:00Z'},
};

describe('content slot', () => {
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

  describe('list', () => {
    it('summarizes slots with active configurations', async () => {
      const command = await createCommand(ContentSlotList, {'site-id': 'RefArch', context: 'global'});
      sinon.stub(command.operations, 'searchSlots').resolves({
        total: 1,
        hits: [{slotId: 'home-main', contextType: 'global', slotConfigurations: [CONFIG, {configurationId: 'old'}]}],
      });
      const result = await command.run();
      expect(result.data).to.deep.equal([
        {
          slotId: 'home-main',
          contextType: 'global',
          description: '',
          configurations: 2,
          activeConfigurations: ['summer'],
        },
      ]);
      expect(command.operations.searchSlots.firstCall.args[1]).to.deep.equal({
        siteId: 'RefArch',
        contextType: 'global',
        all: true,
      });
    });

    it('turns a missing scope into a command error', async () => {
      const command = await createCommand(ContentSlotList, {'site-id': 'RefArch'});
      sinon
        .stub(command.operations, 'searchSlots')
        .rejects(new ExperiencesUnavailableError('needs sfcc.experiences', 'missing-scope'));
      try {
        await runSilent(() => command.run());
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('sfcc.experiences');
      }
    });
  });

  describe('get', () => {
    it('returns the slot with its configurations', async () => {
      const command = await createCommand(
        ContentSlotGet,
        {'site-id': 'RefArch', context: 'global'},
        {slotId: 'home-main'},
      );
      const slot = {slotId: 'home-main', contextType: 'global', slotConfigurations: [CONFIG]};
      sinon.stub(command.operations, 'getSlot').resolves(slot);
      expect(await command.run()).to.equal(slot);
      expect(command.operations.getSlot.firstCall.args.slice(1)).to.deep.equal([
        'home-main',
        'global',
        {siteId: 'RefArch'},
      ]);
    });
  });

  describe('config list', () => {
    it('flattens configurations into rows', async () => {
      const command = await createCommand(ContentSlotConfigList, {'site-id': 'RefArch', 'slot-id': 'home-main'});
      sinon.stub(command.operations, 'searchSlotConfigurations').resolves({total: 1, hits: [CONFIG]});
      const result = await command.run();
      expect(result.data[0]).to.include({
        slotId: 'home-main',
        configurationId: 'summer',
        active: true,
        contentType: 'content_assets',
        schedule: '2026-06-01T00:00:00Z → …',
      });
      expect(result.data[0].content).to.deep.equal(['banner-1', 'banner-2']);
      expect(command.operations.searchSlotConfigurations.firstCall.args[1]).to.include({
        slotId: 'home-main',
        all: true,
      });
    });
  });

  describe('config put', () => {
    it('builds the body from flags', async () => {
      const command = await createCommand(
        ContentSlotConfigPut,
        {
          'site-id': 'RefArch',
          'content-assets': 'banner-1, banner-2',
          template: 'slots/content/htmlslotcontainer.isml',
          enabled: true,
          'customer-groups': 'Everyone',
        },
        {slotId: 'home-main', configurationId: 'summer'},
      );
      sinon.stub(command.operations, 'putSlotConfiguration').resolves({status: 'created', configuration: CONFIG});
      const result = await command.run();
      expect(result.status).to.equal('created');
      const [, slotId, configurationId, body, options] = command.operations.putSlotConfiguration.firstCall.args;
      expect([slotId, configurationId, options]).to.deep.equal(['home-main', 'summer', {siteId: 'RefArch'}]);
      expect(body).to.deep.equal({
        slotContent: {type: 'content_assets', contentAssetIds: ['banner-1', 'banner-2']},
        template: 'slots/content/htmlslotcontainer.isml',
        enabled: true,
        customerGroups: ['Everyone'],
      });
    });

    it('requires content and a template before calling the API', async () => {
      const command = await createCommand(
        ContentSlotConfigPut,
        {'site-id': 'RefArch', template: 'slots/x.isml'},
        {slotId: 'home-main', configurationId: 'summer'},
      );
      const put = sinon.stub(command.operations, 'putSlotConfiguration');
      try {
        await runSilent(() => command.run());
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('Slot content is required');
      }
      expect(put.called).to.equal(false);
    });

    it('surfaces API rejections', async () => {
      const command = await createCommand(
        ContentSlotConfigPut,
        {'site-id': 'RefArch', html: '<p>hi</p>', template: 'slots/x.isml'},
        {slotId: 'missing', configurationId: 'summer'},
      );
      sinon
        .stub(command.operations, 'putSlotConfiguration')
        .rejects(new ExperiencesRequestError('Slot Not Found', 404));
      try {
        await runSilent(() => command.run());
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('Slot Not Found');
      }
    });
  });

  describe('config update', () => {
    it('sends only the changed fields', async () => {
      const command = await createCommand(
        ContentSlotConfigUpdate,
        {'site-id': 'RefArch', enabled: false, rank: 2},
        {slotId: 'home-main', configurationId: 'summer'},
      );
      sinon.stub(command.operations, 'updateSlotConfiguration').resolves(CONFIG);
      await command.run();
      const {args} = command.operations.updateSlotConfiguration.firstCall;
      const [changes, options] = args.slice(3);
      expect(changes).to.deep.equal({enabled: false, rank: 2});
      expect(options).to.deep.equal({siteId: 'RefArch', context: undefined});
    });

    it('rejects an empty update', async () => {
      const command = await createCommand(
        ContentSlotConfigUpdate,
        {'site-id': 'RefArch'},
        {slotId: 'home-main', configurationId: 'summer'},
      );
      try {
        await runSilent(() => command.run());
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('Nothing to update');
      }
    });
  });

  describe('config delete', () => {
    it('deletes with --force', async () => {
      const command = await createCommand(
        ContentSlotConfigDelete,
        {'site-id': 'RefArch', force: true},
        {slotId: 'home-main', configurationId: 'summer'},
        false,
      );
      sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
      const del = sinon.stub(command.operations, 'deleteSlotConfiguration').resolves();
      const result = await runSilent(() => command.run());
      expect(result).to.deep.equal({slotId: 'home-main', configurationId: 'summer', deleted: true});
      expect(del.firstCall.args.slice(1)).to.deep.equal([
        'home-main',
        'summer',
        {siteId: 'RefArch', context: undefined},
      ]);
    });
  });

  describe('buildSlotConfigurationInput', () => {
    let tmp: string;

    beforeEach(() => {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slot-'));
    });

    afterEach(() => {
      fs.rmSync(tmp, {recursive: true, force: true});
    });

    it('lets flags override the file', async () => {
      const file = path.join(tmp, 'config.json');
      fs.writeFileSync(file, JSON.stringify({template: 'a.isml', enabled: true, schedule: {startDate: 'S'}}));
      const input = await buildSlotConfigurationInput({file, enabled: false, 'end-date': 'E', html: '<b>x</b>'});
      expect(input).to.deep.equal({
        template: 'a.isml',
        enabled: false,
        schedule: {startDate: 'S', endDate: 'E'},
        slotContent: {type: 'html', body: {default: {source: '<b>x</b>'}}},
      });
    });

    it('rejects conflicting content flags', async () => {
      try {
        await buildSlotConfigurationInput({products: 'a', categories: 'b'});
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.equal('Use only one of --products, --categories');
      }
    });
  });
});
