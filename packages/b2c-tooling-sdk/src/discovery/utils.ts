/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Utility functions for workspace discovery.
 *
 * @module discovery/utils
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {glob as globLib} from 'glob';

/**
 * Package.json structure (partial).
 */
export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Reads and parses a package.json file from a directory.
 *
 * @param dirPath - Directory containing package.json
 * @returns Parsed package.json or undefined if not found/invalid
 */
export async function readPackageJson(dirPath: string): Promise<PackageJson | undefined> {
  const pkgPath = path.join(dirPath, 'package.json');
  try {
    const content = await fs.readFile(pkgPath, 'utf8');
    return JSON.parse(content) as PackageJson;
  } catch {
    return undefined;
  }
}

/**
 * Checks if a file or directory exists.
 *
 * @param filePath - Path to check
 * @returns True if exists, false otherwise
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Finds files matching a glob pattern.
 *
 * @param pattern - Glob pattern to match
 * @param options - Glob options including cwd
 * @returns Array of matching file paths
 */
export async function glob(pattern: string, options: {cwd: string}): Promise<string[]> {
  try {
    return await globLib(pattern, {
      cwd: options.cwd,
      nodir: true,
      ignore: ['**/node_modules/**'],
    });
  } catch {
    return [];
  }
}

/**
 * Finds directories matching a glob pattern.
 *
 * @param pattern - Glob pattern to match
 * @param options - Glob options including cwd
 * @returns Array of matching directory paths
 */
export async function globDirs(pattern: string, options: {cwd: string}): Promise<string[]> {
  try {
    return await globLib(pattern, {
      cwd: options.cwd,
      ignore: ['**/node_modules/**'],
    });
  } catch {
    return [];
  }
}
