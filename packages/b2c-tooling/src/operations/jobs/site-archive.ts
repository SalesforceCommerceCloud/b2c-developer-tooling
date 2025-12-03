/**
 * Site archive import/export operations for B2C Commerce.
 *
 * Provides functions for importing and exporting site archives using
 * the sfcc-site-archive-import and sfcc-site-archive-export system jobs.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {
  executeJob,
  waitForJob,
  JobExecutionError,
  getJobLog,
  type JobExecution,
  type WaitForJobOptions,
} from './run.js';

const IMPORT_JOB_ID = 'sfcc-site-archive-import';
const EXPORT_JOB_ID = 'sfcc-site-archive-export';

/**
 * Options for site archive import.
 */
export interface SiteArchiveImportOptions {
  /** Keep archive on instance after import (default: false) */
  keepArchive?: boolean;
  /** Wait options for job completion */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of a site archive import.
 */
export interface SiteArchiveImportResult {
  /** Job execution details */
  execution: JobExecution;
  /** Archive filename on instance */
  archiveFilename: string;
  /** Whether archive was kept on instance */
  archiveKept: boolean;
}

/**
 * Imports a site archive to a B2C Commerce instance.
 *
 * Supports importing from:
 * - A local directory (will be zipped automatically)
 * - A local zip file
 * - A Buffer containing zip data
 * - A filename already on the instance (in Impex/src/instance/)
 *
 * @param instance - B2C instance to import to
 * @param target - Source to import (directory path, zip file path, Buffer, or remote filename)
 * @param options - Import options
 * @returns Import result with execution details
 * @throws JobExecutionError if import job fails
 *
 * @example
 * ```typescript
 * // Import from a local directory
 * const result = await siteArchiveImport(instance, './my-site-data');
 *
 * // Import from a zip file
 * const result = await siteArchiveImport(instance, './export.zip');
 *
 * // Import from a buffer
 * const zipBuffer = await fs.promises.readFile('./export.zip');
 * const result = await siteArchiveImport(instance, zipBuffer, {
 *   archiveName: 'my-import'
 * });
 *
 * // Import from existing file on instance
 * const result = await siteArchiveImport(instance, {
 *   remoteFilename: 'existing-archive.zip'
 * });
 * ```
 */
export async function siteArchiveImport(
  instance: B2CInstance,
  target: string | Buffer | {remoteFilename: string; archiveName?: string},
  options: SiteArchiveImportOptions & {archiveName?: string} = {},
): Promise<SiteArchiveImportResult> {
  const logger = getLogger();
  const {keepArchive = false, waitOptions, archiveName} = options;

  let zipFilename: string;
  let needsUpload = true;
  let archiveContent: Buffer | NodeJS.ReadableStream | undefined;

  // Handle different input types
  if (typeof target === 'object' && 'remoteFilename' in target) {
    // Remote filename - no upload needed
    zipFilename = target.remoteFilename;
    needsUpload = false;
  } else if (Buffer.isBuffer(target)) {
    // Buffer - use provided archive name
    if (!archiveName) {
      throw new Error('archiveName is required when importing from a Buffer');
    }
    zipFilename = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;
    archiveContent = target;
  } else {
    // File path - check if directory or zip file
    const targetPath = target as string;

    if (!fs.existsSync(targetPath)) {
      throw new Error(`Target not found: ${targetPath}`);
    }

    const stat = await fs.promises.stat(targetPath);

    if (stat.isFile()) {
      // Existing zip file
      archiveContent = await fs.promises.readFile(targetPath);
      zipFilename = path.basename(targetPath);
    } else if (stat.isDirectory()) {
      // Directory - create zip archive
      const timestamp = Date.now();
      const archiveDirName = archiveName || `import-${timestamp}`;
      zipFilename = `${archiveDirName}.zip`;

      logger.debug({directory: targetPath}, `Creating archive from directory: ${targetPath}`);
      archiveContent = await createArchiveFromDirectory(targetPath, archiveDirName);
    } else {
      throw new Error(`Target must be a file or directory: ${targetPath}`);
    }
  }

  // Upload archive if needed
  const uploadPath = `Impex/src/instance/${zipFilename}`;

  if (needsUpload && archiveContent) {
    logger.debug({path: uploadPath}, `Uploading archive to ${uploadPath}`);
    await instance.webdav.put(uploadPath, archiveContent as Buffer, 'application/zip');
    logger.debug(`Archive uploaded: ${uploadPath}`);
  }

  // Execute the import job
  logger.debug(`Executing ${IMPORT_JOB_ID} job`);

  let execution: JobExecution;
  try {
    // Try the standard form first (external users)
    execution = await executeJob(instance, IMPORT_JOB_ID, {
      parameters: [],
      waitForRunning: true,
    });

    // The job needs the file_name - try with parameters form
    // Different SFCC versions accept different formats
  } catch (error) {
    // If we get UnknownPropertyException, try the parameters format
    if (error instanceof Error && error.message.includes('UnknownPropertyException')) {
      logger.warn('Using parameters format for import job');
    }
    throw error;
  }

  // Execute with the correct format - try file_name first, then parameters
  try {
    const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: IMPORT_JOB_ID}},
      body: {file_name: zipFilename} as unknown as string,
    });

    if (error || !data) {
      throw new Error(error?.fault?.message ?? 'Failed to execute import job');
    }

    execution = data;
  } catch {
    // Try with parameters format for internal users
    logger.warn('Retrying with parameters format for internal users');

    const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: IMPORT_JOB_ID}},
      body: {
        parameters: [{name: 'ImportFile', value: zipFilename}],
      } as unknown as string,
    });

    if (error || !data) {
      throw new Error(error?.fault?.message ?? 'Failed to execute import job');
    }

    execution = data;
  }

  logger.debug({executionId: execution.id}, `Import job started: ${execution.id}`);

  // Wait for completion
  try {
    execution = await waitForJob(instance, IMPORT_JOB_ID, execution.id!, waitOptions);
  } catch (error) {
    if (error instanceof JobExecutionError) {
      // Try to get log file
      try {
        const log = await getJobLog(instance, error.execution);
        logger.error({logFile: error.execution.log_file_path}, `Job log:\n${log}`);
      } catch {
        logger.error('Could not retrieve job log');
      }
    }
    throw error;
  }

  // Clean up archive if not keeping
  if (!keepArchive && needsUpload) {
    await instance.webdav.delete(uploadPath);
    logger.debug(`Archive deleted: ${uploadPath}`);
  }

  return {
    execution,
    archiveFilename: zipFilename,
    archiveKept: keepArchive,
  };
}

