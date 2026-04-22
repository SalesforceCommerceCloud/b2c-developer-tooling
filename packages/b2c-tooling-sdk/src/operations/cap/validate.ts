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
        // Check root dir naming convention
        const dirName = path.basename(capDir);
        if (manifest && dirName !== '.' && dirName !== tempDir) {
          const expectedName = `${manifest.id}-v${manifest.version}`;
          if (dirName !== expectedName) {
            warnings.push(`Root directory "${dirName}" does not match expected convention "${expectedName}"`);
          }
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
    if (!fs.existsSync(tasksListPath)) {
      errors.push('Missing required file: app-configuration/tasksList.json');
    } else {
      try {
        const tasks = JSON.parse(fs.readFileSync(tasksListPath, 'utf-8')) as unknown;
        if (!Array.isArray(tasks)) {
          errors.push('app-configuration/tasksList.json: must be a JSON array');
        } else {
          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i] as Record<string, unknown>;
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
 * Validates cartridge structure and rules.
 * - No pipeline/ directories
 * - No *.ds pipeline descriptor files
 * - Site cartridges must not have controllers/
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
