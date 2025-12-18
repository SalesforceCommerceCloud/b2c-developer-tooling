/**
 * Internationalization (i18n) support for B2C CLI tools.
 *
 * This module provides translation utilities using i18next, with support for
 * multiple languages and environment-based language detection.
 *
 * ## Key Features
 *
 * - Default strings are stored inline at point of use (no separate en.ts needed)
 * - TypeScript locale files for type safety and bundling
 * - Namespace separation: 'b2c' for tooling, 'cli' for CLI-specific messages
 *
 * ## Language Detection
 *
 * Language is detected in this order:
 * 1. Explicit {@link setLanguage} call (from --lang flag)
 * 2. `LANGUAGE` environment variable (GNU gettext standard)
 * 3. `LANG` system environment variable (Unix standard)
 * 4. Default: 'en'
 *
 * ## Supported Locale Formats
 *
 * - `de` - simple language code
 * - `de_DE` - language with country
 * - `de-DE` - language with country (hyphen)
 * - `de_DE.UTF-8` - with encoding
 * - `de:en:fr` - colon-separated preference list (LANGUAGE only)
 *
 * ## Usage
 *
 * ```typescript
 * import { t } from '@salesforce/b2c-tooling-sdk';
 *
 * // Simple translation with inline default
 * const message = t('error.serverRequired', 'Server is required.');
 *
 * // With interpolation
 * const fileError = t('error.fileNotFound', 'File {{path}} not found.', {
 *   path: '/foo/bar'
 * });
 * ```
 *
 * ## Adding Translations
 *
 * ```typescript
 * import { registerTranslations } from '@salesforce/b2c-tooling-sdk';
 *
 * // Register translations for a new namespace
 * registerTranslations('my-package', 'de', {
 *   greeting: 'Hallo Welt'
 * });
 * ```
 *
 * @module i18n
 */
import i18next, {type TOptions, type Resource} from 'i18next';

// Re-export TOptions for consumers
export type {TOptions} from 'i18next';
import {locales} from './locales/index.js';

/** The namespace used by b2c-tooling messages */
export const B2C_NAMESPACE = 'b2c';

const instance = i18next.createInstance();

/**
 * Detect language from environment variables.
 * Precedence: LANGUAGE > LANG > 'en'
 */
function detectLanguage(): string {
  // LANGUAGE is the GNU gettext standard, supports colon-separated list
  // e.g., "de:en:fr" means prefer German, then English, then French
  if (process.env.LANGUAGE) {
    const langs = process.env.LANGUAGE.split(':');
    for (const lang of langs) {
      const normalized = normalizeLocale(lang);
      if (normalized && normalized !== 'c' && normalized !== 'posix') {
        return normalized;
      }
    }
  }

  // LANG is the Unix standard locale
  // e.g., "de_DE.UTF-8"
  if (process.env.LANG) {
    const normalized = normalizeLocale(process.env.LANG);
    if (normalized && normalized !== 'c' && normalized !== 'posix') {
      return normalized;
    }
  }

  return 'en';
}

/**
 * Normalize locale string to language code.
 *
 * Handles all common formats:
 * - "de" -> "de"
 * - "de_DE" -> "de"
 * - "de-DE" -> "de"
 * - "de_DE.UTF-8" -> "de"
 * - "de_DE@euro" -> "de"
 * - "C" -> "c" (special POSIX locale)
 * - "POSIX" -> "posix" (special POSIX locale)
 */
function normalizeLocale(locale: string): string {
  if (!locale) return 'en';

  // Trim whitespace
  locale = locale.trim();

  // Handle special POSIX locales
  if (locale.toUpperCase() === 'C' || locale.toUpperCase() === 'POSIX') {
    return locale.toLowerCase();
  }

  // Extract language code: first 2-3 letters before any separator (_, -, ., @)
  const match = locale.match(/^([a-z]{2,3})/i);
  return match ? match[1].toLowerCase() : 'en';
}

/**
 * Build i18next resources from locale files.
 */
function buildResources(): Resource {
  const resources: Resource = {};

  for (const [lang, translations] of Object.entries(locales)) {
    resources[lang] = {
      [B2C_NAMESPACE]: translations,
    };
  }

  return resources;
}

instance.init({
  lng: detectLanguage(),
  fallbackLng: 'en',
  // Don't require keys to exist in resources - use defaultValue instead
  returnNull: false,
  returnEmptyString: false,
  // Use the default value when key is missing (our primary mode)
  saveMissing: false,
  // Namespace configuration
  defaultNS: B2C_NAMESPACE,
  ns: [B2C_NAMESPACE],
  // Resource bundles for supported languages
  resources: buildResources(),
  // Interpolation settings
  interpolation: {
    escapeValue: false, // CLI doesn't need HTML escaping
  },
});

/**
 * Translate a message key with an inline default.
 *
 * The default string is used directly during development and serves as
 * the English translation. Future localization adds translations via
 * locale files without changing call sites.
 *
 * @param key - Dot-notation key (e.g., 'error.serverRequired')
 * @param defaultValue - The default English string
 * @param options - Optional interpolation values
 * @returns The translated string
 *
 * @example
 * // Simple usage
 * t('error.serverRequired', 'Server is required.')
 *
 * @example
 * // With interpolation
 * t('error.fileNotFound', 'File {{path}} not found.', { path: filePath })
 *
 * @example
 * // With multiple interpolations
 * t('info.uploadProgress', 'Uploading {{file}} ({{percent}}%)', { file: name, percent: 50 })
 */
export function t(key: string, defaultValue: string, options?: TOptions): string {
  return instance.t(key, {defaultValue, ...options});
}

/**
 * Set the language for translations.
 * Call this early in CLI initialization if --lang flag is provided.
 *
 * @param lang - Language code (e.g., 'en', 'de')
 *
 * @example
 * // In BaseCommand.init()
 * if (this.flags.lang) {
 *   setLanguage(this.flags.lang)
 * }
 */
export function setLanguage(lang: string): void {
  instance.changeLanguage(normalizeLocale(lang));
}

/**
 * Get the currently active language.
 */
export function getLanguage(): string {
  return instance.language;
}

/**
 * Get the i18next instance for advanced usage.
 *
 * Use this to:
 * - Add translations from other packages (e.g., b2c-cli adding 'cli' namespace)
 * - Add additional languages at runtime
 *
 * @example
 * // Add a new namespace from b2c-cli
 * getI18nInstance().addResourceBundle('de', 'cli', {
 *   command: {
 *     sites: { description: 'Sites-Befehle' }
 *   }
 * })
 *
 * @example
 * // Add a new language
 * getI18nInstance().addResourceBundle('fr', 'b2c', {
 *   error: {
 *     serverRequired: 'Le serveur est requis.'
 *   }
 * })
 */
export function getI18nInstance() {
  return instance;
}

/**
 * Register translations for a namespace.
 *
 * This is the primary way for packages to add their translations.
 * Each package should use its own namespace.
 *
 * @param namespace - The namespace (e.g., 'cli' for b2c-cli)
 * @param lang - Language code (e.g., 'de')
 * @param resources - Translation object
 *
 * @example
 * // In b2c-cli initialization
 * registerTranslations('cli', 'de', {
 *   command: {
 *     sites: { description: 'Sites-Befehle' }
 *   }
 * })
 */
export function registerTranslations(namespace: string, lang: string, resources: Record<string, unknown>): void {
  instance.addResourceBundle(lang, namespace, resources, true, true);
}
