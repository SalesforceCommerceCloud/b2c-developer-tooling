/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Locale resources for b2c-cli commands.
 *
 * Each locale file exports a translation object matching the structure
 * of keys used in t() calls. English is included for documentation
 * but defaults are defined inline at point of use.
 *
 * To add a new language:
 * 1. Create a new file (e.g., fr.ts) with translations
 * 2. Import and add to the locales object below
 */

import {de} from './de.js';
import {en} from './en.js';

/**
 * All locale resources for the 'cli' namespace.
 */
export const locales = {
  de,
  en,
};

export type SupportedLocale = keyof typeof locales;
