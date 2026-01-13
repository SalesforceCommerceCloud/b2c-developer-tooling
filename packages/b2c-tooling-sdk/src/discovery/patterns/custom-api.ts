/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Custom SCAPI project detection pattern.
 *
 * Custom APIs in Salesforce B2C Commerce MUST be organized within custom code
 * cartridges in a `rest-apis` directory structure. This is a required structure -
 * deviating from it will prevent APIs from being discovered/registered by SFCC.
 *
 * Required structure:
 * ```
 * cartridge/
 * └── rest-apis/              ← Required root folder
 *     └── {apiName}/          ← API subdirectory (alphanumeric lowercase + hyphens)
 *         ├── api.json        ← Required: API mapping
 *         ├── schema.yaml     ← Required: OAS 3.0 contract
 *         └── {script}.js     ← Required: Implementation
 * ```
 *
 * @see https://developer.salesforce.com/docs/commerce/commerce-api/guide/custom-apis.html
 * @module discovery/patterns/custom-api
 */
import type {DetectionPattern} from '../types.js';
import {glob} from '../utils.js';

/**
 * Detection pattern for Custom SCAPI projects.
 *
 * Detects projects with the required SFCC Custom API `rest-apis` directory structure.
 * Only looks for files within `rest-apis/` directories since this structure is required.
 */
export const customApiPattern: DetectionPattern = {
  name: 'custom-api',
  projectType: 'custom-api',
  detect: async (workspacePath) => {
    // Look for api.json within required rest-apis directory structure
    // The rest-apis/{apiName}/ structure is REQUIRED by SFCC for Custom APIs
    const hasRestApisApiJson = await glob('**/rest-apis/*/api.json', {cwd: workspacePath});
    if (hasRestApisApiJson.length > 0) return true;

    // Also check for schema.yaml (OpenAPI 3.0 contract) in rest-apis structure
    const hasRestApisSchema = await glob('**/rest-apis/*/schema.yaml', {cwd: workspacePath});
    return hasRestApisSchema.length > 0;
  },
};
