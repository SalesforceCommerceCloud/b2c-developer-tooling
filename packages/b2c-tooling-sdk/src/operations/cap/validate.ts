/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Validation logic for Commerce App Packages (CAPs).
 *
 * Performs structural and schema validation of a CAP directory or zip file
 * without requiring a live B2C instance.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import JSZip from 'jszip';

/**
 * Who authored a Commerce App.
 * - `salesforce` - first-party Salesforce apps/features.
 * - `thirdParty` - ISV / non-Salesforce apps.
 * - `custom` - merchant-provided custom integrations.
 */
export type CommerceAppProvider = 'salesforce' | 'thirdParty' | 'custom';

/**
 * Manifest from commerce-app.json.
 */
export interface CommerceAppManifest {
  id: string;
  name: string;
  version: string;
  domain: string;
  description?: string;
  publisher?: {name: string; url?: string; support?: string};
  dependencies?: Record<string, string>;
  /** Who authored this app. Absent or non-`salesforce` apps are treated as non-Salesforce. */
  provider?: CommerceAppProvider;
}

/**
 * Result of CAP validation.
 */
export interface CapValidationResult {
  /** Whether the CAP is valid (no errors). */
  valid: boolean;
  /** Blocking errors — a CAP with errors cannot be installed. */
  errors: string[];
  /** Advisory warnings — a CAP with warnings can still be installed. */
  warnings: string[];
  /** Parsed manifest from commerce-app.json (if parseable). */
  manifest?: CommerceAppManifest;
}

const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;

/**
 * Default Business Manager locales a CAP must ship under
 * `app-configuration/translations/` when it includes `tasksList.json`.
 * Kept in sync with commerce-apps `.github/config/required-bm-locales.txt`.
 */
const REQUIRED_BM_LOCALES = [
  'ar-MA',
  'de',
  'en-US',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'nl',
  'pl',
  'pt',
  'zh-CN',
  'zh-TW',
] as const;

const LOCALE_FILENAME_RE = /^[a-z]{2}(-[A-Z]{2})?\.json$/;

