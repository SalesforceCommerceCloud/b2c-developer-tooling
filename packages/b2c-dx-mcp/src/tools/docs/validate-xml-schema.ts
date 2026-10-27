/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {z} from 'zod';
import {
  collectXmlFiles,
  validateXmlContent,
  validateXmlFiles,
  type XmlDiagnostic,
  type XmlValidationResult,
} from '@salesforce/b2c-tooling-sdk/xml-validation';
import {TOOLSETS} from '../../utils/constants.js';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

/** Files with problems included in the result; the counts cover every file. */
const MAX_REPORTED_FILES = 50;
const MAX_ERRORS_PER_FILE = 20;
const MAX_MESSAGE_LENGTH = 500;
/** Files validated per call; the rest are counted in `notValidated`. */
const MAX_VALIDATED_FILES = 2000;
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;

interface ValidateInput {
  content?: string;
  exclude?: string[];
  paths?: string[];
  projectDirectory?: string;
  schema?: string;
}

interface ReportedFile {
  errorCount: number;
  errors: Array<Pick<XmlDiagnostic, 'column' | 'line' | 'message'>>;
  file: string;
  reason?: string;
  schema?: string;
  status: 'fail' | 'skip';
  /** True when the validator stopped collecting errors for this file. */
  truncated?: boolean;
}

interface ValidateOutput {
  failedFiles: number;
  files: ReportedFile[];
  /** Present when more files had problems than are listed. */
  moreFiles?: number;
  /** Present when more files matched than one call validates; narrow paths to check them. */
  notValidated?: number;
  skippedFiles: number;
  totalFiles: number;
  unmatched?: string[];
  valid: boolean;
  validFiles: number;
}

function report(result: XmlValidationResult, root: string): ReportedFile {
  const file = result.filePath === '<content>' ? result.filePath : path.relative(root, result.filePath);
  return {
    file,
    status: result.status as 'fail' | 'skip',
    ...(result.schema ? {schema: result.schema} : {}),
    ...(result.reason ? {reason: result.reason} : {}),
    errorCount: result.errors.length,
    errors: result.errors.slice(0, MAX_ERRORS_PER_FILE).map(({column, line, message}) => ({
      line,
      column,
      message: message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message,
    })),
    ...(result.truncated ? {truncated: true} : {}),
  };
}

export function createValidateXmlSchemaTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ValidateInput, ValidateOutput>(
    {
      name: 'validate_xml_schema',
      effect: 'read',
      idempotent: true,
      openWorld: false,
      description:
        'Validate B2C Commerce import/export XML (catalogs, price books, inventory, site archives, and more) against ' +
        'the bundled XSDs that docs_schema_read serves. The schema is chosen from each root element namespace. ' +
        'Checks local files on the MCP host or inline content, offline; returns line-numbered errors.',
      toolsets: [...TOOLSETS],
      usesProjectContext: true,
      inputSchema: {
        paths: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .optional()
          .describe(
            'XML files, directories (searched for *.xml), or globs, relative to projectDirectory. Exactly one of paths, content.',
          ),
        content: z.string().min(1).max(MAX_CONTENT_LENGTH).optional().describe('An XML document to validate.'),
        schema: z
          .string()
          .min(1)
          .optional()
          .describe(
            'Bundled schema ID (docs_schema_list) or .xsd path to use for every document instead of namespace detection.',
          ),
        exclude: z.array(z.string().min(1)).max(50).optional().describe('Globs to skip when expanding paths.'),
      },
      async execute(args, context) {
        if ((args.paths === undefined) === (args.content === undefined)) {
          throw new Error('Supply exactly one of paths, content.');
        }
        const root = context.services.resolveProjectDirectory(args.projectDirectory).path;
        const options = {cwd: root, schema: args.schema};

        let results: XmlValidationResult[];
        let unmatched: string[] = [];
        let notValidated = 0;
        if (args.content === undefined) {
          const collected = await collectXmlFiles(args.paths!, {cwd: root, exclude: args.exclude});
          unmatched = collected.unmatched;
          if (collected.files.length === 0) throw new Error(`No XML files found for: ${args.paths!.join(', ')}`);
          notValidated = Math.max(0, collected.files.length - MAX_VALIDATED_FILES);
          const files = collected.files.slice(0, MAX_VALIDATED_FILES);
          results = (await validateXmlFiles(files, {...options, explicitFiles: collected.explicitFiles})).results;
        } else {
          results = [await validateXmlContent(args.content, options)];
        }

        const problems = results.filter((r) => r.status !== 'pass');
        const failedFiles = results.filter((r) => r.status === 'fail').length;
        return {
          valid: failedFiles === 0,
          totalFiles: results.length,
          validFiles: results.length - problems.length,
          failedFiles,
          skippedFiles: problems.length - failedFiles,
          // Failures first, so the cap never hides one behind skipped files.
          files: problems
            .sort((a, b) => Number(a.status === 'skip') - Number(b.status === 'skip'))
            .slice(0, MAX_REPORTED_FILES)
            .map((r) => report(r, root)),
          ...(problems.length > MAX_REPORTED_FILES ? {moreFiles: problems.length - MAX_REPORTED_FILES} : {}),
          ...(notValidated > 0 ? {notValidated} : {}),
          ...(unmatched.length > 0 ? {unmatched} : {}),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
