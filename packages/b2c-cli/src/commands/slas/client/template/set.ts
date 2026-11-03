/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable no-template-curly-in-string -- SLAS template placeholders such as ${token} */
import {Args, Flags} from '@oclif/core';
import {ERROR_CODE} from '@salesforce/b2c-tooling-sdk/cli';
import {formatApiError, readJsonObjectInput, readTextInput} from '../../../../utils/slas/client.js';
import {
  SlasTemplateCommand,
  actionTypeFlag,
  actionTypeHelp,
  fetchTemplates,
  flattenTemplateGroups,
  printTemplate,
  templateTypeFlag,
  type PasswordActionTemplate,
  type PasswordActionTemplateRequest,
} from '../../../../utils/slas/template.js';
import {t, withDocs} from '../../../../i18n/index.js';

const REQUIRED_FIELDS = ['name', 'subject', 'link', 'template'] as const;

export default class SlasClientTemplateSet extends SlasTemplateCommand<typeof SlasClientTemplateSet> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID (defaults to configured slasClientId)',
      required: false,
    }),
  };

  static description = withDocs(
    t(
      'commands.slas.client.template.set.description',
      'Create or update a password action template of a SLAS client\n\nA template is identified by site, action type, template type and locale. When it already exists, only the fields you pass change.\n\n{{actionTypes}} The template and link can use the ${token} and ${link} placeholders.',
      {actionTypes: actionTypeHelp()},
    ),
    '/cli/slas.html#b2c-slas-client-template-set',
  );

  static enableJsonFlag = true;

  static examples = [
    String.raw`<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us --name "Login code" --subject "Your login code" --link "https://example.com/login?token=\${token}" --template-file login-email.html`,
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us --subject "Sign in to your account"',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --file template.json',
  ];

  static flags = {
    ...SlasTemplateCommand.baseFlags,
    'action-type': actionTypeFlag(),
    'template-type': templateTypeFlag(),
    locale: Flags.string({description: 'Template locale, for example en-us'}),
    name: Flags.string({description: 'Template name'}),
    subject: Flags.string({description: 'Message subject'}),
    link: Flags.string({description: 'Link sent to the shopper (can include ${token})'}),
    template: Flags.string({description: 'Message body', exclusive: ['template-file']}),
    'template-file': Flags.string({description: 'Read the message body from a file (use - for stdin)'}),
    file: Flags.string({
      description:
        'JSON file with template fields (channelId, actionType, templateType, locale, name, subject, link, template); flags override it',
    }),
  };

  async run(): Promise<PasswordActionTemplate> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const clientId = this.requireSlasClientId(this.args.clientId);
    const f = this.flags;

    const fromFile = f.file ? await readJsonObjectInput(f.file) : {};
    const str = (key: string) => (typeof fromFile[key] === 'string' ? (fromFile[key] as string) : undefined);

    const channelId = (this.flags['site-id'] as string | undefined) ?? str('channelId') ?? this.requireSiteId();
    const actionType = (f['action-type'] ?? str('actionType')) as PasswordActionTemplate['actionType'] | undefined;
    const templateType = (f['template-type'] ?? str('templateType')) as
      | PasswordActionTemplate['templateType']
      | undefined;
    const locale = (f.locale ?? str('locale'))?.toLowerCase();

    const missingKeys = [
      actionType ? undefined : '--action-type',
      templateType ? undefined : '--template-type',
      locale ? undefined : '--locale',
    ].filter(Boolean);
    if (missingKeys.length > 0) {
      this.error(
        t('commands.slas.client.template.set.missingKeys', 'Missing required template key: {{fields}}', {
          fields: missingKeys.join(', '),
        }),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    const slasClient = this.getSlasClient();
    let existing: PasswordActionTemplate | undefined;
    try {
      const templates = await fetchTemplates(slasClient, tenantId, {
        actionType: actionType!,
        channelId,
        clientId,
        templateType: templateType!,
      });
      existing = templates.find((tpl) => tpl.locale.toLowerCase() === locale);
    } catch (error) {
      this.error((error as Error).message);
    }

    const templateBody = f['template-file'] ? await readTextInput(f['template-file']) : f.template;

    const body: PasswordActionTemplateRequest = {
      channelId,
      actionType: actionType!,
      templateType: templateType!,
      locale: locale!,
      name: f.name ?? str('name') ?? existing?.name ?? '',
      subject: f.subject ?? str('subject') ?? existing?.subject ?? '',
      link: f.link ?? str('link') ?? existing?.link ?? '',
      template: templateBody ?? str('template') ?? existing?.template ?? '',
    };

    const missing = REQUIRED_FIELDS.filter((key) => !body[key]);
    if (missing.length > 0) {
      this.error(
        t(
          'commands.slas.client.template.set.missingFields',
          'Template does not exist yet. Provide these fields with flags or --file: {{fields}}',
          {fields: missing.join(', ')},
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    if (!this.jsonEnabled()) {
      this.log(
        existing
          ? t('commands.slas.client.template.set.updating', 'Updating password action template...')
          : t('commands.slas.client.template.set.creating', 'Creating password action template...'),
      );
    }

    const {data, error, response} = await slasClient.PUT(
      '/tenants/{tenantId}/clients/{clientId}/password-action-templates',
      {
        params: {path: {tenantId, clientId}},
        body,
      },
    );

    if (error || !data) {
      this.error(
        t('commands.slas.client.template.set.error', 'Failed to save password action template: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    const saved =
      flattenTemplateGroups([data]).find(
        (tpl) => tpl.locale.toLowerCase() === locale && tpl.templateType === templateType,
      ) ?? ({...body, clientId} as PasswordActionTemplate);

    if (!this.jsonEnabled()) printTemplate(saved);
    return saved;
  }
}
