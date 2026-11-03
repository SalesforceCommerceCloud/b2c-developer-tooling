/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {ExperiencesUnavailableError} from '@salesforce/b2c-tooling-sdk/operations/content';
import {saveContentXml, type SaveContentOptions} from '../content-tree/content-save.js';

const PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="SharedLibrary">
  <content content-id="banner-1">
    <type>component.Content.announcementBanner</type>
    <data xml:lang="x-default">{"message":"Hi"}</data>
    <online-flag>true</online-flag>
  </content>
  <content content-id="about">
    <display-name xml:lang="x-default">About</display-name>
    <type>page.aboutUsPage</type>
    <online-flag>false</online-flag>
    <content-links>
      <content-link content-id="banner-1" type="page.aboutUsPage.headline"><position>0.0</position></content-link>
    </content-links>
  </content>
</library>`;

const EDITED = PAGE.replace('"message":"Hi"', '"message":"Hello"');

function run(overrides: Partial<SaveContentOptions>) {
  const calls = {imports: 0, pushes: [] as unknown[]};
  const options: SaveContentOptions = {
    instance: {} as B2CInstance,
    libraryId: 'SharedLibrary',
    isSiteLibrary: false,
    contentId: 'about',
    xml: EDITED,
    originalXml: PAGE,
    siteId: 'RefArch',
    useExperiencesApi: true,
    importXml: async () => {
      calls.imports++;
    },
    push: (async (_instance: unknown, page: unknown) => {
      calls.pushes.push(page);
      return {status: 'updated', page};
    }) as never,
    ...overrides,
  };
  return {calls, result: saveContentXml(options)};
}

suite('saveContentXml', () => {
  test('saves a page edit through the Experiences API', async () => {
    const {calls, result} = run({});
    assert.deepStrictEqual(await result, {method: 'experiences-api', siteId: 'RefArch'});
    assert.strictEqual(calls.imports, 0);
    assert.strictEqual(calls.pushes.length, 1);
  });

  test('imports when the setting is off', async () => {
    const {calls, result} = run({useExperiencesApi: false});
    assert.deepStrictEqual(await result, {method: 'import', fallbackReason: undefined});
    assert.strictEqual(calls.pushes.length, 0);
    assert.strictEqual(calls.imports, 1);
  });

  test('imports when the edit changes import-only fields', async () => {
    const xml = EDITED.replace('<online-flag>false</online-flag>', '<online-flag>true</online-flag>');
    const {calls, result} = run({xml});
    const saved = await result;
    assert.strictEqual(saved.method, 'import');
    assert.match(saved.method === 'import' ? (saved.fallbackReason ?? '') : '', /online-flag/);
    assert.strictEqual(calls.pushes.length, 0);
  });

  test('imports when no site is configured', async () => {
    const {calls, result} = run({siteId: undefined});
    assert.strictEqual((await result).method, 'import');
    assert.strictEqual(calls.imports, 1);
  });

  test('uses the site ID of a site-private library', async () => {
    const {result} = run({siteId: undefined, isSiteLibrary: true, libraryId: 'RefArch'});
    assert.deepStrictEqual(await result, {method: 'experiences-api', siteId: 'RefArch'});
  });

  test('imports when the Experiences API is unavailable', async () => {
    const {calls, result} = run({
      push: (async () => {
        throw new ExperiencesUnavailableError('no scope', 'missing-scope');
      }) as never,
    });
    const saved = await result;
    assert.strictEqual(saved.method, 'import');
    assert.strictEqual(calls.imports, 1);
  });
});
