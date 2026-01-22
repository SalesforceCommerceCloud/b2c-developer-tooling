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
  policyId: string;
}

/**
 * Command to delete a Page Shield policy for a zone.
 */
export default class EcdnPageShieldPoliciesDelete extends EcdnZoneCommand<typeof EcdnPageShieldPoliciesDelete> {
  static description = t('commands.ecdn.page-shield.policies.delete.description', 'Delete a Page Shield policy');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --policy-id policy_1234567890abcdef',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'policy-id': Flags.string({
      description: t('flags.policyId.description', 'Page Shield policy ID to delete'),
      required: true,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const policyId = this.flags['policy-id'];

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.page-shield.policies.delete.deleting', 'Deleting Page Shield policy {{id}}...', {
          id: policyId,
        }),
      );
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE(
      '/organizations/{organizationId}/zones/{zoneId}/page-shield/policies/{policyId}',
      {
        params: {
          path: {organizationId, zoneId, policyId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.policies.delete.error', 'Failed to delete Page Shield policy: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, policyId};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(
      t('commands.ecdn.page-shield.policies.delete.success', 'Page Shield policy {{id}} deleted successfully.', {
        id: policyId,
      }),
    );

    return output;
  }
}
