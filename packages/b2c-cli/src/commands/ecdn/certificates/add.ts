/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {readFile} from 'node:fs/promises';
import {Flags} from '@oclif/core';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type Certificate = CdnZonesComponents['schemas']['Certificate'];

/**
 * Response type for the add command.
 */
interface AddOutput {
  certificate: Certificate;
}

/**
 * Command to add a certificate for a zone.
 */
export default class EcdnCertificatesAdd extends EcdnZoneCommand<typeof EcdnCertificatesAdd> {
  static description = withDocs(
    t('commands.ecdn.certificates.add.description', 'Add a certificate for a zone'),
    '/cli/ecdn.html#b2c-ecdn-certificates-add',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --hostname example.com --type automatic',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --hostname example.com --type custom --certificate-file cert.pem --private-key-file key.pem',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    hostname: Flags.string({
      char: 'h',
      description: t('flags.hostname.description', 'Hostname for the certificate'),
      required: true,
    }),
    type: Flags.string({
      description: t('flags.certificateType.description', 'Certificate type (custom or automatic)'),
      options: ['custom', 'automatic'],
      default: 'automatic',
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

  async run(): Promise<AddOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const hostname = this.flags.hostname;
    const certificateType = this.flags.type as 'automatic' | 'custom';
    const certificateFile = this.flags['certificate-file'];
    const privateKeyFile = this.flags['private-key-file'];
    const bundleMethod = this.flags['bundle-method'];

    // Validate custom certificate requirements
    if (certificateType === 'custom' && (!certificateFile || !privateKeyFile)) {
      this.error(
        t(
          'commands.ecdn.certificates.add.customRequired',
          'Custom certificates require both --certificate-file and --private-key-file',
        ),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.certificates.add.adding', 'Adding {{type}} certificate for {{hostname}}...', {
          type: certificateType,
          hostname,
        }),
      );
    }

    // Build request body
    const body: {
      hostname: string;
      certificateType?: string;
      certificate?: string;
      privateKey?: string;
      bundleMethod?: string;
    } = {
      hostname,
      certificateType,
    };

    if (certificateType === 'custom' && certificateFile && privateKeyFile) {
      body.certificate = await readFile(certificateFile, 'utf8');
      body.privateKey = await readFile(privateKeyFile, 'utf8');
    }

    if (bundleMethod) {
      body.bundleMethod = bundleMethod;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/certificates', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.certificates.add.error', 'Failed to add certificate: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const certificate = data?.data;
    if (!certificate) {
      this.error(t('commands.ecdn.certificates.add.noData', 'No certificate data returned from API'));
    }

    const output: AddOutput = {certificate};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.certificates.add.success', 'Certificate added successfully!'));
    this.log('');
    this.log(`  Certificate ID: ${certificate.certificateId}`);
    this.log(`  Hosts:          ${certificate.hosts?.join(', ') || '-'}`);
    this.log(`  Status:         ${certificate.status}`);
    this.log(`  Type:           ${certificate.certificateType}`);

    if (certificate.certificateVerificationTXTName) {
      this.log('');
      this.log('  DNS Verification Required:');
      this.log(`    TXT Name:  ${certificate.certificateVerificationTXTName}`);
      this.log(`    TXT Value: ${certificate.certificateVerificationTXTValue || '-'}`);
    }

    return output;
  }
}
