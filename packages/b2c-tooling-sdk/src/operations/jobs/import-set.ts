/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash, randomUUID} from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {B2CInstance} from '../../instance/index.js';
import {siteArchiveImport, type SiteArchiveImportOptions, type SiteArchiveImportResult} from './site-archive.js';
import type {WaitForJobOptions} from './run.js';

const DEFAULT_STATE_ROOT = 'Impex/b2c-cli/import-sets';
const DEFAULT_STALE_LOCK_SECONDS = 30 * 60;
const DEFAULT_LOCK_POLL_INTERVAL_SECONDS = 3;
const DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 30;

/** A local archive in an import set. */
export interface ImportSetItem {
  /** Stable item ID, derived from the immediate child name. */
  id: string;
  /** Absolute local path to the directory or zip archive. */
  target: string;
  /** Source kind. */
  kind: 'directory' | 'zip';
  /** Deterministic SHA-256 of the contents and, for directories, relative paths. */
  sha256: string;
}

/** Durable receipt written after an import completes successfully. */
export interface ImportSetReceipt {
  version: 1;
  setId: string;
  itemId: string;
  sha256: string;
  source: string;
  appliedAt: string;
  runId: string;
  executionId?: string;
  archiveFilename?: string;
}

/** Result for one item in an import set. */
export interface ImportSetItemResult extends ImportSetItem {
  status: 'pending' | 'skipped' | 'imported';
  receipt?: ImportSetReceipt;
  importResult?: SiteArchiveImportResult;
}

/** Result of planning or applying an import set. */
export interface ImportSetResult {
  setId: string;
  directory: string;
  dryRun: boolean;
  runId: string;
  items: ImportSetItemResult[];
  imported: number;
  skipped: number;
  pending: number;
}

/** Progress events emitted while planning and applying an import set. */
export type ImportSetEvent =
  | {type: 'plan'; setId: string; total: number; pending: number; skipped: number; dryRun: boolean}
  | {type: 'lock-acquired'; setId: string; runId: string}
  | {type: 'lock-wait'; setId: string; owner?: ImportSetLockOwner; ageSeconds?: number}
  | {type: 'lock-takeover'; setId: string; owner?: ImportSetLockOwner; ageSeconds?: number; forced: boolean}
  | {type: 'item-skipped'; item: ImportSetItem; receipt: ImportSetReceipt; index: number; total: number}
  | {type: 'item-importing'; item: ImportSetItem; index: number; total: number}
  | {type: 'item-imported'; item: ImportSetItem; receipt: ImportSetReceipt; index: number; total: number}
  | {type: 'receipt-invalid'; item: ImportSetItem; receiptPath: string};

/** Owner information stored inside the WebDAV lock directory. */
export interface ImportSetLockOwner {
  version: 1;
  setId: string;
  runId: string;
  createdAt: string;
  heartbeatAt: string;
  owner?: string;
}

/** Options for {@link siteArchiveImportSet}. */
export interface SiteArchiveImportSetOptions {
  /** Stable set ID. Defaults to the import-set directory name. */
  setId?: string;
  /** Plan imports without creating state, locking, importing, or writing receipts. */
  dryRun?: boolean;
  /** Keep uploaded archives in Impex/src/instance after each import. */
  keepArchive?: boolean;
  /** WebDAV state root. Defaults to Impex/b2c-cli/import-sets. */
  stateRoot?: string;
  /** Age after which a lock heartbeat is considered stale. Defaults to 1800 seconds. */
  staleLockSeconds?: number;
  /** Poll interval while another runner owns the set lock. Defaults to 3 seconds. */
  lockPollIntervalSeconds?: number;
  /** Lock heartbeat interval. Defaults to 30 seconds. */
  heartbeatIntervalSeconds?: number;
  /** Immediately remove an existing lock before attempting to acquire it. */
  breakLock?: boolean;
  /** Optional owner label stored in lock metadata. */
  owner?: string;
  /** Wait options forwarded to each site archive import. */
  waitOptions?: WaitForJobOptions;
  /** Receives planning, locking, and item progress events. */
  onEvent?: (event: ImportSetEvent) => void;
  /**
   * Archive importer override. Defaults to {@link siteArchiveImport}.
   * Useful when embedding the operation with a custom import policy.
   */
  importArchive?: (
    instance: B2CInstance,
    target: string,
    options: SiteArchiveImportOptions,
  ) => Promise<SiteArchiveImportResult>;
  /** Sleep implementation used while polling for a lock. */
  sleep?: (milliseconds: number) => Promise<void>;
}

