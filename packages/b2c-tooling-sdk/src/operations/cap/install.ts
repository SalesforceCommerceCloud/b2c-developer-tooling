/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Commerce App Package (CAP) installation.
 *
 * Uploads a CAP to WebDAV and runs the sfcc-install-commerce-app system job.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {JobExecutionError, getJobLog, type JobExecution, type WaitForJobOptions} from '../jobs/run.js';
import {runSystemJob} from '../jobs/run-system-job.js';
import {addDirectoryToZip} from '../util/zip.js';
import {type CommerceAppManifest} from './validate.js';

const INSTALL_JOB_ID = 'sfcc-install-commerce-app';

/**
 * Options for CAP installation.
 */
export interface CommerceAppInstallOptions {
  /** Target site ID to install the app on. */
  siteId: string;
  /** Keep the uploaded zip on the instance after install (default: false). */
  keepArchive?: boolean;
  /**
   * Create a pull request against the connected Storefront Next repository
   * when the app includes storefront content (default: false).
   */
  shouldCreatePr?: boolean;
  /** Wait options for job completion. */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of a CAP installation.
 */
export interface CommerceAppInstallResult {
  /** Job execution details. */
  execution: JobExecution;
  /** App name (id from commerce-app.json). */
  appName: string;
  /** App version. */
  appVersion: string;
  /** Uploaded archive filename. */
  archiveFilename: string;
  /** Whether the archive was kept on the instance. */
  archiveKept: boolean;
}

/**
 * Installs a Commerce App Package (CAP) on a B2C Commerce instance.
 *
 * Accepts a local directory or zip file. Reads the commerce-app.json manifest
 * to determine app name, version, and domain. Uploads the zip to WebDAV and
 * executes the sfcc-install-commerce-app system job.
 *
 * @param instance - B2C instance to install to
 * @param target - Path to a CAP directory or .zip file
 * @param options - Install options including required siteId
 * @returns Install result with job execution details
 * @throws JobExecutionError if the install job fails
 *
 * @example
 * ```typescript
 * const result = await commerceAppInstall(instance, './commerce-avalara-tax-app-v0.2.5', {
 *   siteId: 'RefArch',
 * });
 * ```
 */
export async function commerceAppInstall(
  instance: B2CInstance,
  target: string,
  options: CommerceAppInstallOptions,
): Promise<CommerceAppInstallResult> {
  const logger = getLogger();
  const {siteId: rawSiteId, keepArchive = false, shouldCreatePr = false, waitOptions} = options;
  const siteId = normalizeSiteId(rawSiteId);

  if (!fs.existsSync(target)) {
    throw new Error(`Target not found: ${target}`);
  }

  const stat = fs.statSync(target);
  let archiveContent: Buffer;
  let archiveFilename: string;
  let manifest: CommerceAppManifest;

  if (stat.isDirectory()) {
    manifest = readManifest(target);
    archiveFilename = `${manifest.id}-v${manifest.version}.zip`;
    logger.debug({path: target}, `Packaging CAP directory: ${target}`);
    archiveContent = await createArchiveFromDirectory(target, `${manifest.id}-v${manifest.version}`);
  } else if (stat.isFile() && target.endsWith('.zip')) {
    manifest = await readManifestFromZip(target);
    archiveFilename = path.basename(target);
    archiveContent = await fs.promises.readFile(target);
  } else {
    throw new Error(`Target must be a directory or .zip file: ${target}`);
  }

  const uploadDir = 'Impex/commerce-apps';
  const webdavUploadPath = `${uploadDir}/${archiveFilename}`;
  const appPath = `webdav/Sites/${webdavUploadPath}`;

  logger.debug({path: webdavUploadPath}, `Uploading CAP to ${webdavUploadPath}`);
  await instance.webdav.mkcol(uploadDir);
  await instance.webdav.put(webdavUploadPath, archiveContent, 'application/zip');
  logger.debug({path: webdavUploadPath}, `CAP uploaded: ${webdavUploadPath}`);

  // Execute the install job (SCAPI when configured, OCAPI fallback in auto).
  logger.debug({jobId: INSTALL_JOB_ID, appName: manifest.id, siteId}, `Executing ${INSTALL_JOB_ID} job`);

  let finalExecution: JobExecution;
  try {
    finalExecution = await runSystemJob(instance, {
      jobId: INSTALL_JOB_ID,
      ocapiBody: {
        app_name: manifest.id,
        app_source: 'WebDAV',
        app_domain: manifest.domain,
        site_id: siteId,
        app_path: appPath,
        should_create_pr: shouldCreatePr,
      },
      parameters: [
        {name: 'AppName', value: manifest.id},
        {name: 'AppSource', value: 'WebDAV'},
        {name: 'AppDomain', value: manifest.domain},
        {name: 'SiteId', value: siteId},
        {name: 'AppPath', value: appPath},
        {name: 'ShouldCreatePR', value: String(shouldCreatePr)},
      ],
      waitOptions,
      failVerb: 'start install job',
    });
  } catch (err) {
    if (err instanceof JobExecutionError) {
      try {
        const log = await getJobLog(instance, err.execution);
        logger.error({jobId: INSTALL_JOB_ID, log}, `Job log:\n${log}`);
      } catch {
        logger.error({jobId: INSTALL_JOB_ID}, 'Could not retrieve job log');
      }
    }
    throw err;
  }

  // Clean up archive unless keeping
  if (!keepArchive) {
    await instance.webdav.delete(webdavUploadPath);
    logger.debug({path: webdavUploadPath}, `Archive deleted: ${webdavUploadPath}`);
  }

  return {
    execution: finalExecution,
    appName: manifest.id,
    appVersion: manifest.version,
    archiveFilename,
    archiveKept: keepArchive,
  };
}

/**
 * Reads and parses the commerce-app.json manifest file from a CAP directory.
 *
 * @param capDir - Path to the CAP directory containing commerce-app.json
 * @returns Parsed manifest object
 * @throws Error if commerce-app.json does not exist in the directory
 * @throws Error if commerce-app.json is not valid JSON
 *
 * @example
 * ```typescript
 * const manifest = readManifest('./my-commerce-app');
 * console.log(`App: ${manifest.id}@${manifest.version}`);
 * ```
 */
export function readManifest(capDir: string): CommerceAppManifest {
  const manifestPath = path.join(capDir, 'commerce-app.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`commerce-app.json not found in: ${capDir}`);
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as CommerceAppManifest;
  } catch {
    throw new Error(`Failed to parse commerce-app.json in: ${capDir}`);
  }
}

async function readManifestFromZip(zipPath: string): Promise<CommerceAppManifest> {
  const data = await fs.promises.readFile(zipPath);
  const zip = await JSZip.loadAsync(data);

  // Find commerce-app.json at root or one level deep
  for (const [filePath, entry] of Object.entries(zip.files)) {
    if (!entry.dir && (filePath === 'commerce-app.json' || filePath.match(/^[^/]+\/commerce-app\.json$/))) {
      try {
        const content = await entry.async('string');
        return JSON.parse(content) as CommerceAppManifest;
      } catch {
        throw new Error('Failed to parse commerce-app.json from zip');
      }
    }
  }
  throw new Error('commerce-app.json not found in zip');
}

/** Prefix site ID with "Sites-" if not already present. */
export function normalizeSiteId(siteId: string): string {
  return siteId.startsWith('Sites-') ? siteId : `Sites-${siteId}`;
}

async function createArchiveFromDirectory(dirPath: string, archiveDirName: string): Promise<Buffer> {
  const zip = new JSZip();
  const rootFolder = zip.folder(archiveDirName)!;
  await addDirectoryToZip(rootFolder, dirPath);
  return zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: {level: 9}});
}
