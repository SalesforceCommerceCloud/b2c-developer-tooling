/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Converts parsed library XML pages into Experiences API page bodies so an
 * exported page can be edited and pushed back without a site-archive import.
 *
 * @module operations/content/page-convert
 */
import type {
  ExperienceComponentRequest,
  ExperiencePageRequest,
  ExperienceRegionRequest,
} from '../../clients/scapi-experiences.js';
import type {LibraryNode} from './library.js';

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
 * Page-level visibility, scheduling and localized values other than
 * `x-default` are not carried over.
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
  const data = cleanData(node.data);
  if (data) page.data = data;
  const regions = toRegions(node, [node.id]);
  if (regions) page.regions = regions;
  return page;
}
