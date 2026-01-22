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
type LogpushUpdateRequest = CdnZonesComponents['schemas']['LogpushUpdateRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  job: LogpushResponse;
}

/**
 * Command to update a Logpush job for a zone.
 */
export default class EcdnLogpushJobsUpdate extends EcdnZoneCommand<typeof EcdnLogpushJobsUpdate> {
  static description = t('commands.ecdn.logpush.jobs.update.description', 'Update a Logpush job');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --job-id 123456 --enabled',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --job-id 123456 --no-enabled',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --job-id 123456 --log-fields ClientRequestHost,ClientRequestMethod,ClientRequestPath',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'job-id': Flags.integer({
      description: t('flags.jobId.description', 'Logpush job ID'),
      required: true,
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Enable or disable the job'),
      allowNo: true,
    }),
    filter: Flags.string({
      description: t('flags.filter.description', 'JSON filter expression for log selection'),
    }),
    'log-fields': Flags.string({
      description: t('flags.logFields.description', 'Comma-separated list of log fields to include'),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const jobId = this.flags['job-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.logpush.jobs.update.updating', 'Updating Logpush job {{id}}...', {id: jobId}));
    }

    const body: LogpushUpdateRequest = {};

    if (this.flags.enabled !== undefined) {
      body.enabled = this.flags.enabled;
    }
    if (this.flags.filter !== undefined) {
      body.filter = this.flags.filter;
    }
    if (this.flags['log-fields']) {
      body.logFields = this.flags['log-fields'].split(',').map((f) => f.trim());
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PUT('/organizations/{organizationId}/zones/{zoneId}/logpush/jobs/{jobId}', {
      params: {
        path: {organizationId, zoneId, jobId: String(jobId)},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.logpush.jobs.update.error', 'Failed to update Logpush job: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const job = data?.data;
    if (!job) {
      this.error(t('commands.ecdn.logpush.jobs.update.noData', 'No Logpush job data returned from API'));
    }

    const output: UpdateOutput = {job};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.logpush.jobs.update.success', 'Logpush job updated successfully!')});
    ui.div('');
    ui.div({text: 'Job ID:', width: labelWidth}, {text: job.jobId === undefined ? '-' : String(job.jobId)});
    ui.div({text: 'Name:', width: labelWidth}, {text: job.name || '-'});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: job.enabled ? 'yes' : 'no'});

    if (job.logFields && job.logFields.length > 0) {
      ui.div({text: 'Log Fields:', width: labelWidth}, {text: job.logFields.join(', ')});
    }
    if (job.filter) {
      ui.div({text: 'Filter:', width: labelWidth}, {text: job.filter});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
