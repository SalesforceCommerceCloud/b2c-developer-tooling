/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * i18n setup for b2c-cli.
 *
 * This module registers CLI-specific translations with the 'cli' namespace.
 * The core i18n infrastructure comes from @salesforce/b2c-tooling-sdk.
 *
 * Usage in commands:
 *   import { t } from '../i18n/index.js'
 *   this.log(t('commands.sites.list.fetching', 'Fetching sites from {{hostname}}...', { hostname }))
 */

import {registerTranslations, t as toolingT, type TOptions} from '@salesforce/b2c-tooling-sdk';
import {locales} from './locales/index.js';

/** The namespace used by b2c-cli messages */
export const CLI_NAMESPACE = 'cli';

// Register all CLI translations
for (const [lang, translations] of Object.entries(locales)) {
  registerTranslations(CLI_NAMESPACE, lang, translations);
}

/**
 * Translate a CLI message key with an inline default.
 *
 * This is a convenience wrapper that uses the 'cli' namespace.
 * For b2c-tooling messages, import t directly from @salesforce/b2c-tooling-sdk.
 *
 * @param key - Dot-notation key (e.g., 'commands.sites.list.fetching')
 * @param defaultValue - The default English string
 * @param options - Optional interpolation values
 * @returns The translated string
 *
 * @example
 * t('commands.sites.list.fetching', 'Fetching sites from {{hostname}}...', { hostname })
 */
export function t(key: string, defaultValue: string, options?: TOptions): string {
  return toolingT(`${CLI_NAMESPACE}:${key}`, defaultValue, options);
}

// Re-export for convenience
export {setLanguage, getLanguage, getI18nInstance} from '@salesforce/b2c-tooling-sdk';

/** Base URL for online documentation */
const DOCS_BASE_URL = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling';

/**
 * Append documentation URL to a description string.
 *
 * @param description - The description text
 * @param docsPath - Path relative to DOCS_BASE_URL (e.g., '/cli/code.html#b2c-code-activate')
 * @returns Description with appended docs URL
 *
 * @example
 * withDocs('Activate or reload a code version', '/cli/code.html#b2c-code-activate')
 * // Returns: "Activate or reload a code version\n\nDocs: https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/code.html#b2c-code-activate"
 */
export function withDocs(description: string, docsPath: string): string {
  return `${description}\n\nDocs: ${DOCS_BASE_URL}${docsPath}`;
}
