/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {listEnvVars, setEnvVar, setEnvVars, deleteEnvVar} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

describe('operations/mrt/env-var', () => {
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

  describe('listEnvVars', () => {
    it('lists environment variables with paginated format', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({
            count: 2,
            next: null,
            previous: null,
            results: [
              {
                API_KEY: {
                  value: '***key',
                  created_by: 'user@example.com',
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-02T00:00:00Z',
                  updated_by: 'user@example.com',
                  publishing_status: 1,
                  publishing_status_description: 'published',
                },
              },
              {
                SECRET: {
                  value: '***ret',
                  created_by: 'admin@example.com',
                  created_at: '2025-01-03T00:00:00Z',
                  updated_at: '2025-01-03T00:00:00Z',
                  updated_by: 'admin@example.com',
                  publishing_status: 1,
                  publishing_status_description: 'published',
                },
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
        },
        auth,
      );

      expect(result.count).to.equal(2);
      expect(result.variables).to.have.length(2);
      expect(result.variables[0]).to.deep.include({
        name: 'API_KEY',
        value: '***key',
        createdBy: 'user@example.com',
      });
      expect(result.variables[1]).to.deep.include({
        name: 'SECRET',
        value: '***ret',
      });
    });

    it('lists environment variables with direct object format', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({
            API_KEY: {
              value: '***key',
              created_by: 'user@example.com',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-02T00:00:00Z',
              updated_by: 'user@example.com',
              publishing_status: 1,
              publishing_status_description: 'published',
            },
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
        },
        auth,
      );

      expect(result.variables).to.have.length(1);
      expect(result.variables[0].name).to.equal('API_KEY');
    });

    it('handles empty results', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({
            count: 0,
            next: null,
            previous: null,
            results: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
        },
        auth,
      );

      expect(result.count).to.equal(0);
      expect(result.variables).to.have.length(0);
    });

    it('uses custom origin when provided', async () => {
      const customOrigin = 'https://custom.mobify.com';
      let requestedUrl = '';

      server.use(
        http.get(`${customOrigin}/api/projects/:projectSlug/target/:targetSlug/env-var/`, ({request}) => {
          requestedUrl = request.url;
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          origin: customOrigin,
        },
        auth,
      );

      expect(requestedUrl).to.include(customOrigin);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await listEnvVars(
          {
            projectSlug: 'nonexistent',
            environment: 'staging',
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list environment variables');
      }
    });
  });

  describe('setEnvVar', () => {
    it('sets a single environment variable', async () => {
      let receivedBody: unknown;

      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      await setEnvVar(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          key: 'NEW_VAR',
          value: 'new-value',
        },
        auth,
      );

      expect(receivedBody).to.deep.equal({
        NEW_VAR: {value: 'new-value'},
      });
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Unauthorized'}, {status: 401});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await setEnvVar(
          {
            projectSlug: 'my-project',
            environment: 'staging',
            key: 'VAR',
            value: 'value',
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to set environment variable');
      }
    });
  });

  describe('setEnvVars', () => {
    it('sets multiple environment variables', async () => {
      let receivedBody: unknown;

      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      await setEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          variables: {
            VAR1: 'value1',
            VAR2: 'value2',
            VAR3: 'value3',
          },
        },
        auth,
      );

      expect(receivedBody).to.deep.equal({
        VAR1: {value: 'value1'},
        VAR2: {value: 'value2'},
        VAR3: {value: 'value3'},
      });
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Invalid request'}, {status: 400});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await setEnvVars(
          {
            projectSlug: 'my-project',
            environment: 'staging',
            variables: {VAR: 'value'},
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to set environment variables');
      }
    });
  });

  describe('deleteEnvVar', () => {
    it('deletes an environment variable by setting value to null', async () => {
      let receivedBody: unknown;

      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      await deleteEnvVar(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          key: 'OLD_VAR',
        },
        auth,
      );

      expect(receivedBody).to.deep.equal({
        OLD_VAR: {value: null},
      });
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Variable not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await deleteEnvVar(
          {
            projectSlug: 'my-project',
            environment: 'staging',
            key: 'NONEXISTENT',
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to delete environment variable');
      }
    });
  });
});
