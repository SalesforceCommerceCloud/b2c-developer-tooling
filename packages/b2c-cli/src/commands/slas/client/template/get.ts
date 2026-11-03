/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {
  SlasTemplateCommand,
  actionTypeFlag,
  fetchTemplates,
  printTemplate,
  templateTypeFlag,
  type PasswordActionTemplate,
} from '../../../../utils/slas/template.js';
import {t, withDocs} from '../../../../i18n/index.js';

export default class SlasClientTemplateGet extends SlasTemplateCommand<typeof SlasClientTemplateGet> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID (defaults to configured slasClientId)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.slas.client.template.get.description', 'Get a password action template of a SLAS client'),
    '/cli/slas.html#b2c-slas-client-template-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us',
  ];

  static flags = {
    ...SlasTemplateCommand.baseFlags,
    'action-type': actionTypeFlag({required: true}),
    'template-type': templateTypeFlag({required: true}),
    locale: Flags.string({description: 'Template locale, for example en-us', required: true}),
  };

  async run(): Promise<PasswordActionTemplate> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const clientId = this.requireSlasClientId(this.args.clientId);
    const channelId = this.requireSiteId();
    const actionType = this.flags['action-type'];
    const templateType = this.flags['template-type'];
    const locale = this.flags.locale.toLowerCase();

    let templates: PasswordActionTemplate[];
    try {
      templates = await fetchTemplates(this.getSlasClient(), tenantId, {actionType, channelId, clientId, templateType});
    } catch (error) {
      this.error((error as Error).message);
    }

    const template = templates.find((tpl) => tpl.locale.toLowerCase() === locale);
    if (!template) {
      this.error(
        t(
          'commands.slas.client.template.get.notFound',
          'No {{templateType}} template for {{actionType}} in locale {{locale}} on site {{channelId}}.',
          {actionType, channelId, locale, templateType},
        ),
      );
    }

    if (!this.jsonEnabled()) printTemplate(template);
    return template;
  }
}
