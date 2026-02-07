/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as xml2js from 'xml2js';
import {getLogger} from '../../logging/logger.js';
import {extractAssetPaths} from './asset-query.js';
import type {
  LibraryNodeType,
  LibraryParseOptions,
  TraverseOptions,
  TraverseCallback,
  FilterCallback,
  TreeStringOptions,
  ColorizeFn,
} from './types.js';

/**
 * A node in the content library tree.
 *
 * Represents a library, page, content asset, component, or static asset reference.
 */
export class LibraryNode {
  id: string;
  type: LibraryNodeType;
  typeId: string | null;
  data: Record<string, unknown> | null;
  parent: LibraryNode | null;
  children: LibraryNode[];
  hidden: boolean;
  /** @internal Raw xml2js content object */
  xml: Record<string, unknown> | null;

  constructor(values: {
    id: string;
    type: LibraryNodeType;
    typeId: string | null;
    data: Record<string, unknown> | null;
    parent: LibraryNode | null;
    children: LibraryNode[];
    hidden: boolean;
    xml: Record<string, unknown> | null;
  }) {
    this.id = values.id;
    this.type = values.type;
    this.typeId = values.typeId;
    this.data = values.data;
    this.parent = values.parent;
    this.children = values.children;
    this.hidden = values.hidden;
    this.xml = values.xml;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      typeId: this.typeId,
      data: this.data,
      children: this.children,
      hidden: this.hidden,
    };
  }
}

/**
 * Recursively processes a content XML element into a LibraryNode tree.
 *
 * Extracts child components via content-links and static assets via asset queries.
 */
function processContent(
  content: Record<string, unknown>,
  allContent: Record<string, Record<string, unknown>>,
  assetQuery: string[],
): LibraryNode {
  const logger = getLogger();
  const attrs = content['$'] as Record<string, string>;
  const contentId = attrs['content-id'];
  const contentType = (content['type'] as string[] | undefined)?.[0] ?? null;
  const dataElements = content['data'] as Array<Record<string, string>> | undefined;

  const node = new LibraryNode({
    id: contentId,
    type: contentType ? (contentType.startsWith('page.') ? 'PAGE' : 'COMPONENT') : 'CONTENT',
    typeId: contentType,
    data: null,
    children: [],
    xml: content,
    hidden: false,
    parent: null,
  });

  // Parse JSON data and extract asset paths
  if (dataElements?.[0]?.['_']) {
    try {
      const dataJson = JSON.parse(dataElements[0]['_']) as Record<string, unknown>;
      node.data = dataJson;

      const assetPaths = extractAssetPaths(dataJson, assetQuery);
      for (const assetPath of assetPaths) {
        node.children.push(
          new LibraryNode({
            id: assetPath,
            type: 'STATIC',
            typeId: null,
            data: null,
            parent: node,
            children: [],
            hidden: false,
            xml: null,
          }),
        );
      }
    } catch {
      logger.warn({contentId}, `Could not parse JSON data for content ${contentId}`);
    }
  }

  // Recurse into content-links
  const contentLinks = content['content-links'] as Array<Record<string, unknown>> | undefined;
  if (contentLinks?.[0]?.['content-link']) {
    const links = contentLinks[0]['content-link'] as Array<Record<string, unknown>>;
    for (const link of links) {
      const linkAttrs = link['$'] as Record<string, string>;
      const linkId = linkAttrs['content-id'];
      if (!allContent[linkId]) {
        logger.warn(`Cannot find component ${linkId} in library; skipping...`);
        continue;
      }

      const componentNode = processContent(allContent[linkId], allContent, assetQuery);
      componentNode.parent = node;
      node.children.push(componentNode);
    }
  }

  return node;
}

/** Private guard to enforce use of Library.parse() */
const CONSTRUCTOR_GUARD = Symbol('Library.parse');

/**
 * Provides an interface for manipulating B2C Commerce content libraries.
 *
 * Use the static `Library.parse()` factory to create instances from library XML.
 * The library tree supports filtering, traversal, mutation, and serialization
 * back to importable XML.
 *
 * @example
 * ```typescript
 * const library = await Library.parse(xmlString);
 *
 * // Filter to specific pages
 * library.filter(node => node.id === 'homepage');
 *
 * // Traverse visible nodes
 * library.traverse(node => {
 *   console.log(node.id, node.type);
 * });
 *
 * // Serialize back to XML
 * const xml = await library.toXMLString({ traverseHidden: false });
 * ```
 */
