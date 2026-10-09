/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Site cartridge path operations for B2C Commerce instances.
 *
 * Provides functions for managing the ordered list of active cartridges
 * on a site via SCAPI with temporary OCAPI fallback, plus site archive
 * import/export when neither direct API is available.
 */
import JSZip from 'jszip';
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {siteArchiveImport, siteArchiveExportToBuffer} from '../jobs/site-archive.js';
import type {WaitForJobOptions} from '../jobs/run.js';
import {createSitesBackend} from './sites-backend.js';
import type {CartridgePosition} from './sites-types.js';

/** The special site ID for Business Manager. */
export const BM_SITE_ID = 'Sites-Site';

/** Position options for adding a cartridge. */
export type {CartridgePosition} from './sites-types.js';

/** Options for adding a cartridge to a site's cartridge path. */
export interface AddCartridgeOptions {
  /** Cartridge name to add. */
  name: string;
  /** Position to add the cartridge (default: 'first'). */
  position: CartridgePosition;
  /** Target cartridge name (required when position is 'before' or 'after'). */
  target?: string;
}

/** Options for cartridge path update operations that may run jobs. */
export interface CartridgeUpdateOptions {
  /** Callback for operation-level status messages (e.g. "Exporting site preferences..."). */
  log?: (message: string) => void;
  /** Wait options for underlying job execution (polling interval, timeout, progress). */
  waitOptions?: WaitForJobOptions;
}

/** Result of a cartridge path operation. */
export interface CartridgePathResult {
  /** Site ID. */
  siteId: string;
  /** Colon-separated cartridge path string. */
  cartridges: string;
  /** Cartridge names as an ordered array. */
  cartridgeList: string[];
}

/**
 * Parses a colon-separated cartridge path string into a CartridgePathResult.
 */
function toResult(siteId: string, cartridges: string): CartridgePathResult {
  const trimmed = cartridges.trim();
  return {
    siteId,
    cartridges: trimmed,
    cartridgeList: trimmed ? trimmed.split(':') : [],
  };
}

/**
 * Gets the cartridge path for a site.
 *
 * Uses the configured Sites backend to read the cartridge path. Auto mode
 * prefers SCAPI and temporarily falls back to OCAPI.
 * Works for all sites including Business Manager (Sites-Site).
 *
 * @param instance - B2C instance to query
 * @param siteId - Site ID (e.g. 'RefArch', 'Sites-Site')
 * @returns Cartridge path result
 *
 * @example
 * ```typescript
 * const result = await getCartridgePath(instance, 'RefArch');
 * console.log(result.cartridgeList); // ['app_storefront_base', 'plugin_applepay']
 *
 * // Business Manager
 * const bmResult = await getCartridgePath(instance, 'Sites-Site');
 * ```
 */
