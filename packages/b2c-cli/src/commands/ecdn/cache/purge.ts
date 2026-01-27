/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the purge command.
 */
interface PurgeOutput {
  success: boolean;
  cachePurged?: boolean;
  details?: string;
  purgedPath?: string;
  purgedTags?: string[];
}

/**
 * Command to purge cache for a zone.
 */
export default class EcdnCachePurge extends EcdnZoneCommand<typeof EcdnCachePurge> {
  static description = withDocs(
    t('commands.ecdn.cache.purge.description', 'Purge cached content for a zone by path or tags'),
    '/cli/ecdn.html#b2c-ecdn-cache-purge',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --path "www.example.com/dw/shop/v21_9/products"',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --tag product-123 --tag category-456',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --path "www.example.com/dw/image/v2/realm_instance/*" --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    path: Flags.string({
      char: 'p',
      description: t('flags.path.description', 'Path to purge (format: hostname/path)'),
    }),
    tag: Flags.string({
      char: 't',
      description: t('flags.tag.description', 'Cache tag to purge (can be specified multiple times)'),
      multiple: true,
    }),
  };

  async run(): Promise<PurgeOutput> {
    this.requireOAuthCredentials();

    const path = this.flags.path;
    const tags = this.flags.tag ?? [];

    if (!path && tags.length === 0) {
      this.error(t('commands.ecdn.cache.purge.noPurgeTarget', 'Either --path or --tag must be specified'));
    }

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      if (path) {
        this.log(t('commands.ecdn.cache.purge.purgingPath', 'Purging path: {{path}}...', {path}));
      }
      if (tags.length > 0) {
        this.log(t('commands.ecdn.cache.purge.purgingTags', 'Purging {{count}} tag(s)...', {count: tags.length}));
      }
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    // Build the request body - API expects either path (string) or tags (array)
    const body: {path?: string; tags?: string[]} = {};
    if (path) {
      body.path = path;
    }
    if (tags.length > 0) {
      body.tags = tags;
    }

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/cachepurge', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.cache.purge.error', 'Failed to purge cache: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const response = data?.data;
    const output: PurgeOutput = {
      success: response?.cachePurged ?? false,
      cachePurged: response?.cachePurged,
      details: response?.details,
      purgedPath: path,
      purgedTags: tags.length > 0 ? tags : undefined,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    if (response?.cachePurged) {
      this.log(t('commands.ecdn.cache.purge.success', 'Cache purge completed successfully!'));
    } else {
      this.log(t('commands.ecdn.cache.purge.partial', 'Cache purge completed with details:'));
      if (response?.details) {
        this.log(`  ${response.details}`);
      }
    }

    if (path) {
      this.log('');
      this.log(`Purged path: ${path}`);
    }

    if (tags.length > 0) {
      this.log('');
      this.log('Purged tags:');
      for (const tag of tags) {
        this.log(`  - ${tag}`);
      }
    }

    return output;
  }
}
