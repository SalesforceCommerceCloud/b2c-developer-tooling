/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Cases share sequential stubs and verify ordered continuations. */

import {expect} from 'chai';
import sinon from 'sinon';
import {mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import {WebDavClient, MiddlewareRegistry, createSafetyMiddleware} from '@salesforce/b2c-tooling-sdk/clients';
import {SafetyGuard} from '@salesforce/b2c-tooling-sdk/safety';
import {Services} from '../../src/services.js';
import {createWebDavTools} from '../../src/tools/webdav/index.js';
import {MAX_FILE_BYTES, readFileResponse, readTextRange, webdavPath} from '../../src/tools/webdav/files.js';
import {createMockResolvedConfig} from '../test-helpers.js';
import type {ToolResult} from '../../src/utils/types.js';

function json(result: ToolResult) {
  const text = (result.content[0] as {text: string}).text;
  return result.isError ? {error: text} : JSON.parse(text);
}

describe('WebDAV file tools', () => {
  let root: string;
  const request = sinon.stub();
  const propfind = sinon.stub();
  let tools: Record<string, ReturnType<typeof createWebDavTools>[number]>;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'mcp-webdav-'));
    request.reset();
    propfind.reset();
    const instance = {config: {}, webdav: {request, propfind}} as unknown as B2CInstance;
    const services = new Services({
      b2cInstance: instance,
      resolvedConfig: createMockResolvedConfig({projectDirectory: root}),
    });
    tools = Object.fromEntries(createWebDavTools(() => services).map((tool) => [tool.name, tool]));
  });

  afterEach(async () => rm(root, {recursive: true, force: true}));

  it('normalizes returned log paths and rejects traversal and URLs', () => {
    expect(webdavPath('/Sites/LOGS/jobs/a b.log')).to.equal('Logs/jobs/a%20b.log');
    for (const path of [
      'https://host/Logs/a',
      'Logs/../a',
      'Logs/%2e%2e/a',
      'Logs/a%2Fb',
      'Logs/%252e%252e/a',
      String.raw`Logs/a\b`,
    ]) {
      expect(() => webdavPath(path), path).to.throw();
    }
  });

  it('lists file sizes and bounded pages without including the directory itself', async () => {
    propfind.resolves([
      {href: '/on/demandware.servlet/webdav/Sites/LOGS/jobs/', isCollection: true},
      {href: '/on/demandware.servlet/webdav/Sites/LOGS/jobs/b.log', isCollection: false, contentLength: 123},
      {href: '/on/demandware.servlet/webdav/Sites/LOGS/jobs/a%20b.log', isCollection: false, contentLength: 456},
    ]);
    const result = await tools.webdav_list.handler({path: 'Logs/jobs', limit: 1});
    expect(result.isError).not.to.equal(true);
    expect(json(result)).to.include({total: 2, nextOffset: 1});
    expect(json(result).files[0]).to.include({path: 'Logs/jobs/a b.log', contentLength: 456});
    expect(propfind.firstCall.args).to.deep.equal(['Logs/jobs', '1']);
  });

  it('pages exact UTF-8 text using byte ranges and reports total file size', async () => {
    request.resolves(
      new Response('éBC', {status: 206, headers: {'content-type': 'text/plain', 'content-range': 'bytes 1-4/6'}}),
    );
    const result = await tools.webdav_get.handler({path: '/Sites/LOGS/jobs/run.log', offset: 1, maxBytes: 4});
    expect(json(result)).to.include({content: 'éBC', size: 6, bytesRead: 4, nextOffset: 5});
    expect(json(result)).to.have.property('resolution');
    expect(request.firstCall.args[0]).to.equal('Logs/jobs/run.log');
    expect(request.firstCall.args[1]).to.include({method: 'GET', redirect: 'error'});
    expect(request.firstCall.args[1].signal).to.be.instanceOf(AbortSignal);
    expect(request.firstCall.args[1].headers.Range).to.equal('bytes=1-4');
  });

  it('downloads binary bytes to a new local file and uploads them without model encoding', async () => {
    const bytes = new Uint8Array([0, 255, 10, 200]);
    request.onFirstCall().resolves(new Response(bytes));
    const download = await tools.webdav_get_to_file.handler({path: 'Impex/src/a.zip', outputPath: 'a.zip'});
    expect(download.isError).not.to.equal(true);
    expect(await readFile(join(root, 'a.zip'))).to.deep.equal(Buffer.from(bytes));
    request.onSecondCall().resolves(new Response(null, {status: 201}));
    const upload = await tools.webdav_put.handler({path: 'Impex/src/b.zip', sourcePath: 'a.zip'});
    expect(upload.isError).not.to.equal(true);
    expect(request.secondCall.args[1].body).to.deep.equal(bytes);
    expect(request.secondCall.args[1].headers['If-None-Match']).to.equal('*');
    request.onThirdCall().resolves(new Response('replacement'));
    const duplicate = await tools.webdav_get_to_file.handler({path: 'Impex/src/a.zip', outputPath: 'a.zip'});
    expect(duplicate.isError).to.equal(true);
    expect(await readFile(join(root, 'a.zip'))).to.deep.equal(Buffer.from(bytes));
  });

  it('reads the end of a file with a suffix range, starting at a complete UTF-8 character', async () => {
    // Bytes 2-5 of "AéBC\n" (6 bytes) begin with the continuation byte of "é".
    const bytes = Buffer.from('AéBC\n');
    request.resolves(
      new Response(bytes.subarray(2), {status: 206, headers: {'content-range': `bytes 2-5/${bytes.length}`}}),
    );
    const result = await tools.webdav_get.handler({path: 'Logs/run.log', tail: true, maxBytes: 4});
    expect(json(result)).to.include({content: 'BC\n', size: 6, offset: 3, nextOffset: null});
    expect(request.firstCall.args[1].headers.Range).to.equal('bytes=-4');
    expect(request.firstCall.args[1].headers['Accept-Encoding']).to.equal('identity');
    request.resolves(new Response('small'));
    expect(json(await tools.webdav_get.handler({path: 'Logs/run.log', tail: true}))).to.include({
      content: 'small',
      offset: 0,
    });
    expect((await tools.webdav_get.handler({path: 'Logs/run.log', tail: true, offset: 4})).isError).to.equal(true);
  });

  it('keeps webdav_get read-only and moves local downloads to webdav_get_to_file', async () => {
    expect(tools.webdav_get.effect).to.equal('read');
    expect(tools.webdav_get.inputSchema).not.to.have.property('outputPath');
    expect(tools.webdav_get_to_file).to.include({effect: 'write', idempotent: false});
  });

  it('keeps local download and upload paths within the project directory', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'mcp-webdav-outside-'));
    try {
      await writeFile(join(outside, 'secret.txt'), 'secret');
      await symlink(outside, join(root, 'linked'));
      await mkdir(join(root, 'downloads'));
      for (const outputPath of ['../escape.txt', join(outside, 'abs.txt'), 'linked/via-link.txt', 'missing/a.txt']) {
        const result = await tools.webdav_get_to_file.handler({path: 'Impex/src/a.xml', outputPath});
        expect(result.isError, outputPath).to.equal(true);
      }
      for (const sourcePath of ['../secret.txt', join(outside, 'secret.txt'), 'linked/secret.txt']) {
        const result = await tools.webdav_put.handler({path: 'Impex/src/a.txt', sourcePath});
        expect(result.isError, sourcePath).to.equal(true);
      }
      // Nothing was requested from or sent to the instance for rejected paths.
      expect(request.callCount).to.equal(0);
      request.resolves(new Response('<a/>'));
      const nested = await tools.webdav_get_to_file.handler({
        path: 'Impex/src/a.xml',
        outputPath: join(root, 'downloads', 'a.xml'),
      });
      expect(nested.isError).not.to.equal(true);
      expect(await readFile(join(root, 'downloads', 'a.xml'), 'utf8')).to.equal('<a/>');
    } finally {
      await rm(outside, {recursive: true, force: true});
    }
  });

  it('uploads inline text, validates exclusive sources, and preserves overwrite errors', async () => {
    request.resolves(new Response(null, {status: 412}));
    const collision = await tools.webdav_put.handler({path: 'Impex/src/a.xml', content: '<a/>'});
    expect(collision.isError).to.equal(true);
    expect(json(collision).error).to.include('Destination exists');
    request.reset();
    request.resolves(new Response(null, {status: 204}));
    const replace = await tools.webdav_put.handler({path: 'Impex/src/a.xml', content: '', overwrite: true});
    expect(replace.isError).not.to.equal(true);
    expect(request.firstCall.args[1].headers).not.to.have.property('If-None-Match');
    expect(request.firstCall.args[1].body).to.have.length(0);
    for (const args of [{}, {content: 'a', sourcePath: 'a.xml'}]) {
      const invalid = await tools.webdav_put.handler({path: 'Impex/src/a.xml', ...args});
      expect(invalid.isError).to.equal(true);
    }
    expect(request.callCount).to.equal(1);
  });

  it('reports HTTP errors and binary text reads instead of empty successful output', async () => {
    for (const status of [403, 404, 500]) {
      request.resolves(new Response(null, {status}));
      const result = await tools.webdav_get.handler({path: 'Logs/missing.log'});
      expect(result.isError).to.equal(true);
      expect(json(result).error).to.include(String(status));
    }
    request.resolves(new Response(new Uint8Array([255, 0])));
    expect(json(await tools.webdav_get.handler({path: 'Impex/src/b.zip'})).error).to.include('webdav_get_to_file');
    await writeFile(join(root, 'large.bin'), 'x');
    expect((await tools.webdav_put.handler({path: 'Impex/src/a', sourcePath: '.'})).isError).to.equal(true);
  });

  it('bounds range reads even without Content-Length', async () => {
    const response = new Response(
      // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Supported by the minimum Node 22.16 release.
      new ReadableStream({
        start(controller) {
          for (let i = 0; i < 3; i++) controller.enqueue(new Uint8Array(4));
          controller.close();
        },
      }),
    );
    let error;
    try {
      await readFileResponse(response, 8);
    } catch (error_) {
      error = error_;
    }
    expect(String(error)).to.include('byte range');
  });

  it('streams downloads larger than the upload limit to a local file', async () => {
    const chunk = new Uint8Array(1024 * 1024);
    const chunks = MAX_FILE_BYTES / chunk.length + 1;
    request.resolves(
      new Response(
        // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Supported by the minimum Node 22.16 release.
        new ReadableStream({
          start(controller) {
            for (let i = 0; i < chunks; i++) controller.enqueue(chunk);
            controller.close();
          },
        }),
      ),
    );
    const result = json(await tools.webdav_get_to_file.handler({path: 'Impex/src/big.zip', outputPath: 'big.zip'}));
    expect(result.size).to.equal(chunks * chunk.length);
    expect((await stat(join(root, 'big.zip'))).size).to.equal(chunks * chunk.length);
  });

  it('removes the partial local file when a download fails mid-stream', async () => {
    request.resolves(
      new Response(
        // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Supported by the minimum Node 22.16 release.
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3]));
            controller.error(new Error('connection reset'));
          },
        }),
      ),
    );
    const result = await tools.webdav_get_to_file.handler({path: 'Impex/src/a.zip', outputPath: 'a.zip'});
    expect(json(result).error).to.include('connection reset');
    let exists = true;
    try {
      await stat(join(root, 'a.zip'));
    } catch {
      exists = false;
    }
    expect(exists).to.equal(false);
  });

  it('continues at a complete UTF-8 boundary and handles end-of-file ranges', async () => {
    const bytes = Buffer.from('ABCéZ');
    const first = await readTextRange(
      new Response(bytes.subarray(0, 4), {
        status: 206,
        headers: {'content-range': 'bytes 0-3/6'},
      }),
      0,
      4,
    );
    expect(first).to.include({content: 'ABC', size: 6, nextOffset: 3});
    const second = await readTextRange(
      new Response(bytes.subarray(3), {
        status: 206,
        headers: {'content-range': 'bytes 3-5/6'},
      }),
      first.nextOffset!,
      4,
    );
    expect(second).to.include({content: 'éZ', size: 6, nextOffset: null});
    // A log mid-append can end inside a character; hold it back rather than failing.
    const partial = await readTextRange(
      new Response(bytes.subarray(0, 4), {status: 206, headers: {'content-range': 'bytes 0-3/4'}}),
      0,
      4,
    );
    expect(partial).to.include({content: 'ABC', size: 4, nextOffset: 3});
    let stalled;
    try {
      await readTextRange(
        new Response(bytes.subarray(3, 4), {status: 206, headers: {'content-range': 'bytes 3-3/4'}}),
        3,
        4,
      );
    } catch (error_) {
      stalled = error_;
    }
    expect(String(stalled)).to.include('no complete UTF-8 character');
    for (const size of [0, 6]) {
      const end = await readTextRange(
        new Response(null, {status: 416, headers: {'content-range': `bytes */${size}`}}),
        size,
        4,
      );
      expect(end).to.include({content: '', size, nextOffset: null});
    }
  });

  it('rejects ignored and truncated ranges rather than skipping or duplicating content', async () => {
    for (const response of [
      new Response('whole file'),
      new Response('x', {status: 206, headers: {'content-range': 'bytes 4-7/12'}}),
    ]) {
      let error;
      try {
        await readTextRange(response, 4, 4);
      } catch (error_) {
        error = error_;
      }
      expect(String(error)).to.match(/range/i);
    }
  });

  it('honors SDK safety and installed middleware on actual managed requests', async () => {
    const fetch = sinon.stub().resolves(new Response('log line'));
    const registry = new MiddlewareRegistry();
    registry.register({
      name: 'safety',
      getMiddleware: () => createSafetyMiddleware(new SafetyGuard({level: 'READ_ONLY'})),
    });
    registry.register({
      name: 'plugin',
      getMiddleware: () => ({
        onRequest({request}) {
          request.headers.set('x-plugin', 'yes');
        },
      }),
    });
    const webdav = new WebDavClient(
      'test.demandware.net',
      {fetch, getAuthorizationHeader: async () => 'Bearer test'},
      {middlewareRegistry: registry},
    );
    const instance = {config: {}, webdav} as unknown as B2CInstance;
    const services = new Services({b2cInstance: instance, resolvedConfig: createMockResolvedConfig()});
    const [, get, , put] = createWebDavTools(() => services);
    expect((await get.handler({path: 'Logs/run.log'})).isError).not.to.equal(true);
    expect(new Headers(fetch.firstCall.args[1].headers).get('x-plugin')).to.equal('yes');
    expect(fetch.firstCall.args[1].redirect).to.equal('error');
    expect(fetch.firstCall.args[1].signal).to.be.instanceOf(AbortSignal);
    const blocked = await put.handler({path: 'Impex/src/a.xml', content: '<a/>'});
    expect(blocked.isError).to.equal(true);
    expect(json(blocked).error).to.match(/blocked/i);
    expect(fetch.callCount).to.equal(1);
  });
});
