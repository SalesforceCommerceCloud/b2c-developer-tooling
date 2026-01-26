/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {readFile} from 'node:fs/promises';
import {Flags} from '@oclif/core';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

type Certificate = CdnZonesComponents['schemas']['Certificate'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  certificate: Certificate;
}

/**
 * Command to update a certificate for a zone.
 */
export default class EcdnCertificatesUpdate extends EcdnZoneCommand<typeof EcdnCertificatesUpdate> {
  static description = t('commands.ecdn.certificates.update.description', 'Update a certificate for a zone');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --certificate-id abc123 --hostname example.com',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --certificate-id abc123 --certificate-file cert.pem --private-key-file key.pem',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'certificate-id': Flags.string({
      description: t('flags.certificateId.description', 'Certificate ID to update'),
      required: true,
    }),
    hostname: Flags.string({
      char: 'h',
      description: t('flags.hostname.description', 'Hostname for the certificate'),
    }),
    type: Flags.string({
      description: t('flags.certificateType.description', 'Certificate type (custom or automatic)'),
      options: ['custom', 'automatic'],
    }),
    'certificate-file': Flags.string({
      description: t(
        'flags.certificateFile.description',
        'Path to certificate file (PEM format, required for custom type)',
      ),
    }),
    'private-key-file': Flags.string({
      description: t(
        'flags.privateKeyFile.description',
        'Path to private key file (PEM format, required for custom type)',
      ),
    }),
    'bundle-method': Flags.string({
      description: t('flags.bundleMethod.description', 'Bundle method for custom certificate chain verification'),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const certificateId = this.flags['certificate-id'];
    const hostname = this.flags.hostname;
    const certificateType = this.flags.type as 'automatic' | 'custom' | undefined;
    const certificateFile = this.flags['certificate-file'];
    const privateKeyFile = this.flags['private-key-file'];
    const bundleMethod = this.flags['bundle-method'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.certificates.update.updating', 'Updating certificate {{id}}...', {id: certificateId}));
    }

    // Build request body - hostname is required by the API
    if (!hostname) {
      this.error(
        t('commands.ecdn.certificates.update.hostnameRequired', 'Hostname is required for certificate update'),
      );
    }

    const body: {
      hostname: string;
      certificateType?: string;
      certificate?: string;
      privateKey?: string;
      bundleMethod?: string;
    } = {
      hostname,
    };

    if (certificateType) {
      body.certificateType = certificateType;
    }

    if (certificateFile && privateKeyFile) {
      body.certificate = await readFile(certificateFile, 'utf8');
      body.privateKey = await readFile(privateKeyFile, 'utf8');
    }

    if (bundleMethod) {
      body.bundleMethod = bundleMethod;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/certificates/{certificateId}',
      {
        params: {
          path: {organizationId, zoneId, certificateId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.certificates.update.error', 'Failed to update certificate: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const certificate = data?.data;
    if (!certificate) {
      this.error(t('commands.ecdn.certificates.update.noData', 'No certificate data returned from API'));
    }

    const output: UpdateOutput = {certificate};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.certificates.update.success', 'Certificate updated successfully!'));
    this.log('');
    this.log(`  Certificate ID: ${certificate.certificateId}`);
    this.log(`  Hosts:          ${certificate.hosts?.join(', ') || '-'}`);
    this.log(`  Status:         ${certificate.status}`);
    this.log(`  Type:           ${certificate.certificateType}`);

    return output;
  }
}
