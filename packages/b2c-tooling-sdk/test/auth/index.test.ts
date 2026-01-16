/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  ALL_AUTH_METHODS,
  ApiKeyStrategy,
  BasicAuthStrategy,
  ImplicitOAuthStrategy,
  OAuthStrategy,
  checkAvailableAuthMethods,
  decodeJWT,
  resolveAuthStrategy,
} from '@salesforce/b2c-tooling-sdk/auth';

describe('auth/index', () => {
  it('exports core strategies and helpers from the auth entrypoint', () => {
    expect(ALL_AUTH_METHODS).to.be.an('array');
    expect(ApiKeyStrategy).to.be.a('function');
    expect(BasicAuthStrategy).to.be.a('function');
    expect(ImplicitOAuthStrategy).to.be.a('function');
    expect(OAuthStrategy).to.be.a('function');
    expect(checkAvailableAuthMethods).to.be.a('function');
    expect(resolveAuthStrategy).to.be.a('function');
    expect(decodeJWT).to.be.a('function');
  });

  it('ALL_AUTH_METHODS is stable and can be iterated', () => {
    const methods = [...ALL_AUTH_METHODS];
    expect(methods).to.include('implicit');
  });
});
