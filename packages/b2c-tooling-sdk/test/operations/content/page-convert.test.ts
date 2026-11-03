/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Library, libraryPageToPageRequest, toExperienceTypeId} from '../../../src/operations/content/index.js';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="TestLib">
  <content content-id="home">
    <display-name xml:lang="x-default">Home</display-name>
    <type>page.homePage</type>
    <content-links>
      <content-link content-id="grid" type="page.homePage.main"/>
      <content-link content-id="banner" type="page.homePage.headerbanner"/>
    </content-links>
  </content>
  <content content-id="grid">
    <type>component.Layout.grid</type>
    <data xml:lang="x-default">{"columns":2}</data>
    <content-links>
      <content-link content-id="hero" type="component.Layout.grid.column_1"/>
    </content-links>
  </content>
  <content content-id="hero">
    <type>component.Content.hero</type>
    <data xml:lang="x-default">{"title":"Hi","subtitle":null}</data>
  </content>
  <content content-id="banner">
    <type>component.Content.announcementBanner</type>
  </content>
</library>`;

describe('operations/content/page-convert', () => {
  it('strips library prefixes from type IDs', () => {
    expect(toExperienceTypeId('page.homePage')).to.equal('homePage');
    expect(toExperienceTypeId('component.Content.hero')).to.equal('Content.hero');
    expect(toExperienceTypeId('Content.hero')).to.equal('Content.hero');
  });

  it('records region IDs from content-link types', async () => {
    const library = await Library.parse(XML);
    const home = library.tree.children[0];
    expect(home.children.map((c) => c.regionId)).to.deep.equal(['main', 'headerbanner']);
    expect(home.children[0].children[0].regionId).to.equal('column_1');
  });

  it('converts a library page into a page request', async () => {
    const library = await Library.parse(XML);
    const request = libraryPageToPageRequest(library.tree.children[0]);
    expect(request).to.deep.equal({
      id: 'home',
      name: 'Home',
      typeId: 'homePage',
      regions: [
        {
          id: 'main',
          components: [
            {
              id: 'grid',
              typeId: 'Layout.grid',
              data: {columns: 2},
              regions: [{id: 'column_1', components: [{id: 'hero', typeId: 'Content.hero', data: {title: 'Hi'}}]}],
            },
          ],
        },
        {id: 'headerbanner', components: [{id: 'banner', typeId: 'Content.announcementBanner'}]},
      ],
    });
  });

  it('rejects non-page nodes', async () => {
    const library = await Library.parse(XML);
    const grid = library.tree.children[0].children[0];
    expect(() => libraryPageToPageRequest(grid)).to.throw('not a Page Designer page');
  });
});
