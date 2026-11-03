/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {SlasClientCommand, formatApiError, isSlasNotFound} from '../../../utils/slas/client.js';
import {t, withDocs} from '../../../i18n/index.js';

interface ShopperDeleteOutput {
  customerId: string;
  deleted: boolean;
}

export default class SlasShopperDelete extends SlasClientCommand<typeof SlasShopperDelete> {
  static args = {
    customerId: Args.string({description: 'Customer ID of the shopper', required: true}),
  };

  static description = withDocs(
    t(
      'commands.slas.shopper.delete.description',
      'Delete all SLAS records of a shopper\n\nUse this to fulfill GDPR data deletion requests. Only SLAS data is deleted; delete the B2C Commerce customer profile separately.',
    ),
    '/cli/slas.html#b2c-slas-shopper-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abcdKZmKZm1234567890abcd --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> abcdKZmKZm1234567890abcd --tenant-id abcd_123 --email shopper@example.com --force',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    email: Flags.string({description: 'Also match SLAS records by this email address'}),
    force: Flags.boolean({char: 'f', description: 'Skip the confirmation prompt', default: false}),
  };

  async run(): Promise<ShopperDeleteOutput> {
    this.assertDestructiveOperationAllowed('delete SLAS shopper');
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const {customerId} = this.args;

    if (!this.flags.force && !this.jsonEnabled()) {
      const ok = await confirm(
        t('commands.slas.shopper.delete.confirm', 'Delete shopper {{customerId}} from SLAS tenant {{tenantId}}?', {
          customerId,
          tenantId,
        }),
      );
      if (!ok) {
        this.log(t('commands.slas.shopper.delete.cancelled', 'Cancelled.'));
        return {customerId, deleted: false};
      }
    }

    const slasClient = this.getSlasClient();
    const {error, response} = await slasClient.DELETE('/tenants/{tenantId}/customers/{customerId}', {
      params: {
        path: {tenantId, customerId},
        query: this.flags.email ? {emailAddress: this.flags.email} : undefined,
      },
    });

    if (error) {
      this.error(
        isSlasNotFound(error, response)
          ? t('commands.slas.shopper.delete.notFound', 'Shopper {{customerId}} not found.', {customerId})
          : t('commands.slas.shopper.delete.error', 'Failed to delete shopper: {{message}}', {
              message: formatApiError(error, response),
            }),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.shopper.delete.success', 'Shopper {{customerId}} deleted.', {customerId}));
    }
    return {customerId, deleted: true};
  }
}
