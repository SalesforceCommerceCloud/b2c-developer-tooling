/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {listSites, getSite} from '../../../src/operations/sites/index.js';
import {B2CInstance} from '../../../src/instance/index.js';

describe('operations/sites', () => {
  let mockInstance: B2CInstance;

  beforeEach(() => {
    mockInstance = new B2CInstance(
      {hostname: 'test.demandware.net'},
      {
        oauth: {clientId: 'test-client', clientSecret: 'test-secret'},
      },
    );
  });

  describe('listSites', () => {
    it('should return empty array (TODO implementation)', async () => {
      const sites = await listSites(mockInstance);
      expect(sites).to.be.an('array');
      expect(sites).to.have.lengthOf(0);
    });
  });

  describe('getSite', () => {
    it('should return null (TODO implementation)', async () => {
      const site = await getSite(mockInstance, 'RefArch');
      expect(site).to.be.null;
    });
  });
});
