/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  getApiErrorMessage,
  isOcapiDeprecatedFault,
  throwOcapiError,
  OcapiDeprecatedError,
  OCAPI_DEPRECATED_MESSAGE,
  ocapiDeprecatedMessage,
} from '../../src/clients/error-utils.js';

describe('getApiErrorMessage', () => {
  // Mock response object for testing
  const mockResponse = (status: number, statusText: string) => ({
    status,
    statusText,
  });

  describe('ODS/SLAS error pattern', () => {
    it('extracts message from { error: { message } } structure', () => {
      const error = {error: {message: 'Sandbox not found'}};
      const response = mockResponse(404, 'Not Found');
      expect(getApiErrorMessage(error, response)).to.equal('Sandbox not found');
    });

    it('ignores error.error if message is not a string', () => {
      const error = {error: {message: 123}};
      const response = mockResponse(500, 'Internal Server Error');
      expect(getApiErrorMessage(error, response)).to.equal('HTTP 500 Internal Server Error');
    });

    it('ignores error.error if message is empty', () => {
      const error = {error: {message: ''}};
      const response = mockResponse(500, 'Internal Server Error');
      expect(getApiErrorMessage(error, response)).to.equal('HTTP 500 Internal Server Error');
    });
  });

  describe('OCAPI fault pattern', () => {
    it('extracts message from { fault: { message } } structure', () => {
      const error = {fault: {type: 'NotFoundException', message: 'Site not found'}};
      const response = mockResponse(404, 'Not Found');
      expect(getApiErrorMessage(error, response)).to.equal('Site not found');
    });

    it('ignores fault if message is not a string', () => {
      const error = {fault: {type: 'Error', message: null}};
      const response = mockResponse(500, 'Internal Server Error');
      expect(getApiErrorMessage(error, response)).to.equal('HTTP 500 Internal Server Error');
    });
  });

  describe('SCAPI/Problem+JSON pattern', () => {
    it('extracts detail from { detail } structure', () => {
      const error = {type: 'NotFound', title: 'Resource Not Found', detail: 'The requested schema was not found'};
      const response = mockResponse(404, 'Not Found');
      expect(getApiErrorMessage(error, response)).to.equal('The requested schema was not found');
    });

    it('falls back to title if detail is missing', () => {
      const error = {type: 'NotFound', title: 'Resource Not Found'};
      const response = mockResponse(404, 'Not Found');
      expect(getApiErrorMessage(error, response)).to.equal('Resource Not Found');
    });

    it('ignores detail if it is empty', () => {
      const error = {title: 'Some Title', detail: ''};
      const response = mockResponse(400, 'Bad Request');
      expect(getApiErrorMessage(error, response)).to.equal('Some Title');
    });
  });

  describe('standard Error pattern', () => {
    it('extracts message from { message } structure', () => {
      const error = {message: 'Something went wrong'};
      const response = mockResponse(500, 'Internal Server Error');
      expect(getApiErrorMessage(error, response)).to.equal('Something went wrong');
    });

    it('works with actual Error objects', () => {
      const error = new Error('Connection refused');
      const response = mockResponse(503, 'Service Unavailable');
      expect(getApiErrorMessage(error, response)).to.equal('Connection refused');
    });
  });

  describe('HTTP status fallback', () => {
    it('returns HTTP status when error is null', () => {
      const response = mockResponse(521, 'Web Server Is Down');
      expect(getApiErrorMessage(null, response)).to.equal('HTTP 521 Web Server Is Down');
    });

    it('returns HTTP status when error is undefined', () => {
      const response = mockResponse(502, 'Bad Gateway');
      expect(getApiErrorMessage(undefined, response)).to.equal('HTTP 502 Bad Gateway');
    });

    it('returns HTTP status when error is not an object', () => {
      const response = mockResponse(500, 'Internal Server Error');
      expect(getApiErrorMessage('some string error', response)).to.equal('HTTP 500 Internal Server Error');
      expect(getApiErrorMessage(123, response)).to.equal('HTTP 500 Internal Server Error');
    });

    it('returns HTTP status when error object has no recognized fields', () => {
      const error = {someField: 'value', html: '<html>...</html>'};
      const response = mockResponse(521, 'Sandbox Down');
      expect(getApiErrorMessage(error, response)).to.equal('HTTP 521 Sandbox Down');
    });

    it('does not include HTML content in the message', () => {
      const error = {body: '<!DOCTYPE html><html><body>Error page</body></html>'};
      const response = mockResponse(521, 'Web Server Is Down');
      const message = getApiErrorMessage(error, response);
      expect(message).to.equal('HTTP 521 Web Server Is Down');
      expect(message).to.not.include('<html>');
    });
  });

  describe('priority order', () => {
    it('prioritizes error.error.message over other fields', () => {
      const error = {
        error: {message: 'ODS message'},
        fault: {message: 'OCAPI message'},
        detail: 'SCAPI detail',
        message: 'Standard message',
      };
      const response = mockResponse(500, 'Error');
      expect(getApiErrorMessage(error, response)).to.equal('ODS message');
    });

    it('prioritizes fault.message over SCAPI and standard message', () => {
      const error = {
        fault: {message: 'OCAPI message'},
        detail: 'SCAPI detail',
        message: 'Standard message',
      };
      const response = mockResponse(500, 'Error');
      expect(getApiErrorMessage(error, response)).to.equal('OCAPI message');
    });

    it('prioritizes detail over title and standard message', () => {
      const error = {
        title: 'Error Title',
        detail: 'Error Detail',
        message: 'Standard message',
      };
      const response = mockResponse(500, 'Error');
      expect(getApiErrorMessage(error, response)).to.equal('Error Detail');
    });

    it('prioritizes title over standard message', () => {
      const error = {
        title: 'Error Title',
        message: 'Standard message',
      };
      const response = mockResponse(500, 'Error');
      expect(getApiErrorMessage(error, response)).to.equal('Error Title');
    });
  });

  describe('works with real Response objects', () => {
    it('accepts a Response-like object', () => {
      // Simulate what openapi-fetch returns
      const error = null;
      const response = {
        status: 521,
        statusText: 'Web Server Is Down',
        ok: false,
        headers: new Headers(),
      };
      expect(getApiErrorMessage(error, response as Response)).to.equal('HTTP 521 Web Server Is Down');
    });
  });

  describe('OCAPI deprecation (D1)', () => {
    const deprecatedFault = {
      fault: {
        type: 'OcapiDeprecatedException',
        message: 'OCAPI has been deprecated. Access is not available for this instance.',
      },
    };

    it('isOcapiDeprecatedFault matches the deprecation fault type', () => {
      expect(isOcapiDeprecatedFault(deprecatedFault)).to.equal(true);
    });

    it('isOcapiDeprecatedFault is false for other faults and non-objects', () => {
      expect(isOcapiDeprecatedFault({fault: {type: 'NotFoundException', message: 'x'}})).to.equal(false);
      expect(isOcapiDeprecatedFault({fault: {type: 'InvalidAccessTokenException'}})).to.equal(false);
      expect(isOcapiDeprecatedFault(null)).to.equal(false);
      expect(isOcapiDeprecatedFault('string')).to.equal(false);
      expect(isOcapiDeprecatedFault({})).to.equal(false);
    });

    it('getApiErrorMessage is a pure extractor — it does NOT substitute the deprecation fault', () => {
      // Deprecation handling lives at the OCAPI-terminal call sites (throwOcapiError),
      // not in the extractor, so the raw fault message comes through here.
      const message = getApiErrorMessage(deprecatedFault, mockResponse(403, 'Forbidden'));
      expect(message).to.equal('OCAPI has been deprecated. Access is not available for this instance.');
    });
  });

  describe('ocapiDeprecatedMessage', () => {
    it('uses generic sfcc.* phrasing when no scopes are given', () => {
      const msg = ocapiDeprecatedMessage();
      expect(msg).to.equal(OCAPI_DEPRECATED_MESSAGE);
      expect(msg).to.include('OCAPI is deprecated');
      expect(msg).to.include('the required sfcc.* scopes');
      expect(msg).to.include('#scapi-authentication');
    });

    it('names a single required scope', () => {
      const msg = ocapiDeprecatedMessage(['sfcc.scripts.rw']);
      expect(msg).to.include('the "sfcc.scripts.rw" scope');
    });

    it('lists multiple scopes with "or"', () => {
      const msg = ocapiDeprecatedMessage(['sfcc.scripts', 'sfcc.scripts.rw']);
      expect(msg).to.include('the "sfcc.scripts" or "sfcc.scripts.rw" scope');
    });
  });

  describe('throwOcapiError', () => {
    it('throws OcapiDeprecatedError for the deprecation fault, naming the operation scope', () => {
      const fault = {fault: {type: 'OcapiDeprecatedException', message: 'deprecated'}};
      try {
        throwOcapiError(fault, mockResponse(403, 'Forbidden'), 'Failed to list code versions', [
          'sfcc.scripts',
          'sfcc.scripts.rw',
        ]);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(OcapiDeprecatedError);
        expect((e as Error).message).to.include('the "sfcc.scripts" or "sfcc.scripts.rw" scope');
        expect((e as Error).cause).to.equal(fault);
      }
    });

    it('uses the generic message when no scopes are supplied (OCAPI-only operations)', () => {
      const fault = {fault: {type: 'OcapiDeprecatedException', message: 'deprecated'}};
      try {
        throwOcapiError(fault, mockResponse(403, 'Forbidden'), 'Failed to search users');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(OcapiDeprecatedError);
        expect((e as Error).message).to.include('the required sfcc.* scopes');
      }
    });

    it('prefixes non-deprecation errors with the fault message and attaches cause', () => {
      const fault = {fault: {type: 'NotFoundException', message: 'Site not found'}};
      try {
        throwOcapiError(fault, mockResponse(404, 'Not Found'), 'Failed to list code versions');
        expect.fail('should have thrown');
      } catch (e) {
        const err = e as Error;
        expect(err).to.be.instanceOf(Error);
        expect(err).to.not.be.instanceOf(OcapiDeprecatedError);
        expect(err.message).to.equal('Failed to list code versions: Site not found');
        expect(err.cause).to.equal(fault);
      }
    });
  });
});
