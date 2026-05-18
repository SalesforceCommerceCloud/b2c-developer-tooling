/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

interface DeleteOutput {
  deleted: boolean;
  ruleId: string;
}

export default class EcdnRateLimitDelete extends EcdnZoneCommand<typeof EcdnRateLimitDelete> {
  static description = withDocs(
    t('commands.ecdn.rate-limit.delete.description', 'Delete a rate limiting rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-rate-limit-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --force',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'Rate limiting rule ID to delete'),
      required: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: t('flags.force.description', 'Skip confirmation prompt'),
      default: false,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.assertDestructiveOperationAllowed('delete rate limiting rule');

    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'];

    if (!this.flags.force && !this.jsonEnabled()) {
      this.warn(
        t(
          'commands.ecdn.rate-limit.delete.warning',
          'Deleting a rate limiting rule may impact traffic behavior. Use --force to confirm.',
        ),
      );
      return {deleted: false, ruleId};
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.rate-limit.delete.deleting', 'Deleting rate limiting rule {{id}}...', {id: ruleId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE('/organizations/{organizationId}/zones/{zoneId}/rate-limiting/rules/{ruleId}', {
      params: {
        path: {organizationId, zoneId, ruleId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.rate-limit.delete.error', 'Failed to delete rate limiting rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, ruleId};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.rate-limit.delete.success', 'Rate limiting rule deleted successfully.'));

    return output;
  }
}
