/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Sample library XML for testing.
 *
 * Structure:
 * - Library: TestLibrary
 *   - Page: homepage (page.storePage)
 *     - Component: hero-banner (component.heroBanner) -> has image.path asset
 *     - Component: product-grid (component.productGrid)
 *   - Page: about-us (page.storePage)
 *     - Component: text-block (component.textBlock)
 *   - Content: footer-content (no type)
 *   - Orphan: orphan-component (component.orphan) - not linked to any page
 */
export const SAMPLE_LIBRARY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="TestLibrary">
  <header>
    <default-content>
      <name xml:lang="x-default">Test Library</name>
    </default-content>
  </header>
  <folder folder-id="root">
    <display-name xml:lang="x-default">Root</display-name>
  </folder>
  <folder folder-id="pages">
    <display-name xml:lang="x-default">Pages</display-name>
    <parent>root</parent>
  </folder>
  <content content-id="homepage">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "Home Page"}]]></data>
    <folder-links>
      <classification-link folder-id="pages"/>
    </folder-links>
    <content-links>
      <content-link content-id="hero-banner"/>
      <content-link content-id="product-grid"/>
    </content-links>
  </content>
  <content content-id="hero-banner">
    <type>component.heroBanner</type>
    <data xml:lang="x-default"><![CDATA[{"heading": "Welcome", "image": {"path": "/images/hero.jpg"}}]]></data>
  </content>
  <content content-id="product-grid">
    <type>component.productGrid</type>
    <data xml:lang="x-default"><![CDATA[{"columns": 3}]]></data>
  </content>
  <content content-id="about-us">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "About Us"}]]></data>
    <folder-links>
      <classification-link folder-id="pages"/>
    </folder-links>
    <content-links>
      <content-link content-id="text-block"/>
    </content-links>
  </content>
  <content content-id="text-block">
    <type>component.textBlock</type>
    <data xml:lang="x-default"><![CDATA[{"text": "About us text", "image": {"path": "/images/about.png"}}]]></data>
  </content>
  <content content-id="footer-content">
    <data xml:lang="x-default"><![CDATA[{"copyright": "2025"}]]></data>
  </content>
  <content content-id="orphan-component">
    <type>component.orphan</type>
    <data xml:lang="x-default"><![CDATA[{"unused": true}]]></data>
  </content>
</library>`;

/**
 * Minimal library XML for basic parsing tests.
 */
export const MINIMAL_LIBRARY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="MinimalLib">
  <content content-id="simple-page">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "Simple"}]]></data>
  </content>
</library>`;

/**
 * Library XML with multi-image components for wildcard asset query tests.
 */
export const WILDCARD_ASSET_LIBRARY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="WildcardLib">
  <content content-id="carousel-page">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "Carousel"}]]></data>
    <content-links>
      <content-link content-id="carousel"/>
    </content-links>
  </content>
  <content content-id="carousel">
    <type>component.carousel</type>
    <data xml:lang="x-default"><![CDATA[{"slides": [{"image": {"src": "/images/slide1.jpg"}}, {"image": {"src": "/images/slide2.jpg"}}]}]]></data>
  </content>
</library>`;

/**
 * Library XML with out-of-order content-link positions.
 *
 * The content-links are listed in XML order: comp-b, comp-d, comp-a, comp-c,
 * but their positions specify: comp-a=1, comp-b=2, comp-c=3, comp-d=4.
 */
export const POSITION_LIBRARY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="PositionLib">
  <content content-id="ordered-page">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "Ordered"}]]></data>
    <content-links>
      <content-link content-id="comp-b" type="page.storePage.main">
        <position>2.0</position>
      </content-link>
      <content-link content-id="comp-d" type="page.storePage.main">
        <position>4.0</position>
      </content-link>
      <content-link content-id="comp-a" type="page.storePage.main">
        <position>1.0</position>
      </content-link>
      <content-link content-id="comp-c" type="page.storePage.main">
        <position>3.0</position>
      </content-link>
    </content-links>
  </content>
  <content content-id="comp-a">
    <type>component.alpha</type>
    <data xml:lang="x-default"><![CDATA[{"label": "A"}]]></data>
  </content>
  <content content-id="comp-b">
    <type>component.beta</type>
    <data xml:lang="x-default"><![CDATA[{"label": "B"}]]></data>
  </content>
  <content content-id="comp-c">
    <type>component.gamma</type>
    <data xml:lang="x-default"><![CDATA[{"label": "C"}]]></data>
  </content>
  <content content-id="comp-d">
    <type>component.delta</type>
    <data xml:lang="x-default"><![CDATA[{"label": "D"}]]></data>
  </content>
</library>`;

/**
 * Library XML with a missing content-link target.
 */
export const MISSING_LINK_LIBRARY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="MissingLinkLib">
  <content content-id="broken-page">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "Broken"}]]></data>
    <content-links>
      <content-link content-id="nonexistent-component"/>
    </content-links>
  </content>
</library>`;
