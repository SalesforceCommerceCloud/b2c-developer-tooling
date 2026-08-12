/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  createBmUserAccessKey,
  deleteBmUserAccessKey,
  getBmUserAccessKey,
  setBmUserAccessKeyEnabled,
  whoamiBmUser,
} from '@salesforce/b2c-tooling-sdk/operations/bm-users';

async function expectScapiCompatibilityError(operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation();
    expect.fail('Expected explicit SCAPI mode to reject the OCAPI-only operation');
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    expect((error as Error).message).to.include('as of B2C Commerce release 26.8');
    expect((error as Error).message).to.include('CLI: --api-backend ocapi');
  }
}

function explicitScapiInstance(): never {
  return {
    apiBackend: 'scapi',
    ocapi: new Proxy(
      {},
      {
        get() {
          throw new Error('OCAPI must not be accessed in explicit SCAPI mode');
        },
      },
    ),
  } as never;
}

describe('BM user OCAPI compatibility guards', () => {
  it('rejects whoami before creating an OCAPI request', async () => {
    await expectScapiCompatibilityError(() => whoamiBmUser(explicitScapiInstance()));
  });

  for (const [name, operation] of [
    ['get', (instance: never) => getBmUserAccessKey(instance, 'user@example.com', 'WEBDAV_AND_STUDIO')],
    ['create', (instance: never) => createBmUserAccessKey(instance, 'user@example.com', 'WEBDAV_AND_STUDIO')],
    ['set', (instance: never) => setBmUserAccessKeyEnabled(instance, 'user@example.com', 'WEBDAV_AND_STUDIO', true)],
    ['delete', (instance: never) => deleteBmUserAccessKey(instance, 'user@example.com', 'WEBDAV_AND_STUDIO')],
  ] as const) {
    it(`rejects access-key ${name} before creating an OCAPI request`, async () => {
      await expectScapiCompatibilityError(() => operation(explicitScapiInstance()));
    });
  }
});
