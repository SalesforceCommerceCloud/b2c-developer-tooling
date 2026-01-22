/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {EcdnCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  deleted: boolean;
  certificateId: string;
}

/**
 * Command to delete an mTLS certificate.
 */
export default class EcdnMtlsDelete extends EcdnCommand<typeof EcdnMtlsDelete> {
  static description = t('commands.ecdn.mtls.delete.description', 'Delete an mTLS certificate');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --certificate-id 465a48f6-3d98-4c15-9312-211984ee8629',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    'certificate-id': Flags.string({
      description: t('flags.certificateId.description', 'mTLS certificate ID to delete'),
      required: true,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const mtlsCertificateId = this.flags['certificate-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mtls.delete.deleting', 'Deleting mTLS certificate {{id}}...', {id: mtlsCertificateId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE(
      '/organizations/{organizationId}/mtls/code-upload-certificates/{mtlsCertificateId}',
      {
        params: {
          path: {organizationId, mtlsCertificateId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.mtls.delete.error', 'Failed to delete mTLS certificate: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, certificateId: mtlsCertificateId};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(
      t('commands.ecdn.mtls.delete.success', 'mTLS certificate {{id}} deleted successfully.', {
        id: mtlsCertificateId,
      }),
    );

    return output;
  }
}
