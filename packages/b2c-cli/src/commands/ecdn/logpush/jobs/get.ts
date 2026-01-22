/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type LogpushResponse = CdnZonesComponents['schemas']['LogpushResponse'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  job: LogpushResponse;
}

/**
 * Command to get a Logpush job for a zone.
 */
export default class EcdnLogpushJobsGet extends EcdnZoneCommand<typeof EcdnLogpushJobsGet> {
  static description = t('commands.ecdn.logpush.jobs.get.description', 'Get details of a Logpush job');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --job-id 123456',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --job-id 123456 --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'job-id': Flags.integer({
      description: t('flags.jobId.description', 'Logpush job ID'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const jobId = this.flags['job-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.logpush.jobs.get.fetching', 'Fetching Logpush job...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/logpush/jobs/{jobId}', {
      params: {
        path: {organizationId, zoneId, jobId: String(jobId)},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.logpush.jobs.get.error', 'Failed to fetch Logpush job: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const job = data?.data;
    if (!job) {
      this.error(t('commands.ecdn.logpush.jobs.get.noData', 'No Logpush job data returned from API'));
    }

    const output: GetOutput = {job};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: 'Logpush Job:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Job ID:', width: labelWidth}, {text: job.jobId === undefined ? '-' : String(job.jobId)});
    ui.div({text: 'Name:', width: labelWidth}, {text: job.name || '-'});
    ui.div({text: 'Log Type:', width: labelWidth}, {text: job.logType || '-'});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: job.enabled ? 'yes' : 'no'});
    ui.div({text: 'Destination:', width: labelWidth}, {text: job.destinationPath || '-'});

    if (job.logFields && job.logFields.length > 0) {
      ui.div({text: 'Log Fields:', width: labelWidth}, {text: job.logFields.join(', ')});
    }
    if (job.filter) {
      ui.div({text: 'Filter:', width: labelWidth}, {text: job.filter});
    }
    if (job.lastComplete) {
      ui.div({text: 'Last Complete:', width: labelWidth}, {text: job.lastComplete});
    }
    if (job.lastError) {
      ui.div({text: 'Last Error:', width: labelWidth}, {text: job.lastError});
    }
    if (job.errorMessage) {
      ui.div({text: 'Error Message:', width: labelWidth}, {text: job.errorMessage});
    }
    if (job.createdOn) {
      ui.div({text: 'Created On:', width: labelWidth}, {text: job.createdOn});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
