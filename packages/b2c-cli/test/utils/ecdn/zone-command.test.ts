/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnSpeedGet from '../../../src/commands/ecdn/speed/get.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

/**
 * Tests zone name resolution in EcdnZoneCommand, using a concrete zone command.
 */
describe('utils/ecdn/zone-command', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  const ZONE_ID = 'a'.repeat(32);

  const all = Array.from({length: 63}, (_, i) => ({
    zoneId: String(i).padStart(32, '0'),
    name: `Zone-${i}.cc-ecdn.net`,
  }));

  async function makeCommand(zoneFlag: string) {
    const command: any = await createTestCommand(
      EcdnSpeedGet,
      hooks.getConfig(),
      {zone: zoneFlag, 'tenant-id': 'zzxy_prd'},
      {},
    );
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    const get = sinon.spy(async (_path: string, opts: any) => {
      const {offset, limit} = opts.params.query;
      return {data: {data: all.slice(offset, offset + limit)}};
    });
    Object.defineProperty(command, '_cdnZonesClient', {value: {GET: get}, configurable: true, writable: true});
    return {command, get};
  }

  it('resolves a zone name that is beyond the first 25 zones (case-insensitive)', async () => {
    const {command} = await makeCommand('zone-60.CC-ECDN.net');

    expect(await command.resolveZoneId()).to.equal(all[60].zoneId);
  });

  it('skips the zone lookup for a 32-char hex zone ID', async () => {
    const {command, get} = await makeCommand(ZONE_ID);

    expect(await command.resolveZoneId()).to.equal(ZONE_ID);
    expect(get.called).to.equal(false);
  });

  it('errors with the available zones when the name is not found', async () => {
    const {command} = await makeCommand('missing-zone');
    const errorStub = sinon.stub(command, 'error').throws(new Error('not found'));

    try {
      await command.resolveZoneId();
      expect.fail('should throw');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Zone-62.cc-ecdn.net');
    }
  });

  it('caches zones for the duration of the command', async () => {
    const {command, get} = await makeCommand('zone-1.cc-ecdn.net');

    await command.fetchZones();
    await command.fetchZones();

    // 63 zones => two pages, fetched once
    expect(get.callCount).to.equal(2);
  });
});
