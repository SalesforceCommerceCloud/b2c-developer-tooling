/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  deleted: boolean;
  rulesetId: string;
}

/**
 * Command to delete an MRT ruleset for a zone.
 */
export default class EcdnMrtRulesDelete extends EcdnZoneCommand<typeof EcdnMrtRulesDelete> {
  static description = t('commands.ecdn.mrt-rules.delete.description', 'Delete an MRT ruleset and all rules within it');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id 12345678901234asdfasfasdf',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'ruleset-id': Flags.string({
      description: t('flags.rulesetId.description', 'MRT ruleset ID to delete'),
      required: true,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const rulesetId = this.flags['ruleset-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mrt-rules.delete.deleting', 'Deleting MRT ruleset {{id}}...', {id: rulesetId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE('/organizations/{organizationId}/zones/{zoneId}/mrtrules/{rulesetId}', {
      params: {
        path: {organizationId, zoneId, rulesetId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.mrt-rules.delete.error', 'Failed to delete MRT ruleset: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, rulesetId};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(t('commands.ecdn.mrt-rules.delete.success', 'MRT ruleset {{id}} deleted successfully.', {id: rulesetId}));

    return output;
  }
}
