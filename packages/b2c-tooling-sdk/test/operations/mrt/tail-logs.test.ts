/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '../../../src/clients/mrt.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {createLoggingToken, parseMrtLogLine, getLogsWebSocketUrl} from '../../../src/operations/mrt/tail-logs.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

describe('operations/mrt/tail-logs', () => {
  describe('parseMrtLogLine', () => {
    it('should parse application log lines with tab-separated fields', () => {
      const raw = '2025-01-15T10:30:45.123Z\t550e8400-e29b-41d4-a716-446655440000\tINFO\tRequest processed';
      const entry = parseMrtLogLine(raw);

      expect(entry.timestamp).to.equal('2025-01-15T10:30:45.123Z');
      expect(entry.requestId).to.equal('550e8400-e29b-41d4-a716-446655440000');
      expect(entry.shortRequestId).to.equal('550e8400');
      expect(entry.level).to.equal('INFO');
      expect(entry.message).to.equal('Request processed');
      expect(entry.raw).to.equal(raw);
    });

    it('should handle application logs with tabs in message content', () => {
      const raw = '2025-01-15T10:30:45.123Z\t550e8400-e29b-41d4-a716-446655440000\tERROR\tFailed\tdetails here';
      const entry = parseMrtLogLine(raw);

      expect(entry.level).to.equal('ERROR');
      expect(entry.message).to.equal('Failed\tdetails here');
    });

    it('should parse platform log lines (LEVEL message format)', () => {
      const raw = 'ERROR Something went wrong';
      const entry = parseMrtLogLine(raw);

      expect(entry.level).to.equal('ERROR');
      expect(entry.message).to.equal('Something went wrong');
      expect(entry.timestamp).to.be.undefined;
      expect(entry.requestId).to.be.undefined;
    });

    it('should handle WARN level in platform format', () => {
      const entry = parseMrtLogLine('WARN Deprecation notice');

      expect(entry.level).to.equal('WARN');
      expect(entry.message).to.equal('Deprecation notice');
    });

    it('should handle WARNING level in platform format', () => {
      const entry = parseMrtLogLine('WARNING Something is off');

      expect(entry.level).to.equal('WARNING');
      expect(entry.message).to.equal('Something is off');
    });

    it('should handle INFO level in platform format', () => {
      const entry = parseMrtLogLine('INFO Server started on port 3000');

      expect(entry.level).to.equal('INFO');
      expect(entry.message).to.equal('Server started on port 3000');
    });

    it('should handle DEBUG level in platform format', () => {
      const entry = parseMrtLogLine('DEBUG Fetching data from cache');

      expect(entry.level).to.equal('DEBUG');
      expect(entry.message).to.equal('Fetching data from cache');
    });

    it('should fall back to raw message when format is unrecognized', () => {
      const raw = 'Just a plain message with no structure';
      const entry = parseMrtLogLine(raw);

      expect(entry.message).to.equal(raw);
      expect(entry.level).to.be.undefined;
      expect(entry.timestamp).to.be.undefined;
      expect(entry.requestId).to.be.undefined;
      expect(entry.raw).to.equal(raw);
    });

    it('should handle empty string', () => {
      const entry = parseMrtLogLine('');

      expect(entry.message).to.equal('');
      expect(entry.raw).to.equal('');
    });

    it('should handle application log with empty level field', () => {
      const raw = '2025-01-15T10:30:45.123Z\t550e8400-e29b-41d4-a716-446655440000\t\tSome message';
      const entry = parseMrtLogLine(raw);

      expect(entry.timestamp).to.equal('2025-01-15T10:30:45.123Z');
      expect(entry.level).to.be.undefined;
      expect(entry.message).to.equal('Some message');
    });

    it('should generate shortRequestId without dashes', () => {
      const raw = '2025-01-15T10:30:45.123Z\tabcdef01-2345-6789-abcd-ef0123456789\tINFO\tTest';
      const entry = parseMrtLogLine(raw);

      expect(entry.shortRequestId).to.equal('abcdef01');
    });
  });

  describe('getLogsWebSocketUrl', () => {
    it('should transform cloud.mobify.com to wss://logs.mobify.com', () => {
      const result = getLogsWebSocketUrl('https://cloud.mobify.com');
      expect(result).to.equal('wss://logs.mobify.com');
    });

    it('should transform cloud-soak.mrt-soak.com to wss://logs-soak.mrt-soak.com', () => {
      const result = getLogsWebSocketUrl('https://cloud-soak.mrt-soak.com');
      expect(result).to.equal('wss://logs-soak.mrt-soak.com');
    });

    it('should handle http:// origins', () => {
      const result = getLogsWebSocketUrl('http://cloud.mobify.com');
      expect(result).to.equal('wss://logs.mobify.com');
    });
  });

  describe('createLoggingToken', () => {
    const server = setupServer();

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    afterEach(() => {
      server.resetHandlers();
    });

    after(() => {
      server.close();
    });

    it('should POST to JWT endpoint and return token', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:project/target/:environment/jwt/`, () => {
          return HttpResponse.json({token: 'test-jwt-token'});
        }),
      );

      const auth = new MockAuthStrategy();
      const token = await createLoggingToken(
        {
          projectSlug: 'my-project',
          environmentSlug: 'staging',
        },
        auth,
      );

      expect(token).to.equal('test-jwt-token');
    });

    it('should handle error responses', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:project/target/:environment/jwt/`, () => {
          return HttpResponse.json({error: 'Unauthorized'}, {status: 401});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await createLoggingToken(
          {
            projectSlug: 'my-project',
            environmentSlug: 'staging',
          },
          auth,
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to create logging token');
        expect(error.message).to.include('401');
      }
    });

    it('should use custom origin when provided', async () => {
      const customOrigin = 'https://cloud-soak.mrt-soak.com';

      server.use(
        http.post(`${customOrigin}/api/projects/:project/target/:environment/jwt/`, () => {
          return HttpResponse.json({token: 'custom-token'});
        }),
      );

      const auth = new MockAuthStrategy();
      const token = await createLoggingToken(
        {
          projectSlug: 'my-project',
          environmentSlug: 'staging',
          origin: customOrigin,
        },
        auth,
      );

      expect(token).to.equal('custom-token');
    });
  });
});
