/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

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

  public constructor(opts: { configPath?: string } = {}) {
    this.configPath = opts.configPath;
  }

  // ============================================
  // Internal OS Resource Access Methods
  // These are for internal use by tools, not exposed to AI assistants
  // ============================================

  /**
   * Read a file from the filesystem.
   *
   * @param filePath - Path to the file
   * @param encoding - File encoding (default: utf8)
   * @returns File contents as a string
   */
  public readFile(filePath: string, encoding: BufferEncoding = "utf8"): string {
    return fs.readFileSync(filePath, { encoding });
  }

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
   * Get file or directory stats.
   *
   * @param targetPath - Path to get stats for
   * @returns File stats object
   */
  public stat(targetPath: string): fs.Stats {
    return fs.statSync(targetPath);
  }

  /**
   * List directory contents.
   *
   * @param dirPath - Directory path to list
   * @returns Array of directory entries
   */
  public listDirectory(dirPath: string): fs.Dirent[] {
    return fs.readdirSync(dirPath, { withFileTypes: true });
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
   * Get system temporary directory.
   */
  public getTmpDir(): string {
    return os.tmpdir();
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
   * Join path segments.
   *
   * @param segments - Path segments to join
   * @returns Joined path
   */
  public joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Get OS platform information.
   */
  public getPlatform(): NodeJS.Platform {
    return os.platform();
  }
}
