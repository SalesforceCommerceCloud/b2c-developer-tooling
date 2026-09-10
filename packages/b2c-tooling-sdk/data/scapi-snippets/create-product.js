/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const product = {id: input.productId, owningCatalogId: input.catalogId,
    onlineFlag: {default: !(input.offline ?? true)},
    ...(input.name === undefined ? {} : {name: {default: input.name}})};
  const path = '/product/products/v1/organizations/' + encodeURIComponent(organizationId)
    + '/products/' + encodeURIComponent(product.id);
  let stage = 'inspect';
  let writeStatus;
  try {
    const before = await scapi.request({method: 'GET', path});
    if (before.ok) return {state: 'exists', id: product.id, changed: false};
    if (before.status !== 404) return {stage, ...before};
    stage = 'create';
    const created = await scapi.request({method: 'PUT', path, body: product});
    if (!created.ok) return {stage, id: product.id, ...created};
    writeStatus = created.status;
    stage = 'verify';
    const after = await scapi.request({method: 'GET', path});
    if (!after.ok) return {stage, id: product.id, writeStatus, ...after};
    const saved = after.data;
    const verified = saved.id === product.id && saved.owningCatalogId === product.owningCatalogId
      && saved.onlineFlag?.default === product.onlineFlag.default
      && (input.name === undefined || saved.name?.default === input.name);
    return {state: verified ? 'verified' : 'verification_failed', id: saved.id,
      catalog: saved.owningCatalogId, onlineFlag: saved.onlineFlag, writeStatus,
      ...(input.name === undefined ? {} : {name: saved.name?.default})};
  } catch (error) {
    return {stage, id: product.id, writeStatus, error: String(error),
      checkWriteBeforeRetry: stage !== 'inspect'};
  }
}
