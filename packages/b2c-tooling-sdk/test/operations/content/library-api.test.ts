/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import type {B2CInstance} from '../../../src/instance/index.js';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  assignContentToFolder,
  deleteContentAsset,
  getContentAsset,
  patchContentAsset,
  putContentAsset,
  putContentFolder,
  walkContentFolder,
} from '../../../src/operations/content/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const SHORT_CODE = 'abcd1234';
const TENANT_ID = 'zzxy_dev';
const LIB = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/experience/experiences/v1/organizations/f_ecom_${TENANT_ID}/libraries/SharedLibrary`;

function fakeInstance(): B2CInstance {
  return {
    config: {shortCode: SHORT_CODE, tenantId: TENANT_ID},
    scapiClientConfig: {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()},
  } as unknown as B2CInstance;
}

const ASSET = {id: 'banner', name: {default: 'Banner'}, online: {default: true}};

describe('operations/content/library-api', () => {
  const server = setupServer();
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('gets a content asset', async () => {
    server.use(http.get(`${LIB}/content/banner`, () => HttpResponse.json(ASSET)));
    expect(await getContentAsset(fakeInstance(), 'SharedLibrary', 'banner')).to.deep.equal(ASSET);
  });

  it('maps 404 to ExperiencesRequestError and 403 to missing-scope', async () => {
    server.use(
      http.get(`${LIB}/content/nope`, () =>
        HttpResponse.json({title: 'Content Not Found', detail: "No content asset with ID 'nope'"}, {status: 404}),
      ),
      http.get(`${LIB}/content/denied`, () => HttpResponse.json({title: 'Forbidden'}, {status: 403})),
    );
    try {
      await getContentAsset(fakeInstance(), 'SharedLibrary', 'nope');
      expect.fail('expected error');
    } catch (error) {
      expect(error).to.be.instanceOf(ExperiencesRequestError);
      expect((error as ExperiencesRequestError).status).to.equal(404);
      expect((error as Error).message).to.include("No content asset with ID 'nope'");
    }
    try {
      await getContentAsset(fakeInstance(), 'SharedLibrary', 'denied');
      expect.fail('expected error');
    } catch (error) {
      expect(error).to.be.instanceOf(ExperiencesUnavailableError);
      expect((error as ExperiencesUnavailableError).reason).to.equal('missing-scope');
    }
  });

  it('puts an asset with its ID and reports created', async () => {
    let body: unknown;
    server.use(
      http.put(`${LIB}/content/banner`, async ({request}) => {
        body = await request.json();
        return HttpResponse.json(ASSET, {status: 201});
      }),
    );
    const result = await putContentAsset(fakeInstance(), 'SharedLibrary', 'banner', {name: {default: 'Banner'}});
    expect(result.status).to.equal('created');
    expect(body).to.deep.equal({name: {default: 'Banner'}, id: 'banner'});
  });

  it('patches and deletes an asset', async () => {
    let patched: unknown;
    let deleted = false;
    server.use(
      http.patch(`${LIB}/content/banner`, async ({request}) => {
        patched = await request.json();
        return HttpResponse.json({...ASSET, description: {default: 'x'}});
      }),
      http.delete(`${LIB}/content/banner`, () => {
        deleted = true;
        return new HttpResponse(null, {status: 204});
      }),
    );
    await patchContentAsset(fakeInstance(), 'SharedLibrary', 'banner', {description: {default: 'x'}});
    await deleteContentAsset(fakeInstance(), 'SharedLibrary', 'banner');
    expect(patched).to.deep.equal({description: {default: 'x'}});
    expect(deleted).to.equal(true);
  });

  it('defaults a new folder to the root parent', async () => {
    let body: unknown;
    server.use(
      http.put(`${LIB}/folders/promos`, async ({request}) => {
        body = await request.json();
        return HttpResponse.json({id: 'promos'}, {status: 200});
      }),
    );
    const result = await putContentFolder(fakeInstance(), 'SharedLibrary', 'promos', {name: {default: 'Promos'}});
    expect(result.status).to.equal('updated');
    expect(body).to.deep.equal({parentFolderId: 'root', name: {default: 'Promos'}, id: 'promos'});
  });

  it('walks a folder tree, paging through results', async () => {
    const offsets: string[] = [];
    server.use(
      http.get(`${LIB}/folders/root/sub-folders`, ({request}) => {
        const offset = new URL(request.url).searchParams.get('offset')!;
        offsets.push(offset);
        return offset === '0'
          ? HttpResponse.json({hits: [{id: 'a'}], total: 2})
          : HttpResponse.json({hits: [{id: 'b'}], total: 2});
      }),
      http.get(`${LIB}/folders/root/content`, () => HttpResponse.json({hits: [], total: 0})),
      http.get(`${LIB}/folders/a/sub-folders`, () => HttpResponse.json({hits: [], total: 0})),
      http.get(`${LIB}/folders/a/content`, () => HttpResponse.json({hits: [ASSET], total: 1})),
      http.get(`${LIB}/folders/b/sub-folders`, () => HttpResponse.json({hits: [], total: 0})),
      http.get(`${LIB}/folders/b/content`, () => HttpResponse.json({hits: [], total: 0})),
    );
    const tree = await walkContentFolder(fakeInstance(), 'SharedLibrary');
    expect(offsets).to.deep.equal(['0', '1']);
    expect(tree.folder.id).to.equal('root');
    expect(tree.folders.map((f) => f.folder.id)).to.deep.equal(['a', 'b']);
    expect(tree.folders[0].content.map((c) => c.id)).to.deep.equal(['banner']);
  });

  it('stops at the requested depth and can skip content', async () => {
    server.use(http.get(`${LIB}/folders/promos/sub-folders`, () => HttpResponse.json({hits: [{id: 'x'}], total: 1})));
    const tree = await walkContentFolder(fakeInstance(), 'SharedLibrary', {
      folderId: 'promos',
      depth: 1,
      includeContent: false,
    });
    expect(tree.folders).to.have.length(1);
    expect(tree.folders[0].folders).to.deep.equal([]);
  });

  it('assigns content as the classification folder', async () => {
    let body: unknown;
    server.use(
      http.put(`${LIB}/folder-assignments/banner/promos`, async ({request}) => {
        body = await request.json();
        return HttpResponse.json({contentId: 'banner', folderId: 'promos', default: true}, {status: 201});
      }),
    );
    await assignContentToFolder(fakeInstance(), 'SharedLibrary', 'banner', 'promos', {default: true});
    expect(body).to.deep.equal({contentId: 'banner', folderId: 'promos', default: true});
  });
});