/**
 * Validates a Commerce App Package (CAP) directory or zip file.
 *
 * Checks required files, manifest schema, and cartridge structure rules.
 * This is a purely local operation — no B2C instance required.
 *
 * @param target - Path to a CAP directory or .zip file
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = await validateCap('./my-commerce-app-v1.0.0');
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export async function validateCap(target: string): Promise<CapValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let manifest: CommerceAppManifest | undefined;

  if (!fs.existsSync(target)) {
    return {valid: false, errors: [`Target not found: ${target}`], warnings};
  }

  const stat = fs.statSync(target);
  let capDir: string;
  let tempDir: string | undefined;

  if (stat.isDirectory()) {
    capDir = target;
  } else if (stat.isFile() && target.endsWith('.zip')) {
    // Extract zip to temp dir for inspection
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-validate-'));
    try {
      await extractZipToDir(target, tempDir);
      // The zip root should be a single directory
      const entries = fs.readdirSync(tempDir);
      if (entries.length === 1 && fs.statSync(path.join(tempDir, entries[0])).isDirectory()) {
        capDir = path.join(tempDir, entries[0]);
      } else {
        capDir = tempDir;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      cleanupTemp(tempDir);
      return {valid: false, errors: [`Failed to read zip: ${msg}`], warnings};
    }
  } else {
    return {valid: false, errors: [`Target must be a directory or .zip file: ${target}`], warnings};
  }

  try {
    // --- commerce-app.json ---
    const manifestPath = path.join(capDir, 'commerce-app.json');
    if (!fs.existsSync(manifestPath)) {
      errors.push('Missing required file: commerce-app.json');
    } else {
      try {
        const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
        const requiredFields = ['id', 'name', 'version', 'domain'] as const;
        for (const field of requiredFields) {
          if (!raw[field] || typeof raw[field] !== 'string') {
            errors.push(`commerce-app.json: missing or invalid field "${field}"`);
          }
        }
        if (raw.version && typeof raw.version === 'string' && !SEMVER_RE.test(raw.version)) {
          errors.push(`commerce-app.json: "version" must be a valid semver string (got "${raw.version}")`);
        }
        if (errors.filter((e) => e.startsWith('commerce-app.json:')).length === 0) {
          manifest = raw as unknown as CommerceAppManifest;
        }
      } catch {
        errors.push('commerce-app.json: file exists but is not valid JSON');
      }
    }

    // --- README.md ---
    if (!fs.existsSync(path.join(capDir, 'README.md'))) {
      errors.push('Missing required file: README.md');
    }

    // --- app-configuration/tasksList.json ---
    const tasksListPath = path.join(capDir, 'app-configuration', 'tasksList.json');
    const tasksListExists = fs.existsSync(tasksListPath);
    let tasks: unknown[] | undefined;
    if (!tasksListExists) {
      errors.push('Missing required file: app-configuration/tasksList.json');
    } else {
      try {
        const parsedTasks = JSON.parse(fs.readFileSync(tasksListPath, 'utf-8')) as unknown;
        if (!Array.isArray(parsedTasks)) {
          errors.push('app-configuration/tasksList.json: must be a JSON array');
        } else {
          tasks = parsedTasks;
          for (let i = 0; i < parsedTasks.length; i++) {
            const task = parsedTasks[i] as Record<string, unknown>;
            for (const field of ['taskNumber', 'name', 'description', 'link']) {
              if (!task[field]) {
                errors.push(`app-configuration/tasksList.json: task[${i}] missing field "${field}"`);
              }
            }
          }
        }
      } catch {
        errors.push('app-configuration/tasksList.json: file exists but is not valid JSON');
      }
    }

    validateConfigTaskTranslations(capDir, tasksListExists, tasks, errors);

    // --- At least one substantive directory ---
    const hasCartridges = fs.existsSync(path.join(capDir, 'cartridges'));
    const hasStorefrontNext = fs.existsSync(path.join(capDir, 'storefront-next'));
    const hasImpex = fs.existsSync(path.join(capDir, 'impex'));
    if (!hasCartridges && !hasStorefrontNext && !hasImpex) {
      errors.push('CAP must contain at least one of: cartridges/, storefront-next/, impex/');
    }

    // --- Cartridge rules ---
    if (hasCartridges) {
      const cartridgesDir = path.join(capDir, 'cartridges');
      validateCartridges(cartridgesDir, errors);
    }

    // --- Optional warnings ---
    if (!fs.existsSync(path.join(capDir, 'icons', 'icon.png'))) {
      warnings.push('icons/icon.png not found (recommended for marketplace listing)');
    }
    if (hasImpex && !fs.existsSync(path.join(capDir, 'impex', 'uninstall'))) {
      warnings.push('impex/uninstall/ not found (recommended for clean removal)');
    }
  } finally {
    cleanupTemp(tempDir);
  }

  return {valid: errors.length === 0, errors, warnings, manifest};
}

/**
 * Requires `app-configuration/translations/` when `tasksList.json` is present,
 * then checks required Business Manager locales, locale filenames, task-key
 * coverage in `en-US.json`, and locale key parity.
 */
