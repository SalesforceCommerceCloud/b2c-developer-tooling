/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * XML Schema validation for B2C Commerce import files.
 *
 * Validates site import and export XML (catalogs, price books, inventory, site archives, and so on) against the
 * bundled B2C Commerce XSDs, choosing the schema from the root element namespace. Validation uses libxml2
 * compiled to WebAssembly and built from source in this repository (`wasm/xml-validator/`); it runs in
 * memory, never loads external entities or DTDs, and makes no network requests.
 *
 * ```typescript
 * import {collectXmlFiles, validateXmlFiles} from '@salesforce/b2c-tooling-sdk/xml-validation';
 *
 * const {files, explicitFiles} = await collectXmlFiles(['./site_template']);
 * const summary = await validateXmlFiles(files, {explicitFiles});
 * for (const result of summary.results.filter((r) => r.status === 'fail')) {
 *   console.log(result.filePath, result.errors[0]?.message ?? result.reason);
 * }
 * ```
 *
 * @module xml-validation
 */

export type {
  CollectedXmlFiles,
  CollectXmlFilesOptions,
  ValidateXmlFilesOptions,
  ValidateXmlOptions,
  XmlDiagnostic,
  XmlDiagnosticSeverity,
  XmlValidationResult,
  XmlValidationStatus,
  XmlValidationSummary,
} from './types.js';

export {collectXmlFiles, validateXmlContent, validateXmlFile, validateXmlFiles} from './validate.js';
export {findBundledXmlSchema, getBundledXmlSchemas, readRootElement, resolveXmlSchema} from './schemas.js';
export type {BundledXmlSchema, XmlRootElement} from './schemas.js';
export {XmlSchemaLoadError} from './engine.js';
