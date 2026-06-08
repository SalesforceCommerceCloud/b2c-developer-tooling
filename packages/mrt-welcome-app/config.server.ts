/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {MrtServerConfig} from '@salesforce/b2c-tooling-sdk/operations/mrt';

export const config: MrtServerConfig = {
  ssrOnly: ['ssr.js', 'loader.js', 'package.json', 'views/layout.html'],
  ssrShared: [],
  ssrParameters: {
    ssrFunctionNodeVersion: '24.x',
  },
};
