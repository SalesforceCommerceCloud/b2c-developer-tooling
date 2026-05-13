/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {formatApiError} from '../../../src/utils/scapi/schemas.js';

describe('utils/scapi/schemas', () => {
  describe('formatApiError', () => {
    it('extracts the standard `message` field from an error object', () => {
      const error = {message: 'Not Found'};
      const response = new Response(null, {status: 404, statusText: 'Not Found'});
      const result = formatApiError(error, response);
      expect(result).to.equal('Not Found');
    });

    it('extracts SCAPI/Problem+JSON `detail` over `title`', () => {
      const error = {detail: 'The widget is missing.', title: 'Widget Error'};
      const response = new Response(null, {status: 422, statusText: 'Unprocessable Entity'});
      const result = formatApiError(error, response);
      expect(result).to.equal('The widget is missing.');
    });

    it('extracts ODS-style nested `error.message`', () => {
      const error = {error: {message: 'Sandbox not found'}};
      const response = new Response(null, {status: 404, statusText: 'Not Found'});
      const result = formatApiError(error, response);
      expect(result).to.equal('Sandbox not found');
    });

    it('extracts OCAPI fault.message', () => {
      const error = {fault: {message: 'Invalid filter expression'}};
      const response = new Response(null, {status: 400, statusText: 'Bad Request'});
      const result = formatApiError(error, response);
      expect(result).to.equal('Invalid filter expression');
    });

    it('falls back to the HTTP status line for non-object errors', () => {
      const response = new Response(null, {status: 500, statusText: 'Internal Server Error'});
      const result = formatApiError('Server error', response);
      expect(result).to.equal('HTTP 500 Internal Server Error');
    });

    it('falls back to the HTTP status line for null errors', () => {
      const response = new Response(null, {status: 400, statusText: 'Bad Request'});
      const result = formatApiError(null, response);
      expect(result).to.equal('HTTP 400 Bad Request');
    });
  });
});
