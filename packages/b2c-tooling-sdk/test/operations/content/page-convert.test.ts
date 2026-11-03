/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  Library,
  libraryPageToPageRequest,
  libraryXmlToPageRequests,
  pageRequestsToLibraryXml,
  planLibraryPagePush,
  toExperienceTypeId,
} from '../../../src/operations/content/index.js';
import {validateXmlContent} from '../../../src/xml-validation/index.js';

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

  it('carries page attributes from the XML', async () => {
    const xml = XML.replace(
      '<type>page.homePage</type>',
      `<description xml:lang="x-default">Desc</description>
    <description xml:lang="fr">Desc FR</description>
    <type>page.homePage</type>
    <page-attributes>
      <page-title xml:lang="x-default">Title</page-title>
      <page-keywords xml:lang="x-default">a, b</page-keywords>
    </page-attributes>`,
    );
    const [page] = await libraryXmlToPageRequests(xml);
    expect(page).to.include({description: 'Desc', pageTitle: 'Title', pageKeywords: 'a, b'});
    expect(page).not.to.have.property('pageDescription');
  });

  it('filters pages by ID', async () => {
    expect(await libraryXmlToPageRequests(XML, {pageIds: ['other']})).to.deep.equal([]);
  });

  describe('pageRequestsToLibraryXml', () => {
    it('round-trips through library XML', async () => {
      const pages = await libraryXmlToPageRequests(XML);
      pages[0].pageTitle = 'Home Title';
      const xml = pageRequestsToLibraryXml(pages, {libraryId: 'TestLib'});
      expect(xml).to.include('type="page.homePage.main"');
      expect(xml).to.include('<type>component.Layout.grid</type>');
      expect(await libraryXmlToPageRequests(xml)).to.deep.equal(pages);
    });

    it('produces XML that matches the library schema', async () => {
      const pages = await libraryXmlToPageRequests(XML);
      pages[0].aspectTypeId = 'pdp';
      pages[0].pageDescription = 'About';
      const result = await validateXmlContent(pageRequestsToLibraryXml(pages, {libraryId: 'TestLib'}));
      expect(result.errors, JSON.stringify(result.errors)).to.deep.equal([]);
      expect(result.status).to.equal('pass');
    });
  });

  describe('planLibraryPagePush', () => {
    const PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="TestLib">
  <content content-id="banner-1">
    <type>component.Content.announcementBanner</type>
    <config>{"visibility":[]}</config>
    <data xml:lang="x-default">{"message":"Hi","height":"md"}</data>
    <online-flag>true</online-flag>
    <online-flag site-id="RefArch">true</online-flag>
  </content>
  <content content-id="about">
    <display-name xml:lang="x-default">About</display-name>
    <type>page.aboutUsPage</type>
    <data xml:lang="x-default">{}</data>
    <online-flag>false</online-flag>
    <page-attributes/>
    <content-links>
      <content-link content-id="banner-1" type="page.aboutUsPage.headline"><position>0.0</position></content-link>
    </content-links>
  </content>
</library>`;

    it('pushes data and name edits', async () => {
      const edited = PAGE.replace('"message":"Hi"', '"message":"Hello"').replace('>About<', '>About Us<');
      const plan = await planLibraryPagePush(edited, {originalXml: PAGE});
      expect(plan.pushable).to.equal(true);
      if (plan.pushable) {
        expect(plan.page.name).to.equal('About Us');
        expect(plan.page.regions?.[0].components?.[0].data).to.deep.equal({message: 'Hello', height: 'md'});
      }
    });

    it('pushes a new component with default export fields', async () => {
      const edited = PAGE.replace(
        '</content-links>',
        `  <content-link content-id="banner-2" type="page.aboutUsPage.headline"><position>1.0</position></content-link>
    </content-links>`,
      ).replace(
        '<content content-id="about">',
        `<content content-id="banner-2">
    <type>component.Content.announcementBanner</type>
    <config>{"visibility":[]}</config>
    <data xml:lang="x-default">{"message":"New"}</data>
    <online-flag>true</online-flag>
  </content>
  <content content-id="about">`,
      );
      const plan = await planLibraryPagePush(edited, {originalXml: PAGE});
      expect(plan.pushable).to.equal(true);
      if (plan.pushable)
        expect(plan.page.regions?.[0].components?.map((c) => c.id)).to.deep.equal(['banner-1', 'banner-2']);
    });

    it('clears an emptied region', async () => {
      const edited = PAGE.replace(/<content-links>[\s\S]*<\/content-links>/, '');
      const plan = await planLibraryPagePush(edited, {originalXml: PAGE});
      expect(plan.pushable).to.equal(true);
      if (plan.pushable) expect(plan.page.regions).to.deep.equal([{id: 'headline', components: []}]);
    });

    for (const [label, edit, reason] of [
      [
        'online state',
        (x: string) => x.replace('<online-flag>false</online-flag>', '<online-flag>true</online-flag>'),
        'online-flag',
      ],
      [
        'another locale',
        (x: string) =>
          x.replace(
            '<type>page.aboutUsPage</type>',
            '<display-name xml:lang="fr">A propos</display-name>\n    <type>page.aboutUsPage</type>',
          ),
        'display-name',
      ],
      ['a cleared attribute', (x: string) => x.replace(',"height":"md"', ''), 'height cleared'],
      ['the page type', (x: string) => x.replaceAll('page.aboutUsPage', 'page.homePage'), 'page type changed'],
    ] as Array<[string, (x: string) => string, string]>) {
      it(`falls back for ${label}`, async () => {
        const plan = await planLibraryPagePush(edit(PAGE), {originalXml: PAGE});
        expect(plan.pushable).to.equal(false);
        if (!plan.pushable) expect(plan.reason).to.include(reason);
      });
    }

    it('falls back without the original when import-only fields are present', async () => {
      const plan = await planLibraryPagePush(PAGE);
      expect(plan.pushable).to.equal(false);
    });

    it('falls back for content assets and shared content blocks', async () => {
      const asset = `<?xml version="1.0"?><library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="L">
  <content content-id="a"><display-name xml:lang="x-default">A</display-name></content></library>`;
      expect((await planLibraryPagePush(asset)).pushable).to.equal(false);
      const withBlock = PAGE.replace('component.Content.announcementBanner', 'fragment.Content.announcementBanner');
      const plan = await planLibraryPagePush(withBlock, {originalXml: withBlock});
      expect(plan.pushable).to.equal(false);
      if (!plan.pushable) expect(plan.reason).to.include('content block');
    });
  });
});
