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
  // Common pipelets
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
  Eval: {
    name: 'Eval',
    description: 'Evaluates JavaScript expressions',
    requiredImports: [],
    canError: false,
    transactional: false,
  },

  // Form pipelets
  ClearFormElement: {
    name: 'ClearFormElement',
    description: 'Clears a form element',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  UpdateFormWithObject: {
    name: 'UpdateFormWithObject',
    description: 'Copies values from an object to a form',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  InvalidateFormElement: {
    name: 'InvalidateFormElement',
    description: 'Invalidates a form element',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  SetFormOptions: {
    name: 'SetFormOptions',
    description: 'Sets options for a form field',
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
  AcceptForm: {
    name: 'AcceptForm',
    description: 'Validates and accepts form submission',
    requiredImports: [],
    canError: true,
    transactional: false,
  },

  // Product/Catalog pipelets
  GetProduct: {
    name: 'GetProduct',
    description: 'Retrieves a product by ID',
    requiredImports: ['dw/catalog/ProductMgr'],
    canError: true,
    transactional: false,
  },
  GetCategory: {
    name: 'GetCategory',
    description: 'Retrieves a category by ID',
    requiredImports: ['dw/catalog/CatalogMgr'],
    canError: true,
    transactional: false,
  },
  UpdateProductOptionSelections: {
    name: 'UpdateProductOptionSelections',
    description: 'Updates product option selections',
    requiredImports: ['dw/catalog/ProductOptionModel'],
    canError: false,
    transactional: false,
  },
  UpdateProductVariationSelections: {
    name: 'UpdateProductVariationSelections',
    description: 'Updates product variation selections',
    requiredImports: ['dw/catalog/ProductVariationModel'],
    canError: false,
    transactional: false,
  },

  // Customer pipelets
  GetCustomer: {
    name: 'GetCustomer',
    description: 'Retrieves a customer by login',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: true,
    transactional: false,
  },
  GetCustomerAddress: {
    name: 'GetCustomerAddress',
    description: 'Retrieves a customer address by ID',
    requiredImports: [],
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
  CreateCustomerAddress: {
    name: 'CreateCustomerAddress',
    description: 'Creates a new customer address',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveCustomerAddress: {
    name: 'RemoveCustomerAddress',
    description: 'Removes a customer address',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveCustomer: {
    name: 'RemoveCustomer',
    description: 'Removes a customer',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: true,
    transactional: true,
  },
  GetCustomerPaymentInstruments: {
    name: 'GetCustomerPaymentInstruments',
    description: 'Gets customer payment instruments',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  CreateCustomerPaymentInstrument: {
    name: 'CreateCustomerPaymentInstrument',
    description: 'Creates a customer payment instrument',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveCustomerPaymentInstrument: {
    name: 'RemoveCustomerPaymentInstrument',
    description: 'Removes a customer payment instrument',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  SetCustomerPassword: {
    name: 'SetCustomerPassword',
    description: 'Sets a customer password',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  GenerateResetPasswordToken: {
    name: 'GenerateResetPasswordToken',
    description: 'Generates a password reset token',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  ResetCustomerPassword: {
    name: 'ResetCustomerPassword',
    description: 'Resets customer password with token',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  ResetCustomerPasswordWithToken: {
    name: 'ResetCustomerPasswordWithToken',
    description: 'Resets customer password with token',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  ValidateResetPasswordToken: {
    name: 'ValidateResetPasswordToken',
    description: 'Validates a password reset token',
    requiredImports: ['dw/customer/CustomerMgr'],
    canError: true,
    transactional: false,
  },

  // Basket pipelets
  GetBasket: {
    name: 'GetBasket',
    description: 'Gets the current basket',
    requiredImports: ['dw/order/BasketMgr'],
    canError: true,
    transactional: false,
  },
  AddProductToBasket: {
    name: 'AddProductToBasket',
    description: 'Adds a product to the basket',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveProductLineItem: {
    name: 'RemoveProductLineItem',
    description: 'Removes a product line item from basket',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  UpdateProductLineItemQuantity: {
    name: 'UpdateProductLineItemQuantity',
    description: 'Updates product line item quantity',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  AddPaymentInstrumentToBasket: {
    name: 'AddPaymentInstrumentToBasket',
    description: 'Adds a payment instrument to basket',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveBasketPaymentInstrument: {
    name: 'RemoveBasketPaymentInstrument',
    description: 'Removes a payment instrument from basket',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  CreateBillingAddress: {
    name: 'CreateBillingAddress',
    description: 'Creates a billing address on basket',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  CreateShipment: {
    name: 'CreateShipment',
    description: 'Creates a shipment on basket',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  CreateShippingAddress: {
    name: 'CreateShippingAddress',
    description: 'Creates a shipping address on shipment',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  SetShippingMethod: {
    name: 'SetShippingMethod',
    description: 'Sets shipping method on shipment',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  AddCouponToBasket: {
    name: 'AddCouponToBasket',
    description: 'Adds a coupon to basket',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  AddCouponToBasket2: {
    name: 'AddCouponToBasket2',
    description: 'Adds a coupon to basket',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveCouponLineItem: {
    name: 'RemoveCouponLineItem',
    description: 'Removes a coupon from basket',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  AddBonusProductToBasket: {
    name: 'AddBonusProductToBasket',
    description: 'Adds a bonus product to basket',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  CreateBasketForOrderEdit: {
    name: 'CreateBasketForOrderEdit',
    description: 'Creates a basket from an order for editing',
    requiredImports: ['dw/order/BasketMgr'],
    canError: true,
    transactional: true,
  },
  StartCheckout: {
    name: 'StartCheckout',
    description: 'Starts the checkout process',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  ReserveInventoryForOrder: {
    name: 'ReserveInventoryForOrder',
    description: 'Reserves inventory for an order',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  ReplaceLineItemProduct: {
    name: 'ReplaceLineItemProduct',
    description: 'Replaces the product on a line item',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  VerifyPaymentCard: {
    name: 'VerifyPaymentCard',
    description: 'Verifies a payment card',
    requiredImports: [],
    canError: true,
    transactional: false,
  },

  // Order pipelets
  GetOrder: {
    name: 'GetOrder',
    description: 'Retrieves an order by order number',
    requiredImports: ['dw/order/OrderMgr'],
    canError: true,
    transactional: false,
  },
  CreateOrder: {
    name: 'CreateOrder',
    description: 'Creates an order from basket',
    requiredImports: ['dw/order/OrderMgr'],
    canError: true,
    transactional: true,
  },
  CreateOrder2: {
    name: 'CreateOrder2',
    description: 'Creates an order from basket',
    requiredImports: ['dw/order/OrderMgr'],
    canError: true,
    transactional: true,
  },
  PlaceOrder: {
    name: 'PlaceOrder',
    description: 'Places an order',
    requiredImports: ['dw/order/OrderMgr'],
    canError: true,
    transactional: true,
  },
  FailOrder: {
    name: 'FailOrder',
    description: 'Fails an order',
    requiredImports: ['dw/order/OrderMgr'],
    canError: true,
    transactional: true,
  },
  CancelOrder: {
    name: 'CancelOrder',
    description: 'Cancels an order',
    requiredImports: ['dw/order/OrderMgr'],
    canError: true,
    transactional: true,
  },
  CreateOrderNo: {
    name: 'CreateOrderNo',
    description: 'Creates a new order number',
    requiredImports: ['dw/order/OrderMgr'],
    canError: false,
    transactional: false,
  },

  // Gift certificate pipelets
  GetGiftCertificate: {
    name: 'GetGiftCertificate',
    description: 'Retrieves a gift certificate by code',
    requiredImports: ['dw/order/GiftCertificateMgr'],
    canError: true,
    transactional: false,
  },
  CreateGiftCertificate: {
    name: 'CreateGiftCertificate',
    description: 'Creates a new gift certificate',
    requiredImports: ['dw/order/GiftCertificateMgr'],
    canError: true,
    transactional: true,
  },
  RedeemGiftCertificate: {
    name: 'RedeemGiftCertificate',
    description: 'Redeems a gift certificate',
    requiredImports: ['dw/order/GiftCertificateMgr'],
    canError: true,
    transactional: true,
  },
  AddGiftCertificateToBasket: {
    name: 'AddGiftCertificateToBasket',
    description: 'Adds a gift certificate line item to basket',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveGiftCertificateLineItem: {
    name: 'RemoveGiftCertificateLineItem',
    description: 'Removes a gift certificate line item from basket',
    requiredImports: [],
    canError: false,
    transactional: true,
  },

  // Payment pipelets
  GetPaymentProcessor: {
    name: 'GetPaymentProcessor',
    description: 'Gets the payment processor for a payment method',
    requiredImports: [],
    canError: false,
    transactional: false,
  },

  // Search pipelets
  Search: {
    name: 'Search',
    description: 'Performs a product search',
    requiredImports: ['dw/catalog/ProductSearchModel'],
    canError: false,
    transactional: false,
  },
  SearchProducts: {
    name: 'SearchProducts',
    description: 'Searches for products',
    requiredImports: ['dw/catalog/ProductSearchModel'],
    canError: true,
    transactional: false,
  },
  SearchSystemObject: {
    name: 'SearchSystemObject',
    description: 'Searches for system objects',
    requiredImports: [],
    canError: true,
    transactional: false,
  },
  SearchCustomObject: {
    name: 'SearchCustomObject',
    description: 'Searches for custom objects',
    requiredImports: ['dw/object/CustomObjectMgr'],
    canError: true,
    transactional: false,
  },
  Paging: {
    name: 'Paging',
    description: 'Creates a paging model',
    requiredImports: ['dw/web/PagingModel'],
    canError: false,
    transactional: false,
  },
  GetSearchSuggestions: {
    name: 'GetSearchSuggestions',
    description: 'Gets search suggestions',
    requiredImports: ['dw/suggest/SuggestModel'],
    canError: false,
    transactional: false,
  },
  SearchRedirectURL: {
    name: 'SearchRedirectURL',
    description: 'Gets the redirect URL from search model',
    requiredImports: [],
    canError: false,
    transactional: false,
  },

  // Store pipelets
  GetNearestStores: {
    name: 'GetNearestStores',
    description: 'Finds stores near a location',
    requiredImports: ['dw/catalog/StoreMgr'],
    canError: false,
    transactional: false,
  },

  // Content pipelets
  GetContent: {
    name: 'GetContent',
    description: 'Retrieves content by ID',
    requiredImports: ['dw/content/ContentMgr'],
    canError: true,
    transactional: false,
  },

  // ProductList pipelets
  GetProductList: {
    name: 'GetProductList',
    description: 'Retrieves a product list',
    requiredImports: ['dw/customer/ProductListMgr'],
    canError: true,
    transactional: false,
  },
  GetProductLists: {
    name: 'GetProductLists',
    description: 'Retrieves product lists for a customer',
    requiredImports: ['dw/customer/ProductListMgr'],
    canError: false,
    transactional: false,
  },
  CreateProductList: {
    name: 'CreateProductList',
    description: 'Creates a new product list',
    requiredImports: ['dw/customer/ProductListMgr'],
    canError: true,
    transactional: true,
  },
  AddProductToProductList: {
    name: 'AddProductToProductList',
    description: 'Adds a product to a product list',
    requiredImports: [],
    canError: true,
    transactional: true,
  },
  RemoveProductListItem: {
    name: 'RemoveProductListItem',
    description: 'Removes an item from a product list',
    requiredImports: [],
    canError: false,
    transactional: true,
  },
  RemoveProductList: {
    name: 'RemoveProductList',
    description: 'Removes a product list',
    requiredImports: ['dw/customer/ProductListMgr'],
    canError: true,
    transactional: true,
  },
  SearchProductLists: {
    name: 'SearchProductLists',
    description: 'Searches for product lists',
    requiredImports: ['dw/customer/ProductListMgr'],
    canError: false,
    transactional: false,
  },

  // Mail pipelet
  SendMail: {
    name: 'SendMail',
    description: 'Sends an email',
    requiredImports: ['dw/net/Mail'],
    canError: true,
    transactional: false,
  },

  // Page metadata pipelet
  UpdatePageMetaData: {
    name: 'UpdatePageMetaData',
    description: 'Updates page meta tags',
    requiredImports: [],
    canError: false,
    transactional: false,
  },

  // CSRF pipelets
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

  // Locale/Currency pipelets
  SetRequestLocale: {
    name: 'SetRequestLocale',
    description: 'Sets the request locale',
    requiredImports: [],
    canError: false,
    transactional: false,
  },
  SetSessionCurrency: {
    name: 'SetSessionCurrency',
    description: 'Sets the session currency',
    requiredImports: [],
    canError: false,
    transactional: false,
  },

  // CustomObject pipelets
  CreateCustomObject: {
    name: 'CreateCustomObject',
    description: 'Creates a custom object',
    requiredImports: ['dw/object/CustomObjectMgr'],
    canError: true,
    transactional: true,
  },
  RemoveCustomObject: {
    name: 'RemoveCustomObject',
    description: 'Removes a custom object',
    requiredImports: ['dw/object/CustomObjectMgr'],
    canError: true,
    transactional: true,
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
