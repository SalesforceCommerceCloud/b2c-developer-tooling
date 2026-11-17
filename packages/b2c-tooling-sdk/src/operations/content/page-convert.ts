/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Converts between library XML (site archive `library.xml`) and Experiences
 * API page bodies, so an exported page can be edited and pushed back without a
 * site-archive import, and a page body can be imported where the API is not
 * available.
 *
 * @module operations/content/page-convert
 */
import * as xml2js from 'xml2js';
import type {
  ExperienceComponentRequest,
  ExperiencePageRequest,
  ExperienceRegionRequest,
} from '../../clients/scapi-experiences.js';
import {Library, type LibraryNode} from './library.js';

const LIBRARY_NAMESPACE = 'http://www.demandware.com/xml/impex/library/2006-10-31';
const DEFAULT_LANG = 'x-default';

type XmlElement = Record<string, unknown>;
type XmlText = {_?: string; $?: Record<string, string>} | string;

function textOf(value: XmlText | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? value : value._;
}

/** The `x-default` (or language-less) value of a localized XML element. */
function defaultText(content: XmlElement, name: string): string | undefined {
  const values = content[name] as XmlText[] | undefined;
  const match = values?.find((v) => typeof v === 'string' || !v.$?.['xml:lang'] || v.$['xml:lang'] === DEFAULT_LANG);
  return textOf(match);
}

/** Strip the library XML `page.` / `component.` prefix from a type ID. */
export function toExperienceTypeId(libraryTypeId: string): string {
  for (const prefix of ['page.', 'component.']) {
    if (libraryTypeId.startsWith(prefix)) return libraryTypeId.slice(prefix.length);
  }
  return libraryTypeId;
}

/**
 * Library XML stores unset attributes as `null`. The Experiences API treats an
 * omitted attribute as "use the default", so drop nulls instead of sending them.
 */
function cleanData(data: Record<string, unknown> | null): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function toRegions(node: LibraryNode, path: string[]): ExperienceRegionRequest[] | undefined {
  const regions = new Map<string, ExperienceComponentRequest[]>();
  for (const child of node.children) {
    if (child.type === 'FRAGMENT') {
      // Pushing a shared content block as an inline component would overwrite
      // it for every page that links it, so refuse until the API semantics for
      // fragments are confirmed.
      throw new Error(
        `Cannot convert ${path.join(' > ')}: it links shared content block "${child.id}", which page push does not support`,
      );
    }
    if (child.type !== 'COMPONENT') continue;
    if (!child.regionId) {
      throw new Error(
        `Cannot convert ${path.join(' > ')} > ${child.id}: the content link has no region type, so its region is unknown`,
      );
    }
    let list = regions.get(child.regionId);
    if (!list) {
      list = [];
      regions.set(child.regionId, list);
    }
    list.push(toComponent(child, [...path, child.id]));
  }
  if (regions.size === 0) return undefined;
  return [...regions.entries()].map(([id, components]) => ({id, components}));
}

function toComponent(node: LibraryNode, path: string[]): ExperienceComponentRequest {
  if (!node.typeId) {
    throw new Error(`Cannot convert ${path.join(' > ')}: component has no type`);
  }
  const component: ExperienceComponentRequest = {
    id: node.id,
    typeId: toExperienceTypeId(node.typeId),
  };
  if (node.displayName) component.name = node.displayName;
  const data = cleanData(node.data);
  if (data) component.data = data;
  const regions = toRegions(node, path);
  if (regions) component.regions = regions;
  return component;
}

/**
 * Converts a PAGE node from {@link Library.parse} into an Experiences API
 * page body (regions and components, with library prefixes removed and unset
 * attributes dropped).
 *
 * Carries the page name, description, aspect type, page title, description
 * and keywords, and each component's name and data, all in the default
 * locale. Online state, visibility, scheduling, site-specific values and
 * other locales are not carried over (see {@link planLibraryPagePush}).
 *
 * @throws Error when the node is not a page, a link has no region type, or the
 *   page links a shared content block (fragment)
 */