/**
 * Creates a zip archive from a directory.
 */
async function createArchiveFromDirectory(dirPath: string, archiveDirName: string): Promise<Buffer> {
  const zip = new JSZip();
  const rootFolder = zip.folder(archiveDirName)!;

  await addDirectoryToZip(rootFolder, dirPath);

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
  });
}

/**
 * Recursively adds directory contents to a JSZip folder.
 */
async function addDirectoryToZip(zipFolder: JSZip, dirPath: string): Promise<void> {
  const entries = await fs.promises.readdir(dirPath, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subFolder = zipFolder.folder(entry.name)!;
      await addDirectoryToZip(subFolder, fullPath);
    } else if (entry.isFile()) {
      const content = await fs.promises.readFile(fullPath);
      zipFolder.file(entry.name, content);
    }
  }
}

/**
 * Configuration for sites in export.
 */
export interface ExportSitesConfiguration {
  ab_tests?: boolean;
  active_data_feeds?: boolean;
  all?: boolean;
  cache_settings?: boolean;
  campaigns_and_promotions?: boolean;
  content?: boolean;
  coupons?: boolean;
  custom_objects?: boolean;
  customer_cdn_settings?: boolean;
  customer_groups?: boolean;
  distributed_commerce_extensions?: boolean;
  dynamic_file_resources?: boolean;
  gift_certificates?: boolean;
  ocapi_settings?: boolean;
  payment_methods?: boolean;
  payment_processors?: boolean;
  redirect_urls?: boolean;
  search_settings?: boolean;
  shipping?: boolean;
  site_descriptor?: boolean;
  site_preferences?: boolean;
  sitemap_settings?: boolean;
  slots?: boolean;
  sorting_rules?: boolean;
  source_codes?: boolean;
  static_dynamic_alias_mappings?: boolean;
  stores?: boolean;
  tax?: boolean;
  url_rules?: boolean;
}

