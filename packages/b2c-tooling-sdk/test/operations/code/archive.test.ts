/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import JSZip from 'jszip';
import {maxArchiveBytesFromConfig} from '@salesforce/b2c-tooling-sdk/operations/code';
import {type ArchiveEntry, planArchiveParts, writeArchive} from '../../../src/operations/code/archive.js';

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
    expect(() => maxArchiveBytesFromConfig('4gb')).to.throw(/less than 4 GiB/);
  });
});

describe('operations/code/archive planArchiveParts', () => {
  const entry = (cartridge: string, i: number): ArchiveEntry => ({
    abs: `/src/${cartridge}/f${i}`,
    name: `v1/${cartridge}/f${i}`,
    size: 1,
    compress: true,
    packedSize: 100,
  });

  it('splits by file count when an archive would exceed 65,535 files', () => {
    const entries = Array.from({length: 70_000}, (_, i) => entry('big', i));
    const parts = planArchiveParts(entries, 1024 * 1024 * 1024);
    expect(parts).to.have.length(2);
    expect(parts[0].entries).to.have.length(65_535);
    expect(parts[1].entries).to.have.length(70_000 - 65_535);
  });
});

describe('operations/code/archive writeArchive', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-archive-test-'));
  });
  afterEach(() => fs.rmSync(dir, {recursive: true, force: true}));

  it('writes compressed and stored entries that round-trip', async () => {
    const text = 'console.log("hi");\n'.repeat(500);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    fs.writeFileSync(path.join(dir, 'a.js'), text);
    fs.writeFileSync(path.join(dir, 'b.png'), png);
    const entries: ArchiveEntry[] = [
      {abs: path.join(dir, 'a.js'), name: 'v1/c/a.js', size: text.length, compress: true, packedSize: 0},
      {abs: path.join(dir, 'b.png'), name: 'v1/c/b.png', size: png.length, compress: false, packedSize: 0},
    ];

    const out = await writeArchive(entries, path.join(dir, 'out.zip'));

    expect(out.bytes).to.equal(fs.statSync(out.path).size);
    expect(out.bytes).to.be.below(text.length);
    const zip = await JSZip.loadAsync(fs.readFileSync(out.path));
    expect(Object.keys(zip.files).sort()).to.deep.equal(['v1/c/a.js', 'v1/c/b.png']);
    expect(await zip.file('v1/c/a.js')!.async('string')).to.equal(text);
    expect(Buffer.compare(await zip.file('v1/c/b.png')!.async('nodebuffer'), png)).to.equal(0);
  });

  it('rejects when a source file is missing', async () => {
    const entries: ArchiveEntry[] = [
      {abs: path.join(dir, 'missing.js'), name: 'v1/c/missing.js', size: 1, compress: true, packedSize: 0},
    ];
    let failed = false;
    try {
      await writeArchive(entries, path.join(dir, 'out.zip'));
    } catch {
      failed = true;
    }
    expect(failed).to.equal(true);
  });
});
