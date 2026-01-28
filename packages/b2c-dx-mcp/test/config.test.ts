/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {APPLICATION_INSIGHTS_CONNECTION_STRING} from '../src/config.js';

describe('config', () => {
  describe('APPLICATION_INSIGHTS_CONNECTION_STRING', () => {
    // The connection string behavior depends on NODE_ENV:
    // - In development mode (NODE_ENV=development): undefined (telemetry disabled)
    // - In production mode: returns the connection string

    it('should be undefined in development mode or a valid connection string in production', () => {
      if (process.env.NODE_ENV === 'development') {
        // In development mode, telemetry is disabled
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.be.undefined;
      } else {
        // In production mode, should have a valid connection string
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.be.a('string');
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING!.length).to.be.greaterThan(0);
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.include('InstrumentationKey=');
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.include('IngestionEndpoint=');
      }
    });

    it('should respect NODE_ENV for telemetry gating', () => {
      // This test documents the expected behavior:
      // Tests run without NODE_ENV=development set, so we get the production string
      // bin/dev.js sets NODE_ENV=development, so local dev gets undefined
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.be.undefined;
      } else {
        expect(APPLICATION_INSIGHTS_CONNECTION_STRING).to.not.be.undefined;
      }
    });
  });
});
