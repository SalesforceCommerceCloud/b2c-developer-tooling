/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createDocsListTool} from './docs-list.js';
import {createDocsReadTool} from './docs-read.js';
import {createDocsSchemaListTool} from './docs-schema-list.js';
import {createDocsSchemaReadTool} from './docs-schema-read.js';
import {createDocsSchemaSearchTool} from './docs-schema-search.js';
import {createDocsSearchTool} from './docs-search.js';

export function createDocsTools(loadServices: () => Promise<Services> | Services): McpTool[] {
  return [
    createDocsSearchTool(loadServices),
    createDocsReadTool(loadServices),
    createDocsListTool(loadServices),
    createDocsSchemaSearchTool(loadServices),
    createDocsSchemaReadTool(loadServices),
    createDocsSchemaListTool(loadServices),
  ];
}
