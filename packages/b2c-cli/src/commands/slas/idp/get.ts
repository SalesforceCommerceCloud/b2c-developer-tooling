/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {SlasClientCommand, formatApiError, isSlasNotFound} from '../../../utils/slas/client.js';
import {printIdp, redactIdp, type IdentityProvider} from '../../../utils/slas/idp.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class SlasIdpGet extends SlasClientCommand<typeof SlasIdpGet> {
  static args = {
    name: Args.string({description: 'Identity provider name (for example google or okta-staging)', required: true}),
  };

  static description = withDocs(
    t('commands.slas.idp.get.description', 'Show a SLAS identity provider configuration'),
    '/cli/slas.html#b2c-slas-idp-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> google --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> google --tenant-id abcd_123 --json --show-secret > google.json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    'show-secret': Flags.boolean({
      description: 'Show the IDP client secret instead of masking it',
      default: false,
    }),
  };

  async run(): Promise<IdentityProvider> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const {name} = this.args;
    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.GET('/tenants/{tenantId}/idps/{name}', {
      params: {path: {tenantId, name}},
    });

    if (error) {
      this.error(
        isSlasNotFound(error, response)
          ? t('commands.slas.idp.get.notFound', 'Identity provider {{name}} not found.', {name})
          : t('commands.slas.idp.get.error', 'Failed to get identity provider: {{message}}', {
              message: formatApiError(error, response),
            }),
      );
    }

    const idp = redactIdp(data as IdentityProvider, this.flags['show-secret']);
    if (!this.jsonEnabled()) printIdp(idp);
    return idp;
  }
}
