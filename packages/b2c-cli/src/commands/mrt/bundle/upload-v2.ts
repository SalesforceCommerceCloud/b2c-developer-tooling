/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import type {MrtPushResultView, PushV2Result} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import MrtBundleDeploy from './deploy.js';

const DEPRECATION_MESSAGE =
  'The "mrt bundle upload-v2" command is deprecated and will be removed in a future release. ' +
  'Use "b2c mrt bundle deploy --v2" instead (add --environment to deploy in the same step).';

/**
 * Build and upload a v2-format bundle to Managed Runtime (upload only).
 *
 * Shares `b2c mrt bundle deploy --v2`'s flags, backend routing, config resolution
 * and error handling, but keeps its released contract until it is removed: it
 * never deploys (an environment is ignored) and `--json` returns the
 * {@link PushV2Result} shape (`bundleId`, `projectSlug`, `message`, `warnings`, `matches`).
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
    // Deploy-only: upload-v2 never deploys, so --wait just warns and is skipped.
    wait: Flags.boolean({char: 'w', description: 'Not supported (upload only)', default: false, hidden: true}),
    'poll-interval': Flags.integer({description: 'Not supported (upload only)', default: 30, hidden: true}),
    timeout: Flags.integer({description: 'Not supported (upload only)', default: 600, hidden: true}),
    v2: Flags.boolean({
      description: 'Always on for this command (it is equivalent to "mrt bundle deploy --v2")',
      default: true,
      hidden: true,
    }),
  };

  protected override pushResultJson(result: MrtPushResultView, project: string): PushV2Result {
    this.log(
      t(
        'commands.mrt.bundle.uploadV2.deployHint',
        'To deploy this bundle: b2c mrt bundle deploy {{bundleId}} --environment <environment>',
        {bundleId: String(result.bundleId)},
      ),
    );
    // Legacy raw is the v2 upload response itself; SCAPI nests it under `bundle`.
    const raw = result.raw as {bundle?: {matches?: Record<string, unknown>}; matches?: Record<string, unknown>};
    return {
      bundleId: result.bundleId,
      projectSlug: project,
      message: result.message ?? '',
      warnings: result.warnings ?? [],
      matches: raw.matches ?? raw.bundle?.matches ?? {},
    };
  }

  protected override pushTarget(): undefined {
    return undefined;
  }

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

    if (this.flags.environment) {
      this.warn(
        'mrt bundle upload-v2 is upload-only and ignores --environment. ' +
          'To upload and deploy in one step, use: b2c mrt bundle deploy --v2 --environment <environment>',
      );
    }

    return super.run();
  }
}
