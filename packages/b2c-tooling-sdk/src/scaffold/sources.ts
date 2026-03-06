/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {findCartridges} from '../operations/code/cartridges.js';
import type {B2CInstance} from '../instance/index.js';
import type {OcapiComponents} from '../clients/index.js';
import type {ScaffoldChoice, ScaffoldParameter, DynamicParameterSource, SourceResult} from './types.js';

/**
 * Common B2C Commerce hook extension points.
 */
export const HOOK_POINTS: ScaffoldChoice[] = [
  {value: 'dw.order.calculate', label: 'Order Calculate'},
  {value: 'dw.order.calculateShipping', label: 'Calculate Shipping'},
  {value: 'dw.order.createOrder', label: 'Create Order'},
  {value: 'dw.order.afterPOST', label: 'OCAPI Order afterPOST'},
  {value: 'dw.order.beforePOST', label: 'OCAPI Order beforePOST'},
  {value: 'dw.ocapi.shop.basket.afterPOST', label: 'OCAPI Basket afterPOST'},
  {value: 'dw.ocapi.shop.basket.modifyGETResponse', label: 'OCAPI Basket modifyGET'},
  {value: 'dw.ocapi.shop.order.afterPOST', label: 'OCAPI Shop Order afterPOST'},
  {value: 'dw.ocapi.shop.order.beforePOST', label: 'OCAPI Shop Order beforePOST'},
  {value: 'dw.ocapi.data.order.afterPATCH', label: 'OCAPI Data Order afterPATCH'},
  {value: 'dw.customer.registration', label: 'Customer Registration'},
  {value: 'dw.customer.afterCreate', label: 'Customer afterCreate'},
  {value: 'app.payment.processor', label: 'Payment Processor'},
  {value: 'app.payment.form.processor', label: 'Payment Form Processor'},
  {value: 'dw.system.request.onSession', label: 'On Session'},
  {value: 'dw.extensions.csv.onFileProcess', label: 'CSV File Process'},
];

/**
 * Resolve a local (non-remote) parameter source.
 * Does not require authentication.
 *
 * @param source - The source type to resolve
 * @param projectRoot - Project root directory for cartridge discovery
 * @returns Resolved choices and optional path mapping
 */
export function resolveLocalSource(source: DynamicParameterSource, projectRoot: string): SourceResult {
  switch (source) {
    case 'cartridges': {
      const cartridges = findCartridges(projectRoot);
      const pathMap = new Map(cartridges.map((c) => [c.name, c.src]));
      return {
        choices: cartridges.map((c) => ({value: c.name, label: c.name})),
        pathMap,
      };
    }
    case 'hook-points': {
      return {choices: HOOK_POINTS};
    }
    default: {
      return {choices: []};
    }
  }
}

/**
 * Resolve a remote parameter source.
 * Requires authenticated B2CInstance (follows SDK operation pattern).
 *
 * @param source - The source type
 * @param instance - Authenticated B2C instance
 * @returns Promise resolving to choices array
 * @throws Error if API call fails
 */
export async function resolveRemoteSource(
  source: DynamicParameterSource,
  instance: B2CInstance,
): Promise<ScaffoldChoice[]> {
  switch (source) {
    case 'sites': {
      const {data, error} = await instance.ocapi.GET('/sites', {
        params: {query: {select: '(**)'}},
      });

      if (error) {
        throw new Error('Failed to fetch sites from B2C instance');
      }

      const sites = data as OcapiComponents['schemas']['sites'];
      return (sites.data ?? []).map((s) => ({
        value: s.id ?? '',
        label: s.display_name?.default || s.id || '',
      }));
    }
    default: {
      return [];
    }
  }
}

/**
 * Check if a source requires remote API access.
 *
 * @param source - The source type to check
 * @returns True if the source requires remote access
 */
export function isRemoteSource(source: DynamicParameterSource): boolean {
  return source === 'sites';
}

/**
 * Validate a value against a dynamic source (local only).
 * Used for non-interactive validation of provided values.
 *
 * @param source - The source type
 * @param value - The value to validate
 * @param projectRoot - Project root for local sources
 * @returns Object with valid status and available choices if invalid
 */
export function validateAgainstSource(
  source: DynamicParameterSource,
  value: string,
  projectRoot: string,
): {valid: boolean; availableChoices?: string[]} {
  if (source === 'cartridges') {
    const {choices} = resolveLocalSource(source, projectRoot);
    const valid = choices.some((c) => c.value === value);
    return {
      valid,
      availableChoices: valid ? undefined : choices.map((c) => c.value),
    };
  }

  // For hook-points and other sources, no validation (allow any value)
  return {valid: true};
}

/**
 * Path to use for scaffold destination so files are generated under outputDir (e.g. working directory).
 * Returns a path relative to projectRoot when the cartridge is under projectRoot, so the executor
 * joins with outputDir instead of ignoring it. Otherwise returns the absolute path.
 */
export function cartridgePathForDestination(absolutePath: string, projectRoot: string): string {
  const normalizedRoot = path.resolve(projectRoot);
  const normalizedPath = path.resolve(absolutePath);
  const relative = path.relative(normalizedRoot, normalizedPath);
  // Use relative path only when cartridge is under projectRoot (no leading '..')
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative;
  }
  return absolutePath;
}

/**
 * Result of detecting a source parameter value from a filesystem path.
 */
export interface SourceDetectionResult {
  /** The resolved parameter value (e.g., cartridge name) */
  value: string;
  /** Companion variables to set (e.g., { cartridgeNamePath: "cartridges/app_custom" }) */
  companionVariables: Record<string, string>;
}

/**
 * Detect a parameter's source value from a filesystem context path.
 *
 * For `cartridges` source: walks up from `contextPath` looking for a `.project` file
 * (cartridge marker), stopping at projectRoot. On match returns the cartridge name and
 * companion path variable.
 *
 * @param param - The scaffold parameter with a `source` field
 * @param contextPath - Filesystem path providing context (e.g., right-clicked folder)
 * @param projectRoot - Project root directory
 * @returns Detection result, or undefined if the source could not be detected
 */
export function detectSourceFromPath(
  param: ScaffoldParameter,
  contextPath: string,
  projectRoot: string,
): SourceDetectionResult | undefined {
  if (param.source !== 'cartridges') {
    return undefined;
  }

  const normalizedRoot = path.resolve(projectRoot);
  let current = path.resolve(contextPath);

  // Walk up from contextPath, checking for .project at each level
  while (current.length >= normalizedRoot.length) {
    const projectFile = path.join(current, '.project');
    if (fs.existsSync(projectFile)) {
      const cartridgeName = path.basename(current);
      const destPath = cartridgePathForDestination(current, projectRoot);
      return {
        value: cartridgeName,
        companionVariables: {[`${param.name}Path`]: destPath},
      };
    }

    const parent = path.dirname(current);
    if (parent === current) break; // filesystem root
    current = parent;
  }

  return undefined;
}
