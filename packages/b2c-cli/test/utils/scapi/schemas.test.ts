/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {formatApiError} from '../../../src/utils/scapi/schemas.js';

describe('utils/scapi/schemas', () => {
  describe('formatApiError', () => {
    it('formats error from response', () => {
      const error = {message: 'Not Found'};
      const response = new Response(null, {status: 404, statusText: 'Not Found'});
      const result = formatApiError(error, response);
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(0);
    });

    it('formats string error', () => {
      const response = new Response(null, {status: 500});
      const result = formatApiError('Server error', response);
      expect(result).to.be.a('string');
    });

    it('formats null error', () => {
      const response = new Response(null, {status: 400});
      const result = formatApiError(null, response);
      expect(result).to.be.a('string');
    });
  });
});
