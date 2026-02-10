/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Product/Catalog pipelet generators.
 *
 * @module operations/pipeline/generator/pipelets/product
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for GetProduct pipelet.
 * Retrieves a product by ID.
 */
export function generateGetProductPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productId = node.keyBindings.find((kb) => kb.key === 'ProductID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Product')?.value;

  if (!productId) {
    return `${ind}// GetProduct: missing ProductID parameter`;
  }

  context.requires.set('ProductMgr', 'dw/catalog/ProductMgr');
  const productExpr = `ProductMgr.getProduct(${transformExpression(productId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${productExpr};`;
  }
  return `${ind}${productExpr};`;
}

/**
 * Generates code for GetCategory pipelet.
 * Retrieves a category by ID.
 */
export function generateGetCategoryPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const categoryId = node.keyBindings.find((kb) => kb.key === 'CategoryID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Category')?.value;

  if (!categoryId) {
    return `${ind}// GetCategory: missing CategoryID parameter`;
  }

  context.requires.set('CatalogMgr', 'dw/catalog/CatalogMgr');
  const categoryExpr = `CatalogMgr.getCategory(${transformExpression(categoryId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${categoryExpr};`;
  }
  return `${ind}${categoryExpr};`;
}

/**
 * Generates code for UpdateProductOptionSelections pipelet.
 */
export function generateUpdateProductOptionSelectionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const optionModel = node.keyBindings.find((kb) => kb.key === 'ProductOptionModel')?.value;
  const selectedOptions = node.keyBindings.find((kb) => kb.key === 'SelectedOptions')?.value;

  lines.push(`${ind}// UpdateProductOptionSelections`);
  if (optionModel && selectedOptions) {
    lines.push(
      `${ind}${transformExpression(optionModel)}.setSelectedOptionValue(${transformExpression(selectedOptions)});`,
    );
  } else if (product) {
    lines.push(`${ind}// Update product option selections for ${product}`);
    lines.push(`${ind}// See dw.catalog.ProductOptionModel for API details`);
  }

  return lines.join('\n');
}

/**
 * Generates code for UpdateProductVariationSelections pipelet.
 */
export function generateUpdateProductVariationSelectionsPipelet(
  node: PipeletNodeIR,
  context: GeneratorContext,
): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const variationModel = node.keyBindings.find((kb) => kb.key === 'ProductVariationModel')?.value;

  lines.push(`${ind}// UpdateProductVariationSelections`);
  if (variationModel) {
    lines.push(`${ind}// See dw.catalog.ProductVariationModel for API details`);
  } else if (product) {
    lines.push(`${ind}// Update product variation selections for ${product}`);
  }

  return lines.join('\n');
}
