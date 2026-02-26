/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  cookieAsString,
  parseHost,
  Headers,
  rewriteProxyRequestHeaders,
  rewriteProxyResponseHeaders,
  rfc1123,
  MAX_URL_LENGTH_BYTES,
  ALLOWED_CACHING_PROXY_REQUEST_HEADERS,
  type HTTPHeaders,
  type AWSHeaders,
  type ParsedHost,
} from '../../src/utils/ssr-proxying.js';

/**
 * Test case interface for rfc1123 tests
 */
interface RFC1123TestCase {
  date: Date;
  expected: string;
}

/**
 * Test case interface for parseHost tests
 */
interface ParseHostTestCase {
  name: string;
  host: string;
  expected: ParsedHost;
}

/**
 * Test case interface for cookieAsString tests
 */
interface CookieAsStringTestCase {
  cookie: {
    name: string;
    value: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    domain?: string;
    maxAge?: number;
    path?: string;
    expires?: Date;
  };
  expected: string;
}

/**
 * Test case interface for rewriteProxyResponseHeaders tests
 */
interface RewriteProxyResponseHeadersTestCase {
  name: string;
  appHostname?: string;
  targetHost?: string;
  statusCode?: number;
  input: HTTPHeaders | AWSHeaders;
  expected: HTTPHeaders | AWSHeaders;
  format?: 'http' | 'aws';
  caching?: boolean;
  requestUrl?: string;
}

/**
 * Test case interface for rewriteProxyRequestHeaders tests
 */
interface RewriteProxyRequestHeadersTestCase {
  name: string;
  targetHost?: string;
  input: HTTPHeaders | AWSHeaders;
  expected: HTTPHeaders | AWSHeaders;
  format?: 'http' | 'aws';
  caching?: boolean;
  targetProtocol?: string;
  testAllowlist?: boolean;
  method?: string;
}

describe('rfc1123 tests', () => {
  const testCases: RFC1123TestCase[] = [
    {
      date: new Date('2018-10-24T10:09:08Z'),
      expected: 'Wed, 24 Oct 2018 10:09:08 GMT',
    },
    {
      date: new Date('2018-10-24T23:22:21-01:00'),
      expected: 'Thu, 25 Oct 2018 00:22:21 GMT',
    },
  ];

  testCases.forEach((testCase) =>
    it(`Expecting ${testCase.expected}`, () => {
      expect(rfc1123(testCase.date)).to.deep.equal(testCase.expected);
    }),
  );
});

describe('parseHost tests', () => {
  const testCases: ParseHostTestCase[] = [
    {
      name: 'localhost with port',
      host: 'localhost:8080',
      expected: {
        host: 'localhost:8080',
        hostname: 'localhost',
        port: '8080',
        isIPOrLocalhost: true,
      },
    },
    {
      name: 'localhost without port',
      host: 'localhost',
      expected: {
        host: 'localhost',
        hostname: 'localhost',
        isIPOrLocalhost: true,
      },
    },
    {
      name: 'single-word host with port',
      host: 'xyzzy:8080',
      expected: {
        host: 'xyzzy:8080',
        hostname: 'xyzzy',
        port: '8080',
        isIPOrLocalhost: false,
      },
    },
    {
      name: 'single-word host without port',
      host: 'doobrie',
      expected: {
        host: 'doobrie',
        hostname: 'doobrie',
        isIPOrLocalhost: false,
      },
    },
    {
      name: 'hostname without port',
      host: 'www.customer.com',
      expected: {
        host: 'www.customer.com',
        hostname: 'www.customer.com',
        isIPOrLocalhost: false,
      },
    },
    {
      name: 'hostname with port',
      host: 'www.customer.com:1234',
      expected: {
        host: 'www.customer.com:1234',
        hostname: 'www.customer.com',
        port: '1234',
        isIPOrLocalhost: false,
      },
    },
    {
      name: 'ipv4 with port',
      host: '1.2.3.4:1234',
      expected: {
        host: '1.2.3.4:1234',
        hostname: '1.2.3.4',
        port: '1234',
        isIPOrLocalhost: true,
      },
    },
    {
      name: 'ipv4 without port',
      host: '192.168.1.128:1234',
      expected: {
        host: '192.168.1.128:1234',
        hostname: '192.168.1.128',
        port: '1234',
        isIPOrLocalhost: true,
      },
    },
    {
      name: 'ipv6 with port',
      host: '[2001:db8::1]:8080',
      expected: {
        host: '[2001:db8::1]:8080',
        hostname: '2001:db8::1',
        port: '8080',
        isIPOrLocalhost: true,
      },
    },
    {
      name: 'ipv6 without port',
      host: '2001:db8::1',
      expected: {
        host: '2001:db8::1',
        hostname: '2001:db8::1',
        isIPOrLocalhost: true,
      },
    },
    {
      name: 'ipv4 without port',
      host: '2001:db8::1',
      expected: {
        host: '2001:db8::1',
        hostname: '2001:db8::1',
        isIPOrLocalhost: true,
      },
    },
  ];

  testCases.forEach((testCase) =>
    it(`${testCase.name} (${testCase.host})`, () => {
      expect(parseHost(testCase.host)).to.deep.equal(testCase.expected);
    }),
  );
});

