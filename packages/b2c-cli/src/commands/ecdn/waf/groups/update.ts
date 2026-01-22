/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type WafGroup = CdnZonesComponents['schemas']['WafGroup'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  group: WafGroup;
}

/**
 * Command to update a WAF group for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf rulesets commands.
 */
export default class EcdnWafGroupsUpdate extends EcdnZoneCommand<typeof EcdnWafGroupsUpdate> {
  static description = t(
    'commands.ecdn.waf.groups.update.description',
    'Update a WAF v1 group for a zone (not applicable for WAFv2 zones)',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --group-id abc123 --mode on',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --group-id abc123 --action block',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'group-id': Flags.string({
      description: t('flags.groupId.description', 'WAF group ID to update'),
      required: true,
    }),
    mode: Flags.string({
      description: t('flags.mode.description', 'Mode for the WAF group (on/off)'),
      options: ['on', 'off'],
      required: true,
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action for the WAF group'),
      options: ['block', 'challenge', 'monitor', 'default'],
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const groupId = this.flags['group-id'];
    const mode = this.flags.mode as 'off' | 'on';
    const action = this.flags.action as WafGroup['action'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.groups.update.updating', 'Updating WAF group {{id}}...', {id: groupId}));
    }

    const body: WafGroup = {mode};
    if (action) {
      body.action = action;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PUT('/organizations/{organizationId}/zones/{zoneId}/waf/groups/{groupId}', {
      params: {
        path: {organizationId, zoneId, groupId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.waf.groups.update.error', 'Failed to update WAF group: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const group = data?.data;
    if (!group) {
      this.error(t('commands.ecdn.waf.groups.update.noData', 'No WAF group data returned from API'));
    }

    const output: UpdateOutput = {group};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 14;

    ui.div('');
    ui.div({text: t('commands.ecdn.waf.groups.update.success', 'WAF group updated successfully!')});
    ui.div('');
    ui.div({text: 'Group ID:', width: labelWidth}, {text: group.groupId || '-'});
    ui.div({text: 'Description:', width: labelWidth}, {text: group.description || '-'});
    ui.div({text: 'Mode:', width: labelWidth}, {text: group.mode});
    ui.div({text: 'Action:', width: labelWidth}, {text: group.action || '-'});

    ux.stdout(ui.toString());

    return output;
  }
}
