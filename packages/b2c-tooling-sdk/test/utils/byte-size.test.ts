/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {parseByteSize} from '@salesforce/b2c-tooling-sdk/utils';

describe('utils/byte-size', () => {
  const MIB = 1024 * 1024;

  it('treats a bare number string as MiB', () => {
    expect(parseByteSize('150')).to.equal(150 * MIB);
  });

  it('treats a number input as MiB', () => {
    expect(parseByteSize(200)).to.equal(200 * MIB);
  });

  it('parses units case-insensitively', () => {
    expect(parseByteSize('512kb')).to.equal(512 * 1024);
    expect(parseByteSize('200MB')).to.equal(200 * MIB);
    expect(parseByteSize('1gb')).to.equal(1024 * MIB);
    expect(parseByteSize('2 GiB')).to.equal(2048 * MIB);
    expect(parseByteSize('10b')).to.equal(10);
  });

  it('supports fractions and floors the result', () => {
    expect(parseByteSize('1.5mb')).to.equal(1.5 * MIB);
    expect(parseByteSize('1.5b')).to.equal(1);
  });

  it('throws on invalid input', () => {
    expect(() => parseByteSize('abc')).to.throw('Invalid size: "abc". Use e.g. 200, 200mb, or 512kb.');
    expect(() => parseByteSize('-5mb')).to.throw(/Invalid size/);
    expect(() => parseByteSize('')).to.throw(/Invalid size/);
  });
});
