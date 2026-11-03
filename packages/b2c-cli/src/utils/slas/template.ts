/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {ERROR_CODE, loadConfig, extractOAuthFlags} from '@salesforce/b2c-tooling-sdk/cli';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import type {SlasComponents} from '@salesforce/b2c-tooling-sdk';
import type {SlasClient} from '@salesforce/b2c-tooling-sdk';
import {
  ExistingSlasClientCommand,
  formatApiError,
  isSlasNotFound,
  siteIdFlag,
  siteIdRequiredMessage,
} from './client.js';
import {t} from '../../i18n/index.js';

export type PasswordActionType = SlasComponents['schemas']['PasswordTemplateActionType'];
export type PasswordTemplateType = SlasComponents['schemas']['PasswordTemplateType'];
export type PasswordActionTemplateGroup = SlasComponents['schemas']['PasswordActionTemplateGroup'];
export type PasswordActionTemplateRequest = SlasComponents['schemas']['PasswordActionTemplate'];

export const ACTION_TYPES: PasswordActionType[] = [
  'PWDLESS_LOGIN',
  'PWD_RESET_ACTION',
  'PWD_RESET_CROSS_DEVICE_ACTION',
  'WEBAUTHN_AUTHORIZE_USER',
];

export const TEMPLATE_TYPES: PasswordTemplateType[] = ['EMAIL', 'SMS'];

/**
 * A single password action template, flattened from the service's grouped response.
 */
export interface PasswordActionTemplate {
  actionType: PasswordActionType;
  channelId: string;
  clientId: string;
  link: string;
  locale: string;
  name: string;
  subject: string;
  template: string;
  templateType: PasswordTemplateType;
}

/**
 * Flatten SLAS template groups (snake_case, one per client/channel/action) into one entry per template.
 */
export function flattenTemplateGroups(groups: PasswordActionTemplateGroup[]): PasswordActionTemplate[] {
  return groups.flatMap((group) =>
    (group.templates ?? []).map((tpl) => ({
      actionType: group.action_type as PasswordActionType,
      channelId: group.channel_id ?? '',
      clientId: group.client_id ?? '',
      link: group.link ?? '',
      locale: tpl.locale ?? '',
      name: tpl.name ?? '',
      subject: tpl.subject ?? '',
      template: tpl.template ?? '',
      templateType: tpl.templateType as PasswordTemplateType,
    })),
  );
}

export const actionTypeFlag = Flags.option({
  description: 'Password action the template is used for',
  options: ACTION_TYPES,
});

export const templateTypeFlag = Flags.option({
  description: 'Delivery channel of the template',
  options: TEMPLATE_TYPES,
});

/**
 * Print the details of one password action template.
 */
export function printTemplate(tpl: PasswordActionTemplate): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 15;
  const rows: Array<[string, string]> = [
    ['Client ID', tpl.clientId],
    ['Site ID', tpl.channelId],
    ['Action Type', tpl.actionType],
    ['Template Type', tpl.templateType],
    ['Locale', tpl.locale],
    ['Name', tpl.name],
    ['Subject', tpl.subject],
    ['Link', tpl.link],
  ];
  for (const [label, value] of rows) {
    ui.div({text: `${label}:`, width: labelWidth}, {text: value});
  }
  ui.div({text: ''});
  ui.div({text: 'Template:'});
  ui.div({text: tpl.template, padding: [0, 0, 0, 2]});
  ux.stdout(ui.toString());
}

/**
 * Base command for SLAS password action template operations: an existing client plus a site.
 */
export abstract class SlasTemplateCommand<T extends typeof Command> extends ExistingSlasClientCommand<T> {
  static baseFlags = {
    ...ExistingSlasClientCommand.baseFlags,
    'site-id': siteIdFlag,
  };

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const flags = this.flags as Record<string, unknown>;
    return loadConfig(
      {
        ...extractOAuthFlags(flags),
        siteId: flags['site-id'] as string | undefined,
        slasClientId: flags['slas-client-id'] as string | undefined,
      },
      this.getBaseConfigOptions(),
    );
  }

  protected requireSiteId(): string {
    const {siteId} = this.resolvedConfig.values;
    if (!siteId) {
      this.error(siteIdRequiredMessage(), {code: ERROR_CODE.VALIDATION});
    }
    return siteId;
  }
}

/**
 * Common description text for the action type values.
 */
export function actionTypeHelp(): string {
  return t(
    'commands.slas.client.template.actionTypes',
    'Action types: PWDLESS_LOGIN (passwordless login), PWD_RESET_ACTION (password reset), PWD_RESET_CROSS_DEVICE_ACTION (cross-device password reset), WEBAUTHN_AUTHORIZE_USER (WebAuthn user authorization).',
  );
}

export interface TemplateQuery {
  actionType: PasswordActionType;
  channelId: string;
  clientId: string;
  templateType: PasswordTemplateType;
}

/**
 * Fetch the templates of one client/site/action/type combination. SLAS requires all
 * four filters and answers 404 when nothing matches, which is returned as an empty list.
 */
export async function fetchTemplates(
  slasClient: SlasClient,
  tenantId: string,
  query: TemplateQuery,
): Promise<PasswordActionTemplate[]> {
  const {data, error, response} = await slasClient.GET(
    '/tenants/{tenantId}/clients/{clientId}/password-action-templates',
    {
      params: {
        path: {tenantId, clientId: query.clientId},
        query: {channelId: query.channelId, actionType: query.actionType, templateType: query.templateType},
      },
    },
  );
  if (error) {
    if (isSlasNotFound(error, response)) return [];
    throw new Error(
      t('commands.slas.client.template.fetchError', 'Failed to get password action templates: {{message}}', {
        message: formatApiError(error, response),
      }),
    );
  }
  // Each template carries its own templateType; keep only the requested one.
  return flattenTemplateGroups(data ?? []).filter(
    (tpl) => !tpl.templateType || tpl.templateType === query.templateType,
  );
}
