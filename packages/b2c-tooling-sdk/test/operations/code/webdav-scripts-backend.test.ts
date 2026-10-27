/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {
  createScriptsBackend,
  parseCodeVersionFile,
  reloadCodeVersion,
  WebDavLookupFallbackScriptsBackend,
  WebDavScriptsBackend,
  type CodeVersionInfo,
  type ScriptsBackend,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;

const VERSION_FILE = `###########################################
# Generated file, do not edit.
# Copyright (c) 2026 by Demandware, Inc.
###########################################
fileVersion=1
maxVersions=10
release_b/1792788217905/1792797535614
release_a/1792788214474/1791311685611
never_activated//1791558158599
version1/1791304172624/1770289748564
deleted_version/1791304100000/1770289700000
# end of file marker
`;

function propfindXml(names: {name: string; collection: boolean; modified?: string}[]): string {
  const responses = [{name: '', collection: true}, ...names].map(({name, collection, modified}) => {
    const href = `/on/demandware.servlet/webdav/Sites/Cartridges/${name}${collection && name ? '/' : ''}`;
    return `<response><href>${href}</href><propstat><prop>
      <displayname>${name || 'Cartridges'}</displayname>
      <resourcetype>${collection ? '<collection/>' : ''}</resourcetype>
      <getlastmodified>${modified ?? 'Fri, 09 Oct 2026 14:29:41 GMT'}</getlastmodified>
    </prop><status>HTTP/1.1 200 OK</status></propstat></response>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><multistatus xmlns="DAV:">${responses.join('')}</multistatus>`;
}

const FOLDERS = [
  {name: 'release_b', collection: true},
  {name: 'release_a', collection: true},
  {name: 'never_activated', collection: true},
  {name: 'version1', collection: true},
  {name: 'uploaded_only', collection: true, modified: 'Fri, 23 Oct 2026 22:30:05 GMT'},
  {name: '.version', collection: false},
  {name: '_sync-123.zip', collection: false},
];

describe('operations/code/webdav-scripts-backend', () => {
  const server = setupServer();
  let instance: B2CInstance;

  before(() => server.listen({onUnhandledRequest: 'error'}));
  beforeEach(() => {
    instance = new B2CInstance({hostname: TEST_HOST}, {basic: {username: 'u', password: 'p'}});
  });
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  function serve(folders = FOLDERS, versionFiles: string[] = [VERSION_FILE]) {
    let reads = 0;
    server.use(
      http.all(`${BASE_URL}/Cartridges`, ({request}) =>
        request.method === 'PROPFIND'
          ? new HttpResponse(propfindXml(folders), {status: 207, headers: {'Content-Type': 'application/xml'}})
          : new HttpResponse(null, {status: 405}),
      ),
      http.get(`${BASE_URL}/Cartridges/.version`, () => {
        const body = versionFiles[Math.min(reads++, versionFiles.length - 1)];
        return new HttpResponse(body, {headers: {'Content-Type': 'text/plain'}});
      }),
    );
    return () => reads;
  }

  describe('parseCodeVersionFile', () => {
    it('marks the first activated line active and the second rollback', () => {
      const entries = parseCodeVersionFile(VERSION_FILE)!;
      expect(entries.map((e) => e.id)).to.deep.equal([
        'release_b',
        'release_a',
        'never_activated',
        'version1',
        'deleted_version',
      ]);
      expect(entries[0]).to.include({
        active: true,
        rollback: false,
        activationTime: '2026-10-23T20:43:37.905Z',
        lastModificationTime: '2026-10-23T23:18:55.614Z',
      });
      expect(entries[1]).to.include({active: false, rollback: true});
      expect(entries[2]).to.include({active: false, rollback: false, activationTime: undefined});
    });

    it('reports no active version when the first line was never activated', () => {
      const entries = parseCodeVersionFile('fileVersion=1\nfresh//1791558158599\n# end of file marker\n')!;
      expect(entries[0]).to.include({id: 'fresh', active: false});
    });

    it('treats a file without the end marker as incomplete', () => {
      expect(parseCodeVersionFile('fileVersion=1\nrelease_b/1/2\n')).to.equal(undefined);
    });

    it('rejects unknown format versions', () => {
      expect(() => parseCodeVersionFile('fileVersion=2\n# end of file marker\n')).to.throw('fileVersion=2');
    });
  });

  describe('WebDavScriptsBackend', () => {
    it('lists versions from the version file and the Cartridges folders', async () => {
      serve();
      const versions = await new WebDavScriptsBackend(instance).listCodeVersions();

      expect(versions.map((v) => v.id)).to.deep.equal([
        'never_activated',
        'release_a',
        'release_b',
        'uploaded_only',
        'version1',
      ]);
      expect(versions.find((v) => v.active)?.id).to.equal('release_b');
      expect(versions.find((v) => v.rollback)?.id).to.equal('release_a');
      expect(versions.find((v) => v.id === 'uploaded_only')).to.include({
        active: false,
        lastModificationTime: '2026-10-23T22:30:05.000Z',
      });
      expect(versions.find((v) => v.id === 'release_b')?.webDavUrl).to.equal(`${BASE_URL}/Cartridges/release_b`);
    });

    it('finds the active version', async () => {
      serve();
      const active = await new WebDavScriptsBackend(instance).getActiveCodeVersion();
      expect(active?.id).to.equal('release_b');
    });

    it('has no active version when the active folder was deleted', async () => {
      serve(FOLDERS.filter((f) => f.name !== 'release_b'));
      const active = await new WebDavScriptsBackend(instance).getActiveCodeVersion();
      expect(active).to.equal(undefined);
    });

    it('has no active version when the instance has no version file', async () => {
      serve(FOLDERS.filter((f) => f.name !== '.version'));
      const versions = await new WebDavScriptsBackend(instance).listCodeVersions();
      expect(versions.some((v) => v.active)).to.equal(false);
      expect(versions).to.have.length(5);
    });

    it('rereads a version file caught mid-write', async () => {
      const reads = serve(FOLDERS, ['fileVersion=1\nrelease_b/1/2\n', VERSION_FILE]);
      const active = await new WebDavScriptsBackend(instance).getActiveCodeVersion();
      expect(active?.id).to.equal('release_b');
      expect(reads()).to.equal(2);
    });

    it('explains that activation needs an API client', async () => {
      const error = await new WebDavScriptsBackend(instance).activateCodeVersion('release_a').catch((e: Error) => e);
      expect((error as Error).message).to.include('needs an API client');
      expect((error as Error).message).to.include('sfcc.scripts.rw');
    });
  });

  describe('createScriptsBackend', () => {
    it('uses WebDAV without an API client', () => {
      expect(createScriptsBackend({instance}).name).to.equal('webdav');
    });

    it('uses the API backend when an API client is configured', () => {
      const withClient = new B2CInstance(
        {hostname: TEST_HOST},
        {oauth: {clientId: 'id', clientSecret: 'secret'}},
        {oauthStrategy: new MockAuthStrategy()},
      );
      expect(createScriptsBackend({instance: withClient}).name).to.not.equal('webdav');
    });
  });

  describe('WebDavLookupFallbackScriptsBackend', () => {
    function apiBackend(failure?: Error, versions: CodeVersionInfo[] = []) {
      const calls: string[] = [];
      const backend: ScriptsBackend = {
        name: 'ocapi',
        async listCodeVersions() {
          calls.push('list');
          if (failure) throw failure;
          return versions;
        },
        async getActiveCodeVersion() {
          calls.push('active');
          if (failure) throw failure;
          return versions.find((v) => v.active);
        },
        async activateCodeVersion(id) {
          calls.push(`activate:${id}`);
          return {alreadyActive: false};
        },
        async createCodeVersion(id) {
          calls.push(`create:${id}`);
        },
        async deleteCodeVersion(id) {
          calls.push(`delete:${id}`);
        },
      };
      return {backend, calls};
    }

    it('uses the API when it answers', async () => {
      const api = apiBackend(undefined, [{id: 'from_api', active: true}]);
      const backend = new WebDavLookupFallbackScriptsBackend(api.backend, new WebDavScriptsBackend(instance));
      expect((await backend.getActiveCodeVersion())?.id).to.equal('from_api');
      expect(backend.name).to.equal('ocapi');
    });

    it('finds the active version over WebDAV when the API refuses the lookup', async () => {
      const reads = serve();
      const api = apiBackend(new Error("Failed to list code versions: Access to resource isn't allowed"));
      const backend = new WebDavLookupFallbackScriptsBackend(api.backend, new WebDavScriptsBackend(instance));

      expect((await backend.getActiveCodeVersion())?.id).to.equal('release_b');
      expect(backend.name).to.equal('webdav');

      // Later lookups go straight to WebDAV.
      await backend.listCodeVersions();
      expect(api.calls).to.deep.equal(['active']);
      expect(reads()).to.equal(2);
    });

    it('reports both failures when WebDAV fails too', async () => {
      server.use(http.all(`${BASE_URL}/Cartridges`, () => new HttpResponse(null, {status: 401})));
      const api = apiBackend(new Error('Failed to list code versions: Unauthorized'));
      const backend = new WebDavLookupFallbackScriptsBackend(api.backend, new WebDavScriptsBackend(instance));

      const error = (await backend.listCodeVersions().catch((e: Error) => e)) as Error;
      expect(error.message).to.include('Failed to list code versions: Unauthorized');
      expect(error.message).to.include('Over WebDAV:');
    });

    it('keeps activation, creation, and deletion on the API', async () => {
      const api = apiBackend(new Error('refused'));
      const backend = new WebDavLookupFallbackScriptsBackend(api.backend, new WebDavScriptsBackend(instance));
      await backend.activateCodeVersion('a');
      await backend.createCodeVersion('b');
      await backend.deleteCodeVersion('c');
      expect(api.calls).to.deep.equal(['activate:a', 'create:b', 'delete:c']);
    });

    it('reloads through the API without a WebDAV lookup', async () => {
      // No WebDAV handlers: any WebDAV request fails the test.
      const api = apiBackend(undefined, [
        {id: 'v1', active: true},
        {id: 'v2', active: false},
      ]);
      const backend = new WebDavLookupFallbackScriptsBackend(api.backend, new WebDavScriptsBackend(instance));
      await reloadCodeVersion(backend);
      expect(api.calls).to.deep.equal(['list', 'activate:v2', 'activate:v1']);
    });
  });
});
