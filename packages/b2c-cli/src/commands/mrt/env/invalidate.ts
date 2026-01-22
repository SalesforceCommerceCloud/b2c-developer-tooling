/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {invalidateCache, type InvalidateCacheResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Invalidate cached objects in the CDN.
 */
export default class MrtCacheInvalidate extends MrtCommand<typeof MrtCacheInvalidate> {
  static description = t(
    'commands.mrt.cache.invalidate.description',
    'Invalidate cached objects in the CDN for a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment production --pattern "/*"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --pattern "/products/*"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --pattern "/category/shoes"',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    pattern: Flags.string({
      description: 'Path pattern to invalidate (must start with /, use /* for all)',
      required: true,
    }),
  };

  async run(): Promise<InvalidateCacheResult> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {pattern} = this.flags;

    // Validate pattern starts with /
    if (!pattern.startsWith('/')) {
      this.error('Pattern must start with a forward slash (/).');
    }

    this.log(
      t('commands.mrt.cache.invalidate.invalidating', 'Invalidating cache for pattern "{{pattern}}"...', {pattern}),
    );

    try {
      const result = await invalidateCache(
        {
          projectSlug: project,
          targetSlug: environment,
          pattern,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.cache.invalidate.success', '{{result}}', {result: result.result}));
        this.log(
          t(
            'commands.mrt.cache.invalidate.note',
            'Note: Cache invalidations are asynchronous and usually complete within two minutes.',
          ),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.cache.invalidate.failed', 'Failed to invalidate cache: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }
}
