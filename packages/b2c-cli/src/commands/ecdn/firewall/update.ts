/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type CustomRule = CdnZonesComponents['schemas']['CustomRule'];
type CustomRulesPatchRequest = CdnZonesComponents['schemas']['CustomRulesPatchRequest'];

interface UpdateOutput {
  rule: CustomRule;
}

export default class EcdnFirewallUpdate extends EcdnZoneCommand<typeof EcdnFirewallUpdate> {
  static description = withDocs(
    t('commands.ecdn.firewall.update.description', 'Update a custom firewall rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-firewall-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --description "Updated copy"',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --actions managed_challenge --no-enabled',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'Custom firewall rule ID'),
      required: true,
    }),
    description: Flags.string({
      description: t('flags.description.description', 'Rule description'),
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Expression that determines when this rule applies'),
    }),
    actions: Flags.string({
      description: t('flags.actions.description', 'Comma-separated list of actions applied by the rule'),
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Whether the rule is enabled'),
      allowNo: true,
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'] as string;
    const description = this.flags.description as string | undefined;
    const expression = this.flags.expression as string | undefined;
    const actionsRaw = this.flags.actions as string | undefined;
    const enabled = this.flags.enabled as boolean | undefined;

    const hasUpdates = [description, expression, actionsRaw, enabled].some((value) => value !== undefined);

    if (!hasUpdates) {
      this.error(t('commands.ecdn.firewall.update.noChanges', 'Provide at least one field to update.'));
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.firewall.update.updating', 'Updating custom firewall rule {{id}}...', {id: ruleId}));
    }

    const body: CustomRulesPatchRequest = {};

    if (description !== undefined) {
      body.description = description;
    }

    if (expression !== undefined) {
      body.expression = expression;
    }

    if (actionsRaw !== undefined) {
      const actions = actionsRaw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (actions.length === 0) {
        this.error(t('commands.ecdn.firewall.update.actionsRequired', 'At least one action must be provided.'));
      }

      body.actions = actions;
    }

    if (enabled !== undefined) {
      body.enabled = enabled;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-custom/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, ruleId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.firewall.update.error', 'Failed to update custom firewall rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.firewall.update.noData', 'No custom firewall rule data returned from API'));
    }

    const output: UpdateOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    printFieldsBlock(
      t('commands.ecdn.firewall.update.success', 'Custom firewall rule updated successfully!'),
      [
        ['Rule ID', rule.ruleId],
        ['Description', rule.description],
        ['Actions', rule.actions?.join(', ') ?? '-'],
        ['Enabled', rule.enabled ? 'yes' : 'no'],
      ],
      {labelWidth: 18},
    );

    return output;
  }
}