export function libraryPageToPageRequest(node: LibraryNode): ExperiencePageRequest {
  if (node.type !== 'PAGE' || !node.typeId) {
    throw new Error(`Content "${node.id}" is not a Page Designer page`);
  }
  const page: ExperiencePageRequest = {
    id: node.id,
    name: node.displayName ?? node.id,
    typeId: toExperienceTypeId(node.typeId),
  };
  const xml = node.xml;
  if (xml) {
    const description = defaultText(xml, 'description');
    if (description) page.description = description;
    const aspect = textOf((xml['aspect-type'] as XmlText[] | undefined)?.[0]);
    if (aspect) page.aspectTypeId = aspect;
    const attributes = (xml['page-attributes'] as XmlElement[] | undefined)?.[0];
    if (attributes && typeof attributes === 'object') {
      const title = defaultText(attributes, 'page-title');
      const pageDescription = defaultText(attributes, 'page-description');
      const keywords = defaultText(attributes, 'page-keywords');
      if (title) page.pageTitle = title;
      if (pageDescription) page.pageDescription = pageDescription;
      if (keywords) page.pageKeywords = keywords;
    }
  }
  const data = cleanData(node.data);
  if (data) page.data = data;
  const regions = toRegions(node, [node.id]);
  if (regions) page.regions = regions;
  return page;
}

/** Options for {@link libraryXmlToPageRequests}. */
export interface LibraryXmlToPageRequestsOptions {
  /** Only convert these page IDs (default: every page in the XML). */
  pageIds?: string[];
}

/**
 * Converts every Page Designer page in a library XML document into an
 * Experiences API page body.
 *
 * @throws Error when a page cannot be converted (see {@link libraryPageToPageRequest})
 */
export async function libraryXmlToPageRequests(
  xml: string,
  options: LibraryXmlToPageRequestsOptions = {},
): Promise<ExperiencePageRequest[]> {
  const library = await Library.parse(xml);
  const wanted = options.pageIds && options.pageIds.length > 0 ? new Set(options.pageIds) : undefined;
  return library.tree.children
    .filter((n) => n.type === 'PAGE' && (!wanted || wanted.has(n.id)))
    .map((n) => libraryPageToPageRequest(n));
}

function localizedElement(value: string): XmlElement {
  return {$: {'xml:lang': DEFAULT_LANG}, _: value};
}

interface ContentFields {
  name?: string;
  description?: string;
  data?: Record<string, unknown>;
  aspectTypeId?: string;
  pageAttributes?: Partial<Record<'page-description' | 'page-keywords' | 'page-title', string>>;
}

/** Builds a `<content>` element with its children in XSD sequence order. */
function contentElement(id: string, libraryTypeId: string, fields: ContentFields): XmlElement {
  const content: XmlElement = {$: {'content-id': id}};
  if (fields.name) content['display-name'] = [localizedElement(fields.name)];
  if (fields.description) content['description'] = [localizedElement(fields.description)];
  content['type'] = [libraryTypeId];
  content['data'] = [localizedElement(JSON.stringify(fields.data ?? {}, null, 2))];
  if (fields.aspectTypeId) content['aspect-type'] = [fields.aspectTypeId];
  const attributes = Object.entries(fields.pageAttributes ?? {}).filter(([, v]) => v);
  if (attributes.length > 0) {
    content['page-attributes'] = [Object.fromEntries(attributes.map(([k, v]) => [k, [localizedElement(v!)]]))];
  }
  return content;
}

