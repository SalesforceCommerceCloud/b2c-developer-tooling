/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Content library operations for B2C Commerce.
 *
 * This module provides functions for exporting, manipulating, and validating
 * Page Designer content libraries and metadefinitions.
 *
 * ## Core Classes
 *
 * - {@link Library} - Parse and manipulate content library trees
 * - {@link LibraryNode} - Individual nodes in the library tree
 *
 * ## Operations
 *
 * - {@link fetchContentLibrary} - Fetch and parse a content library
 * - {@link exportContent} - Export filtered pages with assets to disk
 *
 * ## Validation
 *
 * - {@link validateMetaDefinition} - Validate a parsed JSON object against a metadefinition schema
 * - {@link validateMetaDefinitionFile} - Validate a JSON file against a metadefinition schema
 * - {@link detectMetaDefinitionType} - Auto-detect the schema type from file path or data
 *
 * ## Utilities
 *
 * - {@link extractAssetPaths} - Extract asset paths from component JSON data
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   Library,
 *   fetchContentLibrary,
 *   exportContent,
 *   validateMetaDefinitionFile,
 * } from '@salesforce/b2c-tooling-sdk/operations/content';
 *
 * // Fetch and filter a library
 * const { library } = await fetchContentLibrary(instance, 'SharedLibrary');
 * library.filter(n => n.id === 'homepage');
 *
 * // Or use the high-level export
 * const result = await exportContent(instance, ['homepage'], 'SharedLibrary', './export');
 *
 * // Validate a metadefinition file
 * const validation = validateMetaDefinitionFile('experience/pages/home.json');
 * console.log(validation.valid, validation.errors);
 * ```
 *
 * @module operations/content
 */

export {Library, LibraryNode} from './library.js';

export {extractAssetPaths} from './asset-query.js';

export {fetchContentLibrary, exportContent} from './export.js';

export type {
  ColorizeFn,
  ContentExportOptions,
  ContentExportResult,
  FetchContentLibraryOptions,
  FetchContentLibraryResult,
  FilterCallback,
  LibraryNodeType,
  LibraryParseOptions,
  TraverseCallback,
  TraverseOptions,
  TreeStringOptions,
} from './types.js';

export {
  CONTENT_SCHEMA_TYPES,
  MetaDefinitionDetectionError,
  detectMetaDefinitionType,
  detectTypeFromData,
  detectTypeFromPath,
  validateMetaDefinition,
  validateMetaDefinitionFile,
} from './validate.js';

export type {
  ContentSchemaType,
  MetaDefinitionValidationError,
  MetaDefinitionValidationResult,
  ValidateMetaDefinitionOptions,
} from './validate.js';

export {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  PagePushError,
  fetchExperienceTypes,
  getExperiencesAvailability,
  listComponentTypes,
  listPageTypes,
  pushPage,
} from './experiences.js';

export type {
  ExperienceTypes,
  ExperiencesAvailability,
  ExperiencesUnavailableReason,
  ListExperienceTypesOptions,
  PushPageOptions,
  PushPageResult,
} from './experiences.js';

export {
  catalogFromExperienceTypes,
  catalogFromLocalCartridges,
  mergeTypeCatalogs,
  validatePageRequest,
} from './page-validate.js';

export type {
  PageDesignerAttributeDefinition,
  PageDesignerRegionDefinition,
  PageDesignerTypeCatalog,
  PageDesignerTypeDefinition,
  PageValidationIssue,
  PageValidationResult,
} from './page-validate.js';

export {libraryPageToPageRequest, toExperienceTypeId} from './page-convert.js';

export type {
  ExperienceComponentRequest,
  ExperienceComponentType,
  ExperiencePage,
  ExperiencePageRequest,
  ExperiencePageType,
  ExperienceRegionRequest,
} from '../../clients/scapi-experiences.js';

export {
  deleteSlotConfiguration,
  getSlot,
  getSlotConfiguration,
  putSlotConfiguration,
  searchSlotConfigurations,
  searchSlots,
  toWireSlotContentType,
  updateSlotConfiguration,
} from './slots.js';

export type {
  PutSlotConfigurationResult,
  SearchSlotConfigurationsOptions,
  SearchSlotsOptions,
  SlotConfigurationInput,
  SlotContentType,
  SlotContextType,
  SlotSearchResult,
  SlotSiteOptions,
} from './slots.js';
