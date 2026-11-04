/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import fs from 'node:fs';
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {findCartridges, type CartridgeMapping, type FindCartridgesOptions} from './cartridges.js';
import {reloadCodeVersion} from './scripts-backend.js';
import {OcapiScriptsBackend} from './ocapi-scripts-backend.js';
import type {ScriptsBackend} from './scripts-types.js';
import {UNZIP_TIMEOUT_MS} from './constants.js';
import {NetworkError, describeNetworkErrorKind} from '../../errors/network-error.js';
import {HTTPError} from '../../errors/http-error.js';
import {
  DEFAULT_MAX_ARCHIVE_BYTES,
  collectArchiveEntries,
  createArchiveTempDir,
  formatBytes,
  planArchiveParts,
  writeArchive,
  type ArchivePart,
} from './archive.js';

const UNZIP_BODY = new URLSearchParams({method: 'UNZIP'}).toString();

/**
 * Directory names skipped at any depth when archiving cartridges for deploy, unless overridden
 * with the `cartridgeIgnoreDirs` config value. Narrower than the cartridge discovery ignore
 * list: names like `build` and `dist` are legitimate cartridge folders.
 */
export const DEFAULT_CARTRIDGE_IGNORE_DIRS: readonly string[] = [
  'node_modules',
  '.git',
  'coverage',
  '.cache',
  'tmp',
  'temp',
];

/**
 * Options for deploying cartridges.
 */
/** Progress info passed to the upload onProgress callback. */
export interface UploadProgressInfo {
  /** Current operation phase */
  phase: 'archiving' | 'uploading' | 'unzipping' | 'cleanup';
  /** Seconds elapsed since the current phase started */
  elapsedSeconds: number;
  /** 1-based archive part this phase belongs to (when the deploy is split) */
  part?: number;
  /** Total number of archive parts */
  parts?: number;
  /** Size of the current archive part in bytes (uploading phase) */
  bytes?: number;
}

/** Plan summary passed to the upload onPlan callback. */
export interface UploadPlanInfo {
  /** Number of archive parts that will be uploaded */
  parts: number;
  /** Per-part size limit in bytes */
  maxBytes: number;
  /** Estimated total archive bytes across all parts */
  estimatedBytes: number;
  /** Number of files across all parts */
  fileCount: number;
}

/**
 * Options for upload progress reporting.
 */
export interface UploadOptions {
  /** Callback for progress updates. Called when a phase starts (elapsedSeconds=0) and periodically thereafter. */
  onProgress?: (info: UploadProgressInfo) => void;
  /**
   * Directory names to skip at any depth inside each cartridge. Replaces
   * {@link DEFAULT_CARTRIDGE_IGNORE_DIRS}; pass `[]` to archive everything.
   */
  ignoreDirs?: readonly string[];
  /**
   * Maximum size in bytes of one uploaded archive (default
   * {@link DEFAULT_MAX_ARCHIVE_BYTES}). Larger deploys are split into several
   * archives, each uploaded and unzipped into the same code version.
   */
  maxArchiveBytes?: number;
  /** Called once the archive plan is known, before the first upload */
  onPlan?: (plan: UploadPlanInfo) => void;
}

export interface DeployOptions extends FindCartridgesOptions {
  /** Explicit code-version backend. Defaults to OCAPI for SDK compatibility. */
  scriptsBackend?: ScriptsBackend;
  /** Activate the code version after deploy */
  activate?: boolean;
  /** Reload (toggle activation to force reload) the code version after deploy */
  reload?: boolean;
  /** Delete existing cartridges before uploading */
  delete?: boolean;
  /** Callback for progress updates during long-running operations */
  onProgress?: UploadOptions['onProgress'];
  /** Directory names to skip inside each cartridge (see {@link UploadOptions.ignoreDirs}) */
  ignoreDirs?: UploadOptions['ignoreDirs'];
  /** Per-archive size limit (see {@link UploadOptions.maxArchiveBytes}) */
  maxArchiveBytes?: UploadOptions['maxArchiveBytes'];
}

/**
 * Result of a cartridge deployment.
 */
export interface DeployResult {
  /** Cartridges that were deployed */
  cartridges: CartridgeMapping[];
  /** Code version deployed to */
  codeVersion: string;
  /** Whether the code version was activated after deploy */
  activated: boolean;
  /** Whether the code version was reloaded after deploy */
  reloaded: boolean;
}

