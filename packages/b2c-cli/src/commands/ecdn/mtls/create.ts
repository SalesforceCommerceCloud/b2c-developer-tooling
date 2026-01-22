/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import * as fs from 'node:fs';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

type MtlsCertificateResponse = CdnZonesComponents['schemas']['MtlsCertificateResponse'];
type MtlsCertificateRequest = CdnZonesComponents['schemas']['MtlsCertificateRequest'];

/**
 * Response type for the create command.
 */
interface CreateOutput {
  certificate: MtlsCertificateResponse;
}

/**
 * Command to create an mTLS certificate for code upload.
 */
export default class EcdnMtlsCreate extends EcdnCommand<typeof EcdnMtlsCreate> {
  static description = t(
    'commands.ecdn.mtls.create.description',
    'Create an mTLS certificate for code upload authentication',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --name my-cert --certificate-file cert.pem --private-key-file key.pem',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    name: Flags.string({
      description: t('flags.name.description', 'Certificate name for identification'),
      required: true,
    }),
    'certificate-file': Flags.string({
      description: t('flags.certificateFile.description', 'Path to PEM-encoded certificate file'),
      required: true,
    }),
    'private-key-file': Flags.string({
      description: t('flags.privateKeyFile.description', 'Path to PEM-encoded private key file'),
      required: true,
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mtls.create.creating', 'Creating mTLS certificate...'));
    }

    const certificate = fs.readFileSync(this.flags['certificate-file'], 'utf8');
    const privateKey = fs.readFileSync(this.flags['private-key-file'], 'utf8');

    const body: MtlsCertificateRequest = {
      name: this.flags.name,
      certificate,
      privateKey,
    };

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/mtls/code-upload-certificates', {
      params: {
        path: {organizationId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.mtls.create.error', 'Failed to create mTLS certificate: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const cert = data?.data;
    if (!cert) {
      this.error(t('commands.ecdn.mtls.create.noData', 'No certificate data returned from API'));
    }

    const output: CreateOutput = {certificate: cert};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 20;

    ui.div('');
    ui.div({text: t('commands.ecdn.mtls.create.success', 'mTLS certificate created successfully!')});
    ui.div('');
    ui.div({text: 'Certificate ID:', width: labelWidth}, {text: cert.mtlsCertificateId || '-'});
    ui.div({text: 'Name:', width: labelWidth}, {text: cert.mtlsCertificateName || '-'});
    ui.div({text: 'Issuer:', width: labelWidth}, {text: cert.issuer || '-'});
    ui.div({text: 'Expires:', width: labelWidth}, {text: cert.expiresOn || '-'});

    if (cert.mtlsAssociatedCodeUploadHostname) {
      ui.div({text: 'Hostname:', width: labelWidth}, {text: cert.mtlsAssociatedCodeUploadHostname});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
