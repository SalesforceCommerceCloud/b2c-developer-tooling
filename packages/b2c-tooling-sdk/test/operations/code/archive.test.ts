/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {maxArchiveBytesFromConfig} from '@salesforce/b2c-tooling-sdk/operations/code';

describe('operations/code/archive maxArchiveBytesFromConfig', () => {
  it('returns undefined when unset so the default applies', () => {
    expect(maxArchiveBytesFromConfig(undefined)).to.equal(undefined);
    expect(maxArchiveBytesFromConfig('')).to.equal(undefined);
  });

  it('parses sizes with units and bare MiB numbers', () => {
    expect(maxArchiveBytesFromConfig('100mb')).to.equal(100 * 1024 * 1024);
    expect(maxArchiveBytesFromConfig('150')).to.equal(150 * 1024 * 1024);
  });

  it('rejects invalid or tiny sizes', () => {
    expect(() => maxArchiveBytesFromConfig('huge')).to.throw(/Invalid size/);
    expect(() => maxArchiveBytesFromConfig('512kb')).to.throw(/at least 1 MiB/);
  });
});
