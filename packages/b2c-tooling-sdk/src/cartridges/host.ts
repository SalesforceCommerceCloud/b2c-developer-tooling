/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';

/**
 * Synchronous filesystem access used by the cartridge resolver and discovery.
 *
 * Hosts are injectable so the same logic can run inside environments that own
 * their own filesystem view, such as the TypeScript language service (`ts.sys`),
 * or against an in-memory tree in tests.
 */
export interface CartridgeFileSystemHost {
  /** Returns true when `filePath` exists and is a file. Must not throw. */
  fileExists(filePath: string): boolean;
  /** Returns the file's UTF-8 contents, or undefined if it cannot be read. Must not throw. */
  readFile(filePath: string): string | undefined;
  /** Returns the names (not paths) of the immediate subdirectories of `dirPath`. Must not throw. */
  getDirectories(dirPath: string): readonly string[];
  /**
   * Whether path comparisons are case-sensitive. When false, cartridge ownership
   * checks fold case; filesystem probes always use the original case.
   */
  useCaseSensitiveFileNames: boolean;
}

/**
 * Creates a {@link CartridgeFileSystemHost} backed by Node's `fs` module.
 *
 * @param options.useCaseSensitiveFileNames - Override case sensitivity. Defaults to
 *   false on Windows and macOS (their default volumes are case-insensitive) and true elsewhere.
 */
export function createNodeFileSystemHost(options: {useCaseSensitiveFileNames?: boolean} = {}): CartridgeFileSystemHost {
  return {
    fileExists(filePath) {
      try {
        return fs.statSync(filePath, {throwIfNoEntry: false})?.isFile() ?? false;
      } catch {
        return false;
      }
    },
    readFile(filePath) {
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch {
        return undefined;
      }
    },
    getDirectories(dirPath) {
      try {
        return fs
          .readdirSync(dirPath, {withFileTypes: true})
          .filter((d) => d.isDirectory())
          .map((d) => d.name);
      } catch {
        return [];
      }
    },
    useCaseSensitiveFileNames:
      options.useCaseSensitiveFileNames ?? !(process.platform === 'win32' || process.platform === 'darwin'),
  };
}

/** Converts a path to forward slashes (the form the resolver returns and compares). */
export function toForwardSlashes(p: string): string {
  return p.replace(/\\/g, '/');
}
