/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type CustomRule = CdnZonesComponents['schemas']['CustomRule'];
type CustomRulesPostRequest = CdnZonesComponents['schemas']['CustomRulesPostRequest'];

interface CreateOutput {
  rule: CustomRule;
}

export default class EcdnFirewallCreate extends EcdnZoneCommand<typeof EcdnFirewallCreate> {
  static description = withDocs(
    t('commands.ecdn.firewall.create.description', 'Create a custom firewall rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-firewall-create',
  );

  static enableJsonFlag = true;

  static examples = [
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --description "Block /admin" --expression '(http.request.uri.path matches "^/admin")' --actions block`,
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --description "Challenge bot traffic" --expression 'cf.threat_score gt 30' --actions managed_challenge --enabled false`,
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --description "Insert before existing" --expression '(http.host eq "old.example.com")' --actions block --before 2c0fc9fa937b11eaa1b71c4d701ab86e`,
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    description: Flags.string({
      description: t('flags.description.description', 'Rule description'),
      required: true,
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Expression that determines when this rule applies'),
      required: true,
    }),
    actions: Flags.string({
      description: t('flags.actions.description', 'Comma-separated list of actions applied by the rule'),
      required: true,
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Whether the rule is enabled'),
      allowNo: true,
      default: true,
    }),
    before: Flags.string({
      description: t('flags.before.description', 'Insert this rule before the specified rule ID'),
      exclusive: ['after'],
    }),
    after: Flags.string({
      description: t('flags.after.description', 'Insert this rule after the specified rule ID'),
      exclusive: ['before'],
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const description = this.flags.description as string;
    const expression = this.flags.expression as string;
    const actionsRaw = this.flags.actions as string;
    const enabled = this.flags.enabled as boolean;
    const before = this.flags.before as string | undefined;
    const after = this.flags.after as string | undefined;

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.firewall.create.creating', 'Creating custom firewall rule...'));
    }

    const actions = actionsRaw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (actions.length === 0) {
      this.error(t('commands.ecdn.firewall.create.actionsRequired', 'At least one action must be provided.'));
    }

    const body: CustomRulesPostRequest = {
      description,
      expression,
      actions,
      enabled,
    };

    if (before) {
      body.position = {before};
    } else if (after) {
      body.position = {after};
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/firewall-custom/rules', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.firewall.create.error', 'Failed to create custom firewall rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.firewall.create.noData', 'No custom firewall rule data returned from API'));
    }

    const output: CreateOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.firewall.create.success', 'Custom firewall rule created successfully!')});
    ui.div('');
    ui.div({text: 'Rule ID:', width: labelWidth}, {text: rule.ruleId});
    ui.div({text: 'Description:', width: labelWidth}, {text: rule.description});
    ui.div({text: 'Actions:', width: labelWidth}, {text: rule.actions?.join(', ') ?? '-'});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: rule.enabled ? 'yes' : 'no'});

    this.log(ui.toString());

    return output;
  }
}
