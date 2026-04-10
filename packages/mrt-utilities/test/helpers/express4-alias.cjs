/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

const Module = require('module');

/**
 * Monkey-patch Node's module resolution for tests.
 * - Redirect `express` to the `express4` alias.
 * - Preserve subpath imports like `express/static` by mapping to `express4/...`.
 */
const originalResolveFilename = Module._resolveFilename;

/**
 * Ensure Mocha runs the same test suite against Express 4 by mapping the
 * module IDs at resolution time. This avoids touching production imports.
 */
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'express') {
    return originalResolveFilename.call(this, 'express4', parent, isMain, options);
  }
  if (request.startsWith('express/')) {
    const mappedRequest = `express4/${request.slice('express/'.length)}`;
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
