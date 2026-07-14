/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {withDocs} from '../../../i18n/index.js';

interface SetupIdeVscodeTypesResponse {
  jsconfigPath: string;
  jsconfigOverwritten: boolean;
  typesPath?: string;
  typesVersion?: string;
}

const SCRIPT_TYPES_DIR = '.b2c-script-types';

function buildJsconfigContent(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'es5',
        module: 'commonjs',
        moduleResolution: 'node',
        allowJs: true,
        checkJs: false,
        noEmit: true,
        baseUrl: '.',
        paths: {
          'dw/*': [`./${SCRIPT_TYPES_DIR}/types/dw/*`],
        },
        types: [],
      },
      include: [`${SCRIPT_TYPES_DIR}/types/global.d.ts`, '**/cartridge/**/*.js'],
      exclude: ['**/cartridge/static/**', '**/node_modules/**'],
    },
    null,
    2,
  );
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, {recursive: true});
  const entries = await fs.readdir(src, {withFileTypes: true});
  await Promise.all(
    entries.map((entry) => {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) return copyDir(s, d);
      if (entry.isFile()) return fs.copyFile(s, d);
      return Promise.resolve();
    }),
  );
}

/**
 * Vendor B2C Script API TypeScript definitions and jsconfig.json into the
 * workspace so non-extension IDEs (plain VS Code, WebStorm, Neovim) get
 * dw/* IntelliSense.
 */
export default class SetupIdeVscodeTypes extends BaseCommand<typeof SetupIdeVscodeTypes> {
  static description = withDocs(
    'Vendor Script API TypeScript definitions and a jsconfig.json into the workspace for IDE IntelliSense',
    '/cli/setup.html#b2c-setup-ide-vscode-types',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --force',
    '<%= config.bin %> <%= command.id %> --output jsconfig.json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Path for the generated jsconfig.json',
      default: 'jsconfig.json',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Overwrite output files if they already exist',
      default: false,
    }),
    copy: Flags.boolean({
      description: `Copy bundled types into ./${SCRIPT_TYPES_DIR}/`,
      default: true,
      allowNo: true,
    }),
  };

  async run(): Promise<SetupIdeVscodeTypesResponse> {
    const cwd = this.flags['project-directory'] ? path.resolve(this.flags['project-directory']) : process.cwd();
    const jsconfigPath = path.resolve(cwd, this.flags.output);
    const jsconfigExisted = existsSync(jsconfigPath);

    if (jsconfigExisted && !this.flags.force) {
      this.error(`File already exists at ${jsconfigPath}. Use --force to overwrite.`);
    }

    let typesPath: string | undefined;
    let typesVersion: string | undefined;

    if (this.flags.copy) {
      const typesSrc = this.resolveTypesSource();
      try {
        const sourcePkgJson = JSON.parse(await fs.readFile(path.join(typesSrc, '..', 'package.json'), 'utf8')) as {
          version?: string;
        };
        typesVersion = sourcePkgJson.version;
      } catch {
        // Version metadata is best-effort; missing package.json shouldn't block the copy
      }

      typesPath = path.resolve(cwd, SCRIPT_TYPES_DIR, 'types');
      if (existsSync(typesPath)) {
        if (!this.flags.force) {
          this.error(`Types directory already exists at ${typesPath}. Use --force to overwrite.`);
        }
        await fs.rm(typesPath, {recursive: true, force: true});
      }
      await copyDir(typesSrc, typesPath);
    }

    await fs.mkdir(path.dirname(jsconfigPath), {recursive: true});
    await fs.writeFile(jsconfigPath, buildJsconfigContent() + '\n', 'utf8');

    if (!this.jsonEnabled()) {
      ux.stdout(`Created ${jsconfigPath}${jsconfigExisted ? ' (overwritten)' : ''}`);
      if (typesPath) {
        ux.stdout(`Vendored types into ${typesPath}${typesVersion ? ` (version ${typesVersion})` : ''}`);
      }
    }

    return {
      jsconfigPath,
      jsconfigOverwritten: jsconfigExisted,
      typesPath,
      typesVersion,
    };
  }

  /**
   * Resolve the bundled b2c-script-types `types/` directory. The CLI build
   * stages the workspace package under
   * `dist/script-types/node_modules/@salesforce/b2c-script-types/` so tsserver
   * can probe-load the plugin. Source-tree dev runs without a prior build fall
   * back to the sibling workspace package directly (types/ only — no probe
   * layout needed for the vendor-and-write flow this command does).
   */
  private resolveTypesSource(): string {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const PKG = '@salesforce/b2c-script-types';

    // Built: dist/commands/setup/ide/vscode-types.js -> dist/script-types/node_modules/@salesforce/b2c-script-types/types
    const builtPath = path.resolve(here, '..', '..', '..', 'script-types', 'node_modules', PKG, 'types');
    if (existsSync(builtPath)) return builtPath;

    // Source: src/commands/setup/ide/vscode-types.ts -> ../b2c-script-types/types
    const srcPath = path.resolve(here, '..', '..', '..', '..', '..', 'b2c-script-types', 'types');
    if (existsSync(srcPath)) return srcPath;

    this.error('Could not locate the bundled Script API types. Reinstall the CLI or pass --no-copy.');
  }
}
