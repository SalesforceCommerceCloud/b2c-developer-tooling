/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {Library, LibraryNode} from '../../../src/operations/content/library.js';
import {
  SAMPLE_LIBRARY_XML,
  MINIMAL_LIBRARY_XML,
  WILDCARD_ASSET_LIBRARY_XML,
  MISSING_LINK_LIBRARY_XML,
  POSITION_LIBRARY_XML,
} from './fixtures.js';

describe('operations/content/library', () => {
  describe('Library.parse()', () => {
    let library: Library;

    beforeEach(async () => {
      library = await Library.parse(SAMPLE_LIBRARY_XML);
    });

    it('should parse and create correct tree structure', () => {
      expect(library.tree).to.be.instanceOf(LibraryNode);
      expect(library.tree.type).to.equal('LIBRARY');
      // Root children: homepage, about-us, footer-content (orphan excluded by default)
      expect(library.tree.children).to.have.lengthOf(3);
    });

    it('should set the library ID correctly', () => {
      expect(library.tree.id).to.equal('TestLibrary');
    });

    it('should set pages to type PAGE', () => {
      const homepage = library.tree.children.find((n) => n.id === 'homepage');
      expect(homepage).to.exist;
      expect(homepage!.type).to.equal('PAGE');
      expect(homepage!.typeId).to.equal('page.storePage');

      const aboutUs = library.tree.children.find((n) => n.id === 'about-us');
      expect(aboutUs).to.exist;
      expect(aboutUs!.type).to.equal('PAGE');
    });

    it('should set content without type to type CONTENT', () => {
      const footer = library.tree.children.find((n) => n.id === 'footer-content');
      expect(footer).to.exist;
      expect(footer!.type).to.equal('CONTENT');
      expect(footer!.typeId).to.be.null;
    });

    it('should set components to type COMPONENT', () => {
      const homepage = library.tree.children.find((n) => n.id === 'homepage');
      expect(homepage).to.exist;
      const heroBanner = homepage!.children.find((n) => n.id === 'hero-banner');
      expect(heroBanner).to.exist;
      expect(heroBanner!.type).to.equal('COMPONENT');
      expect(heroBanner!.typeId).to.equal('component.heroBanner');
    });

    it('should extract static assets from JSON data', () => {
      const homepage = library.tree.children.find((n) => n.id === 'homepage');
      const heroBanner = homepage!.children.find((n) => n.id === 'hero-banner');
      expect(heroBanner).to.exist;

      const staticAssets = heroBanner!.children.filter((n) => n.type === 'STATIC');
      expect(staticAssets).to.have.lengthOf(1);
      expect(staticAssets[0].id).to.equal('/images/hero.jpg');

      const aboutUs = library.tree.children.find((n) => n.id === 'about-us');
      const textBlock = aboutUs!.children.find((n) => n.id === 'text-block');
      const textBlockAssets = textBlock!.children.filter((n) => n.type === 'STATIC');
      expect(textBlockAssets).to.have.lengthOf(1);
      expect(textBlockAssets[0].id).to.equal('/images/about.png');
    });

    it('should throw when constructor is called directly', () => {
      expect(() => new Library(Symbol('fake'))).to.throw('Use Library.parse() to construct a Library instance');
    });
  });

  describe('Library.parse() with keepOrphans', () => {
    it('should include orphan components as root children', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML, {keepOrphans: true});
      const orphan = library.tree.children.find((n) => n.id === 'orphan-component');
      expect(orphan).to.exist;
      expect(orphan!.type).to.equal('COMPONENT');
      // 3 normal + 1 orphan = 4
      expect(library.tree.children).to.have.lengthOf(4);
    });
  });

  describe('Library.parse() with minimal library', () => {
    it('should parse a minimal library', async () => {
      const library = await Library.parse(MINIMAL_LIBRARY_XML);
      expect(library.tree.id).to.equal('MinimalLib');
      expect(library.tree.children).to.have.lengthOf(1);
      expect(library.tree.children[0].id).to.equal('simple-page');
      expect(library.tree.children[0].type).to.equal('PAGE');
    });
  });

  describe('Library.traverse()', () => {
    let library: Library;

    beforeEach(async () => {
      library = await Library.parse(SAMPLE_LIBRARY_XML);
    });

    it('should visit all nodes depth-first', () => {
      const visited: string[] = [];
      library.traverse((node) => {
        visited.push(node.id);
      });

      // Depth-first post-order: children before parent
      expect(visited).to.include('hero-banner');
      expect(visited).to.include('product-grid');
      expect(visited).to.include('homepage');
      expect(visited).to.include('text-block');
      expect(visited).to.include('about-us');
      expect(visited).to.include('footer-content');
      // Static assets should also be visited
      expect(visited).to.include('/images/hero.jpg');
      expect(visited).to.include('/images/about.png');

      // Children come before their parents (post-order)
      expect(visited.indexOf('hero-banner')).to.be.lessThan(visited.indexOf('homepage'));
      expect(visited.indexOf('text-block')).to.be.lessThan(visited.indexOf('about-us'));
    });

    it('should return this for chaining', () => {
      const result = library.traverse(() => {});
      expect(result).to.equal(library);
    });

    it('should respect traverseHidden and callbackHidden options', () => {
      // Hide the homepage
      library.tree.children[0].hidden = true;

      // With traverseHidden=false, hidden subtrees are skipped entirely
      const visitedNoHidden: string[] = [];
      library.traverse(
        (node) => {
          visitedNoHidden.push(node.id);
        },
        {traverseHidden: false},
      );
      expect(visitedNoHidden).to.not.include('homepage');
      expect(visitedNoHidden).to.not.include('hero-banner');

      // With traverseHidden=true (default) and callbackHidden=false (default),
      // children of hidden nodes ARE visited, but the hidden node itself is not called back
      const visitedTraverseOnly: string[] = [];
      library.traverse(
        (node) => {
          visitedTraverseOnly.push(node.id);
        },
        {traverseHidden: true, callbackHidden: false},
      );
      // Children of hidden node are visited (they are not hidden themselves)
      expect(visitedTraverseOnly).to.include('hero-banner');
      // The hidden node itself is not called back
      expect(visitedTraverseOnly).to.not.include('homepage');

      // With both options true, hidden nodes are also called back
      const visitedAll: string[] = [];
      library.traverse(
        (node) => {
          visitedAll.push(node.id);
        },
        {traverseHidden: true, callbackHidden: true},
      );
      expect(visitedAll).to.include('homepage');
      expect(visitedAll).to.include('hero-banner');
    });
  });

  describe('Library.nodes()', () => {
    let library: Library;

    beforeEach(async () => {
      library = await Library.parse(SAMPLE_LIBRARY_XML);
    });

    it('should yield all nodes', () => {
      const nodes = [...library.nodes()];
      const ids = nodes.map((n) => n.id);
      expect(ids).to.include('homepage');
      expect(ids).to.include('hero-banner');
      expect(ids).to.include('product-grid');
      expect(ids).to.include('about-us');
      expect(ids).to.include('text-block');
      expect(ids).to.include('footer-content');
      expect(ids).to.include('/images/hero.jpg');
      expect(ids).to.include('/images/about.png');
    });

    it('should respect hidden options', () => {
      library.tree.children[0].hidden = true;

      const nodesFiltered = [...library.nodes({traverseHidden: false})];
      const ids = nodesFiltered.map((n) => n.id);
      expect(ids).to.not.include('homepage');
      expect(ids).to.not.include('hero-banner');
      // Non-hidden nodes are still present
      expect(ids).to.include('about-us');
    });
  });

  describe('Library.filter()', () => {
    let library: Library;

    beforeEach(async () => {
      library = await Library.parse(SAMPLE_LIBRARY_XML);
    });

    it('should hide non-matching root children', () => {
      library.filter((node) => node.id === 'homepage');

      const homepage = library.tree.children.find((n) => n.id === 'homepage');
      const aboutUs = library.tree.children.find((n) => n.id === 'about-us');
      const footer = library.tree.children.find((n) => n.id === 'footer-content');

      expect(homepage!.hidden).to.be.false;
      expect(aboutUs!.hidden).to.be.true;
      expect(footer!.hidden).to.be.true;
    });

    it('should return this for chaining', () => {
      const result = library.filter(() => true);
      expect(result).to.equal(library);
    });

    it('should support recursive filter option', () => {
      library.filter((node) => node.type !== 'STATIC', {recursive: true});

      // Collect all nodes including hidden ones
      const nodes = [...library.nodes({traverseHidden: true, callbackHidden: true})];
      const staticNodes = nodes.filter((n) => n.type === 'STATIC');
      for (const s of staticNodes) {
        expect(s.hidden).to.be.true;
      }

      // Non-STATIC nodes should remain visible
      const nonStaticNodes = nodes.filter((n) => n.type !== 'STATIC');
      for (const ns of nonStaticNodes) {
        expect(ns.hidden).to.be.false;
      }
    });
  });

  describe('Library.reset()', () => {
    it('should clear all hidden flags', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);

      // Hide some nodes via filter
      library.filter((node) => node.id === 'homepage');
      expect(library.tree.children.find((n) => n.id === 'about-us')!.hidden).to.be.true;

      // Reset
      library.reset();

      // All nodes should be visible again
      for (const child of library.tree.children) {
        expect(child.hidden).to.be.false;
      }
    });
  });

  describe('Library.toXMLString()', () => {
    it('should return a valid XML string', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      const xml = await library.toXMLString();

      expect(xml).to.be.a('string');
      expect(xml).to.include('<?xml');
      expect(xml).to.include('TestLibrary');
      expect(xml).to.include('homepage');
      expect(xml).to.include('hero-banner');
    });

    it('should respect traverseHidden option', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      library.filter((node) => node.id === 'homepage');

      // traverseHidden=false: only visible nodes and their children appear in output
      const xmlVisible = await library.toXMLString({traverseHidden: false});
      expect(xmlVisible).to.include('homepage');
      expect(xmlVisible).to.include('hero-banner');
      expect(xmlVisible).to.not.include('about-us');
      expect(xmlVisible).to.not.include('footer-content');

      // traverseHidden=true: traverses into hidden subtrees; children of hidden
      // nodes (which are not themselves hidden) appear in the output
      const xmlTraverse = await library.toXMLString({traverseHidden: true});
      expect(xmlTraverse).to.include('homepage');
      expect(xmlTraverse).to.include('hero-banner');
      // text-block (child of hidden about-us) is itself not hidden, so it appears
      expect(xmlTraverse).to.include('text-block');
    });
  });

  describe('Library.getTreeString()', () => {
    it('should return formatted tree text with proper box-drawing characters', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      const tree = library.getTreeString({traverseHidden: false});
      const lines = tree.split('\n');

      // Root-level pages have no connector prefix
      expect(lines[0]).to.equal('homepage (typeId: page.storePage)');

      // First child of homepage uses ├── (not last)
      expect(lines[1]).to.equal('├── component.heroBanner (hero-banner)');

      // hero-banner's child (last child) uses └──, nested under ├── uses │
      expect(lines[2]).to.equal('│   └── /images/hero.jpg (STATIC ASSET)');

      // Last child of homepage uses └──
      expect(lines[3]).to.equal('└── component.productGrid (product-grid)');

      // about-us is a root-level page
      expect(lines[4]).to.equal('about-us (typeId: page.storePage)');

      // Only child of about-us uses └──
      expect(lines[5]).to.equal('└── component.textBlock (text-block)');

      // text-block's child uses └── with proper indent
      expect(lines[6]).to.equal('    └── /images/about.png (STATIC ASSET)');

      // footer-content is a root-level content asset
      expect(lines[7]).to.equal('footer-content (CONTENT ASSET)');
    });

    it('should respect traverseHidden', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      library.filter((node) => node.id === 'homepage');

      // traverseHidden=false (default): only visible nodes
      const treeVisible = library.getTreeString({traverseHidden: false});
      expect(treeVisible).to.include('homepage');
      expect(treeVisible).to.not.include('about-us');
      expect(treeVisible).to.not.include('footer-content');

      // traverseHidden=true: includes hidden nodes with [HIDDEN] tag
      const treeAll = library.getTreeString({traverseHidden: true});
      expect(treeAll).to.include('homepage');
      expect(treeAll).to.include('about-us');
      expect(treeAll).to.include('[HIDDEN]');
    });

    it('should apply colorize function when provided', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      const colorize = (color: string, text: string) => `[${color}]${text}[/${color}]`;
      const tree = library.getTreeString({colorize});

      // Pages: bold name, dim typeId annotation
      expect(tree).to.include('[bold]homepage[/bold]');
      expect(tree).to.include('[dim](typeId: page.storePage)[/dim]');

      // Components: cyan typeId, dim id
      expect(tree).to.include('[cyan]component.heroBanner[/cyan]');
      expect(tree).to.include('[dim](hero-banner)[/dim]');

      // Static assets: green path, dim label
      expect(tree).to.include('[green]/images/hero.jpg[/green]');
      expect(tree).to.include('[dim](STATIC ASSET)[/dim]');

      // Connectors should be dim
      expect(tree).to.include('[dim]├── [/dim]');
      expect(tree).to.include('[dim]└── [/dim]');
    });
  });

  describe('Library.toJSON()', () => {
    it('should return a JSON-safe object without circular references', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      const json = library.toJSON();

      // Should not throw when stringified (no circular references)
      const str = JSON.stringify(json);
      expect(str).to.be.a('string');

      // Should have the library structure
      expect(json).to.have.property('id', 'TestLibrary');
      expect(json).to.have.property('type', 'LIBRARY');
      expect(json).to.have.property('children');
      // parent should not be present (excluded by toJSON)
      expect(json).to.not.have.property('parent');
    });
  });

  describe('LibraryNode.toJSON()', () => {
    it('should exclude parent to avoid circular references', async () => {
      const library = await Library.parse(SAMPLE_LIBRARY_XML);
      const homepage = library.tree.children.find((n) => n.id === 'homepage')!;

      // homepage has a parent (the root), but toJSON should exclude it
      expect(homepage.parent).to.exist;
      const json = homepage.toJSON();
      expect(json).to.not.have.property('parent');
      expect(json).to.have.property('id', 'homepage');
      expect(json).to.have.property('type', 'PAGE');
      expect(json).to.have.property('children');
    });
  });

  describe('wildcard asset query', () => {
    it('should find 2 static nodes using wildcard asset queries', async () => {
      const library = await Library.parse(WILDCARD_ASSET_LIBRARY_XML, {
        assetQuery: ['slides.*.image.src'],
      });

      const staticNodes: LibraryNode[] = [];
      library.traverse((node) => {
        if (node.type === 'STATIC') {
          staticNodes.push(node as LibraryNode);
        }
      });

      expect(staticNodes).to.have.lengthOf(2);
      const ids = staticNodes.map((n) => n.id);
      expect(ids).to.include('/images/slide1.jpg');
      expect(ids).to.include('/images/slide2.jpg');
    });
  });

  describe('content-link position sorting', () => {
    it('should sort children by position rather than XML document order', async () => {
      const library = await Library.parse(POSITION_LIBRARY_XML);
      const page = library.tree.children.find((n) => n.id === 'ordered-page');
      expect(page).to.exist;

      const childIds = page!.children.map((n) => n.id);
      expect(childIds).to.deep.equal(['comp-a', 'comp-b', 'comp-c', 'comp-d']);
    });
  });

  describe('missing content-link', () => {
    it('should parse without error when content-link target is missing', async () => {
      const library = await Library.parse(MISSING_LINK_LIBRARY_XML);
      expect(library).to.be.instanceOf(Library);
      expect(library.tree.id).to.equal('MissingLinkLib');
    });

    it('should have no component children for page with broken link', async () => {
      const library = await Library.parse(MISSING_LINK_LIBRARY_XML);
      const brokenPage = library.tree.children.find((n) => n.id === 'broken-page');
      expect(brokenPage).to.exist;
      // The missing component should be skipped
      const componentChildren = brokenPage!.children.filter((n) => n.type === 'COMPONENT');
      expect(componentChildren).to.have.lengthOf(0);
    });
  });
});