describe('cookieAsString tests', () => {
  const testCases: CookieAsStringTestCase[] = [
    {
      cookie: {
        name: 'abc',
        value: '123',
      },
      expected: 'abc=123',
    },
    {
      cookie: {
        name: 'def',
        value: '456',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      },
      expected: 'def=456; Secure; HttpOnly; SameSite=lax',
    },
    {
      cookie: {
        name: 'abc',
        value: '123',
        domain: 'mobify.com',
        maxAge: 123,
        path: '/',
      },
      expected: 'abc=123; Path=/; Domain=mobify.com; Max-Age=123',
    },
    {
      cookie: {
        name: 'abc',
        value: '123',
        expires: new Date('2018-10-24T10:09:08Z'),
      },
      expected: 'abc=123; Expires=Wed, 24 Oct 2018 10:09:08 GMT',
    },
  ];

  testCases.forEach((testCase) =>
    it(`Expecting ${testCase.expected}`, () => {
      expect(cookieAsString(testCase.cookie)).to.deep.equal(testCase.expected);
    }),
  );
});

describe('rewriteProxyResponseHeaders tests', () => {
  const tooLongUrlBase = 'https://www.customer.com/xyz?xyz=';
  // Because this string is based on tooLongUrlBase,
  // it will exceed MAX_URL_LENGTH_BYTES in length.
  const tooLongUrl = tooLongUrlBase.padEnd(MAX_URL_LENGTH_BYTES, 'x');

  const testCases: RewriteProxyResponseHeadersTestCase[] = [
    {
      name: 'no changes expected',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'access-control-allow-origin': '*',
        location: '/xyz',
        'content-type': 'application/octet-stream',
      },
      expected: {
        'access-control-allow-origin': '*',
        location: '/xyz',
        'content-type': 'application/octet-stream',
      },
    },
    {
      name: 'no domain rewrite of set-cookie',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'set-cookie': 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; secure; httpOnly',
      },
      expected: {
        'set-cookie': ['origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Secure; HttpOnly'],
      },
    },
    {
      name: 'rewrite set-cookie',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'access-control-allow-origin': '*',
        'set-cookie': [
          'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.www.customer.com',
          'origin_dc=war; expires=Tue, 02-Oct-2018 00:13:20 GMT; path=/; domain=.someone.com',
        ],
      },
      expected: {
        'access-control-allow-origin': '*',
        'set-cookie': [
          'origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Domain=apphost.mobify.com',
          'origin_dc=war; Path=/; Expires=Tue, 02 Oct 2018 00:13:20 GMT; Domain=.someone.com',
        ],
      },
    },
    {
      name: 'rewrite set-cookie (AWS format)',
      format: 'aws',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'set-cookie': [
          {
            key: 'Set-Cookie',
            value: 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.www.customer.com',
          },
        ],
      },
      expected: {
        'set-cookie': [
          {
            key: 'Set-Cookie',
            value: 'origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Domain=apphost.mobify.com',
          },
        ],
      },
    },
    {
      name: 'rewrite set-cookie local',
      appHostname: 'localhost:3443',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'set-cookie': 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.www.customer.com',
      },
      expected: {
        'set-cookie': ['origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Domain=localhost'],
      },
    },
    {
      name: 'rewrite set-cookie local with subdomain',
      appHostname: 'localhost:3443',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'set-cookie': 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.customer.com',
      },
      expected: {
        'set-cookie': ['origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Domain=localhost'],
      },
    },
    {
      name: 'rewrite set-cookie third-party',
      appHostname: 'localhost:3443',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'set-cookie': 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.someone.com',
      },
      expected: {
        'set-cookie': ['origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Domain=.someone.com'],
      },
    },
    {
      name: 'rewrite access-control and set-cookie',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'access-control-allow-origin': 'https://www.customer.com',
        'set-cookie': 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.customer.com',
      },
      expected: {
        'access-control-allow-origin': 'https://apphost.mobify.com',
        'set-cookie': ['origin_dc=war; Path=/; Expires=Mon, 01 Oct 2018 00:13:20 GMT; Domain=mobify.com'],
      },
    },
    {
      name: 'remove set-cookie',
      caching: true,
      appHostname: 'localhost:3443',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {
        'set-cookie': 'origin_dc=war; expires=Mon, 01-Oct-2018 00:13:20 GMT; path=/; domain=.www.customer.com',
      },
      expected: {
        // @ts-expect-error: Testing undefined value
        'set-cookie': undefined,
      },
    },
    {
      name: 'rewrite location',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 301,
      input: {
        location: 'https://www.customer.com/abc/def',
      },
      expected: {
        location: 'https://apphost.mobify.com/mobify/proxy/base/abc/def',
      },
    },
    {
      name: "don't rewrite location",
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 301,
      input: {
        location: 'https://www.elsewhere.com/abc/def',
      },
      expected: {
        location: 'https://www.elsewhere.com/abc/def',
      },
    },
    {
      name: 'rewrite location (AWS format)',
      format: 'aws',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 301,
      input: {
        location: [
          {
            key: 'Location',
            value: 'https://www.customer.com/abc/def',
          },
        ],
      },
      expected: {
        location: [
          {
            key: 'Location',
            value: 'https://apphost.mobify.com/mobify/proxy/base/abc/def',
          },
        ],
      },
    },
    {
      name: 'x-proxy-request-url (full URL)',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      input: {},
      statusCode: 200,
      requestUrl: 'https://www.customer.com/xyz?xyz=123',
      expected: {
        'x-proxy-request-url': 'https://www.customer.com/xyz?xyz=123',
      },
    },
    {
      name: 'x-proxy-request-url (path-only URL)',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      input: {},
      statusCode: 200,
      requestUrl: '/xyz?abc=def',
      expected: {
        'x-proxy-request-url': 'https://www.customer.com/xyz?abc=def',
      },
    },
    {
      name: 'x-proxy-request-url (long URL)',
      appHostname: 'apphost.mobify.com',
      targetHost: 'www.customer.com',
      statusCode: 200,
      input: {},
      requestUrl: tooLongUrl,
      expected: {
        'x-proxy-request-url': tooLongUrl.slice(0, MAX_URL_LENGTH_BYTES),
      },
    },
  ];

  testCases.forEach((testCase, testCaseIndex) =>
    it(testCase.name || `test ${testCaseIndex}`, () => {
      const updatedHeaders = rewriteProxyResponseHeaders({
        appHostname: testCase.appHostname || '',
        proxyPath: '/mobify/proxy/base/',
        statusCode: testCase.statusCode || 200,
        headers: testCase.input,
        headerFormat: testCase.format || 'http',
        caching: !!testCase.caching,
        targetProtocol: 'https',
        targetHost: testCase.targetHost || '',
        logging: true,
        requestUrl: testCase.requestUrl,
      });

      Object.entries(testCase.expected).forEach(([key, value]) => {
        const actual = updatedHeaders[key];
        expect(actual).to.deep.equal(value);
      });
    }),
  );

  it('missing headers', () => {
    expect(
      rewriteProxyResponseHeaders({
        appHostname: '',
        proxyPath: '/mobify/proxy/base',
        headers: {},
        caching: false,
        targetProtocol: 'https',
        targetHost: 'www.customer.com',
      }),
    ).to.deep.equal({});
  });

  it('Headers.modified', () => {
    const headers = new Headers({a: '1'}, 'http');
    expect(headers.modified).to.equal(false);
    headers.setHeader('a', '2');
    expect(headers.modified).to.equal(true);
  });

  it('Headers case handling', () => {
    const headers = new Headers({}, 'aws');
    headers.setHeader('cached_response', 'true');
    const result = headers.toObject();
    expect(result.cached_response).to.deep.equal([
      {
        key: 'cached_response',
        value: 'true',
      },
    ]);
  });

  it('bad Headers format', () => {
    expect(() => new Headers({}, 'unknown' as 'http')).to.throw();
  });
});

