/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import type {AuthStrategy} from '../../../src/auth/types.js';
import {ScapiCapabilityUnsupportedError} from '../../../src/clients/scapi-backend-utils.js';
import {ScapiUsersBackend} from '../../../src/operations/bm-users/scapi-backend.js';

describe('ScapiUsersBackend search', () => {
  function createBackend() {
    const backend = new ScapiUsersBackend({shortCode: 'abcd1234', tenantId: 'zzxy_dev', auth: {} as AuthStrategy});
    (backend as unknown as {scopeTier: unknown}).scopeTier = {
      async tryRead<T>(operation: (client: unknown) => Promise<T>): Promise<T> {
        return operation({
          async GET() {
            return {
              data: {
                total: 3,
                offset: 0,
                limit: 200,
                data: [
                  {login: 'alex', email: 'alex@example.com', firstName: 'Alex', lastName: 'Smith', locked: false},
                  {login: 'sam', email: 'sam@example.com', firstName: 'Sam', lastName: 'Jones', locked: true},
                  {login: 'taylor', email: 'taylor@example.com', firstName: 'Taylor', lastName: 'Smith', locked: true},
                ],
              },
              error: undefined,
              response: {status: 200},
            };
          },
        });
      },
    };
    return backend;
  }

  it('filters and sorts portable criteria over the paginated user listing', async () => {
    const result = await createBackend().searchUsers({
      searchPhrase: 'smith',
      locked: true,
      sortBy: 'login',
      sortOrder: 'desc',
    });

    expect(result.total).to.equal(1);
    expect(result.hits.map(({login}) => login)).to.deep.equal(['taylor']);
  });

  it('marks raw OCAPI query JSON as an explicit compatibility capability', async () => {
    try {
      await createBackend().searchUsers({query: {match_all_query: {}}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(ScapiCapabilityUnsupportedError);
      expect((error as Error).message).to.include(
        'SCAPI does not currently support raw OCAPI user-search JSON as of B2C Commerce release 26.8',
      );
      expect((error as Error).message).to.include('Use portable search flags to stay on SCAPI');
    }
  });

  it('updates disabled through PUT while preserving current writable fields', async () => {
    const backend = createBackend();
    let received: unknown;
    (backend as unknown as {getUser: ScapiUsersBackend['getUser']}).getUser = async () => ({
      login: 'alex',
      email: 'alex@example.com',
      firstName: 'Alex',
      roles: ['Developer'],
      disabled: false,
    });
    (backend as unknown as {scopeTier: unknown}).scopeTier = {
      getClientForWrite() {
        return {
          async PUT(_path: string, options: {body: unknown}) {
            received = options.body;
            return {data: options.body, error: undefined, response: {status: 200}};
          },
        };
      },
    };

    const updated = await backend.updateUser('alex', {disabled: true});

    expect(received).to.deep.equal({
      login: 'alex',
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: undefined,
      externalId: undefined,
      password: undefined,
      disabled: true,
      preferredDataLocale: undefined,
      preferredUiLocale: undefined,
      roles: ['Developer'],
    });
    expect(updated.disabled).to.equal(true);
  });
});