/**
 * Configuration for global data in export.
 */
export interface ExportGlobalDataConfiguration {
  access_roles?: boolean;
  all?: boolean;
  csc_settings?: boolean;
  csrf_whitelists?: boolean;
  custom_preference_groups?: boolean;
  custom_quota_settings?: boolean;
  custom_types?: boolean;
  geolocations?: boolean;
  global_custom_objects?: boolean;
  job_schedules?: boolean;
  job_schedules_deprecated?: boolean;
  locales?: boolean;
  meta_data?: boolean;
  oauth_providers?: boolean;
  ocapi_settings?: boolean;
  page_meta_tags?: boolean;
  preferences?: boolean;
  price_adjustment_limits?: boolean;
  services?: boolean;
  sorting_rules?: boolean;
  static_resources?: boolean;
  system_type_definitions?: boolean;
  users?: boolean;
  webdav_client_permissions?: boolean;
}

/**
 * Data units configuration for export.
 */
export interface ExportDataUnitsConfiguration {
  /** Catalog static resources to export (catalog_id: true) */
  catalog_static_resources?: Record<string, boolean>;
  /** Catalogs to export (catalog_id: true) */
  catalogs?: Record<string, boolean>;
  /** Customer lists to export (list_id: true) */
  customer_lists?: Record<string, boolean>;
  /** Inventory lists to export (list_id: true) */
  inventory_lists?: Record<string, boolean>;
  /** Library static resources to export (library_id: true) */
  library_static_resources?: Record<string, boolean>;
  /** Libraries to export (library_id: true) */
  libraries?: Record<string, boolean>;
  /** Price books to export (pricebook_id: true) */
  price_books?: Record<string, boolean>;
  /** Sites to export (site_id: ExportSitesConfiguration) */
  sites?: Record<string, Partial<ExportSitesConfiguration> | boolean>;
  /** Global data to export */
  global_data?: Partial<ExportGlobalDataConfiguration>;
}

/**
 * Options for site archive export.
 */
export interface SiteArchiveExportOptions {
  /** Keep archive on instance after download (default: false) */
  keepArchive?: boolean;
  /** Wait options for job completion */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of a site archive export.
 */
export interface SiteArchiveExportResult {
  /** Job execution details */
  execution: JobExecution;
  /** Archive filename on instance */
  archiveFilename: string;
  /** Archive content as buffer (if downloaded) */
  data?: Buffer;
  /** Whether archive was kept on instance */
  archiveKept: boolean;
}

/**
 * Exports a site archive from a B2C Commerce instance.
 *
 * @param instance - B2C instance to export from
 * @param dataUnits - Data units configuration specifying what to export
 * @param options - Export options
 * @returns Export result with archive data
 * @throws JobExecutionError if export job fails
 *
 * @example
 * ```typescript
 * // Export global meta data
 * const result = await siteArchiveExport(instance, {
 *   global_data: { meta_data: true }
 * });
 *
 * // Export a site's content
 * const result = await siteArchiveExport(instance, {
 *   sites: {
 *     'RefArch': { content: true, site_preferences: true }
 *   }
 * });
 *
 * // Export catalogs
 * const result = await siteArchiveExport(instance, {
 *   catalogs: { 'storefront-catalog': true }
 * });
 * ```
 */
export async function siteArchiveExport(
  instance: B2CInstance,
  dataUnits: Partial<ExportDataUnitsConfiguration>,
  options: SiteArchiveExportOptions = {},
): Promise<SiteArchiveExportResult> {
  const logger = getLogger();
  const {keepArchive = false, waitOptions} = options;

  // Generate archive filename
  const timestamp = new Date().toISOString().replace(/[:.-]+/g, '');
  const archiveDirName = `${timestamp}_export`;
  const zipFilename = `${archiveDirName}.zip`;
  const webdavPath = `Impex/src/instance/${zipFilename}`;

  logger.debug(`Executing ${EXPORT_JOB_ID} job`);
  logger.debug({dataUnits}, 'Export data units');

  let execution: JobExecution;

  // Execute export job - try export_file format first
  try {
    const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: EXPORT_JOB_ID}},
      body: {
        export_file: zipFilename,
        data_units: dataUnits,
      } as unknown as string,
    });

    if (error || !data) {
      throw new Error(error?.fault?.message ?? 'Failed to execute export job');
    }

    execution = data;
  } catch {
    // Try parameters format for internal users
    logger.warn('Retrying with parameters format for internal users');

    const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: EXPORT_JOB_ID}},
      body: {
        parameters: [
          {name: 'ExportFile', value: zipFilename},
          {name: 'DataUnits', value: JSON.stringify(dataUnits)},
        ],
      } as unknown as string,
    });

    if (error || !data) {
      throw new Error(error?.fault?.message ?? 'Failed to execute export job');
    }

    execution = data;
  }

  logger.debug({executionId: execution.id}, `Export job started: ${execution.id}`);

  // Wait for completion
  try {
    execution = await waitForJob(instance, EXPORT_JOB_ID, execution.id!, waitOptions);
  } catch (error) {
    if (error instanceof JobExecutionError) {
      // Try to get log file
      try {
        const log = await getJobLog(instance, error.execution);
        logger.error({logFile: error.execution.log_file_path}, `Job log:\n${log}`);
      } catch {
        logger.error('Could not retrieve job log');
      }
    }
    throw error;
  }

  // Download archive
  logger.debug(`Downloading archive: ${webdavPath}`);
  const archiveData = await instance.webdav.get(webdavPath);

  // Clean up if not keeping
  if (!keepArchive) {
    await instance.webdav.delete(webdavPath);
    logger.debug(`Archive deleted: ${webdavPath}`);
  }

  return {
    execution,
    archiveFilename: zipFilename,
    data: Buffer.from(archiveData),
    archiveKept: keepArchive,
  };
}