/**
 * Deletes cartridges from an instance via WebDAV.
 *
 * This is a low-level function that deletes cartridge directories
 * from the specified code version. Errors are silently ignored for
 * cartridges that don't exist.
 *
 * Requires `instance.config.codeVersion` to be set.
 *
 * @param instance - B2C instance to delete from
 * @param cartridges - Cartridge mappings to delete
 * @throws Error if code version not set
 *
 * @example
 * ```typescript
 * const cartridges = findCartridges('./cartridges');
 * await deleteCartridges(instance, cartridges);
 * ```
 */
export async function deleteCartridges(instance: B2CInstance, cartridges: CartridgeMapping[]): Promise<void> {
  const logger = getLogger();
  const codeVersion = instance.config.codeVersion;

  if (!codeVersion) {
    throw new Error('Code version required for cartridge deletion');
  }

  if (cartridges.length === 0) {
    return;
  }

  const webdav = instance.webdav;

  logger.debug({count: cartridges.length}, `Deleting ${cartridges.length} cartridge(s)...`);
  for (const c of cartridges) {
    const cartridgePath = `Cartridges/${codeVersion}/${c.dest}`;
    try {
      await webdav.delete(cartridgePath);
      logger.debug({cartridgeName: c.dest, path: cartridgePath}, `Deleted ${cartridgePath}`);
    } catch {
      // Ignore errors - cartridge may not exist
      logger.debug({cartridgeName: c.dest, path: cartridgePath}, `Could not delete ${cartridgePath} (may not exist)`);
    }
  }
}

/**
 * Server-side unzip timing. Exported for tests.
 *
 * - `requestTimeoutMs`: how long one unzip request may take at minimum. A
 *   200 MiB part normally unzips in well under a minute, and some instances
 *   drop requests that run longer than that.
 * - `bytesPerSecond`: a conservative unzip rate; archives above the default
 *   limit get proportionally longer per request (measured rates are several
 *   times faster).
 * - `intervalMs`: after a request drops, how often to ask again.
 * - `timeoutMs`: how long to keep asking. The server holds its unzip lock for
 *   at most 30 minutes.
 */
export const UNZIP_WAIT = {
  requestTimeoutMs: UNZIP_TIMEOUT_MS,
  bytesPerSecond: 4 * 1024 * 1024,
  intervalMs: 10_000,
  timeoutMs: 30 * 60_000,
};

/**
 * How many more unzip requests may drop after the first one before deploy
 * gives up. Each dropped request may have started an extraction, so this caps
 * how many times one part can be extracted.
 */
const UNZIP_MAX_DROPS = 2;

/** How many times to send one archive part before giving up on a dropped connection. */
const PUT_ATTEMPTS = 3;

/** Progress helper: fires immediately (0s) then every 5s until stopped. */
const PROGRESS_INTERVAL_MS = 5_000;
function startProgress(
  onProgress: UploadOptions['onProgress'],
  info: Omit<UploadProgressInfo, 'elapsedSeconds'>,
): () => void {
  const start = Date.now();
  onProgress?.({...info, elapsedSeconds: 0});
  if (!onProgress) return () => {};
  const interval = setInterval(() => {
    onProgress({...info, elapsedSeconds: Math.round((Date.now() - start) / 1000)});
  }, PROGRESS_INTERVAL_MS);
  return () => clearInterval(interval);
}

/**
 * Builds the error for a rejected archive upload. A 413 means either the
 * archive is over the instance's request size limit or (for a small archive)
 * the sandbox is stopped, so say which one is likely.
 */
function uploadRejected(error: HTTPError, bytes: number, maxBytes: number): Error {
  if (error.response.status !== 413) return error;
  const size = formatBytes(bytes);
  if (bytes > 50 * 1024 * 1024) {
    return new HTTPError(
      `Upload of a ${size} deploy archive was rejected as too large (413). ` +
        `Lower the archive size limit (currently ${formatBytes(maxBytes)}) so the deploy is split into smaller parts.`,
      error.response,
      'PUT',
    );
  }
  return new HTTPError(
    `Upload of a ${size} deploy archive was rejected (413). The sandbox may be stopped or unavailable.`,
    error.response,
    'PUT',
  );
}

/**
 * Uploads one archive file, retrying when the connection drops mid-transfer.
 * Re-sending a PUT is safe: it replaces the partial file.
 */
