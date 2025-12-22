/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {t} from '../i18n/index.js';

/**
 * WebDAV root location identifiers.
 *
 * These map to the standard B2C Commerce WebDAV directories.
 */
export const WEBDAV_ROOTS = {
  IMPEX: 'Impex',
  TEMP: 'Temp',
  CARTRIDGES: 'Cartridges',
  REALMDATA: 'Realmdata',
  CATALOGS: 'Catalogs',
  LIBRARIES: 'Libraries',
  STATIC: 'Static',
  LOGS: 'Logs',
  SECURITYLOGS: 'Securitylogs',
} as const;

/**
 * Type for valid WebDAV root keys.
 */
export type WebDavRootKey = keyof typeof WEBDAV_ROOTS;

/**
 * Array of valid root location values for flag validation.
 */
export const VALID_ROOTS = Object.keys(WEBDAV_ROOTS) as WebDavRootKey[];

/**
 * Base command for WebDAV file operations.
 *
 * Extends InstanceCommand with a `--root` flag to specify the WebDAV
 * directory root for operations. Provides helper methods for building
 * paths relative to the selected root.
 *
 * @example
 * ```typescript
 * export default class MyWebDavCommand extends WebDavCommand<typeof MyWebDavCommand> {
 *   static args = {
 *     path: Args.string({ required: true, description: 'Remote path' }),
 *   };
 *
 *   async run(): Promise<void> {
 *     const fullPath = this.buildPath(this.args.path);
 *     // fullPath = "Impex/src/data/file.xml" when --root=impex path=src/data/file.xml
 *     const entries = await this.instance.webdav.propfind(fullPath);
 *   }
 * }
 * ```
 */
export abstract class WebDavCommand<T extends typeof Command> extends InstanceCommand<T> {
  static baseFlags = {
    ...InstanceCommand.baseFlags,
    root: Flags.string({
      char: 'r',
      description: 'WebDAV root directory',
      default: 'IMPEX',
      helpGroup: 'WEBDAV',
      options: VALID_ROOTS.map((r) => r.toLowerCase()),
    }),
  };

  /**
   * Builds a full WebDAV path from the root and a relative path.
   *
   * @param relativePath - Path relative to the root directory
   * @returns Full WebDAV path including the root prefix
   *
   * @example
   * ```typescript
   * // With --root=impex
   * this.buildPath('src/data/file.xml')  // Returns: "Impex/src/data/file.xml"
   * this.buildPath('/src/data/file.xml') // Returns: "Impex/src/data/file.xml"
   * this.buildPath('')                    // Returns: "Impex"
   * ```
   */
  protected buildPath(relativePath: string): string {
    const rootKey = this.flags.root.toUpperCase() as WebDavRootKey;
    const rootPath = WEBDAV_ROOTS[rootKey];

    if (!rootPath) {
      this.error(
        t(
          'error.invalidWebdavRoot',
          `Invalid WebDAV root: ${this.flags.root}. Valid options: ${VALID_ROOTS.join(', ')}`,
        ),
      );
    }

    if (!relativePath || relativePath === '' || relativePath === '/') {
      return rootPath;
    }

    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return `${rootPath}/${cleanPath}`;
  }

  /**
   * Gets the current root path.
   *
   * @returns The WebDAV root path (e.g., "Impex")
   */
  protected get rootPath(): string {
    const rootKey = this.flags.root.toUpperCase() as WebDavRootKey;
    return WEBDAV_ROOTS[rootKey];
  }

  /**
   * Validates that WebDAV credentials are available before operations.
   * Called by subclasses that need to ensure auth is configured.
   */
  protected ensureWebDavAuth(): void {
    this.requireServer();
    this.requireWebDavCredentials();
  }
}
