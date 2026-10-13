/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {invalidateCacheWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Invalidate cached objects in the CDN.
 */
export default class MrtCacheInvalidate extends MrtCommand<typeof MrtCacheInvalidate> {
  static description = withDocs(
    t(
      'commands.mrt.cache.invalidate.description',
      'Invalidate cached objects in the CDN for a Managed Runtime environment',
    ),
    '/cli/mrt.html#b2c-mrt-env-invalidate',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment production --pattern "/*"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --pattern "/products/*"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --pattern "/category/shoes"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --pattern "/*" --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    pattern: Flags.string({
      description: 'Path pattern to invalidate (must start with /, use /* for all)',
      required: true,
    }),
  };

  protected operations = {
    invalidateCacheWithBackend,
  };

  async run(): Promise<unknown> {
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {pattern} = this.flags;

    // Validate pattern starts with /
    if (!pattern.startsWith('/')) {
      this.error('Pattern must start with a forward slash (/).');
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t('commands.mrt.cache.invalidate.invalidating', 'Invalidating cache for pattern "{{pattern}}"...', {pattern}),
    );

    const result = await this.operations.invalidateCacheWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      pattern,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Invalidating cache via backend'),
    });

    // this.log() is swallowed under --json by MrtCommand.log(), so no jsonEnabled() guard is needed here.
    this.log(t('commands.mrt.cache.invalidate.success', 'Cache invalidation requested.'));
    this.log(
      t(
        'commands.mrt.cache.invalidate.note',
        'Note: Cache invalidations are asynchronous and usually complete within two minutes.',
      ),
    );

    // The legacy backend returns a native payload; emit it verbatim under --json
    // to preserve the existing contract.
    if (result.backend === 'legacy') {
      return result.raw;
    }

    // Invalidation is fire-and-forget: the SCAPI backend returns an empty 202
    // (raw === null), so returning `result.raw` directly would leave --json with
    // no output. Emit a stable acknowledgement instead for the SCAPI backend.
    return {
      project,
      environment,
      pattern,
      backend: result.backend,
      requested: true,
      raw: result.raw,
    };
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
