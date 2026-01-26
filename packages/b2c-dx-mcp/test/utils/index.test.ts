/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {loadAppInsightsKey} from '../../src/utils/index.js';

describe('utils', () => {
  describe('loadAppInsightsKey', () => {
    it('should return a connection string', () => {
      const key = loadAppInsightsKey();
      expect(key).to.be.a('string');
    });

    it('should return a string containing InstrumentationKey', () => {
      const key = loadAppInsightsKey();
      expect(key).to.include('InstrumentationKey=');
    });

    it('should return a valid Application Insights connection string format', () => {
      const key = loadAppInsightsKey();
      // Connection string should have key=value pairs separated by semicolons
      expect(key).to.match(/InstrumentationKey=[^;]+/);
      expect(key).to.match(/IngestionEndpoint=[^;]+/);
    });
  });
});
