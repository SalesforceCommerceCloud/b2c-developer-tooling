/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import JSZip from 'jszip';
import {uploadFiles} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';

describe('code file upload validation', () => {
  let directory: string;
  const put = sinon.stub();
  const request = sinon.stub();
  const remove = sinon.stub();
  let instance: B2CInstance;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'code-upload-'));
    await writeFile(join(directory, 'a.js'), 'first');
    await writeFile(join(directory, 'b.js'), 'second');
    put.reset();
    request.reset();
    remove.reset();
    put.resolves();
    request.resolves(new Response(null));
    remove.resolves();
    instance = {config: {}, webdav: {put, request, delete: remove}} as unknown as B2CInstance;
  });

  afterEach(async () => rm(directory, {recursive: true, force: true}));

  it('creates a selected-file archive with exact contents', async () => {
    await uploadFiles(instance, 'v1', [{src: join(directory, 'a.js'), dest: 'app/cartridge/a.js'}], [], {
      strict: true,
      maxBytes: 5,
    });
    const archive = await JSZip.loadAsync(put.firstCall.args[1]);
    expect(Object.keys(archive.files).filter((name) => !archive.files[name].dir)).to.deep.equal(['app/cartridge/a.js']);
    expect(await archive.file('app/cartridge/a.js')!.async('string')).to.equal('first');
  });

  it('rejects an oversized batch before any remote write', async () => {
    let error;
    try {
      await uploadFiles(
        instance,
        'v1',
        ['a.js', 'b.js'].map((name) => ({src: join(directory, name), dest: `app/${name}`})),
        [],
        {strict: true, maxBytes: 8},
      );
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('limit');
    expect(put.called).to.equal(false);
  });

  it('keeps watch callers best-effort unless strict is requested', async () => {
    const files = [{src: join(directory, 'missing'), dest: 'app/missing'}];
    await uploadFiles(instance, 'v1', files, []);
    let error;
    try {
      await uploadFiles(instance, 'v1', files, [], {strict: true});
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('does not exist');
    expect(put.called).to.equal(false);
  });

  it('does not report success or delete the archive when unzip fails', async () => {
    request.resolves(new Response(null, {status: 500}));
    const onUpload = sinon.spy();
    let error;
    try {
      await uploadFiles(instance, 'v1', [{src: join(directory, 'a.js'), dest: 'app/a.js'}], [], {
        strict: true,
        onUpload,
      });
    } catch (caught) {
      error = caught;
    }
    expect(String(error)).to.include('500');
    expect(onUpload.called).to.equal(false);
    expect(remove.called).to.equal(false);
    expect(put.callCount).to.equal(1);
  });
});
