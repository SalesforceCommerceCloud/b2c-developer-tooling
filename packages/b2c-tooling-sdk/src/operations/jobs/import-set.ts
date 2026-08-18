/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash, randomUUID} from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {HTTPError} from '../../errors/http-error.js';
import type {B2CInstance} from '../../instance/index.js';
import {findCartridges} from '../code/cartridges.js';
import {siteArchiveImport, type SiteArchiveImportOptions, type SiteArchiveImportResult} from './site-archive.js';
import type {WaitForJobOptions} from './run.js';

const DEFAULT_STATE_ROOT = 'Impex/b2c-cli/import-sets';
const DEFAULT_SET_ID = 'migrations';
const DEFAULT_STALE_LOCK_SECONDS = 30 * 60;
const DEFAULT_LOCK_POLL_INTERVAL_SECONDS = 3;
const DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 30;
const SITE_ARCHIVE_DIRECTORY_NAMES = new Set([
  'ab-tests',
  'cache-settings',
  'catalogs',
  'coupons',
  'csrf-allowlists',
  'csrf-whitelists',
  'customer-lists',
  'custom-objects',
  'dcext',
  'geolocations',
  'global-data',
  'inventory',
  'inventory-lists',
  'jobs',
  'libraries',
  'locales',
  'meta',
  'oauth-providers',
  'ocapi-settings',
  'payment-methods',
  'payment-processors',
  'preferences',
  'price-books',
  'pricebooks',
  'promotions',
  'redirect-urls',
  'search',
  'services',
  'shipping',
  'sites',
  'slots',
  'sorting-rules',
  'source-codes',
  'sourcecodes',
  'static',
  'static-resources',
  'stores',
  'system-type-definitions',
  'tax',
  'users',
]);

/** A local archive in an import set. */
export interface ImportSetItem {
  /** Stable item ID, derived from the source and immediate child name. */
  id: string;
  /** Absolute local path to the directory or zip archive. */
  target: string;
  /** Source kind. */
  kind: 'directory' | 'zip';
  /**
   * Contents of a `README.md` or `README` file found at the top of a directory
   * item, trimmed of surrounding whitespace. Used to surface manual follow-up
   * steps after the item is imported. Undefined when no README is present or
   * for zip items.
   */
  note?: string;
}

/** Options for discovering import-set items. */
export interface DiscoverImportSetOptions {
  /** Include items from `metadata/` directories in discovered cartridges. Defaults to true. */
  includeCartridgeMetadata?: boolean;
  /** Root directory used to discover cartridges. Defaults to the current working directory. */
  cartridgeRoot?: string;
  /** Directory paths to exclude recursively, resolved relative to `cartridgeRoot`. */
  excludeDirectories?: string[];
}

