/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createBundle, getDefaultMessage, DEFAULT_SSR_PARAMETERS} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

export interface SaveBundleResult {
  filePath: string;
  projectSlug: string;
  message: string;
  ssrOnlyCount: number;
  ssrSharedCount: number;
}

/**
 * Save a bundle to a local directory without uploading it to Managed Runtime.
 */
export default class MrtBundleSave extends BaseCommand<typeof MrtBundleSave> {
  static description = withDocs(
    t('commands.mrt.bundle.save.description', 'Save a Managed Runtime bundle to a local directory'),
    '/cli/mrt.html#b2c-mrt-bundle-save',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --save-dir ./artifacts',
    '<%= config.bin %> <%= command.id %> --project my-storefront --save-dir ./artifacts --gzip',
    '<%= config.bin %> <%= command.id %> --project my-storefront --save-dir ./artifacts --build-dir ./dist',
    '<%= config.bin %> <%= command.id %> --project my-storefront --save-dir ./artifacts --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    project: Flags.string({
      char: 'p',
      description: 'MRT project slug (or set MRT_PROJECT env var)',
      env: 'MRT_PROJECT',
      default: async () => process.env.SFCC_MRT_PROJECT || undefined,
    }),
    'save-dir': Flags.string({
      char: 's',
      description: 'Directory to save the bundle to',
      required: true,
    }),
    'build-dir': Flags.string({
      char: 'b',
      description: 'Path to the build directory',
      default: 'build',
    }),
    'ssr-only': Flags.string({
      description: 'Glob patterns for server-only files (comma-separated or JSON array)',
    }),
    'ssr-shared': Flags.string({
      description: 'Glob patterns for shared files (comma-separated or JSON array)',
    }),
    'node-version': Flags.string({
      char: 'n',
      description: `Node.js version for SSR runtime (default: ${DEFAULT_SSR_PARAMETERS.SSRFunctionNodeVersion})`,
    }),
    gzip: Flags.boolean({
      char: 'g',
      description: 'Gzip the bundle (saves as bundle.tgz instead of bundle.tar)',
      default: false,
    }),
  };

  async run(): Promise<SaveBundleResult> {
    const project = this.flags.project;

    if (!project) {
      this.error('MRT project is required. Provide --project flag or set MRT_PROJECT.');
    }

    const saveDir = this.flags['save-dir'];
    const buildDir = this.flags['build-dir'];
    const ssrOnly = this.flags['ssr-only'] ? parseGlobPatterns(this.flags['ssr-only']) : undefined;
    const ssrShared = this.flags['ssr-shared'] ? parseGlobPatterns(this.flags['ssr-shared']) : undefined;
    const ssrParameters: Record<string, unknown> = {};

    if (this.flags['node-version']) {
      ssrParameters.SSRFunctionNodeVersion = this.flags['node-version'];
    }

    const message = getDefaultMessage();

    this.log(t('commands.mrt.bundle.save.creating', 'Creating bundle for {{project}}...', {project}));

    const bundle = await createBundle({
      projectSlug: project,
      buildDirectory: buildDir,
      message,
      ssrOnly,
      ssrShared,
      ssrParameters,
    });

    const gzip = this.flags.gzip;
    const fileName = gzip ? 'bundle.tgz' : 'bundle.tar';
    const filePath = path.resolve(saveDir, fileName);

    let data = Buffer.from(bundle.data, 'base64');
    if (gzip) {
      data = gzipSync(data);
    }

    writeFileSync(filePath, data);

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.bundle.save.success', 'Bundle saved to {{filePath}}', {filePath}));
    }

    return {
      filePath,
      projectSlug: project,
      message: bundle.message,
      ssrOnlyCount: bundle.ssr_only.length,
      ssrSharedCount: bundle.ssr_shared.length,
    };
  }
}

function parseGlobPatterns(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      throw new Error(`Invalid glob pattern array: expected an array of strings`);
    }
    return parsed.map((s: string) => s.trim()).filter(Boolean);
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
