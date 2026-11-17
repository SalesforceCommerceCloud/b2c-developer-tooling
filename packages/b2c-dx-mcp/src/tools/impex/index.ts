/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {
  importSiteArchiveFiles,
  SITE_ARCHIVE_FILES_MAX,
  SITE_ARCHIVE_FILES_MAX_BYTES,
  type ImportSiteArchiveFilesResult,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import type {McpTool} from '../../utils/index.js';
import {createToolAdapter, jsonResult, type ServicesLoader} from '../adapter.js';

export const SITE_IMPORT_SKILL_URI = 'skill://mcp/b2c-mcp-site-import/SKILL.md';
const SITE_IMPORT_SKILL_REQUIRED = `SITE_IMPORT_SKILL_REQUIRED: Read ${SITE_IMPORT_SKILL_URI} through resources or skills_read, then retry with skillRead: true.`;

interface SiteArchiveImportInput {
  files: Array<{path: string; content: string}>;
  skillRead: true;
  dryRun?: boolean;
  archiveName?: string;
}

export interface SiteArchiveImportInjections {
  importSiteArchiveFiles?: typeof importSiteArchiveFiles;
}

export function createSiteArchiveImportTool(
  loadServices: ServicesLoader,
  injections: SiteArchiveImportInjections = {},
): McpTool {
  const run = injections.importSiteArchiveFiles ?? importSiteArchiveFiles;
  return createToolAdapter<SiteArchiveImportInput, ImportSiteArchiveFilesResult>(
    {
      name: 'site_archive_import',
      searchHint: 'impex write merge discount rule promotion',
      effect: 'destructive',
      idempotent: false,
      openWorld: true,
      description: `Read ${SITE_IMPORT_SKILL_URI} first. Writes merchandising data that has no SCAPI write (e.g. promotion discount rules) as XML: validates every file against its schema (no separate validate_xml_schema call needed), then runs the archive job. Nothing is uploaded if a file fails. Merges into existing data.`,
      toolsets: ['SCAPI'],
      requiresInstance: true,
      inputSchema: {
        files: z
          .array(
            z
              .object({
                path: z.string().min(1).max(512).describe('Path in the archive, e.g. sites/RefArch/promotions.xml.'),
                content: z.string().min(1).describe('File text.'),
              })
              .strict(),
          )
          .min(1)
          .max(SITE_ARCHIVE_FILES_MAX)
          .describe(`Archive files; ${SITE_ARCHIVE_FILES_MAX_BYTES / 1024 / 1024} MiB total.`),
        skillRead: z
          .literal(true, {error: SITE_IMPORT_SKILL_REQUIRED})
          .describe('Set true only after reading the site import skill (MCP resource or skills_read({uri})).'),
        dryRun: z
          .boolean()
          .optional()
          .describe('Validate only, without uploading or importing. Every call validates. Default false.'),
        archiveName: z
          .string()
          .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/)
          .optional()
          .describe('Archive name on the instance. Default import-<timestamp>.'),
      },
      async execute(args, context) {
        if (args.skillRead !== true) throw new Error(SITE_IMPORT_SKILL_REQUIRED);
        return run(context.b2cInstance!, args.files, {dryRun: args.dryRun, archiveName: args.archiveName});
      },
      formatOutput: jsonResult,
    },
    loadServices,
  );
}