async function putArchive(
  instance: B2CInstance,
  remotePath: string,
  file: string,
  bytes: number,
  maxBytes: number,
): Promise<void> {
  const logger = getLogger();
  for (let attempt = 1; ; attempt++) {
    try {
      // A Blob backed by the file streams from disk and can be re-read on retry.
      const body = await fs.openAsBlob(file, {type: 'application/zip'});
      await instance.webdav.put(remotePath, body, 'application/zip');
      return;
    } catch (error) {
      if (error instanceof HTTPError) throw uploadRejected(error, bytes, maxBytes);
      if (!(error instanceof NetworkError) || attempt >= PUT_ATTEMPTS) {
        if (error instanceof NetworkError) {
          const {summary, hint} = describeNetworkErrorKind(error.kind);
          throw new NetworkError(
            `Upload of a ${formatBytes(bytes)} deploy archive failed after ${attempt} attempts: ${summary}. ${hint} ` +
              `Some instances drop long uploads; lower the archive size limit (currently ${formatBytes(maxBytes)}) ` +
              `to upload in smaller parts.`,
            {
              kind: error.kind,
              operation: 'upload of cartridge archive',
              host: instance.config.hostname,
              cause: error.cause,
            },
          );
        }
        throw error;
      }
      logger.warn(
        {remotePath, attempt, kind: error.kind},
        `Upload of ${remotePath} dropped (${error.kind}); retrying (attempt ${attempt + 1} of ${PUT_ATTEMPTS})`,
      );
    }
  }
}

/** Outcome of one unzip request. */
type UnzipAttempt = 'done' | 'locked' | 'dropped';

/**
 * Sends one unzip request. The server runs each extraction under a lock on
 * the archive, so while one is running another request returns 423 (Locked)
 * without starting a second extraction. A broken archive returns 500.
 */
async function requestUnzip(instance: B2CInstance, zipPath: string, timeoutMs: number): Promise<UnzipAttempt> {
  let response: Response;
  try {
    response = await instance.webdav.request(zipPath, {
      method: 'POST',
      body: UNZIP_BODY,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof NetworkError) return 'dropped';
    throw error;
  }
  if (response.status === 423) {
    await response.body?.cancel();
    return 'locked';
  }
  if (!response.ok) {
    const text = await response.text();
    const reason =
      response.status === 500 ? ' The server could not extract the archive; it may be damaged or invalid.' : '';
    throw new Error(`Failed to unzip ${zipPath}: ${response.status} ${response.statusText}.${reason} ${text}`.trim());
  }
  await response.body?.cancel();
  return 'done';
}

/**
 * Unzips an uploaded archive part on the server.
 *
 * Normally this is one request. If it times out or the connection drops, the
 * server keeps extracting, so this asks again every few seconds:
 * - 423 (Locked) means the extraction is still running; keep waiting.
 * - Success means the archive is extracted. If the first extraction had
 *   already finished, the server extracts the part again, which writes the
 *   same files.
 * - A failed status (such as 500) stops the deploy.
 *
 * Requests that drop again are capped at {@link UNZIP_MAX_DROPS} so a part is
 * never extracted over and over.
 */
async function unzipArchive(instance: B2CInstance, zipPath: string, partLabel: string, bytes: number): Promise<void> {
  const logger = getLogger();
  // Allow larger archives (a raised limit) proportionally more time.
  const timeoutMs = Math.max(UNZIP_WAIT.requestTimeoutMs, Math.ceil(bytes / UNZIP_WAIT.bytesPerSecond) * 1000);
  if ((await requestUnzip(instance, zipPath, timeoutMs)) === 'done') return;

  logger.warn(
    {zipPath},
    `Server-side unzip of ${partLabel} did not respond within ${Math.round(timeoutMs / 1000)}s; ` +
      `checking whether the server is still extracting it`,
  );
  const deadline = Date.now() + UNZIP_WAIT.timeoutMs;
  let drops = 0;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, UNZIP_WAIT.intervalMs));
    const attempt = await requestUnzip(instance, zipPath, timeoutMs);
    if (attempt === 'done') {
      logger.warn({zipPath}, `Server-side unzip of ${partLabel} finished`);
      return;
    }
    if (attempt === 'locked') {
      logger.debug({zipPath}, 'Unzip still running on the server (423 Locked)');
      continue;
    }
    drops++;
    if (drops > UNZIP_MAX_DROPS) break;
    logger.warn({zipPath, drops}, `Unzip request for ${partLabel} dropped again; retrying`);
  }
  throw new NetworkError(
    `Server-side unzip of ${partLabel} did not finish: ` +
      (drops > UNZIP_MAX_DROPS
        ? 'the unzip request kept timing out or dropping. '
        : `the server was still extracting it after ${Math.round(UNZIP_WAIT.timeoutMs / 60_000)} minutes. `) +
      `The server may still be extracting it; verify the code version before re-deploying. ` +
      `Lowering the archive size limit makes each unzip shorter. The uploaded archive remains at "${zipPath}".`,
    {kind: 'timeout', operation: 'server-side unzip of cartridge archive', host: instance.config.hostname},
  );
}