/**
 * Exports a site archive and saves it to a local path.
 *
 * @param instance - B2C instance to export from
 * @param dataUnits - Data units configuration
 * @param outputPath - Local path to save the archive
 * @param options - Export options
 * @returns Export result
 *
 * @example
 * ```typescript
 * // Export and save to a directory (extracts zip)
 * await siteArchiveExportToPath(instance, { global_data: { meta_data: true } }, './exports');
 *
 * // Export and save as zip
 * await siteArchiveExportToPath(instance, { global_data: { meta_data: true } }, './exports/archive.zip');
 * ```
 */
export async function siteArchiveExportToPath(
  instance: B2CInstance,
  dataUnits: Partial<ExportDataUnitsConfiguration>,
  outputPath: string,
  options: SiteArchiveExportOptions & {extractZip?: boolean} = {},
): Promise<SiteArchiveExportResult & {localPath: string}> {
  const logger = getLogger();
  const {extractZip = true, ...exportOptions} = options;

  const result = await siteArchiveExport(instance, dataUnits, exportOptions);

  if (!result.data) {
    throw new Error('No archive data returned');
  }

  // Determine output handling
  const isZipPath = outputPath.endsWith('.zip');

  if (isZipPath || !extractZip) {
    // Save as zip file
    const zipPath = isZipPath ? outputPath : path.join(outputPath, result.archiveFilename);

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(zipPath), {recursive: true});
    await fs.promises.writeFile(zipPath, result.data);

    logger.debug(`Archive saved to: ${zipPath}`);

    return {
      ...result,
      localPath: zipPath,
    };
  } else {
    // Extract to directory
    await fs.promises.mkdir(outputPath, {recursive: true});

    const zip = await JSZip.loadAsync(result.data);

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      const fullPath = path.join(outputPath, relativePath);

      if (zipEntry.dir) {
        await fs.promises.mkdir(fullPath, {recursive: true});
      } else {
        // Ensure parent directory exists
        await fs.promises.mkdir(path.dirname(fullPath), {recursive: true});
        const content = await zipEntry.async('nodebuffer');
        await fs.promises.writeFile(fullPath, content);
      }
    }

    logger.debug(`Archive extracted to: ${outputPath}`);

    return {
      ...result,
      localPath: outputPath,
    };
  }
}
