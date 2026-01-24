/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Node generators for pipeline-to-controller conversion.
 *
 * @module operations/pipeline/generator/nodes
 */

import type {
  CallNodeIR,
  EndNodeIR,
  InteractionContinueNodeIR,
  InteractionNodeIR,
  JumpNodeIR,
  NodeIR,
  PipeletNodeIR,
} from '../types.js';
import {type GeneratorContext, indent} from './helpers.js';

// Import pipelet generators
import {generateAssignPipelet, generateEvalPipelet, generateScriptPipelet} from './pipelets/common.js';
import {
  generateAcceptFormPipelet,
  generateClearFormElementPipelet,
  generateInvalidateFormElementPipelet,
  generateSetFormOptionsPipelet,
  generateUpdateFormWithObjectPipelet,
  generateUpdateObjectWithFormPipelet,
} from './pipelets/form.js';
import {
  generateGetCategoryPipelet,
  generateGetProductPipelet,
  generateUpdateProductOptionSelectionsPipelet,
  generateUpdateProductVariationSelectionsPipelet,
} from './pipelets/product.js';
import {
  generateCreateCustomerAddressPipelet,
  generateCreateCustomerPaymentInstrumentPipelet,
  generateCreateCustomerPipelet,
  generateGenerateResetPasswordTokenPipelet,
  generateGetCustomerAddressPipelet,
  generateGetCustomerPaymentInstrumentsPipelet,
  generateGetCustomerPipelet,
  generateLoginCustomerPipelet,
  generateLogoutCustomerPipelet,
  generateRemoveCustomerAddressPipelet,
  generateRemoveCustomerPaymentInstrumentPipelet,
  generateRemoveCustomerPipelet,
  generateResetCustomerPasswordPipelet,
  generateSetCustomerPasswordPipelet,
  generateValidateResetPasswordTokenPipelet,
} from './pipelets/customer.js';
import {
  generateAddBonusProductToBasketPipelet,
  generateAddCouponToBasketPipelet,
  generateAddPaymentInstrumentToBasketPipelet,
  generateAddProductToBasketPipelet,
  generateCreateBasketForOrderEditPipelet,
  generateCreateBillingAddressPipelet,
  generateCreateShipmentPipelet,
  generateCreateShippingAddressPipelet,
  generateGetBasketPipelet,
  generateRemoveBasketPaymentInstrumentPipelet,
  generateRemoveCouponLineItemPipelet,
  generateRemoveProductLineItemPipelet,
  generateReplaceLineItemProductPipelet,
  generateReserveInventoryForOrderPipelet,
  generateSetShippingMethodPipelet,
  generateStartCheckoutPipelet,
  generateUpdateProductLineItemQuantityPipelet,
  generateVerifyPaymentCardPipelet,
} from './pipelets/basket.js';
import {
  generateCancelOrderPipelet,
  generateCreateOrderNoPipelet,
  generateCreateOrderPipelet,
  generateFailOrderPipelet,
  generateGetOrderPipelet,
  generatePlaceOrderPipelet,
} from './pipelets/order.js';
import {
  generateGetNearestStoresPipelet,
  generateGetSearchSuggestionsPipelet,
  generatePagingPipelet,
  generateSearchPipelet,
  generateSearchRedirectURLPipelet,
  generateSearchSystemObjectPipelet,
} from './pipelets/search.js';
import {
  generateAddGiftCertificateToBasketPipelet,
  generateAddProductToProductListPipelet,
  generateCreateGiftCertificatePipelet,
  generateCreateProductListPipelet,
  generateGetContentPipelet,
  generateGetGiftCertificatePipelet,
  generateGetProductListPipelet,
  generateGetProductListsPipelet,
  generateRedeemGiftCertificatePipelet,
  generateRemoveGiftCertificateLineItemPipelet,
  generateRemoveProductListItemPipelet,
  generateRemoveProductListPipelet,
  generateSearchProductListsPipelet,
  generateSendMailPipelet,
} from './pipelets/content.js';
import {
  generateCreateCustomObjectPipelet,
  generateGenerateCSRFTokenPipelet,
  generateGetPaymentProcessorPipelet,
  generateRemoveCustomObjectPipelet,
  generateSearchCustomObjectPipelet,
  generateSetRequestLocalePipelet,
  generateSetSessionCurrencyPipelet,
  generateUpdatePageMetaDataPipelet,
  generateValidateCSRFTokenPipelet,
} from './pipelets/misc.js';

