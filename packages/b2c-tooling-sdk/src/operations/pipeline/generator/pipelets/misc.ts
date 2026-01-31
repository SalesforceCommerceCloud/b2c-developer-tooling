/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Miscellaneous pipelet generators: Page metadata, CSRF, Locale, Currency, CustomObject, Payment.
 *
 * @module operations/pipeline/generator/pipelets/misc
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for UpdatePageMetaData pipelet.
 */
export function generateUpdatePageMetaDataPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const category = node.keyBindings.find((kb) => kb.key === 'Category')?.value;
  const content = node.keyBindings.find((kb) => kb.key === 'Content')?.value;

  lines.push(`${ind}var pageMetaData = request.pageMetaData;`);

  // Only generate if binding exists and is not null
  if (product && product !== 'null') {
    const prodExpr = transformExpression(product);
    lines.push(`${ind}pageMetaData.setTitle(${prodExpr}.name);`);
    lines.push(`${ind}pageMetaData.setDescription(${prodExpr}.shortDescription);`);
  } else if (category && category !== 'null') {
    const catExpr = transformExpression(category);
    lines.push(`${ind}pageMetaData.setTitle(${catExpr}.displayName);`);
    lines.push(`${ind}pageMetaData.setDescription(${catExpr}.description);`);
  } else if (content && content !== 'null') {
    const contentExpr = transformExpression(content);
    lines.push(`${ind}pageMetaData.setTitle(${contentExpr}.name);`);
    lines.push(`${ind}pageMetaData.setDescription(${contentExpr}.description);`);
  }

  return lines.join('\n');
}

/**
 * Generates code for GenerateCSRFToken pipelet.
 */
export function generateGenerateCSRFTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  context.requires.set('CSRFProtection', 'dw/web/CSRFProtection');
  return `${ind}pdict.csrf = CSRFProtection.generateToken();`;
}

/**
 * Generates code for ValidateCSRFToken pipelet.
 * Sets CSRFTokenValid flag for error branch handling.
 */
export function generateValidateCSRFTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  context.requires.set('CSRFProtection', 'dw/web/CSRFProtection');
  return `${ind}pdict.CSRFTokenValid = CSRFProtection.validateRequest();`;
}

/**
 * Generates code for SetRequestLocale pipelet.
 */
export function generateSetRequestLocalePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const locale = node.keyBindings.find((kb) => kb.key === 'Locale' || kb.key === 'LocaleID')?.value;

  if (!locale) {
    return `${ind}// SetRequestLocale: missing Locale parameter`;
  }

  return `${ind}request.setLocale(${transformExpression(locale)});`;
}

/**
 * Generates code for SetSessionCurrency pipelet.
 */
export function generateSetSessionCurrencyPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const currency = node.keyBindings.find((kb) => kb.key === 'Currency' || kb.key === 'CurrencyCode')?.value;

  if (!currency) {
    return `${ind}// SetSessionCurrency: missing Currency parameter`;
  }

  return `${ind}session.setCurrency(${transformExpression(currency)});`;
}

/**
 * Generates code for CreateCustomObject pipelet.
 */
export function generateCreateCustomObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const objectType = node.keyBindings.find((kb) => kb.key === 'ObjectType')?.value;
  const keyValue = node.keyBindings.find((kb) => kb.key === 'KeyValue')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'CustomObject')?.value;

  if (!objectType || !keyValue) {
    return `${ind}// CreateCustomObject: missing ObjectType or KeyValue parameter`;
  }

  context.requires.set('CustomObjectMgr', 'dw/object/CustomObjectMgr');
  const objectExpr = `CustomObjectMgr.createCustomObject(${transformExpression(objectType)}, ${transformExpression(keyValue)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${objectExpr};`;
  }
  return `${ind}${objectExpr};`;
}

/**
 * Generates code for RemoveCustomObject pipelet.
 */
export function generateRemoveCustomObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customObject = node.keyBindings.find((kb) => kb.key === 'CustomObject')?.value;

  if (!customObject) {
    return `${ind}// RemoveCustomObject: missing CustomObject parameter`;
  }

  context.requires.set('CustomObjectMgr', 'dw/object/CustomObjectMgr');
  return `${ind}CustomObjectMgr.remove(${transformExpression(customObject)});`;
}

/**
 * Generates code for SearchCustomObject pipelet.
 */
export function generateSearchCustomObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const objectType = node.keyBindings.find((kb) => kb.key === 'ObjectType')?.value;
  const queryString = node.keyBindings.find((kb) => kb.key === 'QueryString' || kb.key === 'Query')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'SearchResult' || kb.key === 'Result')?.value;

  if (!objectType) {
    return `${ind}// SearchCustomObject: missing ObjectType parameter`;
  }

  context.requires.set('CustomObjectMgr', 'dw/object/CustomObjectMgr');

  const queryArg = queryString ? transformExpression(queryString) : 'null';
  const searchExpr = `CustomObjectMgr.queryCustomObjects(${transformExpression(objectType)}, ${queryArg}, null)`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${searchExpr};`;
  }
  return `${ind}${searchExpr};`;
}

/**
 * Generates code for GetPaymentProcessor pipelet.
 */
export function generateGetPaymentProcessorPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const paymentMethod = node.keyBindings.find((kb) => kb.key === 'PaymentMethod')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PaymentProcessor')?.value;

  if (!paymentMethod) {
    return `${ind}// GetPaymentProcessor: missing PaymentMethod parameter`;
  }

  const processorExpr = `${transformExpression(paymentMethod)}.getPaymentProcessor()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${processorExpr};`;
  }
  return `${ind}${processorExpr};`;
}
