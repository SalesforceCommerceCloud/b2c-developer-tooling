/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ACTION_TYPES,
  SlasTemplateCommand,
  TEMPLATE_TYPES,
  actionTypeFlag,
  fetchTemplates,
  templateTypeFlag,
  type PasswordActionTemplate,
} from '../../../../utils/slas/template.js';
import {t, withDocs} from '../../../../i18n/index.js';

interface TemplateListOutput {
  templates: PasswordActionTemplate[];
}

const COLUMNS: Record<string, ColumnDef<PasswordActionTemplate>> = {
  actionType: {header: 'Action Type', get: (x) => x.actionType},
  templateType: {header: 'Type', get: (x) => x.templateType},
  locale: {header: 'Locale', get: (x) => x.locale},
  name: {header: 'Name', get: (x) => x.name},
  subject: {header: 'Subject', get: (x) => x.subject},
  link: {header: 'Link', get: (x) => x.link},
  channelId: {header: 'Site ID', get: (x) => x.channelId},
};

const DEFAULT_COLUMNS = ['actionType', 'templateType', 'locale', 'name', 'subject'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class SlasClientTemplateList extends SlasTemplateCommand<typeof SlasClientTemplateList> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID (defaults to configured slasClientId)',
      required: false,
    }),
  };

  static description = withDocs(
    t(
      'commands.slas.client.template.list.description',
      'List the password action templates of a SLAS client for a site\n\nTemplates define the email or SMS message SLAS sends for passwordless login, password reset, and WebAuthn flows.',
    ),
    '/cli/slas.html#b2c-slas-client-template-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --json',
  ];

  static flags = {
    ...SlasTemplateCommand.baseFlags,
    ...columnFlagsFor(COLUMNS),
    'action-type': actionTypeFlag(),
    'template-type': templateTypeFlag(),
  };

  async run(): Promise<TemplateListOutput> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const clientId = this.requireSlasClientId(this.args.clientId);
    const channelId = this.requireSiteId();
    const slasClient = this.getSlasClient();

    const actionTypes = this.flags['action-type'] ? [this.flags['action-type']] : ACTION_TYPES;
    const templateTypes = this.flags['template-type'] ? [this.flags['template-type']] : TEMPLATE_TYPES;

    // SLAS can only read one action type and template type at a time.
    const combos = actionTypes.flatMap((actionType) =>
      templateTypes.map((templateType) => ({actionType, channelId, clientId, templateType})),
    );
    let results: PasswordActionTemplate[][];
    try {
      results = await Promise.all(combos.map((query) => fetchTemplates(slasClient, tenantId, query)));
    } catch (error) {
      this.error((error as Error).message);
    }
    const templates = results.flat();
    const output: TemplateListOutput = {templates};

    if (this.jsonEnabled()) return output;

    if (templates.length === 0) {
      this.log(
        t('commands.slas.client.template.list.none', 'No password action templates found for site {{channelId}}.', {
          channelId,
        }),
      );
      return output;
    }

    tableRenderer.render(templates, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    return output;
  }
}
