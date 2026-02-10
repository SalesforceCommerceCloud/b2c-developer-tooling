/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Content pipelet generators: Content, ProductList, GiftCertificate, SendMail.
 *
 * @module operations/pipeline/generator/pipelets/content
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for GetContent pipelet.
 */
export function generateGetContentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const contentId = node.keyBindings.find((kb) => kb.key === 'ContentID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Content')?.value;

  if (!contentId) {
    return `${ind}// GetContent: missing ContentID parameter`;
  }

  context.requires.set('ContentMgr', 'dw/content/ContentMgr');
  const contentExpr = `ContentMgr.getContent(${transformExpression(contentId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${contentExpr};`;
  }
  return `${ind}${contentExpr};`;
}

/**
 * Generates code for GetProductList pipelet.
 */
export function generateGetProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productListId = node.keyBindings.find((kb) => kb.key === 'ProductListID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;

  if (!productListId) {
    return `${ind}// GetProductList: missing ProductListID parameter`;
  }

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');
  const listExpr = `ProductListMgr.getProductList(${transformExpression(productListId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${listExpr};`;
  }
  return `${ind}${listExpr};`;
}

/**
 * Generates code for GetProductLists pipelet.
 */
export function generateGetProductListsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const type = node.keyBindings.find((kb) => kb.key === 'Type')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLists')?.value;

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const typeArg = type ? transformExpression(type) : 'null';
  const listsExpr = `ProductListMgr.getProductLists(${customerRef}, ${typeArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${listsExpr};`;
  }
  return `${ind}${listsExpr};`;
}

/**
 * Generates code for CreateProductList pipelet.
 */
export function generateCreateProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const type = node.keyBindings.find((kb) => kb.key === 'Type')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;

  if (!type) {
    return `${ind}// CreateProductList: missing Type parameter`;
  }

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const listExpr = `ProductListMgr.createProductList(${customerRef}, ${transformExpression(type)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${listExpr};`;
  }
  return `${ind}${listExpr};`;
}

/**
 * Generates code for AddProductToProductList pipelet.
 */
export function generateAddProductToProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productList = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductListItem')?.value;

  if (!productList || !product) {
    return `${ind}// AddProductToProductList: missing ProductList or Product parameter`;
  }

  const itemExpr = `${transformExpression(productList)}.createProductItem(${transformExpression(product)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${itemExpr};`;
  }
  return `${ind}${itemExpr};`;
}

/**
 * Generates code for RemoveProductListItem pipelet.
 */
export function generateRemoveProductListItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productList = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;
  const productListItem = node.keyBindings.find((kb) => kb.key === 'ProductListItem')?.value;

  if (!productList || !productListItem) {
    return `${ind}// RemoveProductListItem: missing ProductList or ProductListItem parameter`;
  }

  return `${ind}${transformExpression(productList)}.removeItem(${transformExpression(productListItem)});`;
}

/**
 * Generates code for RemoveProductList pipelet.
 */
export function generateRemoveProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productList = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;

  if (!productList) {
    return `${ind}// RemoveProductList: missing ProductList parameter`;
  }

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');
  return `${ind}ProductListMgr.removeProductList(${transformExpression(productList)});`;
}

/**
 * Generates code for SearchProductLists pipelet.
 */
export function generateSearchProductListsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const queryString = node.keyBindings.find((kb) => kb.key === 'QueryString' || kb.key === 'Query')?.value;
  const type = node.keyBindings.find((kb) => kb.key === 'Type')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLists' || kb.key === 'SearchResult')?.value;

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');

  const queryArg = queryString ? transformExpression(queryString) : 'null';
  const typeArg = type ? `, ${transformExpression(type)}` : '';
  const searchExpr = `ProductListMgr.queryProductLists(${queryArg}${typeArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${searchExpr};`;
  }
  return `${ind}${searchExpr};`;
}

/**
 * Generates code for GetGiftCertificate pipelet.
 */
export function generateGetGiftCertificatePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const gcCode = node.keyBindings.find((kb) => kb.key === 'GiftCertificateCode' || kb.key === 'Code')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'GiftCertificate')?.value;

  if (!gcCode) {
    return `${ind}// GetGiftCertificate: missing GiftCertificateCode parameter`;
  }

  context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');
  const gcExpr = `GiftCertificateMgr.getGiftCertificate(${transformExpression(gcCode)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${gcExpr};`;
  }
  return `${ind}${gcExpr};`;
}

/**
 * Generates code for CreateGiftCertificate pipelet.
 */
export function generateCreateGiftCertificatePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const recipientEmail = node.keyBindings.find((kb) => kb.key === 'RecipientEmail')?.value;
  const recipientName = node.keyBindings.find((kb) => kb.key === 'RecipientName')?.value;
  const senderName = node.keyBindings.find((kb) => kb.key === 'SenderName')?.value;
  const message = node.keyBindings.find((kb) => kb.key === 'Message')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'GiftCertificate')?.value;

  if (!amount) {
    return `${ind}// CreateGiftCertificate: missing Amount parameter`;
  }

  context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');

  const gcVar = outputVar ? transformVariable(outputVar) : 'pdict.giftCertificate';
  lines.push(`${ind}${gcVar} = GiftCertificateMgr.createGiftCertificate(${transformExpression(amount)});`);

  if (recipientEmail) {
    lines.push(`${ind}${gcVar}.setRecipientEmail(${transformExpression(recipientEmail)});`);
  }
  if (recipientName) {
    lines.push(`${ind}${gcVar}.setRecipientName(${transformExpression(recipientName)});`);
  }
  if (senderName) {
    lines.push(`${ind}${gcVar}.setSenderName(${transformExpression(senderName)});`);
  }
  if (message) {
    lines.push(`${ind}${gcVar}.setMessage(${transformExpression(message)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for RedeemGiftCertificate pipelet.
 */
export function generateRedeemGiftCertificatePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const gc = node.keyBindings.find((kb) => kb.key === 'GiftCertificate')?.value;
  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!gc || !amount) {
    return `${ind}// RedeemGiftCertificate: missing GiftCertificate or Amount parameter`;
  }

  context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');
  const orderArg = order ? `, ${transformExpression(order)}` : '';
  return `${ind}GiftCertificateMgr.redeemGiftCertificate(${transformExpression(gc)}, ${transformExpression(amount)}${orderArg});`;
}

/**
 * Generates code for AddGiftCertificateToBasket pipelet.
 */
export function generateAddGiftCertificateToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const recipientEmail = node.keyBindings.find((kb) => kb.key === 'RecipientEmail')?.value;
  const recipientName = node.keyBindings.find((kb) => kb.key === 'RecipientName')?.value;
  const senderName = node.keyBindings.find((kb) => kb.key === 'SenderName')?.value;
  const message = node.keyBindings.find((kb) => kb.key === 'Message')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'GiftCertificateLineItem')?.value;

  if (!basket || !amount) {
    return `${ind}// AddGiftCertificateToBasket: missing Basket or Amount parameter`;
  }

  const gcliVar = outputVar ? transformVariable(outputVar) : 'pdict.gcLineItem';
  lines.push(
    `${ind}${gcliVar} = ${transformExpression(basket)}.createGiftCertificateLineItem(${transformExpression(amount)});`,
  );

  if (recipientName) {
    lines.push(`${ind}${gcliVar}.setRecipientName(${transformExpression(recipientName)});`);
  }
  if (senderName) {
    lines.push(`${ind}${gcliVar}.setSenderName(${transformExpression(senderName)});`);
  }
  if (recipientEmail) {
    lines.push(`${ind}${gcliVar}.setRecipientEmail(${transformExpression(recipientEmail)});`);
  }
  if (message) {
    lines.push(`${ind}${gcliVar}.setMessage(${transformExpression(message)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for RemoveGiftCertificateLineItem pipelet.
 */
export function generateRemoveGiftCertificateLineItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const gcli = node.keyBindings.find((kb) => kb.key === 'GiftCertificateLineItem')?.value;

  if (!basket || !gcli) {
    return `${ind}// RemoveGiftCertificateLineItem: missing Basket or GiftCertificateLineItem parameter`;
  }

  return `${ind}${transformExpression(basket)}.removeGiftCertificateLineItem(${transformExpression(gcli)});`;
}

/**
 * Generates code for SendMail pipelet.
 */
export function generateSendMailPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('Mail', 'dw/net/Mail');

  const mailFrom = node.keyBindings.find((kb) => kb.key === 'MailFrom' || kb.key === 'From')?.value;
  const mailTo = node.keyBindings.find((kb) => kb.key === 'MailTo' || kb.key === 'To')?.value;
  const mailSubject = node.keyBindings.find((kb) => kb.key === 'MailSubject' || kb.key === 'Subject')?.value;
  const mailTemplate = node.keyBindings.find((kb) => kb.key === 'MailTemplate' || kb.key === 'Template')?.value;

  lines.push(`${ind}var mail = new Mail();`);

  if (mailFrom) {
    lines.push(`${ind}mail.setFrom(${transformExpression(mailFrom)});`);
  }
  if (mailTo) {
    lines.push(`${ind}mail.addTo(${transformExpression(mailTo)});`);
  }
  if (mailSubject) {
    lines.push(`${ind}mail.setSubject(${transformExpression(mailSubject)});`);
  }
  if (mailTemplate) {
    lines.push(`${ind}mail.setContent(${transformExpression(mailTemplate)});`);
  }
  lines.push(`${ind}mail.send();`);

  return lines.join('\n');
}
