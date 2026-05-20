/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  bulkDeleteBundles,
  deleteBundle,
  type BulkDeleteBundlesResult,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {confirm} from '../../../prompts.js';

interface DeleteBundleResult {
  queued: number[];
  rejected: BulkDeleteBundlesResult['rejected'];
}

export default class MrtBundleDelete extends MrtCommand<typeof MrtBundleDelete> {
  static args = {
    bundleId: Args.integer({
      description: 'Bundle ID to delete (additional IDs may follow)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.bundle.delete.description', 'Delete one or more bundles from a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-bundle-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> 12345 --project my-storefront',
    '<%= config.bin %> <%= command.id %> 12345 12346 12347 -p my-storefront',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  // Allow multiple positional bundle IDs
  static strict = false;

  protected operations = {
    deleteBundle,
    bulkDeleteBundles,
  };

  async run(): Promise<DeleteBundleResult> {
    this.requireMrtCredentials();

    const {argv, flags} = await this.parse(MrtBundleDelete);
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error('MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.');
    }

    const bundleIds: number[] = [];
    for (const arg of argv as Array<number | string>) {
      const n = typeof arg === 'number' ? arg : Number.parseInt(String(arg), 10);
      if (!Number.isInteger(n) || n <= 0) {
        this.error(t('commands.mrt.bundle.delete.invalidId', 'Invalid bundle ID: {{arg}}', {arg: String(arg)}));
      }
      bundleIds.push(n);
    }

    if (!flags.force && !this.jsonEnabled()) {
      const message =
        bundleIds.length === 1
          ? t('commands.mrt.bundle.delete.confirmOne', 'Delete bundle {{id}} from {{project}}?', {
              id: String(bundleIds[0]),
              project,
            })
          : t('commands.mrt.bundle.delete.confirmMany', 'Delete {{n}} bundles from {{project}}?', {
              n: String(bundleIds.length),
              project,
            });
      const confirmed = await confirm(message);
      if (!confirmed) {
        this.log(t('commands.mrt.bundle.delete.cancelled', 'Delete cancelled.'));
        return {queued: [], rejected: []};
      }
    }

    try {
      if (bundleIds.length === 1) {
        const [bundleId] = bundleIds;
        await this.operations.deleteBundle(
          {
            projectSlug: project,
            bundleId,
            origin: this.resolvedConfig.values.mrtOrigin,
          },
          this.getMrtAuth(),
        );

        if (!this.jsonEnabled()) {
          this.log(
            t('commands.mrt.bundle.delete.queuedOne', 'Bundle {{id}} queued for deletion.', {id: String(bundleId)}),
          );
        }

        return {queued: [bundleId], rejected: []};
      }

      const result = await this.operations.bulkDeleteBundles(
        {
          projectSlug: project,
          bundleIds,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.bundle.delete.queuedMany', '{{n}} bundle(s) queued for deletion.', {
            n: String(result.queued.length),
          }),
        );
        if (result.rejected.length > 0) {
          this.log(t('commands.mrt.bundle.delete.rejectedHeader', 'Rejected bundles:'));
          for (const r of result.rejected) {
            this.log(`  - ${r.bundleId ?? '?'}: ${r.reason}`);
          }
        }
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.bundle.delete.failed', 'Failed to delete bundle(s): {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
