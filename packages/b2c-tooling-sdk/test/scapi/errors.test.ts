/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  createScapiRequest,
  loadScapiSchemas,
  runScapiCode,
  ScapiCodeError,
  scapiErrorCode,
} from '@salesforce/b2c-tooling-sdk/scapi';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth: AuthStrategy = {fetch, getAuthorizationHeader: async () => 'Bearer test-token'};

async function caught(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected a rejection');
}

describe('scapi/errors', () => {
  it('reads the code from a message prefix', () => {
    expect(scapiErrorCode('SCAPI_CALL_LIMIT: at most 20 calls.')).to.equal('SCAPI_CALL_LIMIT');
    expect(scapiErrorCode('SCAPI_REQUEST_TOO_LARGE')).to.equal('SCAPI_REQUEST_TOO_LARGE');
    expect(scapiErrorCode('Request must be an object.')).to.equal(undefined);
    expect(scapiErrorCode('Not SCAPI_CALL_LIMIT: here')).to.equal(undefined);
  });

  it('types code-mode failures from the parent and the worker, keeping the message', async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    const early = await caught(() => runScapiCode({code: 'async () => 1', signal: cancelled.signal}));
    expect(early).to.be.instanceOf(ScapiCodeError);
    expect(early).to.include({code: 'SCAPI_EXECUTION_CANCELLED', message: 'SCAPI_EXECUTION_CANCELLED'});

    const worker = await caught(() =>
      runScapiCode({code: "async () => { throw new Error('SCAPI_CALL_LIMIT: from the program.'); }"}),
    );
    expect(worker).to.be.instanceOf(ScapiCodeError);
    expect(worker).to.include({code: 'SCAPI_CALL_LIMIT', message: 'SCAPI_CALL_LIMIT: from the program.'});

    const plain = await caught(() => runScapiCode({code: "async () => { throw new Error('plain'); }"}));
    expect(plain).to.be.instanceOf(Error).and.not.instanceOf(ScapiCodeError);
    expect((plain as Error).message).to.equal('plain');
  });

  it('types managed request failures and leaves others unchanged', async () => {
    const request = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      auth,
      safety: {level: 'NONE'},
      documents: loadScapiSchemas(),
      middlewareRegistry: new MiddlewareRegistry(),
    });
    const signal = new AbortController().signal;
    const missingBody = await caught(() =>
      request({method: 'PUT', path: '/product/products/v1/organizations/{organizationId}/products/p1'}, signal),
    );
    expect(missingBody).to.be.instanceOf(ScapiCodeError);
    expect(missingBody).to.include({
      code: 'SCAPI_ARGUMENT_INVALID',
      message: 'SCAPI_ARGUMENT_INVALID: request body is required.',
    });
    const invalid = await caught(() => request('nope', signal));
    expect(invalid).to.not.be.instanceOf(ScapiCodeError);
    expect((invalid as Error).message).to.equal('Request must be an object.');
  });
});
