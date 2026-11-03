/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {SlasClientCommand, formatApiError, isSlasNotFound} from '../../../utils/slas/client.js';
import {t, withDocs} from '../../../i18n/index.js';

interface DeleteOutput {
  deleted: boolean;
  name: string;
}

export default class SlasIdpDelete extends SlasClientCommand<typeof SlasIdpDelete> {
  static args = {
    name: Args.string({description: 'Identity provider name', required: true}),
  };

  static description = withDocs(
    t(
      'commands.slas.idp.delete.description',
      'Delete a SLAS identity provider\n\nShoppers can no longer log in through this provider.',
    ),
    '/cli/slas.html#b2c-slas-idp-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> okta-staging --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> okta-staging --tenant-id abcd_123 --force',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    force: Flags.boolean({char: 'f', description: 'Skip the confirmation prompt', default: false}),
  };

  async run(): Promise<DeleteOutput> {
    this.assertDestructiveOperationAllowed('delete SLAS identity provider');
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const {name} = this.args;

    if (!this.flags.force && !this.jsonEnabled()) {
      const ok = await confirm(
        t('commands.slas.idp.delete.confirm', 'Delete identity provider {{name}} from tenant {{tenantId}}?', {
          name,
          tenantId,
        }),
      );
      if (!ok) {
        this.log(t('commands.slas.idp.delete.cancelled', 'Cancelled.'));
        return {deleted: false, name};
      }
    }

    const slasClient = this.getSlasClient();
    // SLAS answers 500 "Content type '' not supported" to a DELETE without a Content-Type header.
    const {error, response} = await slasClient.DELETE('/tenants/{tenantId}/idps/{name}', {
      params: {path: {tenantId, name}},
      headers: {'Content-Type': 'application/json'},
    });

    if (error) {
      this.error(
        isSlasNotFound(error, response, 'IdpNotFoundException')
          ? t('commands.slas.idp.get.notFound', 'Identity provider {{name}} not found.', {name})
          : t('commands.slas.idp.delete.error', 'Failed to delete identity provider: {{message}}', {
              message: formatApiError(error, response),
            }),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.idp.delete.success', 'Identity provider {{name}} deleted.', {name}));
    }
    return {deleted: true, name};
  }
}
