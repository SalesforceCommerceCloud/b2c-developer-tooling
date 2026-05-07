/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import express5 from 'express';
import {createRequire} from 'node:module';

/*
 * Load Express v4 via an npm alias so tests can run against v4 and v5
 * in the same process without altering production imports.
 */
const require = createRequire(import.meta.url);
const express4 = require('express4') as typeof express5;

/*
 * Export both versions for parameterized test suites.
 */
export const expressVersions = [
  {label: 'express4', express: express4},
  {label: 'express5', express: express5},
];
