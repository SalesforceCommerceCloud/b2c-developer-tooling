/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {EcdnCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the create command.
 */
interface CreateOutput {
  zoneId: string;
  zoneName: string;
  status: string;
  createdOn: string;
}

/**
 * Command to create a new storefront zone.
 */
export default class EcdnZonesCreate extends EcdnCommand<typeof EcdnZonesCreate> {
  static description = withDocs(
    t('commands.ecdn.zones.create.description', 'Create a new storefront CDN zone'),
    '/cli/ecdn.html#b2c-ecdn-zones-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --domain-name example.com',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --domain-name store.example.com --json',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    'domain-name': Flags.string({
      description: t('flags.domainName.description', 'Domain name for the storefront zone'),
      required: true,
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const domainName = this.flags['domain-name'];

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.zones.create.creating', 'Creating storefront zone for {{domain}}...', {domain: domainName}),
      );
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/storefront-zones', {
      params: {
        path: {organizationId},
      },
      body: {
        domainName,
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.zones.create.error', 'Failed to create storefront zone: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const zone = data?.data;
    if (!zone) {
      this.error(t('commands.ecdn.zones.create.noData', 'No zone data returned from API'));
    }

    const output: CreateOutput = {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      status: zone.status,
      createdOn: zone.createdOn,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    this.log(t('commands.ecdn.zones.create.success', 'Storefront zone created successfully!'));
    this.log('');
    this.log(`  Zone ID:    ${output.zoneId}`);
    this.log(`  Zone Name:  ${output.zoneName}`);
    this.log(`  Status:     ${output.status}`);
    this.log(`  Created On: ${output.createdOn}`);

    return output;
  }
}
