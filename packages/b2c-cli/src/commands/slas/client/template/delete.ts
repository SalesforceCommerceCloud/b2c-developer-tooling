/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {formatApiError, isSlasNotFound} from '../../../../utils/slas/client.js';
import {SlasTemplateCommand, actionTypeFlag, templateTypeFlag} from '../../../../utils/slas/template.js';
import {t, withDocs} from '../../../../i18n/index.js';

interface TemplateDeleteOutput {
  actionType: string;
  channelId: string;
  clientId: string;
  deleted: boolean;
  locale: string;
  templateType: string;
}

export default class SlasClientTemplateDelete extends SlasTemplateCommand<typeof SlasClientTemplateDelete> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID (defaults to configured slasClientId)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.slas.client.template.delete.description', 'Delete a password action template of a SLAS client'),
    '/cli/slas.html#b2c-slas-client-template-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us --force',
  ];

  static flags = {
    ...SlasTemplateCommand.baseFlags,
    'action-type': actionTypeFlag({required: true}),
    'template-type': templateTypeFlag({required: true}),
    locale: Flags.string({description: 'Template locale, for example en-us', required: true}),
    force: Flags.boolean({char: 'f', description: 'Skip the confirmation prompt', default: false}),
  };

  async run(): Promise<TemplateDeleteOutput> {
    this.assertDestructiveOperationAllowed('delete SLAS password action template');
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const clientId = this.requireSlasClientId(this.args.clientId);
    const channelId = this.requireSiteId();
    const actionType = this.flags['action-type'];
    const templateType = this.flags['template-type'];
    const locale = this.flags.locale.toLowerCase();
    const output: TemplateDeleteOutput = {actionType, channelId, clientId, deleted: false, locale, templateType};

    if (!this.flags.force && !this.jsonEnabled()) {
      const ok = await confirm(
        t(
          'commands.slas.client.template.delete.confirm',
          'Delete the {{templateType}} {{actionType}} template ({{locale}}) of client {{clientId}} on site {{channelId}}?',
          {actionType, channelId, clientId, locale, templateType},
        ),
      );
      if (!ok) {
        this.log(t('commands.slas.client.template.delete.cancelled', 'Cancelled.'));
        return output;
      }
    }

    const {error, response} = await this.getSlasClient().DELETE(
      '/tenants/{tenantId}/clients/{clientId}/password-action-templates',
      {
        params: {
          path: {tenantId, clientId},
          query: {channelId, actionType, templateType, locale},
        },
        headers: {'Content-Type': 'application/json'},
      },
    );

    if (error) {
      this.error(
        isSlasNotFound(error, response)
          ? t('commands.slas.client.template.delete.notFound', 'Password action template not found.')
          : t('commands.slas.client.template.delete.error', 'Failed to delete password action template: {{message}}', {
              message: formatApiError(error, response),
            }),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.template.delete.success', 'Password action template deleted.'));
    }
    return {...output, deleted: true};
  }
}
