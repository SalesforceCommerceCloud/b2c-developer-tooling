/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {HTTPError} from '@salesforce/b2c-tooling-sdk/errors';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {
  discoverImportSet,
  siteArchiveImportSet,
  type ImportSetEvent,
  type SiteArchiveImportSetOptions,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';

class FakeWebDav {
  readonly directories = new Set(['Impex']);
  readonly files = new Map<string, string>();
  readonly requests: Array<{method: string; path: string}> = [];
  failNextReceiptCreation = false;

  async request(remotePath: string, init: RequestInit = {}): Promise<Response> {
    const method = init.method ?? 'GET';
    this.requests.push({method, path: remotePath});

    if (method === 'MKCOL') {
      if (this.directories.has(remotePath) || this.files.has(remotePath)) return response(405);
      if (!this.directories.has(path.posix.dirname(remotePath))) return response(409);
      if (this.failNextReceiptCreation && remotePath.includes('/receipts/')) {
        this.failNextReceiptCreation = false;
        return response(500);
      }
      this.directories.add(remotePath);
      return response(201);
    }

    if (method === 'HEAD') {
      return response(this.directories.has(remotePath) || this.files.has(remotePath) ? 200 : 404);
    }

    if (method === 'GET') {
      const value = this.files.get(remotePath);
      return value === undefined ? response(404) : new Response(value, {status: 200});
    }

    if (method === 'PUT') {
      if (!this.directories.has(path.posix.dirname(remotePath))) return response(409);
      this.files.set(remotePath, String(init.body ?? ''));
      return response(this.files.has(remotePath) ? 204 : 201);
    }

    if (method === 'DELETE') {
      const existed =
        this.directories.has(remotePath) ||
        this.files.has(remotePath) ||
        [...this.directories].some((entry) => entry.startsWith(`${remotePath}/`)) ||
        [...this.files.keys()].some((entry) => entry.startsWith(`${remotePath}/`));
      for (const entry of [...this.directories]) {
        if (entry === remotePath || entry.startsWith(`${remotePath}/`)) this.directories.delete(entry);
      }
      for (const entry of [...this.files.keys()]) {
        if (entry === remotePath || entry.startsWith(`${remotePath}/`)) this.files.delete(entry);
      }
      return response(existed ? 204 : 404);
    }

    return response(405);
  }

  async propfind(remotePath: string): Promise<Array<{href: string; isCollection: boolean; lastModified: Date}>> {
    if (!this.directories.has(remotePath) && !this.files.has(remotePath)) {
      throw new HTTPError('Not found', response(404), 'PROPFIND');
    }
    return [{href: remotePath, isCollection: this.directories.has(remotePath), lastModified: new Date()}];
  }
}

function response(status: number): Response {
  return new Response(null, {status});
}

function createImportDirectory(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-import-set-'));
  const first = path.join(root, '20260101T000000-metadata');
  fs.mkdirSync(path.join(first, 'meta'), {recursive: true});
  fs.writeFileSync(path.join(first, 'meta', 'system-objecttype-extensions.xml'), '<metadata/>');
  fs.writeFileSync(
    path.join(first, 'README.md'),
    '# Manual step\n\nEnable the feature preference in Business Manager.\n',
  );
  fs.writeFileSync(path.join(root, '20260102T000000-sites.zip'), 'zip-content');
  fs.writeFileSync(path.join(root, 'README.md'), 'ignored');
  return root;
}

function createHarness(): {
  instance: B2CInstance;
  webdav: FakeWebDav;
  imported: string[];
  options: SiteArchiveImportSetOptions;
} {
  const webdav = new FakeWebDav();
  const imported: string[] = [];
  const instance = {webdav, config: {hostname: 'test.demandware.net'}} as unknown as B2CInstance;
  const options: SiteArchiveImportSetOptions = {
    sleep: () => Promise.resolve(),
    importArchive: async (_instance, target) => {
      imported.push(path.basename(target));
      return {
        execution: {id: `execution-${imported.length}`, execution_status: 'finished'},
        archiveFilename: `${path.basename(target)}.uploaded.zip`,
        archiveKept: false,
      };
    },
  };
  return {instance, webdav, imported, options};
}

describe('operations/jobs/import-set', () => {
  let importDirectory: string;

  beforeEach(() => {
    importDirectory = createImportDirectory();
  });

  afterEach(() => {
    fs.rmSync(importDirectory, {recursive: true, force: true});
  });

  it('discovers immediate directories and zip archives in filename order', async () => {
    const items = await discoverImportSet(importDirectory);

    expect(items.map((item) => item.id)).to.deep.equal(['20260101T000000-metadata', '20260102T000000-sites.zip']);
    expect(items.map((item) => item.kind)).to.deep.equal(['directory', 'zip']);
  });

  it('reads a README note from directory items and ignores it for zip items', async () => {
    const items = await discoverImportSet(importDirectory);

    expect(items[0].note).to.equal('# Manual step\n\nEnable the feature preference in Business Manager.');
    expect(items[1].note).to.equal(undefined);
  });

  it('prefers README.md over README and treats an empty README as no note', async () => {
    const withPlainReadme = path.join(importDirectory, '20260103T000000-plain');
    fs.mkdirSync(withPlainReadme, {recursive: true});
    fs.writeFileSync(path.join(withPlainReadme, 'README'), 'plain readme body');
    const withEmptyReadme = path.join(importDirectory, '20260104T000000-empty');
    fs.mkdirSync(withEmptyReadme, {recursive: true});
    fs.writeFileSync(path.join(withEmptyReadme, 'README.md'), '   \n  \n');

    const items = await discoverImportSet(importDirectory);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get('20260103T000000-plain')?.note).to.equal('plain readme body');
    expect(byId.get('20260104T000000-empty')?.note).to.equal(undefined);
  });

  it('carries item notes through to the applied result', async () => {
    const {instance, options} = createHarness();

    const result = await siteArchiveImportSet(instance, importDirectory, options);
    const metadataItem = result.items.find((item) => item.id === '20260101T000000-metadata');

    expect(metadataItem?.status).to.equal('imported');
    expect(metadataItem?.note).to.equal('# Manual step\n\nEnable the feature preference in Business Manager.');
  });

  it('imports pending items, verifies receipts, and skips them on the next run', async () => {
    const {instance, webdav, imported, options} = createHarness();

    const first = await siteArchiveImportSet(instance, importDirectory, options);
    const second = await siteArchiveImportSet(instance, importDirectory, options);

    expect(imported).to.deep.equal(['20260101T000000-metadata', '20260102T000000-sites.zip']);
    expect(first.imported).to.equal(2);
    expect(first.skipped).to.equal(0);
    expect(second.imported).to.equal(0);
    expect(second.skipped).to.equal(2);
    expect([...webdav.directories].filter((entry) => entry.includes('/receipts/'))).to.have.lengthOf(2);
    expect([...webdav.files.keys()].some((entry) => entry.includes('/receipts/'))).to.equal(false);
  });

  it('uses the same default receipt namespace for equivalent directories at different local paths', async () => {
    const {instance, imported, options} = createHarness();
    const anotherDirectory = createImportDirectory();

    try {
      const first = await siteArchiveImportSet(instance, importDirectory, options);
      const second = await siteArchiveImportSet(instance, anotherDirectory, options);

      expect(first.setId).to.equal('migrations');
      expect(second.setId).to.equal('migrations');
      expect(imported).to.have.lengthOf(2);
      expect(second.skipped).to.equal(2);
    } finally {
      fs.rmSync(anotherDirectory, {recursive: true, force: true});
    }
  });

  it('reruns an import when the previous receipt directory creation failed', async () => {
    const {instance, webdav, imported, options} = createHarness();
    webdav.failNextReceiptCreation = true;

    try {
      await siteArchiveImportSet(instance, importDirectory, options);
      expect.fail('Expected receipt write failure');
    } catch (error) {
      expect((error as Error).message).to.include('Unable to create WebDAV receipt directory');
    }

    const result = await siteArchiveImportSet(instance, importDirectory, options);

    expect(imported.filter((item) => item === '20260101T000000-metadata')).to.have.lengthOf(2);
    expect(result.imported).to.equal(2);
  });

  it('reruns an import and replaces an invalid non-directory receipt marker', async () => {
    const {instance, webdav, imported, options} = createHarness();
    await siteArchiveImportSet(instance, importDirectory, options);
    const receiptPath = [...webdav.directories].find((remotePath) => remotePath.includes('/receipts/'))!;
    webdav.directories.delete(receiptPath);
    webdav.files.set(receiptPath, 'incomplete');

    const result = await siteArchiveImportSet(instance, importDirectory, options);

    expect(imported.filter((item) => item === '20260101T000000-metadata')).to.have.lengthOf(2);
    expect(result.imported).to.equal(1);
    expect(result.skipped).to.equal(1);
  });

  it('uses only the item name as receipt identity', async () => {
    const {instance, imported, options} = createHarness();
    await siteArchiveImportSet(instance, importDirectory, options);
    fs.writeFileSync(
      path.join(importDirectory, '20260101T000000-metadata', 'meta', 'system-objecttype-extensions.xml'),
      '<metadata changed="true"/>',
    );

    const result = await siteArchiveImportSet(instance, importDirectory, options);

    expect(imported).to.have.lengthOf(2);
    expect(result.skipped).to.equal(2);
  });

  it('keeps applied state when regular WebDAV files are cleaned', async () => {
    const {instance, webdav, imported, options} = createHarness();
    await siteArchiveImportSet(instance, importDirectory, options);

    webdav.files.clear();
    const result = await siteArchiveImportSet(instance, importDirectory, options);

    expect(imported).to.have.lengthOf(2);
    expect(result.skipped).to.equal(2);
  });

  it('uses MKCOL locking and waits for an active runner', async () => {
    const {instance, webdav, imported, options} = createHarness();
    const setId = 'migrations';
    const setRoot = `Impex/b2c-cli/import-sets/${setId}`;
    for (const directory of [
      'Impex/b2c-cli',
      'Impex/b2c-cli/import-sets',
      setRoot,
      `${setRoot}/receipts`,
      `${setRoot}/lock`,
    ]) {
      webdav.directories.add(directory);
    }
    webdav.files.set(
      `${setRoot}/lock/owner.json`,
      JSON.stringify({
        version: 1,
        setId,
        runId: 'other-run',
        createdAt: new Date().toISOString(),
        heartbeatAt: new Date().toISOString(),
      }),
    );
    const events: ImportSetEvent[] = [];
    let slept = false;
    options.onEvent = (event) => events.push(event);
    options.sleep = async () => {
      if (!slept) {
        slept = true;
        await webdav.request(`${setRoot}/lock`, {method: 'DELETE'});
      }
    };

    await siteArchiveImportSet(instance, importDirectory, options);

    expect(imported).to.have.lengthOf(2);
    expect(events.some((event) => event.type === 'lock-wait')).to.equal(true);
    expect(webdav.requests.some((request) => request.method === 'MKCOL' && request.path.endsWith('/lock'))).to.equal(
      true,
    );
  });

  it('takes over stale locks and emits a visible takeover event', async () => {
    const {instance, webdav, options} = createHarness();
    const setId = 'migrations';
    const setRoot = `Impex/b2c-cli/import-sets/${setId}`;
    for (const directory of [
      'Impex/b2c-cli',
      'Impex/b2c-cli/import-sets',
      setRoot,
      `${setRoot}/receipts`,
      `${setRoot}/lock`,
    ]) {
      webdav.directories.add(directory);
    }
    webdav.files.set(
      `${setRoot}/lock/owner.json`,
      JSON.stringify({
        version: 1,
        setId,
        runId: 'stale-run',
        createdAt: '2020-01-01T00:00:00.000Z',
        heartbeatAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    const events: ImportSetEvent[] = [];
    options.onEvent = (event) => events.push(event);
    options.staleLockSeconds = 1;

    await siteArchiveImportSet(instance, importDirectory, options);

    expect(events.some((event) => event.type === 'lock-takeover')).to.equal(true);
  });

  it('does not create WebDAV state or import during a dry run', async () => {
    const {instance, webdav, imported, options} = createHarness();

    const result = await siteArchiveImportSet(instance, importDirectory, {...options, dryRun: true});

    expect(result.pending).to.equal(2);
    expect(imported).to.have.lengthOf(0);
    expect(webdav.requests.some((request) => ['MKCOL', 'PUT', 'DELETE'].includes(request.method))).to.equal(false);
  });
});
