/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  deleted: boolean;
  ruleId: string;
}

/**
 * Command to delete an individual MRT rule.
 */
export default class EcdnMrtRulesRulesDelete extends EcdnZoneCommand<typeof EcdnMrtRulesRulesDelete> {
  static description = t('commands.ecdn.mrt-rules.rules.delete.description', 'Delete an individual MRT rule');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'ruleset-id': Flags.string({
      description: t('flags.rulesetId.description', 'MRT ruleset ID'),
      required: true,
    }),
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'MRT rule ID to delete'),
      required: true,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const rulesetId = this.flags['ruleset-id'];
    const ruleId = this.flags['rule-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mrt-rules.rules.delete.deleting', 'Deleting MRT rule {{id}}...', {id: ruleId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE(
      '/organizations/{organizationId}/zones/{zoneId}/mrtrules/{rulesetId}/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, rulesetId, ruleId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.mrt-rules.rules.delete.error', 'Failed to delete MRT rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, ruleId};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(t('commands.ecdn.mrt-rules.rules.delete.success', 'MRT rule {{id}} deleted successfully.', {id: ruleId}));

    return output;
  }
}
