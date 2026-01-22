/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createRequire} from 'node:module';
import {SDK_NAME, SDK_VERSION, SDK_USER_AGENT} from '@salesforce/b2c-tooling-sdk';

const require = createRequire(import.meta.url);
const pkg = require('@salesforce/b2c-tooling-sdk/package.json') as {name: string; version: string};

describe('version', () => {
  it('SDK_NAME matches package.json name', () => {
    expect(SDK_NAME).to.equal(pkg.name);
  });

  it('SDK_VERSION matches package.json version', () => {
    expect(SDK_VERSION).to.equal(pkg.version);
  });

  it('SDK_USER_AGENT has correct format (without @salesforce/ prefix)', () => {
    expect(SDK_USER_AGENT).to.equal(`${pkg.name.replace(/^@salesforce\//, '')}/${pkg.version}`);
  });

  it('SDK_USER_AGENT is b2c-tooling-sdk/x.x.x format', () => {
    expect(SDK_USER_AGENT).to.match(/^b2c-tooling-sdk\/\d+\.\d+\.\d+$/);
  });
});
