/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import {Services} from '../../src/services.js';
import {createSiteArchiveImportTool, SITE_IMPORT_SKILL_URI} from '../../src/tools/impex/index.js';
import {createMockResolvedConfig} from '../test-helpers.js';
import type {ToolResult} from '../../src/utils/types.js';

const text = (result: ToolResult) => (result.content[0] as {text: string}).text;
const files = [{path: 'sites/RefArch/promotions.xml', content: '<promotions/>'}];

describe('site_archive_import', () => {
  const instance = {config: {hostname: 'my-sandbox.example.com'}} as unknown as B2CInstance;
  const services = new Services({b2cInstance: instance, resolvedConfig: createMockResolvedConfig()});

  it('requires the site import skill before running', async () => {
    const run = sinon.stub();
    const tool = createSiteArchiveImportTool(() => services, {importSiteArchiveFiles: run});
    const result = await tool.handler({files});
    expect(result.isError).to.equal(true);
    expect(text(result)).to.include('SITE_IMPORT_SKILL_REQUIRED').and.include(SITE_IMPORT_SKILL_URI);
    expect(run.called).to.equal(false);
  });

  it('passes files, dry run and archive name to the SDK and returns its result', async () => {
    const run = sinon
      .stub()
      .resolves({outcome: 'validated', files: [{path: files[0].path, status: 'pass', errors: []}]});
    const tool = createSiteArchiveImportTool(() => services, {importSiteArchiveFiles: run});
    const result = await tool.handler({files, skillRead: true, dryRun: true, archiveName: 'promo-rule'});
    expect(result.isError).to.not.equal(true);
    expect(JSON.parse(text(result))).to.include({outcome: 'validated'});
    expect(run.firstCall.args[0]).to.equal(instance);
    expect(run.firstCall.args[1]).to.deep.equal(files);
    expect(run.firstCall.args[2]).to.deep.equal({dryRun: true, archiveName: 'promo-rule'});
  });

  it('rejects archive names that are not a single path segment', async () => {
    const run = sinon.stub();
    const tool = createSiteArchiveImportTool(() => services, {importSiteArchiveFiles: run});
    const result = await tool.handler({files, skillRead: true, archiveName: '../x'});
    expect(result.isError).to.equal(true);
    expect(run.called).to.equal(false);
  });
});