/** Thrown when an applied item ID now resolves to different contents. */
export class ImportSetChangedError extends Error {
  constructor(
    public readonly item: ImportSetItem,
    public readonly receipt: ImportSetReceipt,
  ) {
    super(
      `Import-set item "${item.id}" has changed since it was applied ` +
        `(receipt ${receipt.sha256}, local ${item.sha256}). Add a new item instead of modifying an applied import.`,
    );
    this.name = 'ImportSetChangedError';
  }
}

/** Thrown when WebDAV lock or receipt state cannot be safely read or written. */
export class ImportSetStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportSetStateError';
  }
}

interface JsonReadResult<T> {
  found: boolean;
  valid: boolean;
  value?: T;
}

interface LockInfo {
  owner?: ImportSetLockOwner;
  ageSeconds?: number;
}

/**
 * Discovers the immediate child directories and zip archives in an import-set
 * directory, sorts them by name, and computes deterministic content hashes.
 */
export async function discoverImportSet(directory: string): Promise<ImportSetItem[]> {
  const resolvedDirectory = path.resolve(directory);
  const stat = await fs.promises.stat(resolvedDirectory).catch(() => undefined);
  if (!stat?.isDirectory()) {
    throw new Error(`Import-set directory does not exist: ${resolvedDirectory}`);
  }

  const entries = await fs.promises.readdir(resolvedDirectory, {withFileTypes: true});
  const candidates = entries
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.isDirectory() || (entry.isFile() && path.extname(entry.name).toLowerCase() === '.zip'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: false}));

  if (candidates.length === 0) {
    throw new Error(`No import directories or zip archives found in ${resolvedDirectory}`);
  }

  return Promise.all(
    candidates.map(async (entry) => {
      const target = path.join(resolvedDirectory, entry.name);
      return {
        id: entry.name,
        target,
        kind: entry.isDirectory() ? ('directory' as const) : ('zip' as const),
        sha256: await hashImportTarget(target),
      };
    }),
  );
}

/**
 * Applies an ordered set of site archives exactly until a verified receipt is
 * written for each item. A missing or invalid receipt always leaves the item
 * pending, even if a previous process may have completed the platform import.
 *
 * The operation uses an exclusive WebDAV directory (`MKCOL`) as a best-effort
 * set-wide lock. B2C Commerce does not provide conditional WebDAV deletes, so
 * stale lock takeover is intentionally observable through progress events.
 */
