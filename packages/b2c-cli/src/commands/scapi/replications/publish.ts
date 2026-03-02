/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {GranularReplicationsCommand} from '../granular-replications-command.js';
import {getApiErrorMessage, type PublishIdResponse} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

export default class ReplicationsPublish extends GranularReplicationsCommand<typeof ReplicationsPublish> {
  static description = withDocs(
    t('commands.replications.publish.description', 'Queue an item for granular replication (publish to production)'),
    '/cli/replications.html#publish',
  );

  static enableJsonFlag = true;

  static examples = [
    '# Publish a product',
    '<%= config.bin %> <%= command.id %> --product-id PROD-123',
    '',
    '# Publish a price table',
    '<%= config.bin %> <%= command.id %> --price-table-id usd-list-prices',
    '',
    '# Publish content asset from private library',
    '<%= config.bin %> <%= command.id %> --content-id hero-banner --content-type private --site-id RefArch',
    '',
    '# Publish content asset from shared library',
    '<%= config.bin %> <%= command.id %> --content-id footer-links --content-type shared --library-id SharedLibrary',
  ];

  static flags = {
    'product-id': Flags.string({
      description: 'Product ID (SKU) to publish',
      exclusive: ['price-table-id', 'content-id'],
    }),
    'price-table-id': Flags.string({
      description: 'Price table ID to publish',
      exclusive: ['product-id', 'content-id'],
    }),
    'content-id': Flags.string({
      description: 'Content asset ID to publish',
      exclusive: ['product-id', 'price-table-id'],
      dependsOn: ['content-type'],
    }),
    'content-type': Flags.string({
      description: 'Content asset library type',
      options: ['private', 'shared'],
      dependsOn: ['content-id'],
    }),
    'site-id': Flags.string({
      description: 'Site ID (required for private content assets)',
    }),
    'library-id': Flags.string({
      description: 'Library ID (required for shared content assets)',
    }),
  };

  async run(): Promise<PublishIdResponse> {
    this.requireOAuthCredentials();

    const {
      'product-id': productId,
      'price-table-id': priceTableId,
      'content-id': contentId,
      'content-type': contentType,
      'site-id': siteId,
      'library-id': libraryId,
    } = this.flags;

    // Validate entity type provided
    if (!productId && !priceTableId && !contentId) {
      this.error(
        t('commands.replications.publish.no-entity', 'Must specify --product-id, --price-table-id, or --content-id'),
      );
    }

    // Build request body based on entity type
    type PublishBody =
      | {contentAsset: {contentId: string; type: 'private'; siteId: string}}
      | {contentAsset: {contentId: string; type: 'shared'; libraryId: string}}
      | {priceTable: {priceTableId: string}}
      | {product: {productId: string}};

    let body: PublishBody | undefined;

    if (productId) {
      body = {product: {productId}};
    } else if (priceTableId) {
      body = {priceTable: {priceTableId}};
    } else if (contentId) {
      if (contentType === 'private') {
        if (!siteId) {
          this.error(t('commands.replications.publish.site-required', '--site-id required for private content assets'));
        }
        body = {contentAsset: {contentId, type: 'private', siteId}};
      } else if (contentType === 'shared') {
        if (!libraryId) {
          this.error(
            t('commands.replications.publish.library-required', '--library-id required for shared content assets'),
          );
        }
        body = {contentAsset: {contentId, type: 'shared', libraryId}};
      }
    }

    if (!body) {
      this.error(
        t('commands.replications.publish.no-entity', 'Must specify --product-id, --price-table-id, or --content-id'),
      );
    }

    const organizationId = this.getOrganizationId();

    const result = await this.granularReplicationsClient.POST('/organizations/{organizationId}/granular-processes', {
      params: {path: {organizationId}},
      body,
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.replications.publish.error', 'Failed to queue item for publishing: {{message}}', {message}),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.replications.publish.success', 'Item queued for publishing. Process ID: {{id}}', {
          id: result.data.id,
        }),
      );
    }

    return result.data;
  }
}
