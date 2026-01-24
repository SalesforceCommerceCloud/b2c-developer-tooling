/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Pipelet registry and mappings.
 *
 * Contains information about how to convert common pipelets to JavaScript.
 *
 * @module operations/pipeline/pipelets
 */

/**
 * Information about a pipelet's conversion to JavaScript.
 */
export interface PipeletMapping {
  /** The pipelet name. */
  name: string;
  /** Description of what the pipelet does. */
  description: string;
  /** Required imports for the converted code. */
  requiredImports: string[];
  /** Whether this pipelet can throw errors. */
  canError: boolean;
  /** Whether this pipelet is transactional. */
  transactional: boolean;
}

/**
 * Known pipelet mappings for conversion.
 */
export const PIPELET_MAPPINGS: Record<string, PipeletMapping> = {
  Assign: {
    name: 'Assign',
    description: 'Assigns values to variables',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  Script: {
    name: 'Script',
    description: 'Executes a script file',
    requiredImports: [],
    canError: true,
    transactional: false,
  },
  GetCustomer: {
    name: 'GetCustomer',
    description: 'Retrieves a customer by login',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: true,
    transactional: false,
  },
  CreateCustomer: {
    name: 'CreateCustomer',
    description: 'Creates a new customer',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: true,
    transactional: true,
  },
  LoginCustomer: {
    name: 'LoginCustomer',
    description: 'Authenticates a customer',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: true,
    transactional: false,
  },
  LogoutCustomer: {
    name: 'LogoutCustomer',
    description: 'Logs out the current customer',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: false,
    transactional: false,
  },
  UpdatePageMetaData: {
    name: 'UpdatePageMetaData',
    description: 'Updates page meta tags',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  UpdateObjectWithForm: {
    name: 'UpdateObjectWithForm',
    description: 'Updates a business object with form data',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  GetProductList: {
    name: 'GetProductList',
    description: 'Retrieves a product list',
    requiredImports: ['dw/customer/ProductListMgr'],
    canError: true,
    transactional: false,
  },
  GetBasket: {
    name: 'GetBasket',
    description: 'Gets the current basket',
    requiredImports: ['dw/order/BasketMgr'],
    canError: true,
    transactional: false,
  },
  SearchProducts: {
    name: 'SearchProducts',
    description: 'Searches for products',
    requiredImports: ['dw/catalog/ProductSearchModel'],
    canError: true,
    transactional: false,
  },
  SendMail: {
    name: 'SendMail',
    description: 'Sends an email',
    requiredImports: ['dw/net/Mail'],
    canError: true,
    transactional: false,
  },
  ValidateCSRFToken: {
    name: 'ValidateCSRFToken',
    description: 'Validates CSRF token',
    requiredImports: ['dw/web/CSRFProtection'],
    canError: true,
    transactional: false,
  },
  GenerateCSRFToken: {
    name: 'GenerateCSRFToken',
    description: 'Generates a CSRF token',
    requiredImports: ['dw/web/CSRFProtection'],
    canError: false,
    transactional: false,
  },
};

/**
 * Gets the mapping for a pipelet, or undefined if not mapped.
 */
export function getPipeletMapping(name: string): PipeletMapping | undefined {
  return PIPELET_MAPPINGS[name];
}

/**
 * Checks if a pipelet is known and can be converted.
 */
export function isPipeletMapped(name: string): boolean {
  return name in PIPELET_MAPPINGS;
}
