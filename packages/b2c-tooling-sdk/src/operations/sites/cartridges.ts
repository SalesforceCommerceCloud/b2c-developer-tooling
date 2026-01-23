/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Site cartridge path operations for B2C Commerce.
 *
 * This module provides functions for reading and modifying site cartridge paths
 * via OCAPI. Cartridge paths determine which cartridges are used for a site.
 *
 * @module operations/sites/cartridges
 */
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Position for adding a cartridge to the path.
 */
export type CartridgePosition = 'first' | 'last' | 'before' | 'after';

/**
 * Gets the cartridge path for a site.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @returns Array of cartridge names in the path, or empty array if none
 * @throws Error if the site cannot be retrieved
 *
 * @example
 * ```typescript
 * const cartridges = await getSiteCartridgePath(instance, 'RefArch');
 * // ['app_storefront_base', 'int_marketing', 'bm_custom']
 * ```
 */
export async function getSiteCartridgePath(instance: B2CInstance, siteId: string): Promise<string[]> {
  const logger = getLogger();
  logger.debug({siteId}, `Getting cartridge path for site ${siteId}`);

  const {data, error} = await instance.ocapi.GET('/sites/{site_id}', {
    params: {path: {site_id: siteId}},
  });

  if (error) {
    throw new Error(`Failed to get site ${siteId}`, {cause: error});
  }

  const cartridgesString = data?.cartridges ?? '';
  const cartridges = cartridgesString ? cartridgesString.split(':').filter(Boolean) : [];

  logger.debug({siteId, cartridges}, `Site ${siteId} has ${cartridges.length} cartridge(s)`);
  return cartridges;
}

/**
 * Adds a cartridge to a site's cartridge path.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param cartridgeName - Name of the cartridge to add
 * @param position - Where to add: 'first', 'last', 'before', or 'after'
 * @param target - Target cartridge name (required for 'before'/'after')
 * @returns Updated cartridge path as array
 * @throws Error if the operation fails
 *
 * @example
 * ```typescript
 * // Add to the beginning
 * await addCartridgeToSite(instance, 'RefArch', 'my_cartridge', 'first');
 *
 * // Add before a specific cartridge
 * await addCartridgeToSite(instance, 'RefArch', 'my_cartridge', 'before', 'app_storefront_base');
 * ```
 */
export async function addCartridgeToSite(
  instance: B2CInstance,
  siteId: string,
  cartridgeName: string,
  position: CartridgePosition,
  target?: string,
): Promise<string[]> {
  const logger = getLogger();
  logger.debug({siteId, cartridgeName, position, target}, `Adding cartridge ${cartridgeName} to site ${siteId}`);

  if ((position === 'before' || position === 'after') && !target) {
    throw new Error(`Target cartridge required when position is '${position}'`);
  }

  const body: {name: string; position: CartridgePosition; target?: string} = {
    name: cartridgeName,
    position,
  };

  if (target) {
    body.target = target;
  }

  const {data, error} = await instance.ocapi.POST('/sites/{site_id}/cartridges', {
    params: {path: {site_id: siteId}},
    body,
  });

  if (error) {
    throw new Error(`Failed to add cartridge ${cartridgeName} to site ${siteId}`, {cause: error});
  }

  const cartridgesString = data?.cartridges ?? '';
  const cartridges = cartridgesString ? cartridgesString.split(':').filter(Boolean) : [];

  logger.debug({siteId, cartridges}, `Cartridge ${cartridgeName} added to site ${siteId}`);
  return cartridges;
}

/**
 * Removes a cartridge from a site's cartridge path.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param cartridgeName - Name of the cartridge to remove
 * @returns Updated cartridge path as array
 * @throws Error if the operation fails (e.g., cartridge not in path or is a system cartridge)
 *
 * @example
 * ```typescript
 * await removeCartridgeFromSite(instance, 'RefArch', 'my_cartridge');
 * ```
 */
export async function removeCartridgeFromSite(
  instance: B2CInstance,
  siteId: string,
  cartridgeName: string,
): Promise<string[]> {
  const logger = getLogger();
  logger.debug({siteId, cartridgeName}, `Removing cartridge ${cartridgeName} from site ${siteId}`);

  const {data, error} = await instance.ocapi.DELETE('/sites/{site_id}/cartridges/{cartridge_name}', {
    params: {path: {site_id: siteId, cartridge_name: cartridgeName}},
  });

  if (error) {
    throw new Error(`Failed to remove cartridge ${cartridgeName} from site ${siteId}`, {cause: error});
  }

  const cartridgesString = data?.cartridges ?? '';
  const cartridges = cartridgesString ? cartridgesString.split(':').filter(Boolean) : [];

  logger.debug({siteId, cartridges}, `Cartridge ${cartridgeName} removed from site ${siteId}`);
  return cartridges;
}

/**
 * Sets (overwrites) the entire cartridge path for a site.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param cartridges - Array of cartridge names to set as the new path
 * @returns Updated cartridge path as array
 * @throws Error if the operation fails
 *
 * @example
 * ```typescript
 * await setSiteCartridgePath(instance, 'RefArch', ['my_cartridge', 'app_storefront_base']);
 * ```
 */
export async function setSiteCartridgePath(
  instance: B2CInstance,
  siteId: string,
  cartridges: string[],
): Promise<string[]> {
  const logger = getLogger();
  logger.debug({siteId, cartridges}, `Setting cartridge path for site ${siteId}`);

  const cartridgesString = cartridges.join(':');

  const {data, error} = await instance.ocapi.PUT('/sites/{site_id}/cartridges', {
    params: {path: {site_id: siteId}},
    body: {cartridges: cartridgesString},
  });

  if (error) {
    throw new Error(`Failed to set cartridge path for site ${siteId}`, {cause: error});
  }

  const resultString = data?.cartridges ?? '';
  const result = resultString ? resultString.split(':').filter(Boolean) : [];

  logger.debug({siteId, result}, `Cartridge path set for site ${siteId}`);
  return result;
}
