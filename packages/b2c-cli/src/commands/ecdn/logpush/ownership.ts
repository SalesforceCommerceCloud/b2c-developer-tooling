/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

/**
 * Response type for the ownership command.
 */
interface OwnershipOutput {
  destinationPath: string;
  fileName: string;
}

/**
 * Command to create a Logpush ownership challenge token.
 */
export default class EcdnLogpushOwnership extends EcdnZoneCommand<typeof EcdnLogpushOwnership> {
  static description = t(
    'commands.ecdn.logpush.ownership.description',
    'Create a Logpush ownership challenge token for destination verification',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --destination-path "s3://my-bucket/logs/{DATE}?region=us-east-1"',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'destination-path': Flags.string({
      description: t(
        'flags.destinationPath.description',
        'S3 bucket destination path (e.g., s3://bucket/path/{DATE}?region=us-east-1)',
      ),
      required: true,
    }),
  };

  async run(): Promise<OwnershipOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const destinationPath = this.flags['destination-path'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.logpush.ownership.creating', 'Creating Logpush ownership challenge...'));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/logpush/ownership', {
      params: {
        path: {organizationId, zoneId},
      },
      body: {destinationPath},
    });

    if (error) {
      this.error(
        t('commands.ecdn.logpush.ownership.error', 'Failed to create ownership challenge: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const result = data?.data;
    if (!result) {
      this.error(t('commands.ecdn.logpush.ownership.noData', 'No ownership data returned from API'));
    }

    const output: OwnershipOutput = {
      destinationPath: result.destinationPath,
      fileName: result.fileName,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 20;

    ui.div('');
    ui.div({text: t('commands.ecdn.logpush.ownership.success', 'Ownership challenge created successfully!')});
    ui.div('');
    ui.div({text: 'Destination Path:', width: labelWidth}, {text: result.destinationPath});
    ui.div({text: 'Challenge File:', width: labelWidth}, {text: result.fileName});
    ui.div('');
    ui.div({
      text: t(
        'commands.ecdn.logpush.ownership.instructions',
        'Upload the ownership challenge file to your S3 bucket, then create a Logpush job with the token.',
      ),
    });

    ux.stdout(ui.toString());

    return output;
  }
}