export async function siteArchiveImportSet(
  instance: B2CInstance,
  directory: string,
  options: SiteArchiveImportSetOptions = {},
): Promise<ImportSetResult> {
  const resolvedDirectory = path.resolve(directory);
  const setId = options.setId ?? path.basename(resolvedDirectory);
  validateSetId(setId);
  validateStateRoot(options.stateRoot ?? DEFAULT_STATE_ROOT);

  const runId = randomUUID();
  const items = await discoverImportSet(resolvedDirectory);
  const stateRoot = (options.stateRoot ?? DEFAULT_STATE_ROOT).replace(/\/+$/, '');
  const setRoot = `${stateRoot}/${setId}`;
  const receiptsRoot = `${setRoot}/receipts`;
  const lockPath = `${setRoot}/lock`;
  const sleep =
    options.sleep ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const importArchive = options.importArchive ?? siteArchiveImport;

  let itemResults = await evaluateReceipts(instance, setId, receiptsRoot, items, options.onEvent);
  emitPlan(options, setId, itemResults);

  if (options.dryRun || itemResults.every((item) => item.status === 'skipped')) {
    return buildResult(setId, resolvedDirectory, Boolean(options.dryRun), runId, itemResults);
  }

  await ensureCollection(instance, stateRoot, sleep);
  await ensureCollection(instance, setRoot, sleep);
  await ensureCollection(instance, receiptsRoot, sleep);

  const lockOwner = await acquireLock(instance, lockPath, setId, runId, options, sleep);
  let heartbeatError: Error | undefined;
  let heartbeatChain = Promise.resolve();
  const heartbeatInterval = Math.max(1, options.heartbeatIntervalSeconds ?? DEFAULT_HEARTBEAT_INTERVAL_SECONDS);
  const heartbeatTimer = setInterval(() => {
    heartbeatChain = heartbeatChain
      .then(() => heartbeatLock(instance, lockPath, lockOwner))
      .catch((error: unknown) => {
        heartbeatError = error instanceof Error ? error : new Error(String(error));
      });
  }, heartbeatInterval * 1000);
  heartbeatTimer.unref();
  let operationError: unknown;

  try {
    // Another runner may have completed work while this process waited.
    itemResults = await evaluateReceipts(instance, setId, receiptsRoot, items, options.onEvent);
    const total = itemResults.length;

    for (const [index, itemResult] of itemResults.entries()) {
      if (itemResult.status === 'skipped') {
        options.onEvent?.({
          type: 'item-skipped',
          item: itemResult,
          receipt: itemResult.receipt!,
          index: index + 1,
          total,
        });
        continue;
      }

      if (heartbeatError) throw heartbeatError;
      await heartbeatLock(instance, lockPath, lockOwner);
      options.onEvent?.({type: 'item-importing', item: itemResult, index: index + 1, total});

      const importResult = await importArchive(instance, itemResult.target, {
        keepArchive: options.keepArchive,
        wait: true,
        waitOptions: options.waitOptions,
      });

      if (heartbeatError) throw heartbeatError;
      const receipt: ImportSetReceipt = {
        version: 1,
        setId,
        itemId: itemResult.id,
        sha256: itemResult.sha256,
        source: path.basename(itemResult.target),
        appliedAt: new Date().toISOString(),
        runId,
        executionId: importResult.execution.id,
        archiveFilename: importResult.archiveFilename,
      };
      await writeAndVerifyReceipt(instance, receiptPath(receiptsRoot, itemResult.id), receipt);

      itemResult.status = 'imported';
      itemResult.receipt = receipt;
      itemResult.importResult = importResult;
      options.onEvent?.({type: 'item-imported', item: itemResult, receipt, index: index + 1, total});
    }

    return buildResult(setId, resolvedDirectory, false, runId, itemResults);
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    clearInterval(heartbeatTimer);
    await heartbeatChain;
    try {
      await releaseLock(instance, lockPath, runId);
    } catch (error) {
      // Preserve an import or receipt error so callers can report the real
      // failure. An unreleased lock will become eligible for stale takeover.
      if (operationError === undefined) throw error;
    }
  }
}

async function evaluateReceipts(
  instance: B2CInstance,
  setId: string,
  receiptsRoot: string,
  items: ImportSetItem[],
  onEvent?: (event: ImportSetEvent) => void,
): Promise<ImportSetItemResult[]> {
  const results: ImportSetItemResult[] = [];
  for (const item of items) {
    const remotePath = receiptPath(receiptsRoot, item.id);
    // Receipt reads are intentionally sequential to avoid bursting WebDAV on large sets.
    // eslint-disable-next-line no-await-in-loop
    const read = await readJson<ImportSetReceipt>(instance, remotePath);
    if (!read.found) {
      results.push({...item, status: 'pending'});
      continue;
    }
    if (!read.valid || !isReceipt(read.value, setId, item.id)) {
      onEvent?.({type: 'receipt-invalid', item, receiptPath: remotePath});
      results.push({...item, status: 'pending'});
      continue;
    }
    if (read.value.sha256 !== item.sha256) {
      throw new ImportSetChangedError(item, read.value);
    }
    results.push({...item, status: 'skipped', receipt: read.value});
  }
  return results;
}