export class Library {
  assetQuery: string[] = [];
  tree!: LibraryNode;
  /** @internal Raw xml2js parsed object */
  xml!: Record<string, unknown>;

  /** @internal */
  constructor(guard: symbol) {
    if (guard !== CONSTRUCTOR_GUARD) {
      throw new Error('Use Library.parse() to construct a Library instance');
    }
  }

  /**
   * Parse library XML into a Library tree.
   *
   * @param libraryXML - Raw XML string of a content library
   * @param options - Parse options
   * @returns Parsed Library instance
   */
  static async parse(
    libraryXML: string,
    {assetQuery = ['image.path'], keepOrphans = false}: LibraryParseOptions = {},
  ): Promise<Library> {
    const xml = (await xml2js.parseStringPromise(libraryXML)) as Record<string, Record<string, unknown>>;
    const libraryElement = xml['library'] as Record<string, unknown>;
    const attrs = libraryElement['$'] as Record<string, string>;
    const libraryId = attrs['library-id'];
    const contentArray = libraryElement['content'] as Array<Record<string, unknown>>;

    const library = new Library(CONSTRUCTOR_GUARD);
    library.assetQuery = assetQuery;

    const root = new LibraryNode({
      id: libraryId,
      type: 'LIBRARY',
      typeId: null,
      children: [],
      data: null,
      parent: null,
      hidden: false,
      xml: null,
    });

    // Index all content by ID
    const contentById: Record<string, Record<string, unknown>> = {};
    for (const c of contentArray) {
      const cAttrs = c['$'] as Record<string, string>;
      contentById[cAttrs['content-id']] = c;
    }

    // Process pages and root-level content (no type = content asset)
    for (const c of contentArray) {
      const cType = (c['type'] as string[] | undefined)?.[0];
      if ((cType && cType.startsWith('page.')) || !cType) {
        const node = processContent(c, contentById, assetQuery);
        node.parent = root;
        root.children.push(node);
      }
    }

    library.xml = xml;
    library.tree = root;

    // Optionally include orphan components
    if (keepOrphans) {
      const processedIds = new Set<string>();
      library.traverse((node) => {
        processedIds.add(node.id);
      });

      for (const c of contentArray) {
        const cAttrs = c['$'] as Record<string, string>;
        const cId = cAttrs['content-id'];
        if (!processedIds.has(cId)) {
          const node = processContent(c, contentById, assetQuery);
          node.parent = root;
          root.children.push(node);
        }
      }
    }

    // Remove headers and folders from xml (not needed for filtered export)
    delete libraryElement['header'];
    delete libraryElement['folder'];

    return library;
  }

  /**
   * Depth-first traversal of the library tree.
   *
   * @param callback - Function called for each visited node
   * @param options - Traversal options
   * @returns this (for chaining)
   */
  traverse(callback: TraverseCallback, {traverseHidden = true, callbackHidden = false}: TraverseOptions = {}): this {
    function walk(node: LibraryNode): void {
      if (!node.hidden || traverseHidden) {
        for (const child of node.children) {
          walk(child);
        }
      }

      if (!node.hidden || callbackHidden) {
        callback(node);
      }
    }

    for (const child of this.tree.children) {
      walk(child);
    }

    return this;
  }

  /**
   * Generator-based depth-first iteration of the library tree.
   *
   * @param options - Traversal options
   * @yields LibraryNode for each visited node
   *
   * @example
   * ```typescript
   * for (const node of library.nodes()) {
   *   console.log(node.id, node.type);
   * }
   * ```
   */
  *nodes({traverseHidden = true, callbackHidden = false}: TraverseOptions = {}): Generator<LibraryNode> {
    function* walk(node: LibraryNode): Generator<LibraryNode> {
      if (!node.hidden || traverseHidden) {
        for (const child of node.children) {
          yield* walk(child);
        }
      }

      if (!node.hidden || callbackHidden) {
        yield node;
      }
    }

    for (const child of this.tree.children) {
      yield* walk(child);
    }
  }

