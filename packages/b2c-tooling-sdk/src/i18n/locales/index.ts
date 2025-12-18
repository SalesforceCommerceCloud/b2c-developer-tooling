/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Locale resources for b2c-tooling.
 *
 * Each locale file exports a translation object matching the structure
 * of keys used in t() calls. English defaults are defined inline at
 * the point of use, so no en.ts is needed.
 *
 * To add a new language:
 * 1. Create a new file (e.g., fr.ts) with translations
 * 2. Import and add to the resources object below
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
