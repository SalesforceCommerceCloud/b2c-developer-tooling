/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  NetworkError,
  classifyNetworkError,
  isNetworkError,
  wrapNetworkError,
  describeNetworkErrorKind,
  type NetworkErrorKind,
} from '../../src/errors/network-error.js';

describe('errors/network-error', () => {
  describe('classifyNetworkError', () => {
    it('classifies ECONNRESET as connection-reset', () => {
      const error = Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'});
      expect(classifyNetworkError(error)).to.equal('connection-reset');
    });

    it('classifies UND_ERR_SOCKET as connection-reset', () => {
      const error = Object.assign(new Error('undici socket error'), {code: 'UND_ERR_SOCKET'});
      expect(classifyNetworkError(error)).to.equal('connection-reset');
    });

    it('classifies EPIPE as connection-reset', () => {
      const error = Object.assign(new Error('broken pipe'), {code: 'EPIPE'});
      expect(classifyNetworkError(error)).to.equal('connection-reset');
    });

    it('classifies socket hang up message as connection-reset', () => {
      const error = new Error('socket hang up');
      expect(classifyNetworkError(error)).to.equal('connection-reset');
    });

    it('classifies ETIMEDOUT as timeout', () => {
      const error = Object.assign(new Error('connection timed out'), {code: 'ETIMEDOUT'});
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('classifies UND_ERR_HEADERS_TIMEOUT as timeout', () => {
      const error = Object.assign(new Error('headers timeout'), {code: 'UND_ERR_HEADERS_TIMEOUT'});
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('classifies UND_ERR_BODY_TIMEOUT as timeout', () => {
      const error = Object.assign(new Error('body timeout'), {code: 'UND_ERR_BODY_TIMEOUT'});
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('classifies UND_ERR_CONNECT_TIMEOUT as timeout', () => {
      const error = Object.assign(new Error('connect timeout'), {code: 'UND_ERR_CONNECT_TIMEOUT'});
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('classifies TimeoutError by name', () => {
      const error = Object.assign(new Error('timeout'), {name: 'TimeoutError'});
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('classifies timeout message as timeout', () => {
      const error = new Error('request timeout exceeded');
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('classifies ENOTFOUND as dns', () => {
      const error = Object.assign(new Error('getaddrinfo ENOTFOUND'), {code: 'ENOTFOUND'});
      expect(classifyNetworkError(error)).to.equal('dns');
    });

    it('classifies EAI_AGAIN as dns', () => {
      const error = Object.assign(new Error('temporary dns failure'), {code: 'EAI_AGAIN'});
      expect(classifyNetworkError(error)).to.equal('dns');
    });

    it('classifies ECONNREFUSED as connection-refused', () => {
      const error = Object.assign(new Error('connection refused'), {code: 'ECONNREFUSED'});
      expect(classifyNetworkError(error)).to.equal('connection-refused');
    });

    it('classifies CERT_* codes as tls', () => {
      const error = Object.assign(new Error('cert error'), {code: 'CERT_HAS_EXPIRED'});
      expect(classifyNetworkError(error)).to.equal('tls');
    });

    it('classifies ERR_TLS_* codes as tls', () => {
      const error = Object.assign(new Error('tls error'), {code: 'ERR_TLS_CERT_ALTNAME_INVALID'});
      expect(classifyNetworkError(error)).to.equal('tls');
    });

    it('classifies DEPTH_ZERO_SELF_SIGNED_CERT as tls', () => {
      const error = Object.assign(new Error('self signed cert'), {code: 'DEPTH_ZERO_SELF_SIGNED_CERT'});
      expect(classifyNetworkError(error)).to.equal('tls');
    });

    it('classifies AbortError by name', () => {
      const error = Object.assign(new Error('aborted'), {name: 'AbortError'});
      expect(classifyNetworkError(error)).to.equal('aborted');
    });

    it('classifies undici nested cause with ECONNRESET', () => {
      const cause = Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'});
      const error = Object.assign(new TypeError('fetch failed'), {cause});
      expect(classifyNetworkError(error)).to.equal('connection-reset');
    });

    it('classifies undici nested cause with ETIMEDOUT', () => {
      const cause = Object.assign(new Error('timeout'), {code: 'ETIMEDOUT'});
      const error = Object.assign(new TypeError('fetch failed'), {cause});
      expect(classifyNetworkError(error)).to.equal('timeout');
    });

    it('returns unknown for unrecognized error', () => {
      const error = new Error('some random error');
      expect(classifyNetworkError(error)).to.equal('unknown');
    });

    it('returns unknown for non-object', () => {
      expect(classifyNetworkError(null)).to.equal('unknown');
      expect(classifyNetworkError('string')).to.equal('unknown');
    });
  });

  describe('isNetworkError', () => {
    it('returns true for TypeError with "fetch failed" message', () => {
      const error = new TypeError('fetch failed');
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for TypeError with nested cause', () => {
      const cause = Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'});
      const error = Object.assign(new TypeError('fetch failed'), {cause});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for ECONNRESET', () => {
      const error = Object.assign(new Error('reset'), {code: 'ECONNRESET'});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for ETIMEDOUT', () => {
      const error = Object.assign(new Error('timeout'), {code: 'ETIMEDOUT'});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for ENOTFOUND', () => {
      const error = Object.assign(new Error('not found'), {code: 'ENOTFOUND'});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for ECONNREFUSED', () => {
      const error = Object.assign(new Error('refused'), {code: 'ECONNREFUSED'});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for undici timeout codes', () => {
      expect(isNetworkError(Object.assign(new Error('timeout'), {code: 'UND_ERR_HEADERS_TIMEOUT'}))).to.be.true;
      expect(isNetworkError(Object.assign(new Error('timeout'), {code: 'UND_ERR_BODY_TIMEOUT'}))).to.be.true;
      expect(isNetworkError(Object.assign(new Error('timeout'), {code: 'UND_ERR_CONNECT_TIMEOUT'}))).to.be.true;
    });

    it('returns true for TLS error codes', () => {
      expect(isNetworkError(Object.assign(new Error('cert'), {code: 'CERT_HAS_EXPIRED'}))).to.be.true;
      expect(isNetworkError(Object.assign(new Error('tls'), {code: 'ERR_TLS_CERT_ALTNAME_INVALID'}))).to.be.true;
    });

    it('returns true for AbortError', () => {
      const error = Object.assign(new Error('aborted'), {name: 'AbortError'});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns true for TimeoutError', () => {
      const error = Object.assign(new Error('timeout'), {name: 'TimeoutError'});
      expect(isNetworkError(error)).to.be.true;
    });

    it('returns false for HTTPError-shaped object', () => {
      const error = {name: 'HTTPError', message: 'HTTP 404', status: 404};
      expect(isNetworkError(error)).to.be.false;
    });

    it('returns false for plain Error without network codes', () => {
      const error = new Error('some application error');
      expect(isNetworkError(error)).to.be.false;
    });

    it('returns false for non-object', () => {
      expect(isNetworkError(null)).to.be.false;
      expect(isNetworkError('string')).to.be.false;
    });
  });

  describe('wrapNetworkError', () => {
    it('wraps TypeError "fetch failed" into NetworkError with operation and host', () => {
      const error = new TypeError('fetch failed');
      const wrapped = wrapNetworkError(error, {operation: 'WebDAV POST', host: 'test.demandware.net'});

      expect(wrapped).to.be.instanceOf(NetworkError);
      const netErr = wrapped as NetworkError;
      expect(netErr.operation).to.equal('WebDAV POST');
      expect(netErr.host).to.equal('test.demandware.net');
      expect(netErr.kind).to.equal('unknown');
      expect(netErr.cause).to.equal(error);
      expect(netErr.message).to.include('WebDAV POST');
      expect(netErr.message).to.include('test.demandware.net');
      expect(netErr.message).to.include('network error occurred');
    });

    it('wraps ECONNRESET with connection-reset kind', () => {
      const cause = Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'});
      const error = Object.assign(new TypeError('fetch failed'), {cause});
      const wrapped = wrapNetworkError(error, {operation: 'Deploy', host: 'sandbox.com'});

      expect(wrapped).to.be.instanceOf(NetworkError);
      const netErr = wrapped as NetworkError;
      expect(netErr.kind).to.equal('connection-reset');
      expect(netErr.message).to.include('connection was reset');
      expect(netErr.message).to.include('Deploy');
      expect(netErr.message).to.include('sandbox.com');
    });

    it('includes hint in message', () => {
      const error = Object.assign(new Error('timeout'), {code: 'ETIMEDOUT'});
      const wrapped = wrapNetworkError(error, {operation: 'Test operation'});

      expect(wrapped).to.be.instanceOf(NetworkError);
      const netErr = wrapped as NetworkError;
      expect(netErr.message).to.include('request timed out');
      expect(netErr.message).to.include('proxy/load balancer');
    });

    it('passes HTTPError-shaped object through unchanged', () => {
      const httpError = {name: 'HTTPError', message: 'HTTP 404', status: 404};
      const result = wrapNetworkError(httpError, {operation: 'Test'});

      expect(result).to.equal(httpError);
    });

    it('passes plain non-network Error through unchanged', () => {
      const error = new Error('application error');
      const result = wrapNetworkError(error, {operation: 'Test'});

      expect(result).to.equal(error);
    });

    it('does not double-wrap NetworkError', () => {
      const original = new NetworkError('Already wrapped', {
        kind: 'timeout',
        operation: 'Original operation',
        host: 'original.host',
      });
      const result = wrapNetworkError(original, {operation: 'New operation', host: 'new.host'});

      expect(result).to.equal(original);
      expect((result as NetworkError).operation).to.equal('Original operation');
      expect((result as NetworkError).host).to.equal('original.host');
    });

    it('fills in missing operation on existing NetworkError', () => {
      const original = new NetworkError('Already wrapped', {
        kind: 'timeout',
        host: 'test.host',
      });
      const result = wrapNetworkError(original, {operation: 'Added operation'});

      expect(result).to.be.instanceOf(NetworkError);
      const netErr = result as NetworkError;
      expect(netErr.operation).to.equal('Added operation');
      expect(netErr.host).to.equal('test.host');
      expect(netErr.kind).to.equal('timeout');
    });

    it('fills in missing host on existing NetworkError', () => {
      const original = new NetworkError('Already wrapped', {
        kind: 'connection-reset',
        operation: 'Test operation',
      });
      const result = wrapNetworkError(original, {host: 'added.host'});

      expect(result).to.be.instanceOf(NetworkError);
      const netErr = result as NetworkError;
      expect(netErr.operation).to.equal('Test operation');
      expect(netErr.host).to.equal('added.host');
      expect(netErr.kind).to.equal('connection-reset');
    });

    it('preserves cause through wrapping', () => {
      const originalCause = new Error('root cause');
      const error = Object.assign(new TypeError('fetch failed'), {cause: originalCause});
      const wrapped = wrapNetworkError(error, {operation: 'Test'});

      expect(wrapped).to.be.instanceOf(NetworkError);
      expect((wrapped as NetworkError).cause).to.equal(error);
    });
  });

  describe('describeNetworkErrorKind', () => {
    const kinds: NetworkErrorKind[] = [
      'timeout',
      'connection-reset',
      'connection-refused',
      'dns',
      'tls',
      'aborted',
      'unknown',
    ];

    it('returns summary and hint for all kinds', () => {
      for (const kind of kinds) {
        const {summary, hint} = describeNetworkErrorKind(kind);
        expect(summary).to.be.a('string').and.not.be.empty;
        expect(hint).to.be.a('string').and.not.be.empty;
      }
    });

    it('provides actionable hints for timeout', () => {
      const {summary, hint} = describeNetworkErrorKind('timeout');
      expect(summary).to.include('timed out');
      expect(hint).to.include('proxy');
      expect(hint).to.include('load balancer');
    });

    it('provides actionable hints for connection-reset', () => {
      const {summary, hint} = describeNetworkErrorKind('connection-reset');
      expect(summary).to.include('reset');
      expect(hint).to.include('server');
      expect(hint).to.include('Retrying');
    });

    it('provides actionable hints for dns', () => {
      const {summary, hint} = describeNetworkErrorKind('dns');
      expect(summary).to.include('hostname');
      expect(hint).to.include('DNS');
      expect(hint).to.include('hostname');
    });

    it('provides actionable hints for tls', () => {
      const {summary, hint} = describeNetworkErrorKind('tls');
      expect(summary).to.include('TLS');
      expect(hint).to.include('certificate');
    });
  });
});
