/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {
  listCodeVersions,
  getActiveCodeVersion,
  activateCodeVersion,
  createCodeVersion,
  deleteCodeVersion,
  reloadCodeVersion,
} from '../../../src/operations/code/versions.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

describe('operations/code/versions', () => {
  const server = setupServer();
  let mockInstance: any;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    // Create a real OCAPI client with mocked HTTP
    const auth = new MockAuthStrategy();
    const ocapi = createOcapiClient(TEST_HOST, auth);

    mockInstance = {
      ocapi,
    };
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  describe('listCodeVersions', () => {
    it('should return list of code versions', async () => {
      const mockVersions = [
        {id: 'v1', active: true, last_modification_time: '2025-01-01T00:00:00Z'},
        {id: 'v2', active: false, last_modification_time: '2025-01-02T00:00:00Z'},
      ];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
      );

      const result = await listCodeVersions(mockInstance);

      expect(result).to.deep.equal(mockVersions);
    });

    it('should return empty array when no versions exist', async () => {
      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: []});
        }),
      );

      const result = await listCodeVersions(mockInstance);

      expect(result).to.deep.equal([]);
    });

    it('should handle undefined data gracefully', async () => {
      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({});
        }),
      );

      const result = await listCodeVersions(mockInstance);

      expect(result).to.deep.equal([]);
    });

    it('should throw error when API call fails', async () => {
      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({fault: {message: 'Unauthorized'}}, {status: 401});
        }),
      );

      try {
        await listCodeVersions(mockInstance);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to list code versions');
      }
    });
  });

  describe('getActiveCodeVersion', () => {
    it('should return the active code version', async () => {
      const mockVersions = [
        {id: 'v1', active: false},
        {id: 'v2', active: true},
        {id: 'v3', active: false},
      ];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
      );

      const result = await getActiveCodeVersion(mockInstance);

      expect(result).to.deep.equal({id: 'v2', active: true});
    });

    it('should return undefined when no version is active', async () => {
      const mockVersions = [
        {id: 'v1', active: false},
        {id: 'v2', active: false},
      ];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
      );

      const result = await getActiveCodeVersion(mockInstance);

      expect(result).to.be.undefined;
    });

    it('should return undefined when no versions exist', async () => {
      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: []});
        }),
      );

      const result = await getActiveCodeVersion(mockInstance);

      expect(result).to.be.undefined;
    });
  });

  describe('activateCodeVersion', () => {
    it('should activate a code version successfully', async () => {
      server.use(
        http.patch(`${BASE_URL}/code_versions/v2`, () => {
          return HttpResponse.json({id: 'v2', active: true});
        }),
      );

      await activateCodeVersion(mockInstance, 'v2');
      // Success - no error thrown
    });

    it('should throw error when activation fails', async () => {
      server.use(
        http.patch(`${BASE_URL}/code_versions/nonexistent`, () => {
          return HttpResponse.json({fault: {message: 'Version not found'}}, {status: 404});
        }),
      );

      try {
        await activateCodeVersion(mockInstance, 'nonexistent');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to activate code version');
      }
    });
  });

  describe('createCodeVersion', () => {
    it('should create a new code version', async () => {
      server.use(
        http.put(`${BASE_URL}/code_versions/new-version`, () => {
          return HttpResponse.json({id: 'new-version', active: false});
        }),
      );

      await createCodeVersion(mockInstance, 'new-version');
      // Success - no error thrown
    });

    it('should throw error when creation fails', async () => {
      server.use(
        http.put(`${BASE_URL}/code_versions/:id`, () => {
          return HttpResponse.json({fault: {message: 'Invalid version ID'}}, {status: 400});
        }),
      );

      try {
        await createCodeVersion(mockInstance, 'invalid!version');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to create code version');
      }
    });
  });

  describe('deleteCodeVersion', () => {
    it('should delete a code version', async () => {
      server.use(
        http.delete(`${BASE_URL}/code_versions/old-version`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteCodeVersion(mockInstance, 'old-version');
      // Success - no error thrown
    });

    it('should throw error when deletion fails', async () => {
      server.use(
        http.delete(`${BASE_URL}/code_versions/nonexistent`, () => {
          return HttpResponse.json({fault: {message: 'Version not found'}}, {status: 404});
        }),
      );

      try {
        await deleteCodeVersion(mockInstance, 'nonexistent');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to delete code version');
      }
    });
  });

  describe('reloadCodeVersion', () => {
    it('should reload a code version successfully when already active', async () => {
      const mockVersions = [
        {id: 'v1', active: false},
        {id: 'v2', active: true},
      ];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
        http.patch(`${BASE_URL}/code_versions/v1`, () => {
          return HttpResponse.json({id: 'v1', active: true});
        }),
        http.patch(`${BASE_URL}/code_versions/v2`, () => {
          return HttpResponse.json({id: 'v2', active: true});
        }),
      );

      await reloadCodeVersion(mockInstance, 'v2');
      // Success - no error thrown
    });

    it('should reload when not currently active', async () => {
      const mockVersions = [
        {id: 'v1', active: true},
        {id: 'v2', active: false},
      ];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
        http.patch(`${BASE_URL}/code_versions/v2`, () => {
          return HttpResponse.json({id: 'v2', active: true});
        }),
      );

      await reloadCodeVersion(mockInstance, 'v2');
      // Success - no error thrown
    });

    it('should throw error when no alternate version available', async () => {
      const mockVersions = [{id: 'v1', active: true}];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
      );

      try {
        await reloadCodeVersion(mockInstance, 'v1');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('no alternate code version available');
      }
    });

    it('should throw error when no active version and none specified', async () => {
      const mockVersions = [{id: 'v1', active: false}];

      server.use(
        http.get(`${BASE_URL}/code_versions`, () => {
          return HttpResponse.json({data: mockVersions});
        }),
      );

      try {
        await reloadCodeVersion(mockInstance);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('No code version specified');
      }
    });
  });
});