/** Durable directory receipt created after an import completes successfully. */
export interface ImportSetReceipt {
  version: 1;
  setId: string;
  itemId: string;
  /** WebDAV directory whose existence records the applied item name. */
  receiptPath: string;
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

/** Structured lifecycle events delivered while planning and applying an import set. */
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
  /** Stable receipt and lock namespace. Defaults to `migrations`. */
  setId?: string;
  /** Plan imports without creating state, locking, importing, or writing receipts. */
  dryRun?: boolean;
  /** Keep uploaded archives in Impex/src/instance after each import. */
  keepArchive?: boolean;
  /** Include items from `metadata/` directories in discovered cartridges. Defaults to true. */
  includeCartridgeMetadata?: boolean;
  /** Root directory used to discover cartridges. Defaults to the current working directory. */
  cartridgeRoot?: string;
  /** Directory paths to exclude recursively, resolved relative to `cartridgeRoot`. */
  excludeDirectories?: string[];
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
  /** Receives planning, locking, and item progress events. The operation itself does not log or write output. */
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

interface ReceiptDirectoryReadResult {
  found: boolean;
  valid: boolean;
}

interface LockInfo {
  owner?: ImportSetLockOwner;
  ageSeconds?: number;
}

/**
 * Discovers import items from cartridge `metadata/` directories followed by
 * the explicit import-set directory. A cartridge metadata directory that
 * resembles a site archive is one item; otherwise its immediate child
 * directories and zip archives are items. Cartridge sources are ordered by
 * cartridge name, and child items within each source are sorted by name.
 */
export async function discoverImportSet(
  directory: string,
  options: DiscoverImportSetOptions = {},
): Promise<ImportSetItem[]> {
  const resolvedDirectory = path.resolve(directory);
  const excludedDirectories = resolveExcludedDirectories(options);
  const cartridgeItems =
    options.includeCartridgeMetadata === false ? [] : await discoverCartridgeMetadata(options, excludedDirectories);
  const directoryItems = await discoverImportDirectory(resolvedDirectory, '', excludedDirectories);
  const items = [...cartridgeItems, ...directoryItems];

  if (items.length === 0) {
    const importDirectoryExists = await isDirectory(resolvedDirectory);
    if (!importDirectoryExists && options.includeCartridgeMetadata === false) {
      throw new Error(`Import-set directory does not exist: ${resolvedDirectory}`);
    }

    throw new Error(
      options.includeCartridgeMetadata === false
        ? `No import directories or zip archives found in ${resolvedDirectory}`
        : `No import directories or zip archives found in ${resolvedDirectory} or discovered cartridge metadata`,
    );
  }

  const itemIds = new Set<string>();
  for (const item of items) {
    if (itemIds.has(item.id)) throw new Error(`Duplicate import-set item ID: ${item.id}`);
    itemIds.add(item.id);
  }

  return items;
}

async function discoverCartridgeMetadata(
  options: DiscoverImportSetOptions,
  excludedDirectories: string[],
): Promise<ImportSetItem[]> {
  const cartridges = findCartridges(options.cartridgeRoot)
    .filter((cartridge) => !isExcludedPath(cartridge.src, excludedDirectories))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: false}));
  const items: ImportSetItem[] = [];

  for (const cartridge of cartridges) {
    const metadataDirectory = path.join(cartridge.src, 'metadata');
    // eslint-disable-next-line no-await-in-loop
    const metadataEntries = await readDirectory(metadataDirectory);
    if (!metadataEntries) continue;

    if (looksLikeSiteArchive(metadataEntries)) {
      items.push({
        id: `cartridge-metadata/${cartridge.name}`,
        target: metadataDirectory,
        kind: 'directory',
        // eslint-disable-next-line no-await-in-loop
        note: await readItemNote(metadataDirectory),
      });
      continue;
    }

    // Keep source discovery sequential so ordering is explicit and stable.
    // eslint-disable-next-line no-await-in-loop
    const cartridgeItems = await discoverImportDirectory(
      metadataDirectory,
      `cartridge-metadata/${cartridge.name}/`,
      excludedDirectories,
    );
    items.push(...cartridgeItems);
  }

  return items;
}

function looksLikeSiteArchive(entries: fs.Dirent[]): boolean {
  return entries.some((entry) => {
    if (entry.name.startsWith('.')) return false;
    if (entry.isFile()) return path.extname(entry.name).toLowerCase() === '.xml';
    if (!entry.isDirectory()) return false;
    return SITE_ARCHIVE_DIRECTORY_NAMES.has(entry.name.toLowerCase().replaceAll('_', '-'));
  });
}

async function readDirectory(directory: string): Promise<fs.Dirent[] | undefined> {
  const stat = await fs.promises.stat(directory).catch(() => undefined);
  if (!stat) return undefined;
  if (!stat.isDirectory()) throw new Error(`Import-set source is not a directory: ${directory}`);
  return fs.promises.readdir(directory, {withFileTypes: true});
}

async function discoverImportDirectory(
  directory: string,
  idPrefix = '',
  excludedDirectories: string[] = [],
): Promise<ImportSetItem[]> {
  const entries = await readDirectory(directory);
  if (!entries) return [];
  const candidates = entries
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.isDirectory() || (entry.isFile() && path.extname(entry.name).toLowerCase() === '.zip'))
    .filter((entry) => !isExcludedPath(path.join(directory, entry.name), excludedDirectories))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: false}));

  return Promise.all(
    candidates.map(async (entry) => {
      const target = path.join(directory, entry.name);
      const kind = entry.isDirectory() ? ('directory' as const) : ('zip' as const);
      return {
        id: `${idPrefix}${entry.name}`,
        target,
        kind,
        note: kind === 'directory' ? await readItemNote(target) : undefined,
      };
    }),
  );
}

function resolveExcludedDirectories(options: DiscoverImportSetOptions): string[] {
  const root = path.resolve(options.cartridgeRoot ?? process.cwd());
  const configuredDirectories = options.excludeDirectories ?? [];
  return [
    ...new Set(
      configuredDirectories
        .filter((directory) => typeof directory === 'string' && directory.trim().length > 0)
        .map((directory) => path.resolve(root, directory.trim())),
    ),
  ];
}