function validateConfigTaskTranslations(
  capDir: string,
  tasksListExists: boolean,
  tasks: unknown[] | undefined,
  errors: string[],
): void {
  const translationsDir = path.join(capDir, 'app-configuration', 'translations');
  if (!isDirectory(translationsDir)) {
    if (tasksListExists) {
      errors.push('app-configuration/translations/ is required when tasksList.json is present');
    }
    return;
  }

  const localeFiles = listJsonFiles(translationsDir);
  const misformatted = localeFiles.map((file) => path.basename(file)).filter((name) => !LOCALE_FILENAME_RE.test(name));
  if (misformatted.length > 0) {
    errors.push(
      `app-configuration/translations/ contains misformatted locale file(s): ${misformatted.join(' ')} (expected BM-supported BCP-47 filename such as de.json or en-US.json)`,
    );
  }

  const present = new Set(localeFiles.map((file) => path.basename(file)));
  const missingLocales = REQUIRED_BM_LOCALES.filter((locale) => !present.has(`${locale}.json`));
  if (missingLocales.length > 0) {
    errors.push(
      `app-configuration/translations/ is missing required locale file(s): ${missingLocales.map((locale) => `${locale}.json`).join(' ')}`,
    );
  }

  const parsed = new Map<string, unknown>();
  for (const file of localeFiles) {
    const filename = path.basename(file);
    if (!LOCALE_FILENAME_RE.test(filename)) continue;
    try {
      parsed.set(filename, JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown);
    } catch {
      errors.push(`app-configuration/translations/${filename}: not valid JSON`);
    }
  }

  for (const [filename, raw] of parsed) {
    validateLocaleFileShape(filename, raw, errors);
  }

  const enUs = parsed.get('en-US.json');
  if (enUs !== undefined) {
    if (tasks) {
      validateTaskKeyCoverage(tasks, enUs, errors);
    }
    validateTaskKeyParity(parsed, enUs, errors);
    validateAdminComponentTranslations(capDir, parsed, enUs, errors);
  }
}

function validateLocaleFileShape(filename: string, raw: unknown, errors: string[]): void {
  const tasks = readObjectProperty(raw, 'tasks');
  if (!tasks) {
    errors.push(`app-configuration/translations/${filename}: missing or non-object "tasks" key`);
    return;
  }

  const invalidTasks = Object.entries(tasks).filter(([, value]) => !hasNonEmptyStrings(value, ['name', 'description']));
  if (invalidTasks.length > 0) {
    errors.push(
      `app-configuration/translations/${filename}: tasks with missing/invalid name or description: ${invalidTasks.map(([key]) => key).join(', ')}`,
    );
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('adminComponents' in raw)) return;

  const adminComponents = readObjectProperty(raw, 'adminComponents');
  if (!adminComponents) {
    errors.push(`app-configuration/translations/${filename}: "adminComponents" must be an object`);
    return;
  }

  const invalidAdmin: string[] = [];
  for (const [componentKey, component] of Object.entries(adminComponents)) {
    if (!component || typeof component !== 'object' || Array.isArray(component)) {
      invalidAdmin.push(`${componentKey}: must be an object`);
      continue;
    }
    if (!('attributes' in component)) {
      invalidAdmin.push(`${componentKey}: missing "attributes"`);
      continue;
    }
    const attributes = readObjectProperty(component, 'attributes');
    if (!attributes) {
      invalidAdmin.push(`${componentKey}: "attributes" must be an object`);
      continue;
    }
    for (const [attributeId, attribute] of Object.entries(attributes)) {
      if (!hasNonEmptyStrings(attribute, ['label'])) {
        invalidAdmin.push(`${componentKey}.attributes.${attributeId}: "label" missing or invalid`);
      }
    }
  }
  if (invalidAdmin.length > 0) {
    errors.push(
      `app-configuration/translations/${filename}: adminComponents shape invalid: ${invalidAdmin.join('; ')}`,
    );
  }
}

function validateTaskKeyCoverage(tasks: unknown[], enUs: unknown, errors: string[]): void {
  const translated = new Set(Object.keys(readObjectProperty(enUs, 'tasks') ?? {}));
  const missing: string[] = [];
  for (const task of tasks) {
    if (!task || typeof task !== 'object' || Array.isArray(task) || !('taskKey' in task)) continue;
    const taskKey = (task as Record<string, unknown>).taskKey;
    // jq's join drops null, matching a missing taskKey. Every other value is rendered and must be translated.
    if (taskKey == null) continue;
    const token = jqInterpolate(taskKey);
    if (!translated.has(token)) missing.push(token);
  }
  if (missing.length > 0) {
    errors.push(`tasksList.json references taskKey(s) not present in translations/en-US.json: ${missing.join(', ')}`);
  }
}

