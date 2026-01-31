/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Search pipelet generators.
 *
 * @module operations/pipeline/generator/pipelets/search
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for Search pipelet (ProductSearchModel).
 */
export function generateSearchPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('ProductSearchModel', 'dw/catalog/ProductSearchModel');

  const searchPhrase = node.keyBindings.find((kb) => kb.key === 'SearchPhrase')?.value;
  const categoryId = node.keyBindings.find((kb) => kb.key === 'CategoryID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductSearchResult' || kb.key === 'SearchResult')?.value;

  const searchModelVar = outputVar ? transformVariable(outputVar) : 'pdict.productSearchModel';

  lines.push(`${ind}${searchModelVar} = new ProductSearchModel();`);

  if (categoryId) {
    lines.push(`${ind}${searchModelVar}.setCategoryID(${transformExpression(categoryId)});`);
  }
  if (searchPhrase) {
    lines.push(`${ind}${searchModelVar}.setSearchPhrase(${transformExpression(searchPhrase)});`);
  }

  lines.push(`${ind}${searchModelVar}.search();`);

  return lines.join('\n');
}

/**
 * Generates code for SearchSystemObject pipelet.
 */
export function generateSearchSystemObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const objectType = node.keyBindings.find((kb) => kb.key === 'ObjectType')?.value;
  const queryString = node.keyBindings.find((kb) => kb.key === 'QueryString' || kb.key === 'Query')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'SearchResult' || kb.key === 'Result')?.value;

  lines.push(`${ind}// SearchSystemObject: ${objectType || 'unknown type'}`);

  if (queryString) {
    lines.push(`${ind}// Query: ${queryString}`);
  }

  // Add appropriate manager based on object type
  if (objectType) {
    const typeStr = objectType.replace(/"/g, '');
    if (typeStr === 'Order') {
      context.requires.set('OrderMgr', 'dw/order/OrderMgr');
      if (outputVar && queryString) {
        lines.push(
          `${ind}${transformVariable(outputVar)} = OrderMgr.searchOrders(${transformExpression(queryString)}, null);`,
        );
      }
    } else if (typeStr === 'Customer') {
      context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
      if (outputVar && queryString) {
        lines.push(
          `${ind}${transformVariable(outputVar)} = CustomerMgr.searchProfiles(${transformExpression(queryString)}, null);`,
        );
      }
    } else if (typeStr === 'GiftCertificate') {
      context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');
      if (outputVar && queryString) {
        lines.push(
          `${ind}${transformVariable(outputVar)} = GiftCertificateMgr.queryGiftCertificates(${transformExpression(queryString)});`,
        );
      }
    } else {
      lines.push(`${ind}// Use appropriate *Mgr.query* or *Mgr.search* method`);
    }
  }

  return lines.join('\n');
}

/**
 * Generates code for Paging pipelet.
 */
export function generatePagingPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('PagingModel', 'dw/web/PagingModel');

  const iterator = node.keyBindings.find((kb) => kb.key === 'Iterator' || kb.key === 'SearchResult')?.value;
  const pageSize = node.keyBindings.find((kb) => kb.key === 'PageSize')?.value;
  const start = node.keyBindings.find((kb) => kb.key === 'Start')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PagingModel')?.value;

  const pagingModelVar = outputVar ? transformVariable(outputVar) : 'pdict.pagingModel';

  if (iterator) {
    lines.push(`${ind}${pagingModelVar} = new PagingModel(${transformExpression(iterator)});`);
  } else {
    lines.push(`${ind}${pagingModelVar} = new PagingModel();`);
  }

  if (pageSize) {
    lines.push(`${ind}${pagingModelVar}.setPageSize(${transformExpression(pageSize)});`);
  }
  if (start) {
    lines.push(`${ind}${pagingModelVar}.setStart(${transformExpression(start)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for GetSearchSuggestions pipelet.
 */
export function generateGetSearchSuggestionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('SuggestModel', 'dw/suggest/SuggestModel');

  const searchPhrase = node.keyBindings.find((kb) => kb.key === 'SearchPhrase')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Suggestions' || kb.key === 'SuggestModel')?.value;

  const suggestModelVar = outputVar ? transformVariable(outputVar) : 'pdict.suggestModel';

  lines.push(`${ind}${suggestModelVar} = new SuggestModel();`);
  if (searchPhrase) {
    lines.push(`${ind}${suggestModelVar}.setSearchPhrase(${transformExpression(searchPhrase)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for SearchRedirectURL pipelet.
 */
export function generateSearchRedirectURLPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const searchModel = node.keyBindings.find((kb) => kb.key === 'SearchModel' || kb.key === 'ProductSearchModel')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'RedirectURL' || kb.key === 'URL')?.value;

  if (!searchModel) {
    return `${ind}// SearchRedirectURL: missing SearchModel parameter`;
  }

  const urlExpr = `${transformExpression(searchModel)}.getRedirectURL()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${urlExpr};`;
  }
  return `${ind}${urlExpr};`;
}

/**
 * Generates code for GetNearestStores pipelet.
 */
export function generateGetNearestStoresPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('StoreMgr', 'dw/catalog/StoreMgr');

  const latitude = node.keyBindings.find((kb) => kb.key === 'Latitude')?.value;
  const longitude = node.keyBindings.find((kb) => kb.key === 'Longitude')?.value;
  const postalCode = node.keyBindings.find((kb) => kb.key === 'PostalCode')?.value;
  const countryCode = node.keyBindings.find((kb) => kb.key === 'CountryCode')?.value;
  const radius = node.keyBindings.find((kb) => kb.key === 'Radius' || kb.key === 'DistanceUnit')?.value;
  const maxCount = node.keyBindings.find((kb) => kb.key === 'MaxCount')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Stores')?.value;

  const storesVar = outputVar ? transformVariable(outputVar) : 'pdict.stores';

  if (latitude && longitude) {
    const radiusArg = radius ? `, ${transformExpression(radius)}` : '';
    const maxArg = maxCount ? `, ${transformExpression(maxCount)}` : '';
    lines.push(
      `${ind}${storesVar} = StoreMgr.searchStoresByCoordinates(${transformExpression(latitude)}, ${transformExpression(longitude)}${radiusArg}${maxArg});`,
    );
  } else if (postalCode && countryCode) {
    const radiusArg = radius ? `, ${transformExpression(radius)}` : '';
    const maxArg = maxCount ? `, ${transformExpression(maxCount)}` : '';
    lines.push(
      `${ind}${storesVar} = StoreMgr.searchStoresByPostalCode(${transformExpression(countryCode)}, ${transformExpression(postalCode)}${radiusArg}${maxArg});`,
    );
  } else {
    lines.push(`${ind}// GetNearestStores: provide Latitude/Longitude or PostalCode/CountryCode`);
  }

  return lines.join('\n');
}