/**
 * Uploads cartridges to an instance via WebDAV.
 *
 * This is a low-level upload function that:
 * 1. Plans one or more zip archives, each under `maxArchiveBytes`
 * 2. For each archive: streams it to a temporary file, uploads it (retrying
 *    dropped uploads), unzips it on the server into the code version, and
 *    deletes the uploaded archive
 *
 * Archives are written to disk rather than held in memory, so large code
 * versions don't need large amounts of RAM. When the server-side unzip
 * request drops or times out, this waits for the server to finish instead of
 * failing (see the unzip retry rules on `UNZIP_WAIT`).
 *
 * Requires `instance.config.codeVersion` to be set.
 *
 * @param instance - B2C instance to upload to
 * @param cartridges - Cartridge mappings to upload
 * @param options - Progress callbacks, ignored directories, and the archive size limit
 * @throws Error if code version not set or upload fails
 *
 * @example
 * ```typescript
 * const cartridges = findCartridges('./cartridges');
 * await uploadCartridges(instance, cartridges, {maxArchiveBytes: 200 * 1024 * 1024});
 * ```
 */
export async function uploadCartridges(
  instance: B2CInstance,
  cartridges: CartridgeMapping[],
  options?: UploadOptions,
): Promise<void> {
  const logger = getLogger();
  const codeVersion = instance.config.codeVersion;

  if (!codeVersion) {
    throw new Error('Code version required for cartridge upload');
  }

  if (cartridges.length === 0) {
    throw new Error('No cartridges to upload');
  }

  const webdav = instance.webdav;
  const onProgress = options?.onProgress;
  const maxBytes = options?.maxArchiveBytes ?? DEFAULT_MAX_ARCHIVE_BYTES;
  const ignoreDirs = new Set(options?.ignoreDirs ?? DEFAULT_CARTRIDGE_IGNORE_DIRS);
  const deployId = `${Date.now()}`;

  // Plan archives
  onProgress?.({phase: 'archiving', elapsedSeconds: 0});
  logger.debug('Planning cartridge archives...');
  const entries = await collectArchiveEntries(cartridges, codeVersion, {ignoreDirs});
  const parts: ArchivePart[] = planArchiveParts(entries, maxBytes);
  options?.onPlan?.({
    parts: parts.length,
    maxBytes,
    estimatedBytes: parts.reduce((sum, p) => sum + p.estimatedBytes, 0),
    fileCount: entries.length,
  });
  logger.debug({parts: parts.length, files: entries.length}, `Planned ${parts.length} archive part(s)`);

  const tempDir = await createArchiveTempDir();
  try {
    for (const [i, part] of parts.entries()) {
      const partInfo = parts.length > 1 ? {part: i + 1, parts: parts.length} : {};
      const suffix = parts.length > 1 ? `-${i + 1}` : '';
      const zipName = `_sync-${deployId}${suffix}.zip`;
      const zipPath = `Cartridges/${zipName}`;
      const partLabel = parts.length > 1 ? `archive part ${i + 1} of ${parts.length}` : 'the cartridge archive';

      // Archive
      if (i > 0) onProgress?.({phase: 'archiving', elapsedSeconds: 0, ...partInfo});
      const archive = await writeArchive(part.entries, path.join(tempDir, zipName));
      logger.debug({size: archive.bytes, part: i + 1}, `Archive created: ${archive.bytes} bytes`);
      if (archive.bytes > maxBytes) {
        logger.warn(
          {bytes: archive.bytes, maxBytes},
          `Archive part ${i + 1} is ${formatBytes(archive.bytes)}, over the ${formatBytes(maxBytes)} limit (size estimate was low)`,
        );
      }

      // Upload
      let stopProgress = startProgress(onProgress, {phase: 'uploading', bytes: archive.bytes, ...partInfo});
      try {
        await putArchive(instance, zipPath, archive.path, archive.bytes, maxBytes);
      } finally {
        stopProgress();
      }
      await fs.promises.rm(archive.path, {force: true});

      // Unzip
      stopProgress = startProgress(onProgress, {phase: 'unzipping', ...partInfo});
      try {
        await unzipArchive(instance, zipPath, partLabel, archive.bytes);
      } finally {
        stopProgress();
      }
      logger.debug({zipPath}, 'Archive unzipped');

      // Delete the uploaded archive (best-effort)
      onProgress?.({phase: 'cleanup', elapsedSeconds: 0, ...partInfo});
      try {
        await webdav.delete(zipPath);
      } catch (error) {
        logger.warn({error, uploadPath: zipPath}, 'Failed to clean up temporary archive (non-fatal)');
      }
    }
  } finally {
    await fs.promises.rm(tempDir, {recursive: true, force: true});
  }

  logger.debug(
    {server: instance.config.hostname, codeVersion, cartridgeCount: cartridges.length, parts: parts.length},
    `Uploaded ${cartridges.length} cartridges to ${instance.config.hostname}`,
  );
}