/** README filenames checked, in priority order, at the top of a directory item. */
const README_FILENAMES = ['README.md', 'README'];

/**
 * Reads the first README file at the top of a directory item, if present.
 * Returns the trimmed contents, or undefined when no README exists or it is empty.
 */
async function readItemNote(directory: string): Promise<string | undefined> {
  for (const filename of README_FILENAMES) {
    // eslint-disable-next-line no-await-in-loop
    const contents = await fs.promises.readFile(path.join(directory, filename), 'utf8').catch(() => undefined);
    if (contents === undefined) continue;
    const trimmed = contents.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function isExcludedPath(candidate: string, excludedDirectories: string[]): boolean {
  return excludedDirectories.some((excludedDirectory) => {
    const relativePath = path.relative(excludedDirectory, candidate);
    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  });
}

async function isDirectory(directory: string): Promise<boolean> {
  const stat = await fs.promises.stat(directory).catch(() => undefined);
  return stat?.isDirectory() === true;
}

/**
 * Applies an ordered set of site archives exactly until a verified receipt
 * directory is created for each item name. A missing or invalid receipt always
 * leaves the item pending, even if a previous process may have completed the
 * platform import.
 *
 * The operation uses an exclusive WebDAV directory (`MKCOL`) as a best-effort
 * set-wide lock. B2C Commerce does not provide conditional WebDAV deletes, so
 * stale lock takeover is intentionally observable through progress events.
 * The operation never logs or writes output; callers can consume structured
 * progress through {@link SiteArchiveImportSetOptions.onEvent}.
 */
export async function siteArchiveImportSet(
  instance: B2CInstance,
  directory: string,
  options: SiteArchiveImportSetOptions = {},
): Promise<ImportSetResult> {
  const resolvedDirectory = path.resolve(directory);
  const setId = options.setId ?? DEFAULT_SET_ID;
  validateSetId(setId);
  validateStateRoot(options.stateRoot ?? DEFAULT_STATE_ROOT);

  const runId = randomUUID();
  const items = await discoverImportSet(resolvedDirectory, {
    includeCartridgeMetadata: options.includeCartridgeMetadata,
    cartridgeRoot: options.cartridgeRoot,
    excludeDirectories: options.excludeDirectories,
  });
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
      const receipt = createReceipt(setId, receiptsRoot, itemResult.id);
      await writeAndVerifyReceipt(instance, receipt.receiptPath);

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
    const read = await readReceiptDirectory(instance, remotePath);
    if (!read.found) {
      results.push({...item, status: 'pending'});
      continue;
    }
    if (!read.valid) {
      onEvent?.({type: 'receipt-invalid', item, receiptPath: remotePath});
      results.push({...item, status: 'pending'});
      continue;
    }
    results.push({...item, status: 'skipped', receipt: createReceipt(setId, receiptsRoot, item.id)});
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

async function readReceiptDirectory(instance: B2CInstance, remotePath: string): Promise<ReceiptDirectoryReadResult> {
  try {
    const entries = await instance.webdav.propfind(remotePath, '0');
    return {found: true, valid: entries[0]?.isCollection === true};
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return {found: false, valid: false};
    throw new ImportSetStateError(
      `Unable to read WebDAV receipt directory ${remotePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function writeAndVerifyReceipt(instance: B2CInstance, remotePath: string): Promise<void> {
  let response = await instance.webdav.request(remotePath, {method: 'MKCOL'});
  if (response.status === 405) {
    const existing = await readReceiptDirectory(instance, remotePath);
    if (!existing.valid) {
      await deletePath(instance, remotePath);
      response = await instance.webdav.request(remotePath, {method: 'MKCOL'});
    }
  }
  if (response.status !== 201 && response.status !== 405) {
    throw new ImportSetStateError(
      `Unable to create WebDAV receipt directory ${remotePath}: ${response.status} ${response.statusText}`,
    );
  }

  const verification = await readReceiptDirectory(instance, remotePath);
  if (!verification.found || !verification.valid) {
    throw new ImportSetStateError(
      `Receipt directory verification failed for ${remotePath}; the import will be retried.`,
    );
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

function createReceipt(setId: string, receiptsRoot: string, itemId: string): ImportSetReceipt {
  return {version: 1, setId, itemId, receiptPath: receiptPath(receiptsRoot, itemId)};
}

function receiptPath(receiptsRoot: string, itemId: string): string {
  return `${receiptsRoot}/${createHash('sha256').update(itemId).digest('hex')}`;
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