/**
 * Generates code for a single node.
 */
export function generateNode(node: NodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  switch (node.type) {
    case 'start':
      // Start nodes don't generate code (they become function definitions)
      return '';

    case 'end':
      return generateEndNode(node, context);

    case 'pipelet':
      return generatePipeletNode(node, context);

    case 'call':
      return generateCallNode(node, context);

    case 'jump':
      return generateJumpNode(node, context);

    case 'interaction':
      return generateInteractionNode(node, context);

    case 'interaction-continue':
      return generateInteractionContinueNode(node, context);

    case 'join':
      // Join nodes are structural, no code generated
      return '';

    case 'decision':
    case 'loop':
      // These are handled at the block level
      return '';

    default:
      return `${ind}// TODO: Unhandled node type`;
  }
}

/**
 * Generates code for an end node.
 */
function generateEndNode(node: EndNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  if (node.name) {
    return `${ind}return '${node.name}';`;
  }
  return `${ind}return;`;
}

/**
 * Generates code for a call node.
 */
function generateCallNode(node: CallNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  if (node.pipelineName === context.pipelineName) {
    // Same pipeline - direct function call
    return `${ind}${node.startName}();`;
  } else {
    // Different pipeline - require and call
    return `${ind}require('./${node.pipelineName}').${node.startName}();`;
  }
}

/**
 * Generates code for a jump node.
 */
function generateJumpNode(node: JumpNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  // Convert Pipeline-Start to Controller-Action URL
  return `${ind}response.redirect(URLUtils.url('${node.pipelineName}-${node.startName}'));`;
}

/**
 * Generates code for an interaction node.
 */
function generateInteractionNode(node: InteractionNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  return `${ind}ISML.renderTemplate('${node.templateName}', pdict);`;
}

/**
 * Generates code for an interaction-continue node (the render part).
 */
function generateInteractionContinueNode(node: InteractionContinueNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  // Set ContinueURL to point to the handler function
  const handlerUrl = `${context.pipelineName}-${node.handlerStartName}`;
  const urlMethod = node.secure ? 'https' : 'url';

  lines.push(`${ind}pdict.ContinueURL = URLUtils.${urlMethod}('${handlerUrl}');`);
  lines.push(`${ind}ISML.renderTemplate('${node.templateName}', pdict);`);

  return lines.join('\n');
}

/**
 * Generates code for a pipelet node.
 */
