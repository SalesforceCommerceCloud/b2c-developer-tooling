/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-expressions -- Stored function expression, evaluated by code mode. */
async (input) => {
  const product = {
    id: input.productId,
    owningCatalogId: input.catalogId,
    onlineFlag: {default: !(input.offline ?? true)},
    ...(input.name === undefined ? {} : {name: {default: input.name}}),
  };
  const path =
    '/product/products/v1/organizations/' +
    encodeURIComponent(organizationId) +
    '/products/' +
    encodeURIComponent(product.id);
  let stage = 'inspect';
  let writeStatus;
  let writeAttempted = false;
  let summary;
  let categoryWriteStatus;
  const categoryPath = input.category
    ? '/product/catalogs/v1/organizations/' +
      encodeURIComponent(organizationId) +
      '/catalogs/' +
      encodeURIComponent(input.category.catalogId) +
      '/categories/' +
      encodeURIComponent(input.category.categoryId)
    : undefined;
  try {
    const before = await scapi.request({method: 'GET', path});
    if (before.ok) return {state: 'exists', id: product.id, changed: false};
    if (before.status !== 404) return {stage, ...before};
    if (categoryPath) {
      stage = 'inspect-category';
      const category = await scapi.request({method: 'GET', path: categoryPath});
      if (!category.ok) return {stage, category: input.category, ...category};
    }
    stage = 'create';
    writeAttempted = true;
    const created = await scapi.request({method: 'PUT', path, body: product});
    if (!created.ok) return {stage, id: product.id, ...created};
    writeStatus = created.status;
    stage = 'verify';
    const after = await scapi.request({method: 'GET', path});
    if (!after.ok) return {stage, id: product.id, writeStatus, ...after};
    const saved = after.data;
    const verified =
      saved.id === product.id &&
      saved.owningCatalogId === product.owningCatalogId &&
      saved.onlineFlag?.default === product.onlineFlag.default &&
      (input.name === undefined || saved.name?.default === input.name);
    summary = {
      state: verified ? 'verified' : 'verification_failed',
      id: saved.id,
      catalog: saved.owningCatalogId,
      onlineFlag: saved.onlineFlag,
      writeStatus,
      ...(input.name === undefined ? {} : {name: saved.name?.default}),
    };
    if (!verified || !categoryPath) return summary;
    const assignment = {...input.category, productId: saved.id};
    const assignmentPath = categoryPath + '/products/' + encodeURIComponent(saved.id);
    stage = 'assign-category';
    const assigned = await scapi.request({method: 'PUT', path: assignmentPath, body: assignment});
    if (!assigned.ok) return {...summary, state: 'partial', stage, category: assignment, ...assigned};
    categoryWriteStatus = assigned.status;
    stage = 'verify-category';
    const checked = await scapi.request({method: 'GET', path: assignmentPath});
    if (!checked.ok)
      return {
        ...summary,
        state: 'partial',
        stage,
        category: {...assignment, writeStatus: categoryWriteStatus},
        ...checked,
      };
    const observed = {
      catalogId: checked.data.catalogId,
      categoryId: checked.data.categoryId,
      productId: checked.data.productId,
    };
    const categoryVerified = Object.keys(assignment).every((key) => observed[key] === assignment[key]);
    return {
      ...summary,
      state: categoryVerified ? 'verified' : 'verification_failed',
      category: {
        ...assignment,
        verified: categoryVerified,
        writeStatus: categoryWriteStatus,
        ...(categoryVerified ? {} : {observed}),
      },
    };
  } catch (error) {
    return {
      ...(summary ? {...summary, state: 'partial'} : {}),
      stage,
      id: product.id,
      writeStatus,
      error: String(error),
      ...(input.category ? {category: {...input.category, writeStatus: categoryWriteStatus}} : {}),
      checkWriteBeforeRetry: writeAttempted,
    };
  }
}
