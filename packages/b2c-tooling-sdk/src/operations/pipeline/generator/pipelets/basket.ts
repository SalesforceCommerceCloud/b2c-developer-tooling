/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Basket pipelet generators.
 *
 * @module operations/pipeline/generator/pipelets/basket
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for GetBasket pipelet.
 * Gets the current shopping basket.
 */
export function generateGetBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;
  const createIfAbsent = node.configProperties.find((p) => p.key === 'CreateBasket')?.value === 'true';

  context.requires.set('BasketMgr', 'dw/order/BasketMgr');

  const basketMethod = createIfAbsent ? 'getCurrentOrNewBasket()' : 'getCurrentBasket()';

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = BasketMgr.${basketMethod};`;
  }
  return `${ind}BasketMgr.${basketMethod};`;
}

/**
 * Generates code for AddProductToBasket pipelet.
 */
export function generateAddProductToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product' || kb.key === 'ProductID')?.value;
  const quantity = node.keyBindings.find((kb) => kb.key === 'Quantity')?.value;
  const shipment = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;

  if (!basket || !product) {
    return `${ind}// AddProductToBasket: missing Basket or Product parameter`;
  }

  const basketRef = transformExpression(basket);
  const productRef = transformExpression(product);
  const shipmentRef = shipment ? transformExpression(shipment) : `${basketRef}.defaultShipment`;
  const quantityVal = quantity ? transformExpression(quantity) : '1';

  const pliExpr = `${basketRef}.createProductLineItem(${productRef}, ${shipmentRef})`;

  if (outputVar) {
    lines.push(`${ind}${transformVariable(outputVar)} = ${pliExpr};`);
    lines.push(`${ind}${transformVariable(outputVar)}.setQuantityValue(${quantityVal});`);
  } else {
    lines.push(`${ind}var pli = ${pliExpr};`);
    lines.push(`${ind}pli.setQuantityValue(${quantityVal});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for RemoveProductLineItem pipelet.
 */
export function generateRemoveProductLineItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const pli = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;

  if (!basket || !pli) {
    return `${ind}// RemoveProductLineItem: missing Basket or ProductLineItem parameter`;
  }

  return `${ind}${transformExpression(basket)}.removeProductLineItem(${transformExpression(pli)});`;
}

/**
 * Generates code for UpdateProductLineItemQuantity pipelet.
 */
export function generateUpdateProductLineItemQuantityPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const pli = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;
  const quantity = node.keyBindings.find((kb) => kb.key === 'Quantity')?.value;

  if (!pli || !quantity) {
    return `${ind}// UpdateProductLineItemQuantity: missing ProductLineItem or Quantity parameter`;
  }

  return `${ind}${transformExpression(pli)}.setQuantityValue(${transformExpression(quantity)});`;
}

/**
 * Generates code for AddPaymentInstrumentToBasket pipelet.
 */
export function generateAddPaymentInstrumentToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const methodId = node.keyBindings.find((kb) => kb.key === 'PaymentMethodID')?.value;
  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PaymentInstrument')?.value;

  if (!basket || !methodId) {
    return `${ind}// AddPaymentInstrumentToBasket: missing Basket or PaymentMethodID parameter`;
  }

  const basketRef = transformExpression(basket);
  const amountArg = amount ? `, ${transformExpression(amount)}` : '';
  const piExpr = `${basketRef}.createPaymentInstrument(${transformExpression(methodId)}${amountArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${piExpr};`;
  }
  return `${ind}${piExpr};`;
}

/**
 * Generates code for RemoveBasketPaymentInstrument pipelet.
 */
export function generateRemoveBasketPaymentInstrumentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const pi = node.keyBindings.find((kb) => kb.key === 'PaymentInstrument')?.value;

  if (!basket || !pi) {
    return `${ind}// RemoveBasketPaymentInstrument: missing Basket or PaymentInstrument parameter`;
  }

  return `${ind}${transformExpression(basket)}.removePaymentInstrument(${transformExpression(pi)});`;
}

/**
 * Generates code for CreateBillingAddress pipelet.
 */
export function generateCreateBillingAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'BillingAddress' || kb.key === 'Address')?.value;

  if (!basket) {
    return `${ind}// CreateBillingAddress: missing Basket parameter`;
  }

  const addressExpr = `${transformExpression(basket)}.createBillingAddress()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${addressExpr};`;
  }
  return `${ind}${addressExpr};`;
}

/**
 * Generates code for CreateShipment pipelet.
 */
export function generateCreateShipmentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const shipmentId = node.keyBindings.find((kb) => kb.key === 'ShipmentID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;

  if (!basket) {
    return `${ind}// CreateShipment: missing Basket parameter`;
  }

  const shipmentIdArg = shipmentId ? transformExpression(shipmentId) : 'null';
  const shipmentExpr = `${transformExpression(basket)}.createShipment(${shipmentIdArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${shipmentExpr};`;
  }
  return `${ind}${shipmentExpr};`;
}