function generatePipeletNode(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  switch (node.pipeletName) {
    // Common pipelets
    case 'Assign':
      return generateAssignPipelet(node, context);
    case 'Script':
      return generateScriptPipelet(node, context);
    case 'Eval':
      return generateEvalPipelet(node, context);

    // Form pipelets
    case 'ClearFormElement':
      return generateClearFormElementPipelet(node, context);
    case 'UpdateFormWithObject':
      return generateUpdateFormWithObjectPipelet(node, context);
    case 'InvalidateFormElement':
      return generateInvalidateFormElementPipelet(node, context);
    case 'SetFormOptions':
      return generateSetFormOptionsPipelet(node, context);
    case 'UpdateObjectWithForm':
      return generateUpdateObjectWithFormPipelet(node, context);
    case 'AcceptForm':
      return generateAcceptFormPipelet(node, context);

    // Product/Catalog pipelets
    case 'GetProduct':
      return generateGetProductPipelet(node, context);
    case 'GetCategory':
      return generateGetCategoryPipelet(node, context);
    case 'UpdateProductOptionSelections':
      return generateUpdateProductOptionSelectionsPipelet(node, context);
    case 'UpdateProductVariationSelections':
      return generateUpdateProductVariationSelectionsPipelet(node, context);

    // Customer pipelets
    case 'GetCustomer':
      return generateGetCustomerPipelet(node, context);
    case 'GetCustomerAddress':
      return generateGetCustomerAddressPipelet(node, context);
    case 'CreateCustomer':
      return generateCreateCustomerPipelet(node, context);
    case 'LoginCustomer':
      return generateLoginCustomerPipelet(node, context);
    case 'LogoutCustomer':
      return generateLogoutCustomerPipelet(node, context);
    case 'CreateCustomerAddress':
      return generateCreateCustomerAddressPipelet(node, context);
    case 'RemoveCustomerAddress':
      return generateRemoveCustomerAddressPipelet(node, context);
    case 'RemoveCustomer':
      return generateRemoveCustomerPipelet(node, context);
    case 'GetCustomerPaymentInstruments':
      return generateGetCustomerPaymentInstrumentsPipelet(node, context);
    case 'CreateCustomerPaymentInstrument':
      return generateCreateCustomerPaymentInstrumentPipelet(node, context);
    case 'RemoveCustomerPaymentInstrument':
      return generateRemoveCustomerPaymentInstrumentPipelet(node, context);
    case 'SetCustomerPassword':
      return generateSetCustomerPasswordPipelet(node, context);
    case 'GenerateResetPasswordToken':
      return generateGenerateResetPasswordTokenPipelet(node, context);
    case 'ResetCustomerPassword':
    case 'ResetCustomerPasswordWithToken':
      return generateResetCustomerPasswordPipelet(node, context);
    case 'ValidateResetPasswordToken':
      return generateValidateResetPasswordTokenPipelet(node, context);

    // Basket pipelets
    case 'GetBasket':
      return generateGetBasketPipelet(node, context);
    case 'AddProductToBasket':
      return generateAddProductToBasketPipelet(node, context);
    case 'RemoveProductLineItem':
      return generateRemoveProductLineItemPipelet(node, context);
    case 'UpdateProductLineItemQuantity':
      return generateUpdateProductLineItemQuantityPipelet(node, context);
    case 'AddPaymentInstrumentToBasket':
      return generateAddPaymentInstrumentToBasketPipelet(node, context);
    case 'RemoveBasketPaymentInstrument':
      return generateRemoveBasketPaymentInstrumentPipelet(node, context);
    case 'CreateBillingAddress':
      return generateCreateBillingAddressPipelet(node, context);
    case 'CreateShipment':
      return generateCreateShipmentPipelet(node, context);
    case 'CreateShippingAddress':
      return generateCreateShippingAddressPipelet(node, context);
    case 'SetShippingMethod':
      return generateSetShippingMethodPipelet(node, context);
    case 'AddCouponToBasket':
    case 'AddCouponToBasket2':
      return generateAddCouponToBasketPipelet(node, context);
    case 'RemoveCouponLineItem':
      return generateRemoveCouponLineItemPipelet(node, context);

    // Order pipelets
    case 'GetOrder':
      return generateGetOrderPipelet(node, context);
    case 'CreateOrder':
    case 'CreateOrder2':
      return generateCreateOrderPipelet(node, context);
    case 'CreateOrderNo':
      return generateCreateOrderNoPipelet(node, context);
    case 'PlaceOrder':
      return generatePlaceOrderPipelet(node, context);
    case 'FailOrder':
      return generateFailOrderPipelet(node, context);
    case 'CancelOrder':
      return generateCancelOrderPipelet(node, context);

    // Additional basket pipelets
    case 'AddBonusProductToBasket':
      return generateAddBonusProductToBasketPipelet(node, context);
    case 'CreateBasketForOrderEdit':
      return generateCreateBasketForOrderEditPipelet(node, context);
    case 'StartCheckout':
      return generateStartCheckoutPipelet(node, context);
    case 'ReserveInventoryForOrder':
      return generateReserveInventoryForOrderPipelet(node, context);
    case 'ReplaceLineItemProduct':
      return generateReplaceLineItemProductPipelet(node, context);
    case 'VerifyPaymentCard':
      return generateVerifyPaymentCardPipelet(node, context);

    // Payment pipelets
    case 'GetPaymentProcessor':
      return generateGetPaymentProcessorPipelet(node, context);

    // Search pipelets
    case 'Search':
      return generateSearchPipelet(node, context);
    case 'SearchSystemObject':
      return generateSearchSystemObjectPipelet(node, context);
    case 'Paging':
      return generatePagingPipelet(node, context);
    case 'GetSearchSuggestions':
      return generateGetSearchSuggestionsPipelet(node, context);
    case 'SearchRedirectURL':
      return generateSearchRedirectURLPipelet(node, context);

    // Store pipelets
    case 'GetNearestStores':
      return generateGetNearestStoresPipelet(node, context);

    // Content pipelets
    case 'GetContent':
      return generateGetContentPipelet(node, context);

    // ProductList pipelets
    case 'GetProductList':
      return generateGetProductListPipelet(node, context);
    case 'GetProductLists':
      return generateGetProductListsPipelet(node, context);
    case 'CreateProductList':
      return generateCreateProductListPipelet(node, context);
    case 'AddProductToProductList':
      return generateAddProductToProductListPipelet(node, context);
    case 'RemoveProductListItem':
      return generateRemoveProductListItemPipelet(node, context);
    case 'RemoveProductList':
      return generateRemoveProductListPipelet(node, context);
    case 'SearchProductLists':
      return generateSearchProductListsPipelet(node, context);

    // Gift certificate pipelets
    case 'GetGiftCertificate':
      return generateGetGiftCertificatePipelet(node, context);
    case 'CreateGiftCertificate':
      return generateCreateGiftCertificatePipelet(node, context);
    case 'RedeemGiftCertificate':
      return generateRedeemGiftCertificatePipelet(node, context);
    case 'AddGiftCertificateToBasket':
      return generateAddGiftCertificateToBasketPipelet(node, context);
    case 'RemoveGiftCertificateLineItem':
      return generateRemoveGiftCertificateLineItemPipelet(node, context);

    // Mail pipelet
    case 'SendMail':
      return generateSendMailPipelet(node, context);

    // Page metadata pipelet
    case 'UpdatePageMetaData':
      return generateUpdatePageMetaDataPipelet(node, context);

    // CSRF pipelets
    case 'GenerateCSRFToken':
      return generateGenerateCSRFTokenPipelet(node, context);
    case 'ValidateCSRFToken':
      return generateValidateCSRFTokenPipelet(node, context);

    // Locale/Currency pipelets
    case 'SetRequestLocale':
      return generateSetRequestLocalePipelet(node, context);
    case 'SetSessionCurrency':
      return generateSetSessionCurrencyPipelet(node, context);

    // CustomObject pipelets
    case 'CreateCustomObject':
      return generateCreateCustomObjectPipelet(node, context);
    case 'RemoveCustomObject':
      return generateRemoveCustomObjectPipelet(node, context);
    case 'SearchCustomObject':
      return generateSearchCustomObjectPipelet(node, context);

    default:
      // For unknown pipelets, generate a commented placeholder
      lines.push(`${ind}// TODO: Convert pipelet ${node.pipeletName}`);
      for (const kb of node.keyBindings) {
        lines.push(`${ind}//   ${kb.key} = ${kb.value}`);
      }
      return lines.join('\n');
  }
}
