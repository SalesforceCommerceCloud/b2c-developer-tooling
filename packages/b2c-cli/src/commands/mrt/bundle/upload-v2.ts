/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {readFileSync} from 'node:fs';
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  pushBundleV2,
  DEFAULT_SSR_PARAMETERS,
  DEFAULT_V2_ROOT_DIR,
  DEFAULT_V2_CONFIG_PATH,
  DEFAULT_V2_MATCH_MODE,
  type PushV2Result,
  type BundleV2MatchMode,
  type BundleV2Metadata,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {
  parseGlobPatterns,
  parseSsrParams,
  isMrtAuthError,
  MRT_PROJECT_SUGGESTION,
} from '../../../utils/mrt/bundle-flags.js';

/**
 * Parses the --dependencies flag. Accepts an inline JSON object, or a path to a
 * JSON file when prefixed with '@' (e.g. '@./deps.json').
 */
function parseDependencies(value: string): Record<string, unknown> {
  let raw = value.trim();
  if (raw.startsWith('@')) {
    raw = readFileSync(raw.slice(1), 'utf8');
  }
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid --dependencies: expected a JSON object');
  }
  return parsed as Record<string, unknown>;
}

/**
 * Build and upload a v2-format bundle to Managed Runtime.
 *
 * This command is upload-only: it does not deploy the bundle. Deploy separately
 * with `b2c mrt bundle deploy <bundleId> --environment <env>`.
 */
export default class MrtBundleUploadV2 extends MrtCommand<typeof MrtBundleUploadV2> {
  static description = withDocs(
    t(
      'commands.mrt.bundle.uploadV2.description',
      'Build and upload a v2-format bundle to Managed Runtime (upload only)',
    ),
    '/cli/mrt.html#b2c-mrt-bundle-upload-v2',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> --project my-storefront --build-dir ./dist',
    '<%= config.bin %> <%= command.id %> --project my-storefront --match-mode ignore_missing',
    '<%= config.bin %> <%= command.id %> --project my-storefront --root-dir bld --config-path .mrt/config.json',
    '<%= config.bin %> <%= command.id %> --project my-storefront --ssr-param EnvBasePath=/mobify --node-version 20.x',
    '<%= config.bin %> <%= command.id %> --project my-storefront --dependencies @./deps.json --cc-override plugin-a',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    message: Flags.string({
      char: 'm',
      description: 'Bundle message/description',
    }),
    'build-dir': Flags.string({
      char: 'b',
      description: 'Path to the build directory',
      default: 'build',
    }),
    'root-dir': Flags.string({
      description: 'Archive path prefix under which built files and the config file live',
      default: DEFAULT_V2_ROOT_DIR,
    }),
    'config-path': Flags.string({
      description: 'Path to the in-archive config file, relative to --root-dir',
      default: DEFAULT_V2_CONFIG_PATH,
    }),
    'match-mode': Flags.string({
      description: 'How ssr-only/ssr-shared patterns that match no files are handled',
      options: ['strict', 'ignore_missing'],
      default: DEFAULT_V2_MATCH_MODE,
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
    'ssr-param': Flags.string({
      description: 'SSR parameter in key=value format (can be specified multiple times)',
      multiple: true,
      default: [],
    }),
    dependencies: Flags.string({
      description: 'Bundle dependencies as inline JSON or a @path to a JSON file',
    }),
    'cc-override': Flags.string({
      description: 'Commerce Cloud override identifier (can be specified multiple times)',
      multiple: true,
      default: [],
    }),
  };

  protected operations = {
    pushBundleV2,
  };

  async run(): Promise<PushV2Result> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error('MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.');
    }

    const buildDir = this.flags['build-dir'];
    const ssrOnly = this.flags['ssr-only'] ? parseGlobPatterns(this.flags['ssr-only']) : undefined;
    const ssrShared = this.flags['ssr-shared'] ? parseGlobPatterns(this.flags['ssr-shared']) : undefined;

    // Build SSR parameters from flags
    const ssrParameters: Record<string, unknown> = parseSsrParams(this.flags['ssr-param']);

    // --node-version is a convenience flag for SSRFunctionNodeVersion
    if (this.flags['node-version']) {
      ssrParameters.SSRFunctionNodeVersion = this.flags['node-version'];
    }

    this.log(t('commands.mrt.bundle.uploadV2.uploading', 'Uploading v2 bundle to {{project}}...', {project}));

    try {
      // Assemble bundle metadata (dependencies, ccOverrides) if provided.
      // parseDependencies reads and parses a file for `--dependencies @file`, so
      // keep it inside the try to surface a friendly error instead of a raw
      // ENOENT/SyntaxError.
      const bundleMetadata: BundleV2Metadata = {};
      if (this.flags.dependencies) {
        bundleMetadata.dependencies = parseDependencies(this.flags.dependencies);
      }
      if (this.flags['cc-override'].length > 0) {
        bundleMetadata.ccOverrides = this.flags['cc-override'];
      }

      const result = await this.operations.pushBundleV2(
        {
          projectSlug: project,
          buildDirectory: buildDir,
          projectDirectory: this.resolvedConfig.values.projectDirectory,
          message: this.flags.message,
          rootDir: this.flags['root-dir'],
          configPath: this.flags['config-path'],
          matchMode: this.flags['match-mode'] as BundleV2MatchMode,
          ssrOnly,
          ssrShared,
          ssrParameters,
          bundleMetadata: Object.keys(bundleMetadata).length > 0 ? bundleMetadata : undefined,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.bundle.uploadV2.success', 'Bundle #{{bundleId}} uploaded to {{project}} ({{message}})', {
            bundleId: String(result.bundleId),
            project: result.projectSlug,
            message: result.message,
          }),
        );

        // The server returns a `matches` object describing how SSR patterns
        // resolved. Its internal shape is not part of the stable contract, so
        // report it generically here and expose the raw object via --json.
        if (Object.keys(result.matches).length > 0) {
          this.log(
            t(
              'commands.mrt.bundle.uploadV2.matches',
              'Server reported SSR file matches for this bundle. Run with --json to inspect them.',
            ),
          );
        }

        this.log(
          t(
            'commands.mrt.bundle.uploadV2.deployHint',
            'To deploy this bundle: b2c mrt bundle deploy {{bundleId}} --environment <environment>',
            {bundleId: String(result.bundleId)},
          ),
        );
      }

      for (const w of result.warnings ?? []) this.warn(w);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        const message = t('commands.mrt.bundle.uploadV2.uploadFailed', 'Upload failed: {{message}}', {
          message: error.message,
        });
        if (isMrtAuthError(error)) {
          this.error(`${message}\n\n${MRT_PROJECT_SUGGESTION}`);
        }
        this.error(message);
      }
      throw error;
    }
  }
}
