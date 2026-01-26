/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {APPLICATION_INSIGHTS_CONNECTION_STRING} from '../src/config.js';

describe('config', () => {
  describe('APPLICATION_INSIGHTS_CONNECTION_STRING', () => {
    it('should export a non-empty connection string', () => {
      expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.be.a('string');
      expect(APPLICATION_INSIGHTS_CONNECTION_STRING.length).to.be.greaterThan(0);
    });

    it('should contain InstrumentationKey', () => {
      expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.include('InstrumentationKey=');
    });

    it('should contain IngestionEndpoint', () => {
      expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.include('IngestionEndpoint=');
    });
  });
});