/**
 * Generates code for CreateShippingAddress pipelet.
 */
export function generateCreateShippingAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const shipment = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ShippingAddress' || kb.key === 'Address')?.value;

  if (!shipment) {
    return `${ind}// CreateShippingAddress: missing Shipment parameter`;
  }

  const addressExpr = `${transformExpression(shipment)}.createShippingAddress()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${addressExpr};`;
  }
  return `${ind}${addressExpr};`;
}

/**
 * Generates code for SetShippingMethod pipelet.
 */
export function generateSetShippingMethodPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const shipment = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;
  const shippingMethod = node.keyBindings.find((kb) => kb.key === 'ShippingMethod')?.value;

  if (!shipment || !shippingMethod) {
    return `${ind}// SetShippingMethod: missing Shipment or ShippingMethod parameter`;
  }

  return `${ind}${transformExpression(shipment)}.setShippingMethod(${transformExpression(shippingMethod)});`;
}

/**
 * Generates code for AddCouponToBasket pipelet.
 */
export function generateAddCouponToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const couponCode = node.keyBindings.find((kb) => kb.key === 'CouponCode')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'CouponLineItem')?.value;

  if (!basket || !couponCode) {
    return `${ind}// AddCouponToBasket: missing Basket or CouponCode parameter`;
  }

  const couponExpr = `${transformExpression(basket)}.createCouponLineItem(${transformExpression(couponCode)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${couponExpr};`;
  }
  return `${ind}${couponExpr};`;
}

/**
 * Generates code for RemoveCouponLineItem pipelet.
 */
export function generateRemoveCouponLineItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const couponLineItem = node.keyBindings.find((kb) => kb.key === 'CouponLineItem')?.value;

  if (!basket || !couponLineItem) {
    return `${ind}// RemoveCouponLineItem: missing Basket or CouponLineItem parameter`;
  }

  return `${ind}${transformExpression(basket)}.removeCouponLineItem(${transformExpression(couponLineItem)});`;
}

/**
 * Generates code for AddBonusProductToBasket pipelet.
 */
export function generateAddBonusProductToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const bonusDiscountLineItem = node.keyBindings.find((kb) => kb.key === 'BonusDiscountLineItem')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;

  if (!basket || !bonusDiscountLineItem || !product) {
    return `${ind}// AddBonusProductToBasket: missing required parameters`;
  }

  const pliExpr = `${transformExpression(basket)}.createBonusProductLineItem(${transformExpression(bonusDiscountLineItem)}, ${transformExpression(product)}, null)`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${pliExpr};`;
  }
  return `${ind}${pliExpr};`;
}

/**
 * Generates code for CreateBasketForOrderEdit pipelet.
 */
export function generateCreateBasketForOrderEditPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;

  if (!order) {
    return `${ind}// CreateBasketForOrderEdit: missing Order parameter`;
  }

  context.requires.set('BasketMgr', 'dw/order/BasketMgr');
  const basketExpr = `BasketMgr.createBasketFromOrder(${transformExpression(order)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${basketExpr};`;
  }
  return `${ind}${basketExpr};`;
}

/**
 * Generates code for StartCheckout pipelet.
 */
export function generateStartCheckoutPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;

  if (!basket) {
    return `${ind}// StartCheckout: missing Basket parameter`;
  }

  return `${ind}${transformExpression(basket)}.startCheckout();`;
}

/**
 * Generates code for ReserveInventoryForOrder pipelet.
 */
export function generateReserveInventoryForOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;

  if (!basket) {
    return `${ind}// ReserveInventoryForOrder: missing Basket parameter`;
  }

  return `${ind}${transformExpression(basket)}.reserveInventory();`;
}

/**
 * Generates code for ReplaceLineItemProduct pipelet.
 */
export function generateReplaceLineItemProductPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const pli = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;

  if (!pli || !product) {
    return `${ind}// ReplaceLineItemProduct: missing ProductLineItem or Product parameter`;
  }

  return `${ind}${transformExpression(pli)}.replaceProduct(${transformExpression(product)});`;
}

/**
 * Generates code for VerifyPaymentCard pipelet.
 */
export function generateVerifyPaymentCardPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const paymentCard = node.keyBindings.find((kb) => kb.key === 'PaymentCard')?.value;
  const cardNumber = node.keyBindings.find((kb) => kb.key === 'CardNumber')?.value;

  if (!paymentCard) {
    return `${ind}// VerifyPaymentCard: missing PaymentCard parameter`;
  }

  if (cardNumber) {
    return `${ind}${transformExpression(paymentCard)}.verify(${transformExpression(cardNumber)});`;
  }
  return `${ind}${transformExpression(paymentCard)}.verify();`;
}
