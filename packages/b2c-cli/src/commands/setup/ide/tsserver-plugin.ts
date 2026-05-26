/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {existsSync} from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';

import {withDocs} from '../../../i18n/index.js';

interface TsserverPluginInfo {
  /** TS server plugin package name (use as `name` in tsserver init_options.plugins). */
  pluginName: string;
  /**
   * Probe location (use as `location` in tsserver init_options.plugins). TypeScript
   * resolves the plugin via `<location>/node_modules/<pluginName>`, so this is the
   * parent of `node_modules` rather than the package directory itself.
   */
  pluginPath: string;
  /** Absolute directory containing the bundled dw/* TypeScript definitions. */
  typesPath: string;
  /** Plugin/types bundle version, when available. */
  version?: string;
}

const SCRIPT_TYPES_PACKAGE = '@salesforce/b2c-script-types';

/**
 * Print absolute paths to the bundled @salesforce/b2c-script-types TypeScript
 * Server plugin and types directory. Useful for editor integrations (Neovim,
 * Helix, Zed, etc.) that need to wire up the plugin via LSP init_options.
 *
 * Performs no filesystem writes — purely a metadata lookup.
 */
export default class SetupIdeTsserverPlugin extends BaseCommand<typeof SetupIdeTsserverPlugin> {
  static description = withDocs(
    'Print paths to the bundled Script API TypeScript Server plugin (for LSP-based editors)',
    '/cli/setup.html#b2c-setup-ide-tsserver-plugin',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<TsserverPluginInfo> {
    const {pluginPath, packageDir} = this.resolvePaths();
    const typesPath = path.join(packageDir, 'types');
    let version: string | undefined;
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(packageDir, 'package.json'), 'utf8')) as {
        version?: string;
      };
      version = pkg.version;
    } catch {
      // Best-effort; missing version metadata is non-fatal.
    }

    const result: TsserverPluginInfo = {
      pluginName: SCRIPT_TYPES_PACKAGE,
      pluginPath,
      typesPath,
      version,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(`Plugin name: ${result.pluginName}`);
      ux.stdout(`Plugin path: ${result.pluginPath}`);
      ux.stdout(`Types path:  ${result.typesPath}`);
      if (version) ux.stdout(`Version:     ${version}`);
    }

    return result;
  }

  private isPackageDir(dir: string): boolean {
    return (
      existsSync(path.join(dir, 'package.json')) &&
      existsSync(path.join(dir, 'plugin')) &&
      existsSync(path.join(dir, 'types'))
    );
  }

  /**
   * Resolve the bundled b2c-script-types package. tsserver looks up plugins via
   * `<pluginPath>/node_modules/<pluginName>`, so the returned `pluginPath` is the
   * directory whose `node_modules/` contains the package — NOT the package dir
   * itself. `packageDir` is the actual package root (where package.json/types/
   * live), used for metadata reads and the typesPath.
   *
   * The bundle ships at `dist/script-types/node_modules/@salesforce/b2c-script-types/`
   * for both production (npm-installed CLI) and source-tree dev runs after
   * `pnpm --filter @salesforce/b2c-cli run build`. Running `./cli` against
   * uncompiled source without a prior build will not find the bundle.
   */
  private resolvePaths(): {pluginPath: string; packageDir: string} {
    const here = path.dirname(fileURLToPath(import.meta.url));

    // Compiled: dist/commands/setup/ide/tsserver-plugin.js -> dist/script-types/...
    const builtRoot = path.resolve(here, '..', '..', '..', 'script-types');
    // tsx (source): src/commands/setup/ide/tsserver-plugin.ts -> dist/script-types/...
    // (resolved relative to the package root, requires a prior build)
    const srcRoot = path.resolve(here, '..', '..', '..', '..', 'dist', 'script-types');

    for (const root of [builtRoot, srcRoot]) {
      const packageDir = path.join(root, 'node_modules', SCRIPT_TYPES_PACKAGE);
      if (this.isPackageDir(packageDir)) {
        return {pluginPath: root, packageDir};
      }
    }

    this.error(
      'Could not locate the bundled Script API plugin. ' +
        'For an installed CLI, reinstall it. For a source checkout, run `pnpm --filter @salesforce/b2c-cli run build` first.',
    );
  }
}
