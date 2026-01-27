/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createOdsClient} from '../../../src/clients/ods.js';
import {
  isUuid,
  isFriendlySandboxId,
  parseFriendlySandboxId,
  resolveSandboxId,
  SandboxNotFoundError,
} from '../../../src/operations/ods/sandbox-lookup.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'admin.test.dx.commercecloud.salesforce.com';
const BASE_URL = `https://${TEST_HOST}/api/v1`;

describe('sandbox-lookup', () => {
  describe('isUuid', () => {
    it('should return true for valid UUIDs', () => {
      expect(isUuid('abc12345-1234-1234-1234-abc123456789')).to.be.true;
      expect(isUuid('00000000-0000-0000-0000-000000000000')).to.be.true;
      expect(isUuid('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).to.be.true;
      expect(isUuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).to.be.true;
    });

    it('should return false for invalid UUIDs', () => {
      expect(isUuid('not-a-uuid')).to.be.false;
      expect(isUuid('abc12345-1234-1234-1234')).to.be.false;
      expect(isUuid('abc12345-1234-1234-1234-abc12345678')).to.be.false;
      expect(isUuid('abc12345-1234-1234-1234-abc1234567890')).to.be.false;
      expect(isUuid('abcd-123')).to.be.false;
      expect(isUuid('zzzv_456')).to.be.false;
      expect(isUuid('')).to.be.false;
    });
  });

  describe('isFriendlySandboxId', () => {
    it('should return true for valid friendly IDs with dash', () => {
      expect(isFriendlySandboxId('abcd-123')).to.be.true;
      expect(isFriendlySandboxId('zzzv-456')).to.be.true;
      expect(isFriendlySandboxId('ABCD-789')).to.be.true;
      expect(isFriendlySandboxId('a1b2-c3d')).to.be.true;
    });

    it('should return true for valid friendly IDs with underscore', () => {
      expect(isFriendlySandboxId('abcd_123')).to.be.true;
      expect(isFriendlySandboxId('zzzv_456')).to.be.true;
      expect(isFriendlySandboxId('ABCD_789')).to.be.true;
      expect(isFriendlySandboxId('a1b2_c3d')).to.be.true;
    });

    it('should return false for invalid friendly IDs', () => {
      expect(isFriendlySandboxId('abc-123')).to.be.false; // realm too short
      expect(isFriendlySandboxId('abcde-123')).to.be.false; // realm too long
      expect(isFriendlySandboxId('abcd123')).to.be.false; // no separator
      expect(isFriendlySandboxId('abcd-')).to.be.false; // no instance
      expect(isFriendlySandboxId('-123')).to.be.false; // no realm
      expect(isFriendlySandboxId('abc12345-1234-1234-1234-abc123456789')).to.be.false; // UUID
      expect(isFriendlySandboxId('')).to.be.false;
    });
  });

  describe('parseFriendlySandboxId', () => {
    it('should parse valid friendly IDs with dash', () => {
      const result = parseFriendlySandboxId('abcd-123');
      expect(result).to.deep.equal({realm: 'abcd', instance: '123'});
    });

    it('should parse valid friendly IDs with underscore', () => {
      const result = parseFriendlySandboxId('zzzv_456');
      expect(result).to.deep.equal({realm: 'zzzv', instance: '456'});
    });

    it('should lowercase the realm and instance', () => {
      const result = parseFriendlySandboxId('ABCD-XYZ');
      expect(result).to.deep.equal({realm: 'abcd', instance: 'xyz'});
    });

    it('should return null for invalid formats', () => {
      expect(parseFriendlySandboxId('abc-123')).to.be.null;
      expect(parseFriendlySandboxId('abcde-123')).to.be.null;
      expect(parseFriendlySandboxId('not-valid-format')).to.be.null;
      expect(parseFriendlySandboxId('abc12345-1234-1234-1234-abc123456789')).to.be.null;
    });
  });

  describe('resolveSandboxId', () => {
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

    let odsClient: ReturnType<typeof createOdsClient>;

    beforeEach(() => {
      const mockAuth = new MockAuthStrategy();
      odsClient = createOdsClient({host: TEST_HOST}, mockAuth);
    });

    it('should return UUID directly without API call', async () => {
      const uuid = 'abc12345-1234-1234-1234-abc123456789';
      // No MSW handler needed - if it makes a request, test will fail
      const result = await resolveSandboxId(odsClient, uuid);
      expect(result).to.equal(uuid);
    });

    it('should look up sandbox by friendly ID (dash separator)', async () => {
      const expectedUuid = 'found-uuid-1234-1234-abc123456789';

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('filter_params')).to.equal('realm=zzzv');
          return HttpResponse.json({
            data: [
              {id: expectedUuid, realm: 'zzzv', instance: '123', state: 'started'},
              {id: 'other-uuid', realm: 'zzzv', instance: '456', state: 'stopped'},
            ],
          });
        }),
      );

      const result = await resolveSandboxId(odsClient, 'zzzv-123');
      expect(result).to.equal(expectedUuid);
    });

    it('should look up sandbox by friendly ID (underscore separator)', async () => {
      const expectedUuid = 'found-uuid-1234-1234-abc123456789';

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('filter_params')).to.equal('realm=abcd');
          return HttpResponse.json({
            data: [{id: expectedUuid, realm: 'abcd', instance: '789', state: 'started'}],
          });
        }),
      );

      const result = await resolveSandboxId(odsClient, 'abcd_789');
      expect(result).to.equal(expectedUuid);
    });

    it('should be case-insensitive for friendly IDs', async () => {
      const expectedUuid = 'found-uuid-1234-1234-abc123456789';

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('filter_params')).to.equal('realm=zzzv');
          return HttpResponse.json({
            data: [{id: expectedUuid, realm: 'ZZZV', instance: 'ABC', state: 'started'}],
          });
        }),
      );

      const result = await resolveSandboxId(odsClient, 'ZZZV-ABC');
      expect(result).to.equal(expectedUuid);
    });

    it('should throw SandboxNotFoundError when sandbox not found', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json({data: []});
        }),
      );

      try {
        await resolveSandboxId(odsClient, 'zzzv-999');
        expect.fail('Should have thrown SandboxNotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(SandboxNotFoundError);
        expect((error as SandboxNotFoundError).identifier).to.equal('zzzv-999');
        expect((error as SandboxNotFoundError).realm).to.equal('zzzv');
        expect((error as SandboxNotFoundError).instance).to.equal('999');
        expect((error as Error).message).to.include('Sandbox not found');
        expect((error as Error).message).to.include('zzzv-999');
      }
    });

    it('should throw SandboxNotFoundError when instance not in realm', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json({
            data: [{id: 'other-uuid', realm: 'zzzv', instance: '456', state: 'started'}],
          });
        }),
      );

      try {
        await resolveSandboxId(odsClient, 'zzzv-123');
        expect.fail('Should have thrown SandboxNotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(SandboxNotFoundError);
      }
    });

    it('should throw SandboxNotFoundError on API error', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json({error: {message: 'Unauthorized'}}, {status: 401});
        }),
      );

      try {
        await resolveSandboxId(odsClient, 'zzzv-123');
        expect.fail('Should have thrown SandboxNotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(SandboxNotFoundError);
      }
    });

    it('should pass through invalid format as-is', async () => {
      // An identifier that isn't a UUID and isn't a valid friendly format
      // is passed through (API will likely return 404)
      const result = await resolveSandboxId(odsClient, 'invalid');
      expect(result).to.equal('invalid');
    });
  });

  describe('SandboxNotFoundError', () => {
    it('should include identifier in message', () => {
      const error = new SandboxNotFoundError('test-id');
      expect(error.message).to.equal('Sandbox not found: test-id');
      expect(error.identifier).to.equal('test-id');
      expect(error.realm).to.be.undefined;
      expect(error.instance).to.be.undefined;
    });

    it('should include realm and instance when provided', () => {
      const error = new SandboxNotFoundError('zzzv-123', 'zzzv', '123');
      expect(error.message).to.equal('Sandbox not found: zzzv-123 (realm=zzzv, instance=123)');
      expect(error.identifier).to.equal('zzzv-123');
      expect(error.realm).to.equal('zzzv');
      expect(error.instance).to.equal('123');
    });

    it('should have correct name', () => {
      const error = new SandboxNotFoundError('test-id');
      expect(error.name).to.equal('SandboxNotFoundError');
    });
  });
});