  /**
   * Filter the library tree by setting hidden flags on root children.
   *
   * @param predicate - Return true to keep the node visible
   * @param options - Filter options
   * @returns this (for chaining)
   */
  filter(predicate: FilterCallback, {recursive = false} = {}): this {
    if (!recursive) {
      for (const child of this.tree.children) {
        child.hidden = !predicate(child);
      }
    } else {
      this.traverse(
        (n) => {
          n.hidden = !predicate(n);
        },
        {traverseHidden: true, callbackHidden: true},
      );
    }

    return this;
  }

  /**
   * Move a node from its current parent to the root of the library tree.
   *
   * Useful for exporting individual components that are normally nested under pages.
   * The node is removed from its original parent's children and added as a root child.
   *
   * @param node - The node to promote
   * @returns this (for chaining)
   */
  promoteToRoot(node: LibraryNode): this {
    if (node.parent && node.parent !== this.tree) {
      node.parent.children = node.parent.children.filter((c) => c !== node);
    }

    if (!this.tree.children.includes(node)) {
      node.parent = this.tree;
      node.hidden = false;
      this.tree.children.push(node);
    }

    return this;
  }

  /**
   * Reset all hidden flags, making every node visible again.
   *
   * @returns this (for chaining)
   */
  reset(): this {
    this.traverse(
      (n) => {
        n.hidden = false;
      },
      {traverseHidden: true, callbackHidden: true},
    );
    return this;
  }

  /**
   * Serialize the library back to importable XML.
   *
   * Only includes visible content unless `traverseHidden` is true.
   *
   * @param options - Serialization options
   * @returns XML string
   */
  async toXMLString({traverseHidden = true}: {traverseHidden?: boolean} = {}): Promise<string> {
    const libraryElement = this.xml['library'] as Record<string, unknown>;
    delete libraryElement['content'];
    libraryElement['content'] = [];

    this.traverse(
      (n) => {
        const node = n as LibraryNode;
        if (node.data && node.xml) {
          const dataEl = (node.xml['data'] as Array<Record<string, string>>)?.[0];
          if (dataEl) {
            dataEl['_'] = JSON.stringify(node.data, null, 2);
          }
        }

        if (node.xml) {
          (libraryElement['content'] as Array<Record<string, unknown>>).push(node.xml);
        }
      },
      {traverseHidden},
    );

    const builder = new xml2js.Builder();
    return builder.buildObject(this.xml);
  }

  /**
   * Returns a text tree visualization of the library structure.
   *
   * @param options - Tree string options (traversal and optional colorize function)
   * @returns Multi-line tree string
   */
  getTreeString({traverseHidden = false, colorize}: TreeStringOptions = {}): string {
    const lines: string[] = [];
    const c: ColorizeFn = colorize ?? ((_color, text) => text);

    function formatNode(node: LibraryNode): string {
      switch (node.type) {
        case 'COMPONENT': {
          return node.typeId ? `${c('cyan', node.typeId)} ${c('dim', `(${node.id})`)}` : node.id;
        }
        case 'CONTENT': {
          return `${c('bold', node.id)} ${c('dim', '(CONTENT ASSET)')}`;
        }
        case 'PAGE': {
          const name = c('bold', node.id);
          return node.typeId ? `${name} ${c('dim', `(typeId: ${node.typeId})`)}` : name;
        }
        case 'STATIC': {
          return `${c('green', node.id)} ${c('dim', '(STATIC ASSET)')}`;
        }
        default: {
          return node.id;
        }
      }
    }

    function visibleChildren(node: LibraryNode): LibraryNode[] {
      return traverseHidden ? node.children : node.children.filter((child) => !child.hidden);
    }

    function renderSubtree(children: LibraryNode[], prefix: string): void {
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        const isLast = i === children.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const extension = isLast ? '    ' : '│   ';
        const hiddenTag = node.hidden ? ` ${c('yellow', '[HIDDEN]')}` : '';

        lines.push(`${c('dim', prefix + connector)}${formatNode(node)}${hiddenTag}`);
        renderSubtree(visibleChildren(node), prefix + extension);
      }
    }

    for (const child of visibleChildren(this.tree)) {
      const hiddenTag = child.hidden ? ` ${c('yellow', '[HIDDEN]')}` : '';
      lines.push(`${formatNode(child)}${hiddenTag}`);
      renderSubtree(visibleChildren(child), '');
    }

    return lines.join('\n');
  }

  /**
   * Returns a JSON-safe representation of the library tree.
   */
  toJSON(): Record<string, unknown> {
    return this.tree.toJSON();
  }
}