async function acquireLock(
  instance: B2CInstance,
  lockPath: string,
  setId: string,
  runId: string,
  options: SiteArchiveImportSetOptions,
  sleep: (milliseconds: number) => Promise<void>,
): Promise<ImportSetLockOwner> {
  const staleSeconds = Math.max(1, options.staleLockSeconds ?? DEFAULT_STALE_LOCK_SECONDS);
  const pollMilliseconds = Math.max(1, options.lockPollIntervalSeconds ?? DEFAULT_LOCK_POLL_INTERVAL_SECONDS) * 1000;
  let forceBreak = Boolean(options.breakLock);
  let waitNotified = false;

  while (true) {
    // MKCOL is the only conditional creation primitive B2C WebDAV enforces.
    // eslint-disable-next-line no-await-in-loop
    const response = await instance.webdav.request(lockPath, {method: 'MKCOL'});
    if (response.status === 201) {
      const now = new Date().toISOString();
      const owner: ImportSetLockOwner = {
        version: 1,
        setId,
        runId,
        createdAt: now,
        heartbeatAt: now,
        owner: options.owner,
      };
      try {
        // eslint-disable-next-line no-await-in-loop
        await putJson(instance, `${lockPath}/owner.json`, owner);
      } catch (error) {
        await deletePath(instance, lockPath);
        throw error;
      }
      options.onEvent?.({type: 'lock-acquired', setId, runId});
      return owner;
    }

    if (response.status !== 405 && response.status !== 409) {
      throw new ImportSetStateError(
        `Unable to acquire import-set lock ${lockPath}: ${response.status} ${response.statusText}`,
      );
    }

    // eslint-disable-next-line no-await-in-loop
    const info = await readLockInfo(instance, lockPath);
    const stale = info.ageSeconds !== undefined && info.ageSeconds >= staleSeconds;
    if (forceBreak || stale) {
      options.onEvent?.({
        type: 'lock-takeover',
        setId,
        owner: info.owner,
        ageSeconds: info.ageSeconds,
        forced: forceBreak,
      });
      // B2C WebDAV ignores conditional DELETE, so stale takeover is best effort.
      // eslint-disable-next-line no-await-in-loop
      await deletePath(instance, lockPath);
      forceBreak = false;
      waitNotified = false;
      continue;
    }

    if (!waitNotified) {
      options.onEvent?.({type: 'lock-wait', setId, owner: info.owner, ageSeconds: info.ageSeconds});
      waitNotified = true;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(pollMilliseconds);
  }
}

async function heartbeatLock(instance: B2CInstance, lockPath: string, owner: ImportSetLockOwner): Promise<void> {
  const ownerPath = `${lockPath}/owner.json`;
  const current = await readJson<ImportSetLockOwner>(instance, ownerPath);
  if (!current.found || !current.valid || current.value?.runId !== owner.runId) {
    throw new ImportSetStateError(`Import-set lock ${lockPath} is no longer owned by run ${owner.runId}`);
  }
  owner.heartbeatAt = new Date().toISOString();
  await putJson(instance, ownerPath, owner);
}

async function releaseLock(instance: B2CInstance, lockPath: string, runId: string): Promise<void> {
  const current = await readJson<ImportSetLockOwner>(instance, `${lockPath}/owner.json`);
  if (current.found && current.valid && current.value?.runId === runId) {
    await deletePath(instance, lockPath);
  }
}

async function readLockInfo(instance: B2CInstance, lockPath: string): Promise<LockInfo> {
  const ownerRead = await readJson<ImportSetLockOwner>(instance, `${lockPath}/owner.json`);
  const owner = ownerRead.valid ? ownerRead.value : undefined;
  const timestamp = owner?.heartbeatAt ?? owner?.createdAt;
  if (timestamp) {
    const milliseconds = Date.parse(timestamp);
    if (Number.isFinite(milliseconds)) {
      return {owner, ageSeconds: Math.max(0, (Date.now() - milliseconds) / 1000)};
    }
  }

  try {
    const entries = await instance.webdav.propfind(lockPath, '0');
    const modified = entries[0]?.lastModified;
    return {
      owner,
      ageSeconds: modified ? Math.max(0, (Date.now() - modified.getTime()) / 1000) : undefined,
    };
  } catch {
    return {owner};
  }
}

async function ensureCollection(
  instance: B2CInstance,
  remotePath: string,
  sleep: (milliseconds: number) => Promise<void>,
): Promise<void> {
  const segments = remotePath.split('/').filter(Boolean);
  if (segments.length < 2) throw new ImportSetStateError(`Invalid WebDAV state path: ${remotePath}`);

  let current = segments[0];
  for (const segment of segments.slice(1)) {
    current = `${current}/${segment}`;
    // eslint-disable-next-line no-await-in-loop
    const response = await instance.webdav.request(current, {method: 'MKCOL'});
    if (response.status === 201 || response.status === 405) continue;
    if (response.status === 409) {
      // Concurrent creators can receive 409 while the winning collection becomes visible.
      // eslint-disable-next-line no-await-in-loop
      await sleep(25);
      // eslint-disable-next-line no-await-in-loop
      const head = await instance.webdav.request(current, {method: 'HEAD'});
      if (head.ok) continue;
    }
    throw new ImportSetStateError(
      `Unable to create WebDAV collection ${current}: ${response.status} ${response.statusText}`,
    );
  }
}

async function readJson<T>(instance: B2CInstance, remotePath: string): Promise<JsonReadResult<T>> {
  const response = await instance.webdav.request(remotePath, {method: 'GET'});
  if (response.status === 404) return {found: false, valid: false};
  if (!response.ok) {
    throw new ImportSetStateError(
      `Unable to read WebDAV state ${remotePath}: ${response.status} ${response.statusText}`,
    );
  }
  try {
    return {found: true, valid: true, value: JSON.parse(await response.text()) as T};
  } catch {
    return {found: true, valid: false};
  }
}

async function putJson(instance: B2CInstance, remotePath: string, value: unknown): Promise<void> {
  const response = await instance.webdav.request(remotePath, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: `${JSON.stringify(value, null, 2)}\n`,
  });
  if (!response.ok) {
    throw new ImportSetStateError(
      `Unable to write WebDAV state ${remotePath}: ${response.status} ${response.statusText}`,
    );
  }
}

