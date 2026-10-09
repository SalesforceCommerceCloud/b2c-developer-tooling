/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Check each selection against the same no-write fixture. */

import {expect} from 'chai';
import sinon from 'sinon';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import {fileToCartridgePath} from '@salesforce/b2c-tooling-sdk/operations/code';
import {Services} from '../../../src/services.js';
import {createCartridgesTools} from '../../../src/tools/cartridges/index.js';
import {createMockResolvedConfig} from '../../test-helpers.js';

describe('selected cartridge uploads', () => {
  let root: string;
  const put = sinon.stub();
  const request = sinon.stub();
  const remove = sinon.stub();
  let tool: ReturnType<typeof createCartridgesTools>[0];

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'mcp-cartridges-'));
    await mkdir(join(root, 'app', 'cartridge'), {recursive: true});
    await writeFile(join(root, 'app', '.project'), '<projectDescription/>');
    await writeFile(join(root, 'app', 'cartridge', 'a.js'), 'selected');
    await writeFile(join(root, 'app', 'cartridge', 'b.js'), 'unrelated');
    put.reset();
    request.reset();
    remove.reset();
    put.resolves();
    request.resolves(new Response(null, {status: 200}));
    remove.resolves();
    const instance = {
      config: {codeVersion: 'configured'},
      webdav: {put, request, delete: remove},
    } as unknown as B2CInstance;
    const services = new Services({
      b2cInstance: instance,
      resolvedConfig: createMockResolvedConfig({projectDirectory: root}),
    });
    tool = createCartridgesTools(() => services)[0];
  });

  afterEach(async () => rm(root, {recursive: true, force: true}));

  it('uploads only the selected destination to the explicit version', async () => {
    const result = await tool.handler({files: ['app/cartridge/a.js'], codeVersion: 'target'});
    expect(result.isError).not.to.equal(true);
    const data = JSON.parse((result.content[0] as {text: string}).text);
    expect(data).to.include({codeVersion: 'target', reloaded: false});
    expect(data.uploadedFiles).to.deep.equal(['app/cartridge/a.js']);
    expect(put.firstCall.args[0]).to.match(/^Cartridges\/target\/_upload-.+\.zip$/);
    // ZIP directory entries contain each filename even when its contents are compressed.
    const archive = (put.firstCall.args[1] as Buffer).toString('latin1');
    expect(archive).to.include('app/cartridge/a.js');
    expect(archive).not.to.include('b.js');
    expect(request.firstCall.args[1]).to.include({method: 'POST', body: 'method=UNZIP'});
    expect(remove.callCount).to.equal(1);
  });

  it('rejects missing, outside, excluded and duplicate selections before writing', async () => {
    for (const args of [
      {files: ['app/cartridge/a.js', 'app/cartridge/missing.js']},
      {files: ['outside.js']},
      {files: ['app/cartridge/a.js'], exclude: ['app']},
      {files: ['app/cartridge/a.js', 'app/cartridge/a.js']},
      {files: ['app/cartridge/a.js'], codeVersion: '../target'},
      {files: []},
    ])
      expect((await tool.handler(args)).isError).to.equal(true);
    expect(put.called).to.equal(false);
    expect(request.called).to.equal(false);
  });

  it('does not treat sibling path prefixes as cartridges', () => {
    const mappings = [{name: 'app', src: join(root, 'app'), dest: 'app'}];
    expect(fileToCartridgePath(join(root, 'app-other', 'a.js'), mappings)).to.equal(undefined);
    expect(fileToCartridgePath(join(root, 'app', 'cartridge', 'a.js'), mappings)?.dest).to.equal('app/cartridge/a.js');
  });

  it('reports cleanup failure as a successful upload with a warning', async () => {
    remove.rejects(new Error('cleanup forbidden'));
    const result = await tool.handler({files: ['app/cartridge/a.js']});
    expect(result.isError).not.to.equal(true);
    const data = JSON.parse((result.content[0] as {text: string}).text);
    expect(data.uploadedFiles).to.deep.equal(['app/cartridge/a.js']);
    expect(data.warnings[0]).to.include('Files uploaded');
    expect(data.warnings[0]).to.include('cleanup forbidden');
    expect(put.callCount).to.equal(1);
  });

  it('retains upload success when reload fails, without replaying deployment', async () => {
    const result = await tool.handler({files: ['app/cartridge/a.js'], reload: true});
    expect(result.isError).not.to.equal(true);
    const data = JSON.parse((result.content[0] as {text: string}).text);
    expect(data).to.include({reloaded: false});
    expect(data.uploadedFiles).to.deep.equal(['app/cartridge/a.js']);
    expect(data.warnings[0]).to.include('reload failed');
    expect(put.callCount).to.equal(1);
  });
});
