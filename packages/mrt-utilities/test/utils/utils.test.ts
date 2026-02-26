/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {isLocal} from '@salesforce/mrt-utilities';
import {logMRTError} from '../../src/utils/utils.js';

describe('isLocal', () => {
  it('returns true when not in AWS Lambda', () => {
    const originalEnv = process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;

    const result = isLocal();

    expect(result).to.equal(true);

    if (originalEnv !== undefined) {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalEnv;
    }
  });

  it('returns false when in AWS Lambda', () => {
    const originalEnv = process.env.AWS_LAMBDA_FUNCTION_NAME;
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';

    const result = isLocal();

    expect(result).to.equal(false);

    if (originalEnv !== undefined) {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalEnv;
    } else {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    }
  });

  it('returns false when AWS_LAMBDA_FUNCTION_NAME is empty string', () => {
    const originalEnv = process.env.AWS_LAMBDA_FUNCTION_NAME;
    process.env.AWS_LAMBDA_FUNCTION_NAME = '';

    const result = isLocal();

    expect(result).to.equal(false);

    if (originalEnv !== undefined) {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalEnv;
    } else {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    }
  });
});

describe('logMRTError', () => {
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    consoleErrorStub.restore();
  });

  const getLoggedJson = (): Record<string, unknown> => JSON.parse(consoleErrorStub.firstCall.args[0] as string);

  it('logs message and stack when an Error instance is provided', () => {
    const err = new Error('something went wrong');
    logMRTError('data_store', err);

    expect(consoleErrorStub.callCount).to.equal(1);
    const logged = getLoggedJson();
    expect(logged).to.have.property('__MRT__data_store', 'error');
    expect(logged).to.have.property('type', 'MRT_internal');
    expect(logged).to.have.property('error', 'something went wrong');
    expect(logged).to.have.property('stack', err.stack);
  });

  it('normalizes non-Errors to Errors', () => {
    logMRTError('middleware', 'plain string error');

    expect(consoleErrorStub.callCount).to.equal(1);
    const logged = getLoggedJson();
    expect(logged).to.have.property('__MRT__middleware', 'error');
    expect(logged).to.have.property('type', 'MRT_internal');
    expect(logged).to.have.property('error', 'plain string error');
    expect(logged.stack).to.be.ok;
  });

  it('includes context when provided', () => {
    const err = new Error('something bad happened');
    logMRTError('data_store', err, {myContext: 'some helpful context'});

    expect(consoleErrorStub.callCount).to.equal(1);
    const logged = getLoggedJson();
    expect(logged).to.have.property('error', 'something bad happened');
    expect(logged).to.have.property('myContext', 'some helpful context');
  });
});
