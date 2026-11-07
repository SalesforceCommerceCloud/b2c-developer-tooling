/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Import site archive files supplied as text, for hosts without a local
 * archive folder (agent tools, desktop apps).
 */
import JSZip from 'jszip';
import type {B2CInstance} from '../../instance/index.js';
import {validateXmlContent} from '../../xml-validation/validate.js';
import type {XmlValidationResult} from '../../xml-validation/types.js';
import {JobExecutionError, type JobExecution, type WaitForJobOptions} from './run.js';
import {siteArchiveImport} from './site-archive.js';

/** Most files accepted by {@link importSiteArchiveFiles}. */
export const SITE_ARCHIVE_FILES_MAX = 50;
/** Most bytes, across all files, accepted by {@link importSiteArchiveFiles}. */
export const SITE_ARCHIVE_FILES_MAX_BYTES = 10 * 1024 * 1024;

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** One file in the archive, relative to its root (e.g. `sites/RefArch/promotions.xml`). */
export interface SiteArchiveFile {
  path: string;
  content: string;
}

export interface ImportSiteArchiveFilesOptions {
  /**
   * Archive name, used for the zip in `Impex/src/instance/`. Letters, digits,
   * `.`, `_` and `-`. Default: `import-<timestamp>`.
   */
  archiveName?: string;
  /** Validate and report only; nothing is uploaded or imported. Default `false`. */
  dryRun?: boolean;
  /** Keep the zip on the instance after the import. Default `false`. */
  keepArchive?: boolean;
  waitOptions?: WaitForJobOptions;
}

/** Validation outcome for one file. `skip` means no bundled schema applies; the file is still imported. */
export interface SiteArchiveFileCheck {
  path: string;
  status: XmlValidationResult['status'];
  schema?: string;
  reason?: string;
  errors: Array<{line: number; column?: number; message: string}>;
}

export interface ImportSiteArchiveFilesResult {
  /**
   * `invalid`: a file failed validation, nothing was uploaded.
   * `validated`: dry run passed. `imported`: the job finished OK.
   * `failed`: the job ran and failed; read the log at `execution.logFilePath`.
   */
  outcome: 'failed' | 'imported' | 'invalid' | 'validated';
  files: SiteArchiveFileCheck[];
  archiveName?: string;
  execution?: {
    id?: string;
    status?: string;
    exitStatus?: string;
    exitMessage?: string;
    logFilePath?: string;
  };
}

/** Thrown for a request that can never succeed (bad paths, too many files); fix the input before retrying. */
export class SiteArchiveFilesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiteArchiveFilesError';
  }
}

/**
 * Check archive file paths and sizes. Paths are relative to the archive root,
 * use `/`, and contain only letters, digits, `.`, `_` and `-` per segment.
 *
 * @throws SiteArchiveFilesError
 */
export function checkSiteArchiveFiles(files: readonly SiteArchiveFile[]): void {
  if (files.length === 0) throw new SiteArchiveFilesError('Supply at least one file.');
  if (files.length > SITE_ARCHIVE_FILES_MAX)
    throw new SiteArchiveFilesError(`At most ${SITE_ARCHIVE_FILES_MAX} files per import.`);
  const seen = new Set<string>();
  let bytes = 0;
  for (const file of files) {
    const segments = file.path.split('/');
    if (segments.length < 2 || !segments.every((segment) => SEGMENT.test(segment) && segment !== '..'))
      throw new SiteArchiveFilesError(
        `Invalid archive path "${file.path}". Use a path under the archive root, e.g. sites/RefArch/promotions.xml.`,
      );
    const key = file.path.toLowerCase();
    if (seen.has(key)) throw new SiteArchiveFilesError(`Duplicate archive path "${file.path}".`);
    seen.add(key);
    bytes += Buffer.byteLength(file.content);
  }
  if (bytes > SITE_ARCHIVE_FILES_MAX_BYTES)
    throw new SiteArchiveFilesError(`Files exceed ${SITE_ARCHIVE_FILES_MAX_BYTES} bytes in total.`);
}

function check(path: string, result: XmlValidationResult): SiteArchiveFileCheck {
  return {
    path,
    status: result.status,
    ...(result.schema ? {schema: result.schema} : {}),
    ...(result.reason ? {reason: result.reason} : {}),
    errors: result.errors
      .slice(0, 20)
      .map(({line, column, message}) => ({line, ...(column ? {column} : {}), message: message.slice(0, 500)})),
  };
}

function summarize(execution: JobExecution): NonNullable<ImportSiteArchiveFilesResult['execution']> {
  return {
    id: execution.id,
    status: execution.execution_status,
    exitStatus: execution.exit_status?.code,
    exitMessage: execution.exit_status?.message,
    logFilePath: execution.log_file_path,
  };
}

/**
 * Validate site archive files given as text, then zip and import them with
 * the `sfcc-site-archive-import` job. Nothing is uploaded unless every XML file
 * passes validation (files with no bundled schema are skipped, not failed).
 * Files that are not XML are imported without validation.
 *
 * Import merges by default: a file that carries only some elements (for
 * example a promotion's discount rule) updates those and keeps the rest.
 *
 * @throws SiteArchiveFilesError for invalid paths, duplicates or size limits
 *
 * @example
 * ```typescript
 * const result = await importSiteArchiveFiles(instance, [
 *   {path: 'sites/RefArch/promotions.xml', content: promotionsXml},
 * ]);
 * if (result.outcome !== 'imported') console.log(result.files, result.execution);
 * ```
 */
export async function importSiteArchiveFiles(
  instance: B2CInstance,
  files: readonly SiteArchiveFile[],
  options: ImportSiteArchiveFilesOptions = {},
): Promise<ImportSiteArchiveFilesResult> {
  checkSiteArchiveFiles(files);
  const archiveName = options.archiveName ?? `import-${Date.now()}`;
  if (!SEGMENT.test(archiveName))
    throw new SiteArchiveFilesError('archiveName may contain only letters, digits, ".", "_" and "-".');

  const checks: SiteArchiveFileCheck[] = [];
  for (const file of files) {
    if (!file.path.toLowerCase().endsWith('.xml')) {
      checks.push({path: file.path, status: 'skip', reason: 'Not an XML file', errors: []});
      continue;
    }

    checks.push(check(file.path, await validateXmlContent(file.content, {}, {explicit: false, filePath: file.path})));
  }
  if (checks.some((entry) => entry.status === 'fail')) return {outcome: 'invalid', files: checks};
  if (options.dryRun) return {outcome: 'validated', files: checks};

  const zip = new JSZip();
  const root = zip.folder(archiveName)!;
  for (const file of files) root.file(file.path, file.content);
  const buffer = await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'});

  try {
    const {execution} = await siteArchiveImport(instance, buffer, {
      archiveName,
      keepArchive: options.keepArchive,
      waitOptions: options.waitOptions,
    });
    return {outcome: 'imported', files: checks, archiveName, execution: summarize(execution)};
  } catch (error) {
    if (error instanceof JobExecutionError)
      return {outcome: 'failed', files: checks, archiveName, execution: summarize(error.execution)};
    throw error;
  }
}
