/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import {ExperiencesUnavailableError, PagePushError} from '@salesforce/b2c-tooling-sdk/operations/content';
import ContentPush, {readPageInputs, typeMismatchHint} from '../../../src/commands/content/push.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../helpers/test-setup.js';

const TYPES = {
  siteId: 'RefArch',
  pageTypes: [{id: 'homePage', regionDefinitions: [{id: 'main'}], attributeDefinitionGroups: []}],
  componentTypes: [
    {
      id: 'Content.hero',
      regionDefinitions: [],
      attributeDefinitionGroups: [{attributeDefinitions: [{id: 'title', type: 'string', required: true}]}],
    },
  ],
};

const VALID = {
  id: 'p1',
  name: 'P1',
  typeId: 'homePage',
  regions: [{id: 'main', components: [{id: 'h', typeId: 'Content.hero', data: {title: 'x'}}]}],
};
const INVALID = {id: 'p2', name: 'P2', typeId: 'homePage', regions: [{id: 'side', components: []}]};

describe('content push', () => {
  const hooks = createIsolatedConfigHooks();
  let dir: string;

  beforeEach(async () => {
    await hooks.beforeEach();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-push-'));
    fs.writeFileSync(path.join(dir, 'valid.json'), JSON.stringify(VALID));
    fs.writeFileSync(path.join(dir, 'pages.json'), JSON.stringify([VALID, INVALID]));
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(dir, {recursive: true, force: true});
  });

  async function createCommand(flags: Record<string, unknown>, files: string[]) {
    const command: any = await createTestCommand(
      ContentPush,
      hooks.getConfig(),
      {validate: true, 'dry-run': false, force: false, ...flags},
      {},
      files,
    );
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => ({config: {}}));
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command.operations, 'fetchExperienceTypes').resolves(TYPES);
    return command;
  }

  it('requires a site ID', async () => {
    const command = await createCommand({}, [path.join(dir, 'valid.json')]);
    try {
      await command.run();
      expect.fail('expected error');
    } catch (error) {
      expect((error as Error).message).to.include('Site ID is required');
    }
  });

  it('validates then pushes valid pages', async () => {
    const command = await createCommand({'site-id': 'RefArch'}, [path.join(dir, 'valid.json')]);
    const push = sinon.stub(command.operations, 'pushPage').resolves({status: 'created', page: VALID});
    const result = await command.run();
    expect(push.calledOnce).to.equal(true);
    expect(push.firstCall.args[2]).to.deep.equal({siteId: 'RefArch'});
    expect(result.pages).to.deep.equal([{pageId: 'p1', source: path.join(dir, 'valid.json'), status: 'created'}]);
  });

  it('skips invalid pages and sets a failing exit code', async () => {
    const command = await createCommand({'site-id': 'RefArch'}, [path.join(dir, 'pages.json')]);
    const push = sinon.stub(command.operations, 'pushPage').resolves({status: 'updated', page: VALID});
    const exitCode = process.exitCode;
    try {
      const result = await command.run();
      expect(push.calledOnce).to.equal(true);
      expect(result.pages.map((p: {status: string}) => p.status)).to.deep.equal(['updated', 'invalid']);
      expect(result.pages[1].errors[0].message).to.include('Region "side"');
      expect(process.exitCode).to.equal(1);
    } finally {
      process.exitCode = exitCode;
    }
  });

  it('does not push on --dry-run', async () => {
    const command = await createCommand({'site-id': 'RefArch', 'dry-run': true}, [path.join(dir, 'valid.json')]);
    const push = sinon.stub(command.operations, 'pushPage');
    const result = await command.run();
    expect(push.called).to.equal(false);
    expect(result.pages[0].status).to.equal('validated');
  });

  it('skips type fetch with --no-validate', async () => {
    const command = await createCommand({'site-id': 'RefArch', validate: false}, [path.join(dir, 'pages.json')]);
    sinon.stub(command.operations, 'pushPage').resolves({status: 'updated', page: VALID});
    const result = await command.run();
    expect(command.operations.fetchExperienceTypes.called).to.equal(false);
    expect(result.pages.map((p: {status: string}) => p.status)).to.deep.equal(['updated', 'updated']);
  });

  it('records API rejections per page', async () => {
    const command = await createCommand({'site-id': 'RefArch'}, [path.join(dir, 'valid.json')]);
    sinon.stub(command.operations, 'pushPage').rejects(new PagePushError('Failed to push page p1: bad', 400));
    const exitCode = process.exitCode;
    try {
      const result = await command.run();
      expect(result.pages[0]).to.include({status: 'failed', message: 'Failed to push page p1: bad'});
    } finally {
      process.exitCode = exitCode;
    }
  });

  it('fails with the scope hint when the Experiences API is unavailable', async () => {
    const command = await createCommand({'site-id': 'RefArch'}, [path.join(dir, 'valid.json')]);
    command.operations.fetchExperienceTypes.rejects(
      new ExperiencesUnavailableError('needs sfcc.experiences', 'missing-scope'),
    );
    try {
      await runSilent(() => command.run());
      expect.fail('expected error');
    } catch (error) {
      expect((error as Error).message).to.include('sfcc.experiences');
    }
  });

  it('reads pages from library XML filtered by page ID', async () => {
    const xml = path.join(dir, 'library.xml');
    fs.writeFileSync(
      xml,
      `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="L">
  <content content-id="a"><type>page.homePage</type></content>
  <content content-id="b"><type>page.homePage</type></content>
</library>`,
    );
    const inputs = await readPageInputs(xml, ['b']);
    expect(inputs.map((i) => i.page)).to.deep.equal([{id: 'b', name: 'b', typeId: 'homePage'}]);
    expect(inputs[0].source).to.equal(`${xml}#b`);
  });

  it('explains type mismatches on existing pages', () => {
    expect(typeMismatchHint("Region 'main' not found in page type 'aboutUsPage'", 'homePage')).to.include(
      'already exists with type "aboutUsPage"',
    );
    expect(typeMismatchHint("Region 'x' not found in page type 'homePage'", 'homePage')).to.equal('');
  });
});
