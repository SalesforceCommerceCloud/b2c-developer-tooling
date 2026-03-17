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
 * SCAPI/OCAPI hook extension points.
 */
export const SCAPI_OCAPI_HOOK_POINTS: ScaffoldChoice[] = [
  // Basket
  {value: 'dw.ocapi.shop.basket.beforePOST_v2', label: 'Basket beforePOST'},
  {value: 'dw.ocapi.shop.basket.afterPOST', label: 'Basket afterPOST'},
  {value: 'dw.ocapi.shop.basket.modifyPOSTResponse', label: 'Basket modifyPOSTResponse'},
  {value: 'dw.ocapi.shop.basket.beforePATCH', label: 'Basket beforePATCH'},
  {value: 'dw.ocapi.shop.basket.afterPATCH', label: 'Basket afterPATCH'},
  {value: 'dw.ocapi.shop.basket.modifyPATCHResponse', label: 'Basket modifyPATCHResponse'},
  {value: 'dw.ocapi.shop.basket.modifyGETResponse', label: 'Basket modifyGETResponse'},
  {value: 'dw.ocapi.shop.basket.validateBasket', label: 'Basket validateBasket'},
  // Basket sub-resources
  {value: 'dw.ocapi.shop.basket.billing_address.beforePUT', label: 'Basket Billing Address beforePUT'},
  {value: 'dw.ocapi.shop.basket.billing_address.afterPUT', label: 'Basket Billing Address afterPUT'},
  {value: 'dw.ocapi.shop.basket.items.beforePOST', label: 'Basket Items beforePOST'},
  {value: 'dw.ocapi.shop.basket.items.afterPOST', label: 'Basket Items afterPOST'},
  {value: 'dw.ocapi.shop.basket.item.beforePATCH', label: 'Basket Item beforePATCH'},
  {value: 'dw.ocapi.shop.basket.item.afterPATCH', label: 'Basket Item afterPATCH'},
  {value: 'dw.ocapi.shop.basket.item.beforeDELETE', label: 'Basket Item beforeDELETE'},
  {value: 'dw.ocapi.shop.basket.item.afterDELETE', label: 'Basket Item afterDELETE'},
  {value: 'dw.ocapi.shop.basket.coupon.beforePOST', label: 'Basket Coupon beforePOST'},
  {value: 'dw.ocapi.shop.basket.coupon.afterPOST', label: 'Basket Coupon afterPOST'},
  {value: 'dw.ocapi.shop.basket.payment_instrument.beforePOST', label: 'Basket Payment Instrument beforePOST'},
  {value: 'dw.ocapi.shop.basket.payment_instrument.afterPOST', label: 'Basket Payment Instrument afterPOST'},
  {value: 'dw.ocapi.shop.basket.shipment.beforePATCH', label: 'Basket Shipment beforePATCH'},
  {value: 'dw.ocapi.shop.basket.shipment.afterPATCH', label: 'Basket Shipment afterPATCH'},
  {value: 'dw.ocapi.shop.basket.shipment.shipping_address.beforePUT', label: 'Basket Shipping Address beforePUT'},
  {value: 'dw.ocapi.shop.basket.shipment.shipping_address.afterPUT', label: 'Basket Shipping Address afterPUT'},
  {value: 'dw.ocapi.shop.basket.shipment.shipping_method.beforePUT', label: 'Basket Shipping Method beforePUT'},
  {value: 'dw.ocapi.shop.basket.shipment.shipping_method.afterPUT', label: 'Basket Shipping Method afterPUT'},
  // Order
  {value: 'dw.ocapi.shop.order.beforePOST', label: 'Shop Order beforePOST'},
  {value: 'dw.ocapi.shop.order.afterPOST', label: 'Shop Order afterPOST'},
  {value: 'dw.ocapi.shop.order.modifyPOSTResponse', label: 'Shop Order modifyPOSTResponse'},
  {value: 'dw.ocapi.shop.order.modifyGETResponse', label: 'Shop Order modifyGETResponse'},
  {value: 'dw.ocapi.shop.order.validateOrder', label: 'Shop Order validateOrder'},
  {value: 'dw.ocapi.shop.order.payment_instrument.beforePOST', label: 'Order Payment Instrument beforePOST'},
  {value: 'dw.ocapi.shop.order.payment_instrument.afterPOST', label: 'Order Payment Instrument afterPOST'},
  // Customer
  {value: 'dw.ocapi.shop.customer.beforePOST', label: 'Customer beforePOST'},
  {value: 'dw.ocapi.shop.customer.afterPOST', label: 'Customer afterPOST'},
  {value: 'dw.ocapi.shop.customer.modifyGETResponse', label: 'Customer modifyGETResponse'},
  {value: 'dw.ocapi.shop.customer.modifyPOSTResponse', label: 'Customer modifyPOSTResponse'},
  // Auth
  {value: 'dw.ocapi.shop.auth.beforePOST', label: 'Auth beforePOST'},
  {value: 'dw.ocapi.shop.auth.afterPOST', label: 'Auth afterPOST'},
  {value: 'dw.ocapi.shop.auth.modifyPOSTResponse', label: 'Auth modifyPOSTResponse'},
  // Product
  {value: 'dw.ocapi.shop.product.modifyGETResponse', label: 'Product modifyGETResponse'},
  {value: 'dw.ocapi.shop.product_search.modifyGETResponse', label: 'Product Search modifyGETResponse'},
];

/**
 * System hook extension points.
 * Verified against Script API: CalculateHooks, PaymentHooks, OrderHooks,
 * BasketMergeHooks, CheckoutHooks, ReturnHooks, ShippingOrderHooks, RequestHooks
 */
export const SYSTEM_HOOK_POINTS: ScaffoldChoice[] = [
  // CalculateHooks
  {value: 'dw.order.calculate', label: 'Order Calculate'},
  {value: 'dw.order.calculateShipping', label: 'Calculate Shipping'},
  {value: 'dw.order.calculateTax', label: 'Calculate Tax'},
  // PaymentHooks
  {value: 'dw.order.payment.authorize', label: 'Payment Authorize'},
  {value: 'dw.order.payment.authorizeCreditCard', label: 'Payment Authorize Credit Card'},
  {value: 'dw.order.payment.capture', label: 'Payment Capture'},
  {value: 'dw.order.payment.refund', label: 'Payment Refund'},
  {value: 'dw.order.payment.validateAuthorization', label: 'Payment Validate Authorization'},
  {value: 'dw.order.payment.reauthorize', label: 'Payment Reauthorize'},
  {value: 'dw.order.payment.releaseAuthorization', label: 'Payment Release Authorization'},
  // OrderHooks
  {value: 'dw.order.createOrderNo', label: 'Create Order Number'},
  // BasketMergeHooks
  {value: 'dw.order.mergeBasket', label: 'Merge Basket'},
  // CheckoutHooks
  {value: 'dw.order.populateCustomerDetails', label: 'Populate Customer Details'},
  // RequestHooks
  {value: 'dw.system.request.onRequest', label: 'On Request'},
  {value: 'dw.system.request.onSession', label: 'On Session'},
];

/**
 * All hook extension points (combined).
 */
export const HOOK_POINTS: ScaffoldChoice[] = [...SCAPI_OCAPI_HOOK_POINTS, ...SYSTEM_HOOK_POINTS];

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
    case 'scapi-ocapi-hook-points': {
      return {choices: SCAPI_OCAPI_HOOK_POINTS};
    }
    case 'system-hook-points': {
      return {choices: SYSTEM_HOOK_POINTS};
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
