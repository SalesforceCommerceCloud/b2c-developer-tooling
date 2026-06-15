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
  /** Localized display name (x-default), when present. Content blocks (fragments) always have one. */
  displayName: string | null;
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
    displayName?: string | null;
    data: Record<string, unknown> | null;
    parent: LibraryNode | null;
    children: LibraryNode[];
    hidden: boolean;
    xml: Record<string, unknown> | null;
  }) {
    this.id = values.id;
    this.type = values.type;
    this.typeId = values.typeId;
    this.displayName = values.displayName ?? null;
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
      displayName: this.displayName,
      data: this.data,
      children: this.children,
      hidden: this.hidden,
    };
  }

  /**
   * Convert this component node into a content block (fragment) in place.
   *
   * Mirrors the element-level shape of Page Designer's "Convert to Content
   * Block": the underlying `<content>` keeps its content-id, its `<type>` is
   * rewritten from `component.*` to the matching `fragment.*`, a `<display-name>`
   * is set (in schema-correct first position), and the element's own region
   * `content-link` types are flipped to `fragment.*` to match.
   *
   * NOTE: this only mutates the in-memory node. It is NOT sufficient to persist a
   * conversion via site-archive import — a merge import ignores `<type>` changes
   * on an existing element. To persist, use {@link Library.buildContentBlockConversionXML}.
   *
   * @param displayName - The x-default display name for the new content block.
   * @returns this (for chaining)
   * @throws If this node is not a component or has no backing XML.
   */
  convertToFragment(displayName: string): this {
    if (this.type !== 'COMPONENT' || !this.typeId || !this.typeId.startsWith('component.')) {
      throw new Error('Only a component node can be converted to a content block');
    }
    if (!this.xml) {
      throw new Error(`Content "${this.id}" has no backing XML to convert`);
    }

    this.xml = transformContentXmlToFragment(this.xml, displayName);
    this.typeId = (this.xml['type'] as string[])[0];
    this.type = 'FRAGMENT';
    this.displayName = displayName;
    return this;
  }
}

/**
 * Classify a content element's `<type>` value into a {@link LibraryNodeType}.
 *
 * - `page.*`     → `PAGE`
 * - `fragment.*` → `FRAGMENT` (a Page Designer "content block": a shared/reusable singleton)
 * - any other typed value → `COMPONENT`
 * - no type      → `CONTENT` (a content asset)
 */
function classifyContentType(contentType: string | null): LibraryNodeType {
  if (!contentType) {
    return 'CONTENT';
  }
  if (contentType.startsWith('page.')) {
    return 'PAGE';
  }
  if (contentType.startsWith('fragment.')) {
    return 'FRAGMENT';
  }
  return 'COMPONENT';
}

/**
 * Extract the x-default `<display-name>` text from a content XML element, if present.
 */
function extractDisplayName(content: Record<string, unknown>): string | null {
  const displayNames = content['display-name'] as Array<Record<string, string>> | undefined;
  return displayNames?.[0]?.['_'] ?? null;
}

/**
 * Produce a new xml2js content object representing the fragment form of a
 * component element: `<type>` rewritten `component.*` → `fragment.*`, a
 * `<display-name>` set as the first child (schema order), and the element's own
 * region `content-link` `type` attributes flipped from `component.<base>.*` to
 * `fragment.<base>.*` (Layout blocks keep their regions, renamed to match the
 * new type). Does not mutate the input.
 */
function transformContentXmlToFragment(xml: Record<string, unknown>, displayName: string): Record<string, unknown> {
  const currentType = (xml['type'] as string[] | undefined)?.[0];
  if (!currentType || !currentType.startsWith('component.')) {
    throw new Error('Only a component element can be converted to a content block');
  }
  const baseType = currentType.slice('component.'.length);
  const fragmentType = `fragment.${baseType}`;

  // Rebuild with display-name first (xml2js serializes in key-insertion order).
  const rebuilt: Record<string, unknown> = {};
  if (xml['$'] !== undefined) {
    rebuilt['$'] = xml['$'];
  }
  rebuilt['display-name'] = [{$: {'xml:lang': 'x-default'}, _: displayName}];
  for (const [key, value] of Object.entries(xml)) {
    if (key === '$' || key === 'display-name') {
      continue;
    }
    if (key === 'type') {
      rebuilt['type'] = [fragmentType];
      continue;
    }
    if (key === 'content-links') {
      // Flip this element's own region link types: component.<base>.<region> ->
      // fragment.<base>.<region>. Child links to OTHER content keep their own
      // ids; only the region-type attribute (owned by this element's type) changes.
      rebuilt['content-links'] = renameRegionLinkTypes(value, currentType, fragmentType);
      continue;
    }
    rebuilt[key] = value;
  }
  if (rebuilt['type'] === undefined) {
    rebuilt['type'] = [fragmentType];
  }
  return rebuilt;
}

