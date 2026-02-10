/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Order pipelet generators.
 *
 * @module operations/pipeline/generator/pipelets/order
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for GetOrder pipelet.
 */
export function generateGetOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const orderNo = node.keyBindings.find((kb) => kb.key === 'OrderNo')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!orderNo) {
    return `${ind}// GetOrder: missing OrderNo parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  const orderExpr = `OrderMgr.getOrder(${transformExpression(orderNo)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${orderExpr};`;
  }
  return `${ind}${orderExpr};`;
}

/**
 * Generates code for CreateOrder pipelet.
 */
export function generateCreateOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;
  const orderNo = node.keyBindings.find((kb) => kb.key === 'OrderNo')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!basket) {
    return `${ind}// CreateOrder: missing Basket parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  const orderNoArg = orderNo ? `, ${transformExpression(orderNo)}` : '';
  const orderExpr = `OrderMgr.createOrder(${transformExpression(basket)}${orderNoArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${orderExpr};`;
  }
  return `${ind}${orderExpr};`;
}

/**
 * Generates code for CreateOrderNo pipelet.
 */
export function generateCreateOrderNoPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const outputVar = node.keyBindings.find((kb) => kb.key === 'OrderNo')?.value;

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  const orderNoExpr = 'OrderMgr.createOrderNo()';

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${orderNoExpr};`;
  }
  return `${ind}${orderNoExpr};`;
}

/**
 * Generates code for PlaceOrder pipelet.
 */
export function generatePlaceOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!order) {
    return `${ind}// PlaceOrder: missing Order parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  return `${ind}OrderMgr.placeOrder(${transformExpression(order)});`;
}

/**
 * Generates code for FailOrder pipelet.
 */
export function generateFailOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!order) {
    return `${ind}// FailOrder: missing Order parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  return `${ind}OrderMgr.failOrder(${transformExpression(order)});`;
}

/**
 * Generates code for CancelOrder pipelet.
 */
export function generateCancelOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!order) {
    return `${ind}// CancelOrder: missing Order parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  return `${ind}OrderMgr.cancelOrder(${transformExpression(order)});`;
}
