/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Validates Page Designer page bodies (the Experiences API `PageRequest`
 * shape) against page and component type definitions, either fetched live
 * from an instance or read from local cartridge `experience/` meta files.
 *
 * The platform rejects unknown regions, unknown component types and invalid
 * enum values, but silently accepts missing required attributes and drops
 * unknown attribute keys. This validator reports all of these before a push.
 *
 * @module operations/content/page-validate
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {glob} from 'glob';
import type {
  ExperienceAttributeDefinition,
  ExperienceComponentRequest,
  ExperienceComponentType,
  ExperiencePageRequest,
  ExperiencePageType,
  ExperienceRegionDefinition,
  ExperienceRegionRequest,
} from '../../clients/scapi-experiences.js';

/** A type definition normalized from either the live API or a local meta file. */
export interface PageDesignerTypeDefinition {
  id: string;
  kind: 'page' | 'component';
  name?: string;
  regions: PageDesignerRegionDefinition[];
  attributes: PageDesignerAttributeDefinition[];
  /** Where the definition came from. */
  source: 'instance' | 'local';
  /** Local meta file path (local definitions only). */
  file?: string;
}

export interface PageDesignerRegionDefinition {
  id: string;
  maxComponents?: number;
  /** Component type IDs that may not be used in this region. */
  exclusions: string[];
  /** When non-empty, only these component type IDs may be used (local meta only). */
  inclusions: string[];
}

export interface PageDesignerAttributeDefinition {
  id: string;
  type?: string;
  required: boolean;
  values?: Array<string | number>;
}

/** Normalized type catalog used by {@link validatePageRequest}. */
export interface PageDesignerTypeCatalog {
  pageTypes: Map<string, PageDesignerTypeDefinition>;
  componentTypes: Map<string, PageDesignerTypeDefinition>;
}

export interface PageValidationIssue {
  severity: 'error' | 'warning';
  /** JSON-pointer-like path into the page body, e.g. `/regions/0/components/1/data/height`. */
  path: string;
  message: string;
}

export interface PageValidationResult {
  pageId: string;
  valid: boolean;
  errors: PageValidationIssue[];
  warnings: PageValidationIssue[];
}

const LOCAL_META_PATTERN = /\/experience\/(pages|components)\/(.+)\.json$/;

function localizedDefault(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const map = value as Record<string, string>;
    return map.default ?? Object.values(map)[0];
  }
  return undefined;
}

function fromApiRegion(region: ExperienceRegionDefinition): PageDesignerRegionDefinition {
  return {
    id: region.id,
    maxComponents: region.maxComponents,
    exclusions: (region.componentTypeExclusions ?? []).map((e) => e.typeId),
    inclusions: [],
  };
}

function fromApiAttribute(attr: ExperienceAttributeDefinition): PageDesignerAttributeDefinition {
  return {id: attr.id, type: attr.type, required: attr.required ?? false, values: attr.values};
}

function fromApiType(
  type: ExperienceComponentType | ExperiencePageType,
  kind: 'page' | 'component',
): PageDesignerTypeDefinition {
  return {
    id: type.id,
    kind,
    name: localizedDefault(type.name),
    regions: (type.regionDefinitions ?? []).map(fromApiRegion),
    attributes: (type.attributeDefinitionGroups ?? []).flatMap((g) =>
      (g.attributeDefinitions ?? []).map(fromApiAttribute),
    ),
    source: 'instance',
  };
}

/** Builds a catalog from Experiences API page and component types. */
export function catalogFromExperienceTypes(types: {
  pageTypes: ExperiencePageType[];
  componentTypes: ExperienceComponentType[];
}): PageDesignerTypeCatalog {
  return {
    pageTypes: new Map(types.pageTypes.map((t) => [t.id, fromApiType(t, 'page')])),
    componentTypes: new Map(types.componentTypes.map((t) => [t.id, fromApiType(t, 'component')])),
  };
}

interface LocalMeta {
  name?: string;
  region_definitions?: Array<{
    id: string;
    max_components?: number;
    component_type_exclusions?: Array<{type_id: string}>;
    component_type_inclusions?: Array<{type_id: string}>;
  }>;
  attribute_definition_groups?: Array<{
    attribute_definitions?: Array<{id: string; type?: string; required?: boolean; values?: Array<string | number>}>;
  }>;
}

function fromLocalMeta(
  id: string,
  kind: 'page' | 'component',
  meta: LocalMeta,
  file: string,
): PageDesignerTypeDefinition {
  return {
    id,
    kind,
    name: meta.name,
    regions: (meta.region_definitions ?? []).map((r) => ({
      id: r.id,
      maxComponents: r.max_components,
      exclusions: (r.component_type_exclusions ?? []).map((e) => e.type_id),
      inclusions: (r.component_type_inclusions ?? []).map((e) => e.type_id),
    })),
    attributes: (meta.attribute_definition_groups ?? []).flatMap((g) =>
      (g.attribute_definitions ?? []).map((a) => ({
        id: a.id,
        type: a.type,
        required: a.required ?? false,
        values: a.values,
      })),
    ),
    source: 'local',
    file,
  };
}

