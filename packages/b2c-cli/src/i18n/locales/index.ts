/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
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
