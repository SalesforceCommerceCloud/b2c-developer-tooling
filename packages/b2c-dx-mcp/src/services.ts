/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Services class that provides utilities for MCP tools.
 *
 * Tools should use `@salesforce/b2c-tooling-sdk` for auth and config:
 * - `loadDwJson({ path: services.configPath })` for configuration
 * - `resolveAuthStrategy()` for authentication
 */
export class Services {
  /**
   * Optional explicit path to config file (dw.json format).
   * If undefined, SDK's `loadDwJson()` will auto-discover it.
   */
  public readonly configPath?: string;

  public constructor(opts: {configPath?: string} = {}) {
    this.configPath = opts.configPath;
  }

  // ============================================
  // Internal OS Resource Access Methods
  // These are for internal use by tools, not exposed to AI assistants
  // ============================================

  /**
   * Check if a file or directory exists.
   *
   * @param targetPath - Path to check
   * @returns True if exists, false otherwise
   */
  public exists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  /**
   * Get the current working directory.
   */
  public getCwd(): string {
    return process.cwd();
  }

  /**
   * Get the user's home directory.
   */
  public getHomeDir(): string {
    return os.homedir();
  }

  /**
   * Get OS platform information.
   */
  public getPlatform(): NodeJS.Platform {
    return os.platform();
  }

  /**
   * Get system temporary directory.
   */
  public getTmpDir(): string {
    return os.tmpdir();
  }

  /**
   * Join path segments.
   *
   * @param segments - Path segments to join
   * @returns Joined path
   */
  public joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * List directory contents.
   *
   * @param dirPath - Directory path to list
   * @returns Array of directory entries
   */
  public listDirectory(dirPath: string): fs.Dirent[] {
    return fs.readdirSync(dirPath, {withFileTypes: true});
  }

  /**
   * Read a file from the filesystem.
   *
   * @param filePath - Path to the file
   * @param encoding - File encoding (default: utf8)
   * @returns File contents as a string
   */
  public readFile(filePath: string, encoding: 'ascii' | 'base64' | 'hex' | 'latin1' | 'utf8' = 'utf8'): string {
    return fs.readFileSync(filePath, {encoding});
  }

  /**
   * Resolve a path relative to the current working directory.
   *
   * @param segments - Path segments to join and resolve
   * @returns Absolute path
   */
  public resolvePath(...segments: string[]): string {
    return path.resolve(...segments);
  }

  /**
   * Get file or directory stats.
   *
   * @param targetPath - Path to get stats for
   * @returns File stats object
   */
  public stat(targetPath: string): fs.Stats {
    return fs.statSync(targetPath);
  }
}