function addRegions(
  owner: XmlElement,
  ownerTypeId: string,
  regions: ExperienceRegionRequest[] | undefined,
  out: XmlElement[],
): void {
  const links: XmlElement[] = [];
  for (const region of regions ?? []) {
    for (const [index, component] of (region.components ?? []).entries()) {
      const typeId = `component.${toExperienceTypeId(component.typeId)}`;
      links.push({$: {'content-id': component.id, type: `${ownerTypeId}.${region.id}`}, position: [`${index}.0`]});
      const element = contentElement(component.id, typeId, {name: component.name, data: component.data});
      out.push(element);
      addRegions(element, typeId, component.regions, out);
    }
  }
  if (links.length > 0) owner['content-links'] = [{'content-link': links}];
}

/** Options for {@link pageRequestsToLibraryXml}. */
export interface PageRequestsToLibraryXmlOptions {
  /** `library-id` of the generated document. Omit for a site-private library archive. */
  libraryId?: string;
}

/**
 * Converts Experiences API page bodies into a library XML document for a site
 * archive import (`libraries/<id>/library.xml`, or `sites/<site>/library/library.xml`).
 *
 * The inverse of {@link libraryXmlToPageRequests}: pages and components get the
 * library `page.` / `component.` type prefixes, region membership becomes
 * content links typed `<parentTypeId>.<regionId>`, and values are written in
 * the default locale. Imported pages keep the online state the import sets
 * (offline for new pages unless you add `online-flag` yourself).
 */
export function pageRequestsToLibraryXml(
  pages: ExperiencePageRequest[],
  options: PageRequestsToLibraryXmlOptions = {},
): string {
  const contents: XmlElement[] = [];
  for (const page of pages) {
    const typeId = `page.${toExperienceTypeId(page.typeId)}`;
    const element = contentElement(page.id, typeId, {
      name: page.name,
      description: page.description,
      data: page.data,
      aspectTypeId: page.aspectTypeId,
      pageAttributes: {
        'page-title': page.pageTitle,
        'page-description': page.pageDescription,
        'page-keywords': page.pageKeywords,
      },
    });
    contents.push(element);
    addRegions(element, typeId, page.regions, contents);
  }
  const root: XmlElement = {
    $: {xmlns: LIBRARY_NAMESPACE, ...(options.libraryId ? {'library-id': options.libraryId} : {})},
  };
  root['content'] = contents;
  return new xml2js.Builder({xmldec: {version: '1.0', encoding: 'UTF-8'}}).buildObject({library: root});
}

/** Result of {@link planLibraryPagePush}. */
export type LibraryPagePushPlan = {pushable: true; page: ExperiencePageRequest} | {pushable: false; reason: string};

/** Options for {@link planLibraryPagePush}. */
export interface PlanLibraryPagePushOptions {
  /** The page to push (default: the only page in the edited XML). */
  pageId?: string;
  /**
   * The XML the edit started from (for example a fresh export of the page).
   * Without it, any field the API cannot write makes the page unpushable.
   */
  originalXml?: string;
}

/** Library XML elements a page PUT writes (in the default locale). Everything else needs an import. */
const PUSHABLE_ELEMENTS = new Set(['$', 'type', 'content-links']);
const PUSHABLE_LOCALIZED = new Set(['display-name', 'description', 'data']);
const PUSHABLE_PAGE_ATTRIBUTES = new Set(['page-title', 'page-description', 'page-keywords']);

