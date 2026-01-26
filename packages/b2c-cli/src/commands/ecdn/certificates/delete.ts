/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  success: boolean;
  certificateId: string;
}

/**
 * Command to delete a certificate for a zone.
 * WARNING: Deleting a certificate in use can cause site downtime.
 */
export default class EcdnCertificatesDelete extends EcdnZoneCommand<typeof EcdnCertificatesDelete> {
  static description = withDocs(
    t(
      'commands.ecdn.certificates.delete.description',
      'Delete a certificate from a zone (WARNING: can cause downtime if in use)',
    ),
    '/cli/ecdn.html#b2c-ecdn-certificates-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --certificate-id abc123',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --certificate-id abc123 --force',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'certificate-id': Flags.string({
      description: t('flags.certificateId.description', 'Certificate ID to delete'),
      required: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: t('flags.force.description', 'Skip confirmation prompt'),
      default: false,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const certificateId = this.flags['certificate-id'];
    const force = this.flags.force;

    if (!force && !this.jsonEnabled()) {
      this.warn(
        t(
          'commands.ecdn.certificates.delete.warning',
          'WARNING: Deleting a certificate that is in use can result in downtime!',
        ),
      );
      this.log(t('commands.ecdn.certificates.delete.useForce', 'Use --force to confirm deletion.'));
      return {success: false, certificateId};
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.certificates.delete.deleting', 'Deleting certificate {{id}}...', {id: certificateId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE('/organizations/{organizationId}/zones/{zoneId}/certificates/{certificateId}', {
      params: {
        path: {organizationId, zoneId, certificateId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.certificates.delete.error', 'Failed to delete certificate: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {
      success: true,
      certificateId,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.certificates.delete.success', 'Certificate deleted successfully.'));

    return output;
  }
}
