/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {t, withDocs} from '../../../i18n/index.js';
import MrtBundleDeploy from './deploy.js';

const DEPRECATION_MESSAGE =
  'The "mrt bundle upload-v2" command is deprecated and will be removed in a future release. ' +
  'Use "b2c mrt bundle deploy --v2" instead (add --environment to deploy in the same step).';

/**
 * Build and upload a v2-format bundle to Managed Runtime.
 *
 * Behaves exactly like `b2c mrt bundle deploy --v2`: it inherits that command's
 * flags, backend routing, config resolution, output and error handling, with
 * `--v2` always on. It is kept only so existing scripts keep working.
 *
 * @deprecated Use `b2c mrt bundle deploy --v2`.
 */
export default class MrtBundleUploadV2 extends MrtBundleDeploy {
  static override description = withDocs(
    t(
      'commands.mrt.bundle.uploadV2.description',
      'Build and upload a v2-format bundle to Managed Runtime. Deprecated: use "mrt bundle deploy --v2"',
    ),
    '/cli/mrt.html#b2c-mrt-bundle-upload-v2',
  );

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> --project my-storefront --build-dir ./dist',
    '<%= config.bin %> <%= command.id %> --project my-storefront --match-mode ignore_missing',
    '<%= config.bin %> <%= command.id %> --project my-storefront --root-dir bld --config-path .mrt/config.json',
    '<%= config.bin %> <%= command.id %> --project my-storefront --ssr-param EnvBasePath=/mobify --node-version 20.x',
    '<%= config.bin %> <%= command.id %> --project my-storefront --dependencies @./deps.json --cc-override plugin-a',
  ];

  static override flags = {
    ...MrtBundleDeploy.flags,
    v2: Flags.boolean({
      description: 'Always on for this command (it is equivalent to "mrt bundle deploy --v2")',
      default: true,
      hidden: true,
    }),
  };

  async run(): Promise<unknown> {
    // Written to stderr, so --json output stays machine-readable. Emitted here rather than via
    // oclif's `state = 'deprecated'`, whose warning fires in init() before the logger exists.
    this.warn(t('commands.mrt.bundle.uploadV2.deprecated', DEPRECATION_MESSAGE));

    if (this.args.bundleId !== undefined) {
      this.error(
        'mrt bundle upload-v2 builds and uploads a local build and does not take a bundle ID. ' +
          'To deploy an existing bundle, use: b2c mrt bundle deploy <bundleId> --environment <environment>',
      );
    }

    return super.run();
  }
}