export async function getCartridgePath(instance: B2CInstance, siteId: string): Promise<CartridgePathResult> {
  try {
    const cartridges = await createSitesBackend({instance}).getCartridgePath(siteId);
    return toResult(siteId, cartridges);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get cartridge path for site "${siteId}": ${message}`, {cause: error});
  }
}

/**
 * Adds a cartridge to a site's cartridge path.
 *
 * For regular sites, uses the SCAPI-first Sites backend and falls back to site
 * archive import if neither direct backend is available.
 * For Business Manager (Sites-Site), always uses site archive import.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param options - Cartridge name, position, and optional target
 * @returns Updated cartridge path
 *
 * @example
 * ```typescript
 * // Add to beginning (default)
 * await addCartridge(instance, 'RefArch', { name: 'my_cartridge', position: 'first' });
 *
 * // Add before a specific cartridge
 * await addCartridge(instance, 'RefArch', {
 *   name: 'my_cartridge', position: 'before', target: 'app_storefront_base'
 * });
 *
 * // Business Manager
 * await addCartridge(instance, 'Sites-Site', { name: 'bm_ext', position: 'first' });
 * ```
 */
export async function addCartridge(
  instance: B2CInstance,
  siteId: string,
  options: AddCartridgeOptions,
  updateOptions?: CartridgeUpdateOptions,
): Promise<CartridgePathResult> {
  const logger = getLogger();

  // BM always uses import/export
  if (siteId === BM_SITE_ID) {
    logger.debug({siteId}, 'Business Manager site — using site archive import for cartridge add');
    return addCartridgeViaImport(instance, siteId, options, updateOptions);
  }

  const backend = createSitesBackend({instance});
  try {
    return toResult(siteId, await backend.addCartridge(siteId, options.name, options.position, options.target));
  } catch (backendError) {
    return handleFallback(instance, siteId, 'add', backendError, () =>
      addCartridgeViaImport(instance, siteId, options, updateOptions),
    );
  }
}

/**
 * Removes a cartridge from a site's cartridge path.
 *
 * For regular sites, uses the SCAPI-first Sites backend and falls back to site
 * archive import if neither direct backend is available.
 * For Business Manager (Sites-Site), always uses site archive import.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param cartridgeName - Name of the cartridge to remove
 * @returns Updated cartridge path
 *
 * @example
 * ```typescript
 * await removeCartridge(instance, 'RefArch', 'old_cartridge');
 * ```
 */
export async function removeCartridge(
  instance: B2CInstance,
  siteId: string,
  cartridgeName: string,
  updateOptions?: CartridgeUpdateOptions,
): Promise<CartridgePathResult> {
  const logger = getLogger();

  if (siteId === BM_SITE_ID) {
    logger.debug({siteId}, 'Business Manager site — using site archive import for cartridge remove');
    return removeCartridgeViaImport(instance, siteId, cartridgeName, updateOptions);
  }

  const backend = createSitesBackend({instance});
  try {
    return toResult(siteId, await backend.removeCartridge(siteId, cartridgeName));
  } catch (backendError) {
    return handleFallback(instance, siteId, 'remove', backendError, () =>
      removeCartridgeViaImport(instance, siteId, cartridgeName, updateOptions),
    );
  }
}

/**
 * Replaces the entire cartridge path for a site.
 *
 * For regular sites, uses the SCAPI-first Sites backend and falls back to site
 * archive import if neither direct backend is available.
 * For Business Manager (Sites-Site), always uses site archive import.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param cartridges - New cartridge path (colon-separated string)
 * @returns Updated cartridge path
 *
 * @example
 * ```typescript
 * await setCartridgePath(instance, 'RefArch', 'app_storefront_base:plugin_applepay');
 * ```
 */
export async function setCartridgePath(
  instance: B2CInstance,
  siteId: string,
  cartridges: string,
  updateOptions?: CartridgeUpdateOptions,
): Promise<CartridgePathResult> {
  const logger = getLogger();

  if (siteId === BM_SITE_ID) {
    logger.debug({siteId}, 'Business Manager site — using site archive import for cartridge set');
    return setCartridgePathViaImport(instance, siteId, cartridges, updateOptions);
  }

  const backend = createSitesBackend({instance});
  try {
    return toResult(siteId, await backend.setCartridgePath(siteId, cartridges));
  } catch (backendError) {
    return handleFallback(instance, siteId, 'set', backendError, () =>
      setCartridgePathViaImport(instance, siteId, cartridges, updateOptions),
    );
  }
}

// ---------------------------------------------------------------------------
// Internal: Fallback handler
// ---------------------------------------------------------------------------

async function handleFallback(
  instance: B2CInstance,
  siteId: string,
  operation: string,
  backendError: unknown,
  fallbackFn: () => Promise<CartridgePathResult>,
): Promise<CartridgePathResult> {
  const logger = getLogger();
  const backendMessage = backendError instanceof Error ? backendError.message : String(backendError);

  logger.warn(
    {siteId, operation, error: backendMessage},
    `Direct API ${operation} failed, trying site archive import fallback`,
  );

  try {
    return await fallbackFn();
  } catch (importError) {
    const importMessage = importError instanceof Error ? importError.message : String(importError);
    throw new Error(
      [
        `Failed to ${operation} cartridge path for site "${siteId}".`,
        '',
        `SCAPI/OCAPI direct update failed: ${backendMessage}`,
        `Site archive import fallback also failed: ${importMessage}`,
        '',
        'To fix, configure one of:',
        '  • SCAPI Sites API: Grant sfcc.sites.rw',
        '  • OCAPI Data API: Grant POST/PUT/DELETE on /sites/*/cartridges',
        '  • Site import: Grant job execution permissions for sfcc-site-archive-import and WebDAV write access to Impex/',
        '',
        'See: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html',
      ].join('\n'),
      {cause: importError},
    );
  }
}

// ---------------------------------------------------------------------------
// Internal: Import/export-based operations
// ---------------------------------------------------------------------------

/**
 * Reads the current cartridge path via site archive export.
 * Used as a fallback when OCAPI GET also fails.
 */
async function getCartridgePathViaExport(
  instance: B2CInstance,
  siteId: string,
  updateOptions?: CartridgeUpdateOptions,
): Promise<string> {
  const logger = getLogger();
  const {log, waitOptions} = updateOptions ?? {};
  logger.debug({siteId}, 'Reading cartridge path via site archive export');
  log?.(
    `Exporting ${siteId === BM_SITE_ID ? 'organization preferences' : 'site descriptor'} to read cartridge path...`,
  );

  if (siteId === BM_SITE_ID) {
    const result = await siteArchiveExportToBuffer(instance, {global_data: {preferences: true}}, {waitOptions});
    const zip = await JSZip.loadAsync(result.data);
    const prefsXml = await findFileInZip(zip, 'preferences.xml');
    if (!prefsXml) {
      throw new Error('preferences.xml not found in export archive');
    }
    return parseBmCartridgesFromPreferencesXml(prefsXml);
  }

  const result = await siteArchiveExportToBuffer(instance, {sites: {[siteId]: {site_descriptor: true}}}, {waitOptions});
  const zip = await JSZip.loadAsync(result.data);
  const descriptorXml = await findFileInZip(zip, 'site.xml');
  if (!descriptorXml) {
    throw new Error(`site.xml not found in export archive for site "${siteId}"`);
  }
  return parseSiteCartridgesFromDescriptorXml(descriptorXml);
}

async function setCartridgePathViaImport(
  instance: B2CInstance,
  siteId: string,
  cartridges: string,
  updateOptions?: CartridgeUpdateOptions,
): Promise<CartridgePathResult> {
  const logger = getLogger();
  const {log, waitOptions} = updateOptions ?? {};
  logger.debug({siteId, cartridges}, 'Setting cartridge path via site archive import');
  log?.('Importing updated cartridge path...');

  const zip = new JSZip();

  if (siteId === BM_SITE_ID) {
    zip.file('preferences.xml', generateBmPreferencesXml(cartridges));
  } else {
    const sitesFolder = zip.folder(`sites/${siteId}`)!;
    sitesFolder.file('site.xml', generateSiteDescriptorXml(siteId, cartridges));
  }

  const buffer = await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'});
  await siteArchiveImport(instance, buffer, {waitOptions});

  return toResult(siteId, cartridges);
}

async function addCartridgeViaImport(
  instance: B2CInstance,
  siteId: string,
  options: AddCartridgeOptions,
  updateOptions?: CartridgeUpdateOptions,
): Promise<CartridgePathResult> {
  // Read current path
  let currentPath: string;
  try {
    const result = await getCartridgePath(instance, siteId);
    currentPath = result.cartridges;
  } catch {
    currentPath = await getCartridgePathViaExport(instance, siteId, updateOptions);
  }

  const cartridgeList = currentPath ? currentPath.split(':') : [];

  // Check if already exists
  if (cartridgeList.includes(options.name)) {
    throw new Error(`Cartridge "${options.name}" already exists in the cartridge path for site "${siteId}"`);
  }

  // Apply position logic
  const newList = applyCartridgePosition(cartridgeList, options);

  return setCartridgePathViaImport(instance, siteId, newList.join(':'), updateOptions);
}

async function removeCartridgeViaImport(
  instance: B2CInstance,
  siteId: string,
  cartridgeName: string,
  updateOptions?: CartridgeUpdateOptions,
): Promise<CartridgePathResult> {
  let currentPath: string;
  try {
    const result = await getCartridgePath(instance, siteId);
    currentPath = result.cartridges;
  } catch {
    currentPath = await getCartridgePathViaExport(instance, siteId, updateOptions);
  }

  const cartridgeList = currentPath ? currentPath.split(':') : [];
  const index = cartridgeList.indexOf(cartridgeName);
  if (index === -1) {
    throw new Error(`Cartridge "${cartridgeName}" not found in the cartridge path for site "${siteId}"`);
  }

  cartridgeList.splice(index, 1);
  return setCartridgePathViaImport(instance, siteId, cartridgeList.join(':'), updateOptions);
}

// ---------------------------------------------------------------------------
// Internal: Cartridge position logic
// ---------------------------------------------------------------------------

function applyCartridgePosition(cartridgeList: string[], options: AddCartridgeOptions): string[] {
  const list = [...cartridgeList];
  const {name, position, target} = options;

  switch (position) {
    case 'first':
      list.unshift(name);
      break;
    case 'last':
      list.push(name);
      break;
    case 'before': {
      const idx = list.indexOf(target!);
      if (idx === -1) {
        throw new Error(`Target cartridge "${target}" not found in the cartridge path`);
      }
      list.splice(idx, 0, name);
      break;
    }
    case 'after': {
      const idx = list.indexOf(target!);
      if (idx === -1) {
        throw new Error(`Target cartridge "${target}" not found in the cartridge path`);
      }
      list.splice(idx + 1, 0, name);
      break;
    }
  }

  return list;
}

// ---------------------------------------------------------------------------
// Internal: XML generation and parsing
// ---------------------------------------------------------------------------

function generateBmPreferencesXml(cartridges: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <standard-preferences>
        <all-instances>
            <preference preference-id="CustomCartridges">${escapeXml(cartridges)}</preference>
        </all-instances>
    </standard-preferences>
</preferences>
`;
}

function generateSiteDescriptorXml(siteId: string, cartridges: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<site xmlns="http://www.demandware.com/xml/impex/site/2006-10-31" site-id="${escapeXml(siteId)}">
    <cartridges>${escapeXml(cartridges)}</cartridges>
</site>
`;
}

function parseBmCartridgesFromPreferencesXml(xml: string): string {
  // Extract CustomCartridges preference value
  const match = xml.match(/<preference\s+preference-id="CustomCartridges"[^>]*>([^<]*)<\/preference>/);
  return match?.[1]?.trim() ?? '';
}

function parseSiteCartridgesFromDescriptorXml(xml: string): string {
  // Extract cartridges element value
  const match = xml.match(/<cartridges>([^<]*)<\/cartridges>/);
  return match?.[1]?.trim() ?? '';
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function findFileInZip(zip: JSZip, filename: string): Promise<string | null> {
  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry.dir && path.endsWith(`/${filename}`)) {
      return entry.async('text');
    }
  }
  return null;
}
