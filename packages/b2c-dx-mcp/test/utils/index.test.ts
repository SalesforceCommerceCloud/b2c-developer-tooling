/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {loadAppInsightsKey} from '../../src/utils/index.js';

describe('utils', () => {
  describe('loadAppInsightsKey', () => {
    // In development mode (NODE_ENV=development), returns undefined to disable telemetry
    // In production mode, returns the connection string

    it('should return undefined in development mode or a valid connection string in production', () => {
      const key = loadAppInsightsKey();

      if (process.env.NODE_ENV === 'development') {
        expect(key).to.be.undefined;
      } else {
        expect(key).to.be.a('string');
        expect(key).to.include('InstrumentationKey=');
        expect(key).to.include('IngestionEndpoint=');
      }
    });

    it('should gate telemetry based on NODE_ENV', () => {
      const key = loadAppInsightsKey();
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        // Development mode: telemetry disabled
        expect(key).to.be.undefined;
      } else {
        // Production mode: telemetry enabled
        expect(key).to.not.be.undefined;
      }
    });
  });
});