async function writeAndVerifyReceipt(
  instance: B2CInstance,
  remotePath: string,
  receipt: ImportSetReceipt,
): Promise<void> {
  await putJson(instance, remotePath, receipt);
  const verification = await readJson<ImportSetReceipt>(instance, remotePath);
  if (
    !verification.found ||
    !verification.valid ||
    !isReceipt(verification.value, receipt.setId, receipt.itemId) ||
    verification.value?.runId !== receipt.runId ||
    verification.value.sha256 !== receipt.sha256
  ) {
    throw new ImportSetStateError(`Receipt verification failed for ${receipt.itemId}; the import will be retried.`);
  }
}

async function deletePath(instance: B2CInstance, remotePath: string): Promise<void> {
  const response = await instance.webdav.request(remotePath, {method: 'DELETE'});
  if (!response.ok && response.status !== 404) {
    throw new ImportSetStateError(
      `Unable to delete WebDAV state ${remotePath}: ${response.status} ${response.statusText}`,
    );
  }
}

function isReceipt(value: ImportSetReceipt | undefined, setId: string, itemId: string): value is ImportSetReceipt {
  return (
    value?.version === 1 &&
    value.setId === setId &&
    value.itemId === itemId &&
    /^[a-f\d]{64}$/.test(value.sha256) &&
    typeof value.source === 'string' &&
    Number.isFinite(Date.parse(value.appliedAt)) &&
    typeof value.runId === 'string' &&
    value.runId.length > 0
  );
}