/** The parts of a content element a page PUT cannot write, normalized for comparison. */
function unpushableFields(content: XmlElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    if (PUSHABLE_ELEMENTS.has(key) || key === 'aspect-type') continue;
    if (PUSHABLE_LOCALIZED.has(key)) {
      const other = (value as XmlText[]).filter(
        (v) => typeof v !== 'string' && v.$?.['xml:lang'] && v.$['xml:lang'] !== DEFAULT_LANG,
      );
      if (other.length > 0) out[key] = other;
      continue;
    }
    if (key === 'page-attributes') {
      const attributes = (value as Array<XmlElement | string>)[0];
      if (!attributes || typeof attributes !== 'object') continue;
      const rest: Record<string, unknown> = {};
      for (const [name, values] of Object.entries(attributes)) {
        const other = PUSHABLE_PAGE_ATTRIBUTES.has(name)
          ? (values as XmlText[]).filter(
              (v) => typeof v !== 'string' && v.$?.['xml:lang'] && v.$['xml:lang'] !== DEFAULT_LANG,
            )
          : values;
        if (!PUSHABLE_PAGE_ATTRIBUTES.has(name) || (other as unknown[]).length > 0) rest[name] = other;
      }
      if (Object.keys(rest).length > 0) out[key] = rest;
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Names a changed field for a fallback reason, with the locales that changed
 * for localized fields, for example `data (fr)`.
 */
function describeField(field: string, before: unknown, after: unknown): string {
  const byLang = (value: unknown): Map<string, string> => {
    const out = new Map<string, string>();
    if (!Array.isArray(value)) return out;
    for (const v of value as XmlText[]) {
      const lang = typeof v === 'string' ? undefined : v.$?.['xml:lang'];
      if (lang) out.set(lang, JSON.stringify(v));
    }
    return out;
  };
  const b = byLang(before);
  const a = byLang(after);
  const langs = [...new Set([...b.keys(), ...a.keys()])].filter((l) => b.get(l) !== a.get(l));
  return langs.length > 0 ? `${field} (${langs.sort().join(', ')})` : field;
}

/** What a newly created component looks like in an export (the API's defaults). */
function isDefaultNewComponentField(key: string, value: unknown): boolean {
  if (key === 'online-flag') return (value as XmlText[]).every((v) => textOf(v) === 'true');
  if (key === 'config') {
    try {
      const config = JSON.parse(textOf((value as XmlText[])[0]) ?? '{}') as {visibility?: unknown[]};
      return Object.keys(config).every((k) => k === 'visibility') && (config.visibility ?? []).length === 0;
    } catch {
      return false;
    }
  }
  return false;
}

function indexContent(xml: Record<string, unknown>): Map<string, XmlElement> {
  const library = xml['library'] as XmlElement | undefined;
  const contents = (library?.['content'] as XmlElement[] | undefined) ?? [];
  return new Map(contents.map((c) => [(c['$'] as Record<string, string>)['content-id'], c]));
}

/** Region IDs that hold components, per page or layout component ID. */
function regionsByOwner(node: LibraryNode, out: Map<string, Set<string>>): void {
  for (const child of node.children) {
    if (child.type !== 'COMPONENT' && child.type !== 'FRAGMENT') continue;
    if (child.regionId) {
      let set = out.get(node.id);
      if (!set) {
        set = new Set();
        out.set(node.id, set);
      }
      set.add(child.regionId);
    }
    regionsByOwner(child, out);
  }
}

/**
 * A PUT keeps regions it does not mention, so a region the edit emptied must be
 * sent with an empty component list to be cleared.
 */
function addEmptiedRegions(
  owner: {id: string; regions?: ExperienceRegionRequest[]},
  before: Map<string, Set<string>>,
): void {
  const sent = new Set((owner.regions ?? []).map((r) => r.id));
  for (const regionId of before.get(owner.id) ?? []) {
    if (!sent.has(regionId)) (owner.regions ??= []).push({id: regionId, components: []});
  }
  for (const region of owner.regions ?? []) {
    for (const component of region.components ?? []) addEmptiedRegions(component, before);
  }
}

function setAttributes(node: LibraryNode, out: Map<string, Record<string, unknown>>): void {
  if (node.type === 'COMPONENT' || node.type === 'PAGE') {
    out.set(
      node.id,
      Object.fromEntries(Object.entries(node.data ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '')),
    );
  }
  for (const child of node.children) setAttributes(child, out);
}

/**
 * Decides whether an edited library XML page can be saved with a page PUT
 * ({@link pushPage}) without losing part of the edit, and builds the page body.
 *
 * A PUT writes default-locale names, descriptions, page attributes and
 * component data, and replaces the component list of each region it sends.
 * Regions emptied by the edit are sent with no components so they are cleared;
 * components removed from a region stay in the library unassigned (as with
 * Business Manager). It merges component data (an attribute left out keeps its value) and cannot
 * clear an attribute, change an existing page's type, or write online state,
 * visibility, schedules, site-specific values, other locales or shared content
 * blocks. When the edit touches any of these (compared with `originalXml`), the
 * result is `pushable: false` with the reason, and the caller should fall back
 * to a site-archive import.
 */
export async function planLibraryPagePush(
  editedXml: string,
  options: PlanLibraryPagePushOptions = {},
): Promise<LibraryPagePushPlan> {
  let edited: Library;
  try {
    edited = await Library.parse(editedXml);
  } catch (error) {
    return {pushable: false, reason: `the XML could not be parsed (${(error as Error).message})`};
  }
  const pages = edited.tree.children.filter((n) => n.type === 'PAGE');
  const pageNode = options.pageId
    ? pages.find((n) => n.id === options.pageId)
    : pages.length === 1
      ? pages[0]
      : undefined;
  if (!pageNode) {
    return {
      pushable: false,
      reason: options.pageId ? `page ${options.pageId} is not in the XML` : 'the XML does not hold exactly one page',
    };
  }
  const others = edited.tree.children.filter((n) => n !== pageNode);
  if (others.length > 0) {
    return {pushable: false, reason: `the XML also holds ${others.map((n) => n.id).join(', ')}`};
  }

  let page: ExperiencePageRequest;
  try {
    page = libraryPageToPageRequest(pageNode);
  } catch (error) {
    return {pushable: false, reason: (error as Error).message};
  }

  const original = options.originalXml ? await Library.parse(options.originalXml).catch(() => undefined) : undefined;
  const originalPage = original?.tree.children.find((n) => n.id === pageNode.id);
  if (originalPage?.typeId && originalPage.typeId !== pageNode.typeId) {
    return {pushable: false, reason: `the page type changed (${originalPage.typeId} to ${pageNode.typeId})`};
  }

  const editedContent = indexContent(edited.xml);
  const originalContent = original ? indexContent(original.xml) : new Map<string, XmlElement>();
  for (const [id, element] of editedContent) {
    const before = originalContent.get(id);
    const after = unpushableFields(element);
    if (before) {
      if (JSON.stringify(unpushableFields(before)) !== JSON.stringify(after)) {
        const fields = new Set([...Object.keys(after), ...Object.keys(unpushableFields(before))]);
        const beforeFields = unpushableFields(before);
        const changed = [...fields]
          .filter((f) => JSON.stringify(after[f]) !== JSON.stringify(beforeFields[f]))
          .map((f) => describeField(f, beforeFields[f], after[f]));
        return {pushable: false, reason: `${id}: ${changed.join(', ')} changed, which only an import can write`};
      }
    } else {
      const extra = Object.entries(after).filter(([k, v]) => !isDefaultNewComponentField(k, v));
      if (extra.length > 0) {
        return {
          pushable: false,
          reason: `${id}: ${extra.map(([k]) => k).join(', ')} set, which only an import can write`,
        };
      }
    }
  }

  if (originalPage) {
    const beforeData = new Map<string, Record<string, unknown>>();
    const afterData = new Map<string, Record<string, unknown>>();
    setAttributes(originalPage, beforeData);
    setAttributes(pageNode, afterData);
    for (const [id, after] of afterData) {
      const before = beforeData.get(id);
      if (!before) continue;
      const cleared = Object.keys(before).filter((k) => !(k in after));
      if (cleared.length > 0) {
        return {pushable: false, reason: `${id}: ${cleared.join(', ')} cleared, which a page update cannot do`};
      }
    }
    const before = new Map<string, Set<string>>();
    regionsByOwner(originalPage, before);
    addEmptiedRegions(page, before);
  }

  return {pushable: true, page};
}
