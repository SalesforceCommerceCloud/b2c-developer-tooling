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

export default class EcdnFirewallDelete extends EcdnZoneCommand<typeof EcdnFirewallDelete> {
  static description = withDocs(
    t('commands.ecdn.firewall.delete.description', 'Delete a custom firewall rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-firewall-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --force',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'Custom firewall rule ID to delete'),
      required: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: t('flags.force.description', 'Skip confirmation prompt'),
      default: false,
    }),
  };

  async run(): Promise<DeleteOutput> {
    // Routes through the same destructive-action guard the rest of the CLI
    // uses (sandbox reset, code delete, etc.). Surfaces a confirm prompt or
    // honors the safety policy before any HTTP call.
    this.assertDestructiveOperationAllowed('delete custom firewall rule');

    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'];

    if (!this.flags.force && !this.jsonEnabled()) {
      this.warn(
        t(
          'commands.ecdn.firewall.delete.warning',
          'Deleting a custom firewall rule may impact traffic behavior. Use --force to confirm.',
        ),
      );
      return {deleted: false, ruleId};
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.firewall.delete.deleting', 'Deleting custom firewall rule {{id}}...', {id: ruleId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-custom/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, ruleId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.firewall.delete.error', 'Failed to delete custom firewall rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, ruleId};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.firewall.delete.success', 'Custom firewall rule deleted successfully.'));

    return output;
  }
}