function validateTaskKeyParity(locales: Map<string, unknown>, enUs: unknown, errors: string[]): void {
  const enKeys = new Set(Object.keys(readObjectProperty(enUs, 'tasks') ?? {}));
  for (const [filename, locale] of locales) {
    if (filename === 'en-US.json') continue;
    const localeKeys = new Set(Object.keys(readObjectProperty(locale, 'tasks') ?? {}));
    reportKeyParity(filename, 'tasks', enKeys, localeKeys, errors);
  }
}

function validateAdminComponentTranslations(
  capDir: string,
  locales: Map<string, unknown>,
  enUs: unknown,
  errors: string[],
): void {
  const adminPath = path.join(capDir, 'app-configuration', 'adminComponents.json');
  if (!fs.existsSync(adminPath)) return;

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(adminPath, 'utf-8')) as unknown;
  } catch {
    errors.push('app-configuration/adminComponents.json: file exists but is not valid JSON');
    return;
  }

  const requiredPairs = adminComponentPairs(raw, errors);
  const enPairs = localeAdminPairs(enUs);
  const missingInEn = [...requiredPairs].filter((pair) => !enPairs.has(pair)).sort();
  if (missingInEn.length > 0) {
    errors.push(
      `adminComponents.json references componentKey/attribute pair(s) not present in translations/en-US.json: ${missingInEn.join(', ')}`,
    );
  }

  for (const [filename, locale] of locales) {
    if (filename === 'en-US.json') continue;
    reportKeyParity(filename, 'adminComponents', enPairs, localeAdminPairs(locale), errors);
  }
}

function adminComponentPairs(raw: unknown, errors: string[]): Set<string> {
  const root = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : undefined;
  const configuration = root?.configuration;
  if (!Array.isArray(configuration)) return new Set();

  const pairs = new Set<string>();
  for (let index = 0; index < configuration.length; index++) {
    const entry = configuration[index];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const component = entry as Record<string, unknown>;
    const componentKey = component.componentKey;
    if (!('componentKey' in component) || componentKey == null) {
      errors.push(`app-configuration/adminComponents.json: configuration[${index}] missing componentKey`);
      continue;
    }
    if (!Array.isArray(component.attributes)) continue;
    const renderedKey = jqInterpolate(componentKey);
    for (let attributeIndex = 0; attributeIndex < component.attributes.length; attributeIndex++) {
      const attribute = component.attributes[attributeIndex];
      const attributeId =
        attribute && typeof attribute === 'object' && !Array.isArray(attribute) && 'id' in attribute
          ? (attribute as Record<string, unknown>).id
          : undefined;
      if (attributeId == null) {
        errors.push(
          `app-configuration/adminComponents.json: configuration[${index}] attribute[${attributeIndex}] missing id`,
        );
        continue;
      }
      pairs.add(`${renderedKey}/${jqInterpolate(attributeId)}`);
    }
  }
  return pairs;
}

/** Renders a value the way jq string interpolation does (`"\(.id)"`). */
function jqInterpolate(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return 'null';
  return JSON.stringify(value);
}

function localeAdminPairs(locale: unknown): Set<string> {
  const adminComponents = readObjectProperty(locale, 'adminComponents') ?? {};
  const pairs = new Set<string>();
  for (const [componentKey, component] of Object.entries(adminComponents)) {
    const attributes = readObjectProperty(component, 'attributes') ?? {};
    for (const attributeId of Object.keys(attributes)) {
      pairs.add(`${componentKey}/${attributeId}`);
    }
  }
  return pairs;
}

function reportKeyParity(
  filename: string,
  namespace: 'tasks' | 'adminComponents',
  expected: Set<string>,
  actual: Set<string>,
  errors: string[],
): void {
  const missing = [...expected].filter((key) => !actual.has(key)).sort();
  const extra = [...actual].filter((key) => !expected.has(key)).sort();
  if (missing.length === 0 && extra.length === 0) return;

  let message = `${filename} ${namespace} key parity mismatch with en-US.json`;
  if (missing.length > 0) message += ` — missing: ${missing.join(', ')}`;
  if (extra.length > 0) message += ` — extra: ${extra.join(', ')}`;
  errors.push(message);
}