describe('rewriteProxyRequestHeaders tests', () => {
  const testCases: RewriteProxyRequestHeadersTestCase[] = [
    {
      name: 'no changes expected',
      targetHost: 'www.customer.com',
      input: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
      },
      expected: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
      },
    },
    {
      name: 'rewrite host (AWS format)',
      format: 'aws',
      targetHost: 'www.customer.com',
      input: {
        host: [
          {
            key: 'Host',
            value: 'apphost.mobify.com',
          },
        ],
      },
      expected: {
        host: [
          {
            key: 'Host',
            value: 'www.customer.com',
          },
        ],
      },
    },
    {
      name: 'rewrite origin (AWS format)',
      format: 'aws',
      targetHost: 'www.customer.com',
      targetProtocol: 'http',
      input: {
        origin: [
          {
            key: 'Origin',
            value: 'https://apphost.mobify.com',
          },
        ],
      },
      expected: {
        origin: [
          {
            key: 'Origin',
            value: 'http://www.customer.com',
          },
        ],
      },
    },
    {
      name: 'rewrite host (HTTP format)',
      format: 'http',
      targetHost: 'www.customer.com',
      input: {
        host: 'apphost.mobify.com',
      },
      expected: {
        host: 'www.customer.com',
      },
    },
    {
      name: 'rewrite origin (HTTP format)',
      format: 'http',
      targetHost: 'www.customer.com',
      targetProtocol: 'http',
      input: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
        origin: 'https://apphost.mobify.com',
      },
      expected: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
        origin: 'http://www.customer.com',
      },
    },
    {
      name: 'strip out x-mobify-access-key keep apig headers',
      targetHost: 'www.customer.com',
      input: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
        'x-api-key': '1234567890',
        'x-mobify-access-key': 'abcdefghijk',
        'x-apigateway-event': '{}',
        'x-apigateway-context': '{}',
        'x-sfdc-access-control': '123456789',
      },
      expected: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
        'x-api-key': '1234567890',
        // @ts-expect-error: Testing undefined value
        'x-mobify-access-key': undefined,
        'x-apigateway-event': '{}',
        'x-apigateway-context': '{}',
        // @ts-expect-error: Testing undefined value
        'x-sfdc-access-control': undefined,
      },
    },
    {
      name: 'caching-proxy processing GET 1',
      caching: true,
      targetHost: 'www.customer.com',
      testAllowlist: true,
      method: 'GET',
      input: {
        'accept-encoding': 'deflate, gzip',
        authorization: 'abc=123',
        connection: 'keep-alive',
        date: 'some-date-value',
        'user-agent': 'chrome',
      },
      expected: {
        authorization: 'abc=123',
        // @ts-expect-error: Testing undefined value
        connection: undefined,
        // @ts-expect-error: Testing undefined value
        date: undefined,
        host: 'www.customer.com',
        origin: 'https://www.customer.com',
        'user-agent': 'Amazon CloudFront',
      },
    },
    {
      name: 'caching-proxy processing GET 2',
      caching: true,
      method: 'GET',
      input: {
        'accept-encoding': 'deflate',
      },
      expected: {
        'accept-encoding': 'deflate',
      },
    },
    {
      name: 'caching-proxy processing no-op',
      caching: true,
      targetHost: 'www.customer.com',
      method: 'GET',
      input: {},
      expected: {
        'user-agent': 'Amazon CloudFront',
      },
    },
    {
      name: 'add in x-headers',
      targetHost: 'www.customer.com',
      input: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
      },
      expected: {
        'accept-encoding': 'deflate, gzip',
        cookie: 'abc=123',
        'x-mobify': 'true',
      },
    },
  ];

  testCases.forEach((testCase, testCaseIndex) =>
    it(testCase.name || `test ${testCaseIndex}`, () => {
      const headers = Object.assign({}, testCase.input || {});

      if (testCase.testAllowlist) {
        Object.keys(ALLOWED_CACHING_PROXY_REQUEST_HEADERS).forEach((key) => {
          if (!(key in headers)) {
            headers[key] = key;
          }
        });
      }

      const updatedHeaders = rewriteProxyRequestHeaders({
        caching: testCase.caching,
        headers,
        headerFormat: testCase.format || 'http',
        targetProtocol: testCase.targetProtocol || 'https',
        targetHost: testCase.targetHost || '',
        logging: true,
      });

      const expectedKeys = Object.keys(testCase.expected);
      expectedKeys.forEach((key) => {
        const value = testCase.expected[key];
        const actual = updatedHeaders[key];
        expect(actual).to.deep.equal(value);
      });

      if (testCase.testAllowlist) {
        Object.keys(ALLOWED_CACHING_PROXY_REQUEST_HEADERS).forEach((key) => {
          if (expectedKeys.indexOf(key) < 0) {
            expect(updatedHeaders[key]).to.deep.equal(headers[key]);
          }
        });
      }
    }),
  );

  it('missing headers', () => {
    expect(
      rewriteProxyRequestHeaders({
        headers: undefined,
        targetProtocol: 'https',
        targetHost: 'www.customer.com',
      }),
    ).to.deep.equal({});
  });

  it('bad Headers format', () => {
    expect(() => new Headers({}, 'unknown' as 'http')).to.throw();
  });
});
