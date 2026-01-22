/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

type MtlsCertificateResponse = CdnZonesComponents['schemas']['MtlsCertificateResponse'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  certificate: MtlsCertificateResponse;
}

/**
 * Command to get an mTLS certificate.
 */
export default class EcdnMtlsGet extends EcdnCommand<typeof EcdnMtlsGet> {
  static description = t('commands.ecdn.mtls.get.description', 'Get details of an mTLS certificate');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --certificate-id 465a48f6-3d98-4c15-9312-211984ee8629',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --certificate-id 465a48f6-3d98-4c15-9312-211984ee8629 --json',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    'certificate-id': Flags.string({
      description: t('flags.certificateId.description', 'mTLS certificate ID'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const mtlsCertificateId = this.flags['certificate-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mtls.get.fetching', 'Fetching mTLS certificate...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/mtls/code-upload-certificates/{mtlsCertificateId}',
      {
        params: {
          path: {organizationId, mtlsCertificateId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.mtls.get.error', 'Failed to fetch mTLS certificate: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const cert = data?.data;
    if (!cert) {
      this.error(t('commands.ecdn.mtls.get.noData', 'No certificate data returned from API'));
    }

    const output: GetOutput = {certificate: cert};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 20;

    ui.div('');
    ui.div({text: 'mTLS Certificate:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Certificate ID:', width: labelWidth}, {text: cert.mtlsCertificateId || '-'});
    ui.div({text: 'Name:', width: labelWidth}, {text: cert.mtlsCertificateName || '-'});
    ui.div({text: 'Issuer:', width: labelWidth}, {text: cert.issuer || '-'});
    ui.div({text: 'Signature:', width: labelWidth}, {text: cert.signature || '-'});
    ui.div({text: 'Serial Number:', width: labelWidth}, {text: cert.serialNumber || '-'});
    ui.div({text: 'CA Certificate:', width: labelWidth}, {text: cert.ca ? 'yes' : 'no'});
    ui.div({text: 'Expires:', width: labelWidth}, {text: cert.expiresOn || '-'});
    ui.div({text: 'Uploaded:', width: labelWidth}, {text: cert.uploadedOn || '-'});

    if (cert.mtlsAssociatedCodeUploadHostname) {
      ui.div({text: 'Hostname:', width: labelWidth}, {text: cert.mtlsAssociatedCodeUploadHostname});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
