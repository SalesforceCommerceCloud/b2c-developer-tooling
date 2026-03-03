/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {formatApiError} from '../../../src/utils/ecdn/base-command.js';

describe('utils/ecdn/base-command', () => {
  describe('formatApiError', () => {
    it('formats object errors as JSON', () => {
      const error = {title: 'Not Found', detail: 'Zone not found'};
      const result = formatApiError(error);
      expect(result).to.equal(JSON.stringify(error));
    });

    it('formats string errors directly', () => {
      const result = formatApiError('Something went wrong');
      expect(result).to.equal('Something went wrong');
    });

    it('formats number errors as string', () => {
      const result = formatApiError(404);
      expect(result).to.equal('404');
    });

    it('formats null errors', () => {
      const result = formatApiError(null);
      expect(result).to.equal('null');
    });

    it('formats undefined errors', () => {
      const result = formatApiError(undefined);
      expect(result).to.equal('undefined');
    });

    it('formats nested object errors', () => {
      const error = {errors: [{code: 1001, message: 'Invalid zone'}]};
      const result = formatApiError(error);
      expect(result).to.include('1001');
      expect(result).to.include('Invalid zone');
    });
  });
});