/**
 * Return the content-ids this content element links to via its `content-links`.
 */
function childLinkIds(content: Record<string, unknown> | undefined): string[] {
  if (!content) {
    return [];
  }
  const contentLinks = content['content-links'] as Array<Record<string, unknown>> | undefined;
  const links = contentLinks?.[0]?.['content-link'] as Array<Record<string, unknown>> | undefined;
  if (!links) {
    return [];
  }
  return links
    .map((link) => (link['$'] as Record<string, string> | undefined)?.['content-id'])
    .filter((id): id is string => typeof id === 'string');
}

/**
 * Deep-clone a `content-links` xml2js value, rewriting any `content-link` whose
 * `type` attribute starts with `${oldType}.` so it starts with `${newType}.`.
 */
function renameRegionLinkTypes(contentLinks: unknown, oldType: string, newType: string): unknown {
  const cloned = JSON.parse(JSON.stringify(contentLinks)) as Array<Record<string, unknown>>;
  for (const wrapper of cloned) {
    const links = wrapper['content-link'] as Array<Record<string, unknown>> | undefined;
    if (!links) {
      continue;
    }
    for (const link of links) {
      const attrs = link['$'] as Record<string, string> | undefined;
      if (attrs && typeof attrs['type'] === 'string' && attrs['type'].startsWith(`${oldType}.`)) {
        attrs['type'] = `${newType}.${attrs['type'].slice(oldType.length + 1)}`;
      }
    }
  }
  return cloned;
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
  const displayName = extractDisplayName(content);

  const node = new LibraryNode({
    id: contentId,
    type: classifyContentType(contentType),
    typeId: contentType,
    displayName,
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

  // Recurse into content-links (sorted by position)
  const contentLinks = content['content-links'] as Array<Record<string, unknown>> | undefined;
  if (contentLinks?.[0]?.['content-link']) {
    const links = (contentLinks[0]['content-link'] as Array<Record<string, unknown>>).slice().sort((a, b) => {
      const posA = parseFloat((a['position'] as string[] | undefined)?.[0] ?? 'Infinity');
      const posB = parseFloat((b['position'] as string[] | undefined)?.[0] ?? 'Infinity');
      return posA - posB;
    });
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
  /** @internal Index of every content element by content-id (built during parse, reused by getContentBlocks) */
  private contentById: Record<string, Record<string, unknown>> = {};

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

    // Index all content by ID (retained on the instance for getContentBlocks)
    const contentById: Record<string, Record<string, unknown>> = {};
    for (const c of contentArray) {
      const cAttrs = c['$'] as Record<string, string>;
      contentById[cAttrs['content-id']] = c;
    }
    library.contentById = contentById;

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
   * Returns the library's content blocks (fragments) as a deduplicated catalog.
   *
   * A content block is a `<content>` element typed `fragment.*`. Unlike pages or
   * content assets, fragments are not root-level tree children — they surface
   * wherever a page/component/other-fragment links them. This method scans the
   * full content set (not just the linked tree) so that **unlinked** blocks are
   * included too, and returns one source-of-truth {@link LibraryNode} per block,
   * with its child subtree attached (Layout fragments keep their region children).
   *
   * @returns One LibraryNode per content block, deduplicated by content-id.
   *
   * @example
   * ```typescript
   * const library = await Library.parse(xml);
   * for (const block of library.getContentBlocks()) {
   *   console.log(block.displayName ?? block.id, block.typeId);
   * }
   * ```
   */
  getContentBlocks(): LibraryNode[] {
    const libraryElement = this.xml['library'] as Record<string, unknown> | undefined;
    const contentArray = (libraryElement?.['content'] as Array<Record<string, unknown>> | undefined) ?? [];

    const blocks: LibraryNode[] = [];
    const seen = new Set<string>();
    for (const c of contentArray) {
      const cType = (c['type'] as string[] | undefined)?.[0];
      if (!cType || !cType.startsWith('fragment.')) {
        continue;
      }
      const cId = (c['$'] as Record<string, string>)['content-id'];
      if (seen.has(cId)) {
        continue;
      }
      seen.add(cId);
      const node = processContent(c, this.contentById, this.assetQuery);
      blocks.push(node);
    }
    return blocks;
  }

  /**
   * Build a self-contained library XML payload that converts a component into a
   * content block (fragment) when imported via site-archive import.
   *
   * A plain merge import ignores `<type>` changes on an existing element, and a
   * `mode="delete"` on a content element **deep-deletes its entire subtree** and
   * strips every incoming `content-link`. To faithfully reproduce Page Designer's
   * in-place conversion (verified byte-for-byte against a manual conversion), this
   * archive therefore:
   *
   * 1. deletes the target (`<content mode="delete"/>`) — clearing the old type
   *    and its subtree;
   * 2. recreates the target as `fragment.*` (display-name first, own region-link
   *    types flipped) — see {@link transformContentXmlToFragment};
   * 3. recreates **every descendant** of the target (they were cascade-deleted);
   * 4. re-imports **every referrer** (any content that links the target, possibly
   *    several — content blocks are shared) so their `content-link` survives.
   *
   * All four happen in one archive/one import job so the storefront is never left
   * with a dangling reference.
   *
   * @param contentId - The component content-id to convert.
   * @param displayName - The x-default display name for the new content block.
   * @returns Importable library XML string.
   * @throws If the content-id is not found or is not a component.
   */
  async buildContentBlockConversionXML(contentId: string, displayName: string): Promise<string> {
    const target = this.contentById[contentId];
    if (!target) {
      throw new Error(`Content "${contentId}" not found in library`);
    }
    const targetType = (target['type'] as string[] | undefined)?.[0];
    if (!targetType || !targetType.startsWith('component.')) {
      throw new Error(`Content "${contentId}" is not a component and cannot be converted to a content block`);
    }

    // Collect the target's descendants (its content-link tree). They are
    // cascade-deleted by mode="delete" and must be recreated as-is.
    const descendantIds: string[] = [];
    const seen = new Set<string>([contentId]);
    const queue = [contentId];
    while (queue.length > 0) {
      const id = queue.shift() as string;
      for (const childId of childLinkIds(this.contentById[id])) {
        if (!seen.has(childId) && this.contentById[childId]) {
          seen.add(childId);
          descendantIds.push(childId);
          queue.push(childId);
        }
      }
    }

    // Collect every referrer: any content element that links the target.
    const referrerIds: string[] = [];
    for (const [id, el] of Object.entries(this.contentById)) {
      if (id === contentId) {
        continue;
      }
      if (childLinkIds(el).includes(contentId)) {
        referrerIds.push(id);
      }
    }

    // Build the content array: delete marker, recreated fragment, descendants, referrers.
    const transformedTarget = transformContentXmlToFragment(target, displayName);
    const content: Array<Record<string, unknown>> = [
      {$: {'content-id': contentId, mode: 'delete'}},
      transformedTarget,
      ...descendantIds.map((id) => this.contentById[id]),
      ...referrerIds.map((id) => this.contentById[id]),
    ];

    const libraryAttrs = (this.xml['library'] as Record<string, unknown>)['$'];
    const doc = {library: {$: libraryAttrs, content}};
    return new xml2js.Builder().buildObject(doc);
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
        case 'FRAGMENT': {
          const name = c('magenta', node.displayName ?? node.id);
          const annotation = node.typeId ? `(CONTENT BLOCK: ${node.typeId})` : '(CONTENT BLOCK)';
          return `${name} ${c('dim', annotation)}`;
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
