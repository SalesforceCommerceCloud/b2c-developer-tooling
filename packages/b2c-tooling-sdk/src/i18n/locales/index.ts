/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {de} from './de.js';

/**
 * All locale resources for the 'b2c' namespace.
 * Keys are language codes, values are translation objects.
 */
export const locales = {
  de,
};

export type SupportedLocale = keyof typeof locales;
