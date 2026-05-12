/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';

/**
 * Page-size flag with the default AM API limits (20 default / 4000 max).
 * Use this for endpoints that accept the standard "size" pagination param;
 * orgs uses a slightly different range and defines its own.
 */
export const amPageSizeFlag = Flags.integer({
  char: 's',
  description: 'Page size (default: 20, min: 1, max: 4000)',
});
