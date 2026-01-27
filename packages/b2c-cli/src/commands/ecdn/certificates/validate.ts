/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type CustomHostnameValidation = CdnZonesComponents['schemas']['CustomHostnameValidationEnvelope']['data'];

/**
 * Response type for the validate command.
 */
interface ValidateOutput {
  validation: CustomHostnameValidation;
}

/**
 * Command to trigger validation of a custom hostname.
 */
export default class EcdnCertificatesValidate extends EcdnZoneCommand<typeof EcdnCertificatesValidate> {
  static description = withDocs(
    t('commands.ecdn.certificates.validate.description', 'Trigger DNS validation for a custom hostname'),
    '/cli/ecdn.html#b2c-ecdn-certificates-validate',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --custom-hostname-id abc123',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --custom-hostname-id abc123 --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'custom-hostname-id': Flags.string({
      description: t('flags.customHostnameId.description', 'Custom hostname ID to validate'),
      required: true,
    }),
  };

  async run(): Promise<ValidateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const customHostnameId = this.flags['custom-hostname-id'];

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.certificates.validate.triggering', 'Triggering validation for custom hostname {{id}}...', {
          id: customHostnameId,
        }),
      );
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/certificates/custom-hostnames/{customHostnameId}',
      {
        params: {
          path: {organizationId, zoneId, customHostnameId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.certificates.validate.error', 'Failed to trigger validation: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const validation = data?.data;
    if (!validation) {
      this.error(t('commands.ecdn.certificates.validate.noData', 'No validation data returned from API'));
    }

    const output: ValidateOutput = {validation};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.certificates.validate.success', 'Validation triggered successfully!'));
    this.log('');
    this.log(`  Custom Hostname ID: ${validation.customHostnameId}`);
    this.log(`  Custom Hostname:    ${validation.customHostname}`);
    this.log(`  Status:             ${validation.customHostnameStatus}`);
    this.log('');
    this.log('  DNS Verification:');
    this.log(`    TXT Name:  ${validation.customHostnameVerificationTXTName}`);
    this.log(`    TXT Value: ${validation.customHostnameVerificationTXTValue}`);

    return output;
  }
}