function readObjectProperty(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const property = (value as Record<string, unknown>)[key];
  if (!property || typeof property !== 'object' || Array.isArray(property)) return undefined;
  return property as Record<string, unknown>;
}

function hasNonEmptyStrings(value: unknown, keys: string[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => typeof record[key] === 'string' && (record[key] as string).length > 0);
}

function listJsonFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Validates cartridge structure and rules.
 * - No pipeline/ directories
 * - No *.ds pipeline descriptor files
 * - Site cartridges must not have controllers/
 * - Every cartridge must have a .project file (empty or full Eclipse XML)
 */
function validateCartridges(cartridgesDir: string, errors: string[]): void {
  // Check entire cartridges tree for pipelines
  walkDir(cartridgesDir, (filePath, name, isDir) => {
    if (isDir && name === 'pipeline') {
      const rel = path.relative(cartridgesDir, filePath);
      errors.push(`Pipelines not allowed in CAPs: cartridges/${rel}`);
    }
    if (!isDir && name.endsWith('.ds')) {
      const rel = path.relative(cartridgesDir, filePath);
      errors.push(`Pipeline descriptor files not allowed in CAPs: cartridges/${rel}`);
    }
  });

  // Site cartridges must not contain controllers/
  const siteCartridgesDir = path.join(cartridgesDir, 'site_cartridges');
  if (fs.existsSync(siteCartridgesDir)) {
    walkDir(siteCartridgesDir, (filePath, name, isDir) => {
      if (isDir && name === 'controllers') {
        const rel = path.relative(siteCartridgesDir, filePath);
        errors.push(
          `Site cartridges must not contain controllers/ (use BM cartridges instead): site_cartridges/${rel}`,
        );
      }
    });
  }

  // Every cartridge directory must have a .project file (presence check only —
  // an existing non-empty Eclipse .project is just as valid as an empty one).
  validateCartridgesHaveProjectFile(cartridgesDir, 'site_cartridges', errors);
  validateCartridgesHaveProjectFile(cartridgesDir, 'bm_cartridges', errors);
}

/**
 * Requires a `.project` file in every immediate child directory of
 * `cartridgesDir/<groupName>` (e.g. `site_cartridges/int_myapp/.project`).
 */
function validateCartridgesHaveProjectFile(cartridgesDir: string, groupName: string, errors: string[]): void {
  const groupDir = path.join(cartridgesDir, groupName);
  if (!fs.existsSync(groupDir)) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(groupDir, {withFileTypes: true});
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const cartridgeRoot = path.join(groupDir, entry.name);
    if (!fs.existsSync(path.join(cartridgeRoot, '.project'))) {
      errors.push(`Cartridge missing .project file: ${groupName}/${entry.name}`);
    }
  }
}

/**
 * Walks a directory tree, calling callback for each entry.
 * Stops recursing into a directory if callback returns false.
 */
function walkDir(dir: string, cb: (filePath: string, name: string, isDir: boolean) => void): void {
  if (!fs.existsSync(dir)) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    cb(fullPath, entry.name, entry.isDirectory());
    if (entry.isDirectory()) {
      walkDir(fullPath, cb);
    }
  }
}

async function extractZipToDir(zipPath: string, destDir: string): Promise<void> {
  const data = await fs.promises.readFile(zipPath);
  const zip = await JSZip.loadAsync(data);
  for (const [relPath, entry] of Object.entries(zip.files)) {
    const fullPath = path.join(destDir, relPath);
    if (entry.dir) {
      await fs.promises.mkdir(fullPath, {recursive: true});
    } else {
      await fs.promises.mkdir(path.dirname(fullPath), {recursive: true});
      const content = await entry.async('nodebuffer');
      await fs.promises.writeFile(fullPath, content);
    }
  }
}

function cleanupTemp(tempDir: string | undefined): void {
  if (tempDir) {
    try {
      fs.rmSync(tempDir, {recursive: true, force: true});
    } catch {
      // ignore cleanup errors
    }
  }
}
