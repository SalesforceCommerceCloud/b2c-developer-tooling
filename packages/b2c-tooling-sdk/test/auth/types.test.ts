/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {ALL_AUTH_METHODS} from '@salesforce/b2c-tooling-sdk/auth';

describe('auth/types', () => {
  it('exports ALL_AUTH_METHODS in default priority order', () => {
    expect(ALL_AUTH_METHODS).to.deep.equal(['client-credentials', 'implicit', 'basic', 'api-key']);
  });
});
