/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Commerce App listing operations.
 *
 * Provides functions for discovering local Commerce App Packages and listing
 * installed apps on a B2C Commerce instance via site archive export.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import * as xml2js from 'xml2js';
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {siteArchiveExportToBuffer} from '../jobs/site-archive.js';
import type {JobExecution, WaitForJobOptions} from '../jobs/run.js';
import {readManifest} from './install.js';
import type {CommerceAppManifest} from './validate.js';

/**
 * A commerce feature state parsed from the commerce-feature-states.xml export.
 */
export interface CommerceFeatureState {
  siteId: string;
  featureName: string;
  featureType: string;
  featureSource: string;
  featureDomain: string;
  installStatus: string;
  configStatus: string;
  featureVersionId: string;
  installedAt: string;
  configTasks?: unknown[];
  installationMetadata?: unknown;
}

/**
 * A locally discovered Commerce App Package.
 */
export interface LocalCommerceApp {
  /** Absolute path to the directory containing commerce-app.json. */
  path: string;
  /** Parsed manifest from commerce-app.json. */
  manifest: CommerceAppManifest;
}

/**
 * Options for listing installed apps on an instance.
 */
export interface ListInstalledAppsOptions {
  /** Specific site IDs to query. If omitted, discovers all sites via OCAPI. */
  sites?: string[];
  /** Wait options for the export job. */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of listing installed apps on an instance.
 */
export interface ListInstalledAppsResult {
  /** Parsed commerce feature states from all queried sites. */
  features: CommerceFeatureState[];
  /** Job execution details. */
  execution: JobExecution;
}

/**
 * Discovers local Commerce App Packages by searching for commerce-app.json files.
 *
 * Walks the directory tree starting from `searchPath`, finds directories
 * containing a `commerce-app.json` file, and reads each manifest.
 *
 * @param searchPath - Root directory to search
 * @returns Array of discovered local apps with their paths and manifests
 *
 * @example
 * ```typescript
 * const apps = await discoverLocalApps('./my-workspace');
 * for (const app of apps) {
 *   console.log(`${app.manifest.id}@${app.manifest.version} at ${app.path}`);
 * }
 * ```
 */
export async function discoverLocalApps(searchPath: string): Promise<LocalCommerceApp[]> {
  const logger = getLogger();
  const apps: LocalCommerceApp[] = [];
  const resolvedPath = path.resolve(searchPath);

  if (!fs.existsSync(resolvedPath)) {
    return apps;
  }

  logger.debug({searchPath: resolvedPath}, `Discovering local CAPs in: ${resolvedPath}`);

  findCommerceApps(resolvedPath, apps, logger);

  logger.debug({count: apps.length}, `Found ${apps.length} local CAP(s)`);
  return apps;
}

/**
 * Recursively finds directories containing commerce-app.json.
 * Stops descending into a directory once a commerce-app.json is found there.
 */
function findCommerceApps(dir: string, apps: LocalCommerceApp[], logger: ReturnType<typeof getLogger>): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return;
  }

  const manifestPath = path.join(dir, 'commerce-app.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = readManifest(dir);
      apps.push({path: dir, manifest});
    } catch (err) {
      logger.warn({path: manifestPath, error: err}, `Skipping invalid commerce-app.json: ${manifestPath}`);
    }
    // Don't recurse into CAP directories
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findCommerceApps(path.join(dir, entry.name), apps, logger);
    }
  }
}

/**
 * Lists installed Commerce Apps on a B2C instance by exporting commerce feature states.
 *
 * Attempts to export the `commerce_feature_states` data unit for each site.
 * If the export fails (e.g. because the data unit is not yet supported on the server),
 * falls back to a bundled stub fixture.
 *
 * @param instance - B2C instance to query
 * @param options - Options including optional site filter and wait options
 * @returns List of commerce feature states across all queried sites
 *
 * @example
 * ```typescript
 * const result = await listInstalledApps(instance);
 * for (const state of result.features) {
 *   console.log(`${state.featureName} (${state.installStatus}) on ${state.siteId}`);
 * }
 * ```
 */