/**
 * Builds a catalog from local cartridge meta definitions found under
 * `experience/pages/` and `experience/components/` (any depth).
 *
 * Type IDs follow the Page Designer convention: the path below
 * `experience/pages` or `experience/components`, without extension, with
 * `/` replaced by `.` (for example `experience/components/assets/banner.json`
 * is `assets.banner`).
 *
 * @param roots - Directories to search (cartridge roots or a project root)
 */
export async function catalogFromLocalCartridges(roots: string[]): Promise<PageDesignerTypeCatalog> {
  const catalog: PageDesignerTypeCatalog = {pageTypes: new Map(), componentTypes: new Map()};
  for (const root of roots) {
    const files = await glob('**/experience/{pages,components}/**/*.json', {
      cwd: root,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    for (const file of files) {
      const normalized = file.replace(/\\/g, '/');
      const match = normalized.match(LOCAL_META_PATTERN);
      if (!match) continue;
      const kind = match[1] === 'pages' ? 'page' : 'component';
      const id = match[2].replace(/\//g, '.');
      let meta: LocalMeta;
      try {
        meta = JSON.parse(await fs.promises.readFile(file, 'utf8')) as LocalMeta;
      } catch {
        continue;
      }
      const def = fromLocalMeta(id, kind, meta, path.resolve(file));
      (kind === 'page' ? catalog.pageTypes : catalog.componentTypes).set(id, def);
    }
  }
  return catalog;
}

/**
 * Merges catalogs; later catalogs win for duplicate IDs. Use
 * `mergeTypeCatalogs(instanceCatalog, localCatalog)` to let local (not yet
 * deployed) definitions override what the instance has.
 */
export function mergeTypeCatalogs(...catalogs: PageDesignerTypeCatalog[]): PageDesignerTypeCatalog {
  const merged: PageDesignerTypeCatalog = {pageTypes: new Map(), componentTypes: new Map()};
  for (const c of catalogs) {
    for (const [k, v] of c.pageTypes) merged.pageTypes.set(k, v);
    for (const [k, v] of c.componentTypes) merged.componentTypes.set(k, v);
  }
  return merged;
}

const STRING_ATTRIBUTE_TYPES = new Set(['string', 'text', 'url', 'product', 'category', 'page', 'file']);

function checkAttributeValue(
  attr: PageDesignerAttributeDefinition,
  value: unknown,
  attrPath: string,
  issues: PageValidationIssue[],
): void {
  if (attr.type === 'boolean' && typeof value !== 'boolean') {
    issues.push({severity: 'error', path: attrPath, message: `Attribute "${attr.id}" must be a boolean`});
  } else if (attr.type === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) {
    issues.push({severity: 'error', path: attrPath, message: `Attribute "${attr.id}" must be an integer`});
  } else if (
    attr.type === 'enum' &&
    attr.values &&
    attr.values.length > 0 &&
    !attr.values.map(String).includes(String(value))
  ) {
    issues.push({
      severity: 'error',
      path: attrPath,
      message: `Attribute "${attr.id}" value ${JSON.stringify(value)} is not one of: ${attr.values.join(', ')}`,
    });
  } else if (attr.type && STRING_ATTRIBUTE_TYPES.has(attr.type) && typeof value !== 'string') {
    issues.push({severity: 'error', path: attrPath, message: `Attribute "${attr.id}" must be a string`});
  } else if (attr.type === 'image' && (typeof value !== 'object' || Array.isArray(value))) {
    issues.push({
      severity: 'error',
      path: attrPath,
      message: `Attribute "${attr.id}" must be an image object (for example {"path": "images/hero.jpg"})`,
    });
  }
}

function checkAttributes(
  data: Record<string, unknown> | undefined,
  type: PageDesignerTypeDefinition,
  basePath: string,
  issues: PageValidationIssue[],
): void {
  const values = data ?? {};
  const known = new Set(type.attributes.map((a) => a.id));

  for (const attr of type.attributes) {
    const value = values[attr.id];
    const attrPath = `${basePath}/data/${attr.id}`;
    if (value === undefined || value === null || value === '') {
      if (attr.required) {
        issues.push({
          severity: 'error',
          path: attrPath,
          message: `Required attribute "${attr.id}" of ${type.kind} type "${type.id}" is missing`,
        });
      }
      continue;
    }
    checkAttributeValue(attr, value, attrPath, issues);
  }

  for (const key of Object.keys(values)) {
    if (!known.has(key)) {
      issues.push({
        severity: 'warning',
        path: `${basePath}/data/${key}`,
        message: `Attribute "${key}" is not defined by ${type.kind} type "${type.id}" and will be ignored by the platform`,
      });
    }
  }
}

interface WalkContext {
  catalog: PageDesignerTypeCatalog;
  seenIds: Map<string, string>;
  issues: PageValidationIssue[];
}

function checkRegions(
  regions: ExperienceRegionRequest[] | undefined,
  owner: PageDesignerTypeDefinition,
  basePath: string,
  ctx: WalkContext,
): void {
  if (!regions) return;
  const defs = new Map(owner.regions.map((r) => [r.id, r]));

  for (const [ri, region] of regions.entries()) {
    const regionPath = `${basePath}/regions/${ri}`;
    if (!region || typeof region.id !== 'string' || !region.id) {
      ctx.issues.push({severity: 'error', path: `${regionPath}/id`, message: 'Region "id" is required'});
      continue;
    }
    const def = defs.get(region.id);
    if (!def) {
      const defined = owner.regions.map((r) => r.id).join(', ') || 'none';
      ctx.issues.push({
        severity: 'error',
        path: `${regionPath}/id`,
        message: `Region "${region.id}" is not defined by ${owner.kind} type "${owner.id}" (defined: ${defined})`,
      });
      continue;
    }
    const components = region.components ?? [];
    if (def.maxComponents !== undefined && components.length > def.maxComponents) {
      ctx.issues.push({
        severity: 'warning',
        path: `${regionPath}/components`,
        message: `Region "${region.id}" has ${components.length} components; only ${def.maxComponents} are rendered`,
      });
    }
    for (const [ci, component] of components.entries()) {
      checkComponent(component, def, `${regionPath}/components/${ci}`, ctx);
    }
  }
}

function checkComponent(
  component: ExperienceComponentRequest,
  region: PageDesignerRegionDefinition,
  componentPath: string,
  ctx: WalkContext,
): void {
  const {issues} = ctx;
  if (!component || typeof component.id !== 'string' || !component.id) {
    issues.push({severity: 'error', path: `${componentPath}/id`, message: 'Component "id" is required'});
    return;
  }
  const previous = ctx.seenIds.get(component.id);
  if (previous === undefined) {
    ctx.seenIds.set(component.id, componentPath);
  } else {
    issues.push({
      severity: 'error',
      path: `${componentPath}/id`,
      message: `Component ID "${component.id}" is already used at ${previous || '/'}`,
    });
  }

  const {typeId} = component;
  if (typeof typeId !== 'string' || !typeId) {
    issues.push({severity: 'error', path: `${componentPath}/typeId`, message: 'Component "typeId" is required'});
    return;
  }
  if (typeId.startsWith('component.')) {
    issues.push({
      severity: 'error',
      path: `${componentPath}/typeId`,
      message: `Component typeId "${typeId}" uses the library XML prefix; use "${typeId.slice('component.'.length)}"`,
    });
    return;
  }
  if (region.exclusions.includes(typeId)) {
    issues.push({
      severity: 'error',
      path: `${componentPath}/typeId`,
      message: `Component type "${typeId}" is excluded from region "${region.id}"`,
    });
  }
  if (region.inclusions.length > 0 && !region.inclusions.includes(typeId)) {
    issues.push({
      severity: 'error',
      path: `${componentPath}/typeId`,
      message: `Region "${region.id}" only allows: ${region.inclusions.join(', ')}`,
    });
  }
  const type = ctx.catalog.componentTypes.get(typeId);
  if (!type) {
    issues.push({
      severity: 'error',
      path: `${componentPath}/typeId`,
      message: `Component type "${typeId}" is not defined`,
    });
    return;
  }
  checkAttributes(component.data, type, componentPath, issues);
  checkRegions(component.regions, type, componentPath, ctx);
}

/**
 * Validates a page body against a type catalog.
 *
 * Errors are problems the platform rejects or that leave the page broken
 * (unknown type/region, missing required attribute, wrong value type).
 * Warnings are accepted by the platform but probably unintended (attribute
 * keys the type does not define, more components than a region renders).
 */
export function validatePageRequest(
  page: ExperiencePageRequest,
  catalog: PageDesignerTypeCatalog,
): PageValidationResult {
  const issues: PageValidationIssue[] = [];
  const pageId = typeof page?.id === 'string' ? page.id : '';

  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    issues.push({severity: 'error', path: '', message: 'Page body must be a JSON object'});
  } else {
    if (!pageId) issues.push({severity: 'error', path: '/id', message: 'Page "id" is required'});
    if (typeof page.name !== 'string' || !page.name) {
      issues.push({severity: 'error', path: '/name', message: 'Page "name" is required'});
    }
    if (typeof page.typeId !== 'string' || !page.typeId) {
      issues.push({severity: 'error', path: '/typeId', message: 'Page "typeId" is required'});
    } else if (page.typeId.startsWith('page.')) {
      issues.push({
        severity: 'error',
        path: '/typeId',
        message: `Page typeId "${page.typeId}" uses the library XML prefix; use "${page.typeId.slice('page.'.length)}"`,
      });
    } else {
      const type = catalog.pageTypes.get(page.typeId);
      if (type) {
        checkAttributes(page.data, type, '', issues);
        checkRegions(page.regions, type, '', {catalog, seenIds: new Map(), issues});
      } else {
        const known = [...catalog.pageTypes.keys()].join(', ') || 'none';
        issues.push({
          severity: 'error',
          path: '/typeId',
          message: `Page type "${page.typeId}" is not defined (known: ${known})`,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return {pageId, valid: errors.length === 0, errors, warnings};
}