/**
 * Finds and deploys cartridges from a directory to an instance.
 *
 * This is a high-level function that orchestrates the deployment process:
 * 1. Finds cartridges in the specified directory (by .project files)
 * 2. Applies include/exclude filters
 * 3. Optionally deletes existing cartridges first
 * 4. Creates a zip archive and uploads via WebDAV
 * 5. Optionally reloads the code version
 *
 * Requires `instance.config.codeVersion` to be set.
 *
 * @param instance - B2C instance to deploy to (must have codeVersion set)
 * @param directory - Directory to search for cartridges
 * @param options - Deploy options (filters, reload, delete)
 * @returns Deploy result with cartridges and status
 * @throws Error if code version not set, no cartridges found, or deployment fails
 *
 * @example
 * ```typescript
 * // Simple deploy
 * const result = await findAndDeployCartridges(instance, './cartridges');
 *
 * // Deploy specific cartridges with reload
 * const result = await findAndDeployCartridges(instance, '.', {
 *   include: ['app_storefront_base'],
 *   reload: true,
 * });
 *
 * // Delete existing cartridges before upload
 * const result = await findAndDeployCartridges(instance, './cartridges', {
 *   delete: true,
 *   reload: true,
 * });
 * ```
 */
export async function findAndDeployCartridges(
  instance: B2CInstance,
  directory: string,
  options: DeployOptions = {},
): Promise<DeployResult> {
  const logger = getLogger();
  const codeVersion = instance.config.codeVersion;
  const scriptsBackend = options.scriptsBackend ?? new OcapiScriptsBackend(instance);

  if (!codeVersion) {
    throw new Error('Code version required for deployment');
  }

  logger.debug({directory}, 'Finding cartridges...');
  const cartridges = findCartridges(directory, {
    include: options.include,
    exclude: options.exclude,
  });

  if (cartridges.length === 0) {
    throw new Error(`No cartridges found in ${directory}`);
  }

  logger.debug({count: cartridges.length}, `Found ${cartridges.length} cartridge(s)`);
  for (const c of cartridges) {
    logger.debug({cartridgeName: c.name, path: c.src}, `  ${c.name}`);
  }

  // Optionally delete existing cartridges first
  if (options.delete) {
    await deleteCartridges(instance, cartridges);
  }

  // Upload cartridges
  await uploadCartridges(instance, cartridges, {
    onProgress: options.onProgress,
    ignoreDirs: options.ignoreDirs,
    maxArchiveBytes: options.maxArchiveBytes,
  });

  // Optionally activate or reload
  let activated = false;
  let reloaded = false;
  if (options.activate) {
    logger.debug('Activating code version...');
    await scriptsBackend.activateCodeVersion(codeVersion);
    activated = true;
  } else if (options.reload) {
    logger.debug('Reloading code version...');
    await reloadCodeVersion(scriptsBackend, codeVersion);
    activated = true;
    reloaded = true;
  }

  return {
    cartridges,
    codeVersion,
    activated,
    reloaded,
  };
}