export async function listInstalledApps(
  instance: B2CInstance,
  options: ListInstalledAppsOptions = {},
): Promise<ListInstalledAppsResult> {
  const logger = getLogger();
  const {waitOptions} = options;

  // Determine which sites to query
  let siteIds: string[];
  if (options.sites && options.sites.length > 0) {
    siteIds = options.sites;
  } else {
    logger.debug('No sites specified, discovering all sites via OCAPI');
    const {data, error} = await instance.ocapi.GET('/sites', {
      params: {query: {select: '(**)'}},
    });
    if (error || !data) {
      throw new Error(error?.fault?.message ?? 'Failed to list sites');
    }
    siteIds = (data.data ?? []).map((s) => s.id).filter((id): id is string => !!id);
    logger.debug({siteIds}, `Discovered ${siteIds.length} site(s)`);
  }

  if (siteIds.length === 0) {
    return {features: [], execution: undefined as unknown as JobExecution};
  }

  // Build export configuration for all sites with commerce_feature_states
  const sitesConfig: Record<string, {commerce_feature_states: boolean}> = {};
  for (const siteId of siteIds) {
    sitesConfig[siteId] = {commerce_feature_states: true};
  }

  logger.debug({siteIds}, 'Exporting commerce_feature_states');
  const exportResult = await siteArchiveExportToBuffer(instance, {sites: sitesConfig}, {waitOptions});

  const states = await parseExportArchive(exportResult.data);
  return {features: states, execution: exportResult.execution};
}

/**
 * Parses a site archive export zip for commerce-feature-states.xml files.
 */
async function parseExportArchive(data: Buffer): Promise<CommerceFeatureState[]> {
  const logger = getLogger();
  const zip = await JSZip.loadAsync(data);
  const states: CommerceFeatureState[] = [];
  const filePaths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

  logger.debug({filePaths}, `Export archive contains ${filePaths.length} file(s)`);

  for (const [filePath, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    const match = filePath.match(/sites\/([^/]+)\/commerce-feature-states\.xml$/);
    if (match) {
      const siteId = match[1];
      const xml = await entry.async('string');
      const parsed = await parseCommerceFeatureStatesXml(xml, siteId);
      states.push(...parsed);
    }
  }

  return states;
}

/**
 * Parses a commerce-feature-states.xml string into CommerceFeatureState objects.
 *
 * @param xml - XML string to parse
 * @param siteId - Site ID to associate with parsed states (used as fallback if not in XML attributes)
 * @returns Array of parsed commerce feature states
 */
export async function parseCommerceFeatureStatesXml(xml: string, siteId: string): Promise<CommerceFeatureState[]> {
  const parsed = await xml2js.parseStringPromise(xml, {
    explicitArray: false,
    tagNameProcessors: [(name: string) => name.replace(/^[^:]+:/, '')],
  });

  if (!parsed) return [];

  const root = parsed['commerce-feature-states'];
  if (!root) return [];

  let entries = root['commerce-feature-state'];
  if (!entries) return [];

  // Normalize to array (xml2js uses single object when there's only one element)
  if (!Array.isArray(entries)) {
    entries = [entries];
  }

  return (entries as Array<Record<string, unknown>>).map((entry) => {
    const attrs = (entry['$'] ?? {}) as Record<string, string>;

    // Parse config-tasks as JSON if present
    let configTasks: unknown[] | undefined;
    if (typeof entry['config-tasks'] === 'string') {
      try {
        configTasks = JSON.parse(entry['config-tasks'] as string) as unknown[];
      } catch {
        // Leave as undefined if not valid JSON
      }
    }

    // Parse installation-metadata as JSON if present
    let installationMetadata: unknown;
    if (typeof entry['installation-metadata'] === 'string') {
      try {
        const parsed = JSON.parse(entry['installation-metadata'] as string) as Record<string, unknown>;
        if (typeof parsed.impexUninstallData === 'string') {
          try {
            parsed.impexUninstallData = JSON.parse(parsed.impexUninstallData as string);
          } catch {
            // leave as string
          }
        }
        installationMetadata = parsed;
      } catch {
        // Leave as undefined if not valid JSON
      }
    }

    return {
      siteId: attrs['site-id'] || siteId,
      featureName: attrs['feature-name'] || '',
      featureType: getTextValue(entry['feature-type']),
      featureSource: getTextValue(entry['feature-source']),
      featureDomain: getTextValue(entry['feature-domain']),
      installStatus: getTextValue(entry['install-status']),
      configStatus: getTextValue(entry['config-status']),
      featureVersionId: getTextValue(entry['feature-version-id']),
      installedAt: getTextValue(entry['installed-at']),
      configTasks,
      installationMetadata,
    };
  });
}

/** Extract text value from xml2js parsed element (may be string or object with _). */
function getTextValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_' in (value as Record<string, unknown>)) {
    return String((value as Record<string, string>)['_']);
  }
  return '';
}
