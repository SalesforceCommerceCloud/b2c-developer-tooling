/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import MrtProjectCreate from '../../../src/commands/mrt/project/create.js';
import MrtProjectDelete from '../../../src/commands/mrt/project/delete.js';
import MrtProjectGet from '../../../src/commands/mrt/project/get.js';
import MrtProjectList from '../../../src/commands/mrt/project/list.js';
import MrtProjectUpdate from '../../../src/commands/mrt/project/update.js';
import MrtMemberAdd from '../../../src/commands/mrt/project/member/add.js';
import MrtMemberGet from '../../../src/commands/mrt/project/member/get.js';
import MrtMemberList from '../../../src/commands/mrt/project/member/list.js';
import MrtMemberRemove from '../../../src/commands/mrt/project/member/remove.js';
import MrtMemberUpdate from '../../../src/commands/mrt/project/member/update.js';
import MrtNotificationCreate from '../../../src/commands/mrt/project/notification/create.js';
import MrtNotificationDelete from '../../../src/commands/mrt/project/notification/delete.js';
import MrtNotificationGet from '../../../src/commands/mrt/project/notification/get.js';
import MrtNotificationList from '../../../src/commands/mrt/project/notification/list.js';
import MrtNotificationUpdate from '../../../src/commands/mrt/project/notification/update.js';
import MrtBundleSave from '../../../src/commands/mrt/bundle/save.js';

/**
 * W-23941081: `storefront` is an additive alias for `project`.
 * These tests assert the alias declarations statically (no network, no build
 * dependency); oclif's runtime resolution of declared aliases is already
 * exercised by the shipped `sandbox` -> `ods` alias.
 */
describe('mrt storefront alias', () => {
  describe('command-topic aliases', () => {
    const cases: Array<[{aliases: string[]}, string]> = [
      [MrtProjectCreate, 'mrt:storefront:create'],
      [MrtProjectDelete, 'mrt:storefront:delete'],
      [MrtProjectGet, 'mrt:storefront:get'],
      [MrtProjectList, 'mrt:storefront:list'],
      [MrtProjectUpdate, 'mrt:storefront:update'],
      [MrtMemberAdd, 'mrt:storefront:member:add'],
      [MrtMemberGet, 'mrt:storefront:member:get'],
      [MrtMemberList, 'mrt:storefront:member:list'],
      [MrtMemberRemove, 'mrt:storefront:member:remove'],
      [MrtMemberUpdate, 'mrt:storefront:member:update'],
      [MrtNotificationCreate, 'mrt:storefront:notification:create'],
      [MrtNotificationDelete, 'mrt:storefront:notification:delete'],
      [MrtNotificationGet, 'mrt:storefront:notification:get'],
      [MrtNotificationList, 'mrt:storefront:notification:list'],
      [MrtNotificationUpdate, 'mrt:storefront:notification:update'],
    ];

    for (const [command, expectedAlias] of cases) {
      it(`declares ${expectedAlias}`, () => {
        expect(command.aliases).to.include(expectedAlias);
      });
    }
  });

  describe('--storefront flag alias', () => {
    it('exposes storefront as an alias on the central project flag', () => {
      const project = MrtCommand.baseFlags.project as {aliases?: string[]; char?: string};
      expect(project.aliases).to.include('storefront');
    });

    it('keeps -p as the short flag; --storefront is long-form only', () => {
      const project = MrtCommand.baseFlags.project as {aliases?: string[]; char?: string};
      expect(project.char).to.equal('p');
      // Aliases are plain strings (no per-alias char), so --storefront has no short flag by construction.
      expect(project.aliases).to.satisfy((a: unknown[]) => a.every((x) => typeof x === 'string'));
    });

    it('mirrors the alias on the inline project flag of bundle save', () => {
      const project = MrtBundleSave.flags.project as {aliases?: string[]};
      expect(project.aliases).to.include('storefront');
    });
  });

  describe('-s short flag is unchanged (no regression)', () => {
    it('bundle save -s still means --save-dir', () => {
      const saveDir = MrtBundleSave.flags['save-dir'] as {char?: string};
      expect(saveDir.char).to.equal('s');
    });

    it('project create -s still means --slug', () => {
      const slug = MrtProjectCreate.flags.slug as {char?: string};
      expect(slug.char).to.equal('s');
    });
  });

  describe('MRT_STOREFRONT env var support', () => {
    const project = MrtCommand.baseFlags.project as {default?: (ctx: unknown) => Promise<string | undefined>};
    const envKeys = ['SFCC_MRT_PROJECT', 'MRT_STOREFRONT', 'SFCC_MRT_STOREFRONT'] as const;
    let saved: Record<string, string | undefined>;

    beforeEach(() => {
      saved = {};
      for (const k of envKeys) {
        saved[k] = process.env[k];
        delete process.env[k];
      }
    });

    afterEach(() => {
      for (const k of envKeys) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    });

    async function resolve(): Promise<string | undefined> {
      return project.default!({});
    }

    it('resolves the value from MRT_STOREFRONT', async () => {
      process.env.MRT_STOREFRONT = 'shop-a';
      expect(await resolve()).to.equal('shop-a');
    });

    it('resolves the value from SFCC_MRT_STOREFRONT', async () => {
      process.env.SFCC_MRT_STOREFRONT = 'shop-b';
      expect(await resolve()).to.equal('shop-b');
    });

    it('prefers SFCC_MRT_PROJECT over the storefront vars (project stays canonical)', async () => {
      process.env.SFCC_MRT_PROJECT = 'proj';
      process.env.MRT_STOREFRONT = 'shop';
      expect(await resolve()).to.equal('proj');
    });

    it('returns undefined when none are set', async () => {
      expect(await resolve()).to.equal(undefined);
    });
  });
});