function receiptPath(receiptsRoot: string, itemId: string): string {
  return `${receiptsRoot}/${createHash('sha256').update(itemId).digest('hex')}.json`;
}

function emitPlan(options: SiteArchiveImportSetOptions, setId: string, items: ImportSetItemResult[]): void {
  options.onEvent?.({
    type: 'plan',
    setId,
    total: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    skipped: items.filter((item) => item.status === 'skipped').length,
    dryRun: Boolean(options.dryRun),
  });
}

function buildResult(
  setId: string,
  directory: string,
  dryRun: boolean,
  runId: string,
  items: ImportSetItemResult[],
): ImportSetResult {
  return {
    setId,
    directory,
    dryRun,
    runId,
    items,
    imported: items.filter((item) => item.status === 'imported').length,
    skipped: items.filter((item) => item.status === 'skipped').length,
    pending: items.filter((item) => item.status === 'pending').length,
  };
}

function validateSetId(setId: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(setId)) {
    throw new Error(`Invalid import-set ID "${setId}". Use 1-128 letters, numbers, dots, underscores, or hyphens.`);
  }
}

function validateStateRoot(stateRoot: string): void {
  const segments = stateRoot.split('/').filter(Boolean);
  if (segments[0]?.toLowerCase() !== 'impex' || segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error(`Import-set state root must be a path under Impex: ${stateRoot}`);
  }
}

async function hashImportTarget(target: string): Promise<string> {
  const stat = await fs.promises.lstat(target);
  const hash = createHash('sha256');
  if (stat.isFile()) {
    hash.update('F\0');
    await updateHashFromFile(hash, target);
    return hash.digest('hex');
  }
  if (!stat.isDirectory()) throw new Error(`Unsupported import-set item: ${target}`);

  const entries = await collectDirectoryEntries(target);
  for (const entry of entries) {
    hash.update(entry.kind === 'directory' ? 'D\0' : 'F\0');
    hash.update(entry.relativePath);
    hash.update('\0');
    if (entry.kind === 'file') {
      // Reading files sequentially keeps hashing deterministic and bounds memory usage.
      // eslint-disable-next-line no-await-in-loop
      await updateHashFromFile(hash, entry.absolutePath);
      hash.update('\0');
    }
  }
  return hash.digest('hex');
}

async function collectDirectoryEntries(
  root: string,
): Promise<Array<{kind: 'directory' | 'file'; relativePath: string; absolutePath: string}>> {
  const result: Array<{kind: 'directory' | 'file'; relativePath: string; absolutePath: string}> = [];

  async function visit(directory: string): Promise<void> {
    const entries = await fs.promises.readdir(directory, {withFileTypes: true});
    entries.sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: false}));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
      if (entry.isSymbolicLink()) {
        throw new Error(`Symbolic links are not supported in import sets: ${absolutePath}`);
      }
      if (entry.isDirectory()) {
        result.push({kind: 'directory', relativePath, absolutePath});
        // eslint-disable-next-line no-await-in-loop
        await visit(absolutePath);
      } else if (entry.isFile()) {
        result.push({kind: 'file', relativePath, absolutePath});
      }
    }
  }

  await visit(root);
  return result;
}

async function updateHashFromFile(hash: ReturnType<typeof createHash>, filename: string): Promise<void> {
  const stream = fs.createReadStream(filename);
  for await (const chunk of stream) hash.update(chunk);
}
