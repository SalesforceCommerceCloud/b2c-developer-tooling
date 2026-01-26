/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

type LogpushResponse = CdnZonesComponents['schemas']['LogpushResponse'];
type LogpushCreateRequest = CdnZonesComponents['schemas']['LogpushCreateRequest'];

/**
 * Response type for the create command.
 */
interface CreateOutput {
  job: LogpushResponse;
}

/**
 * Command to create a Logpush job for a zone.
 */
export default class EcdnLogpushJobsCreate extends EcdnZoneCommand<typeof EcdnLogpushJobsCreate> {
  static description = withDocs(
    t('commands.ecdn.logpush.jobs.create.description', 'Create a Logpush job for a zone'),
    '/cli/ecdn.html#b2c-ecdn-logpush-jobs-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --name my-job --destination-path "s3://bucket/logs/{DATE}?region=us-east-1" --log-type http_requests --log-fields ClientRequestHost,ClientRequestMethod,ClientRequestPath',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --name firewall-logs --destination-path "s3://bucket/firewall/{DATE}?region=us-west-2" --log-type firewall_events --log-fields Action,ClientIP,RuleId',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    name: Flags.string({
      description: t('flags.name.description', 'Name for the Logpush job (cannot be changed after creation)'),
      required: true,
    }),
    'destination-path': Flags.string({
      description: t(
        'flags.destinationPath.description',
        'S3 bucket destination path (e.g., s3://bucket/path/{DATE}?region=us-east-1)',
      ),
      required: true,
    }),
    'log-type': Flags.string({
      description: t('flags.logType.description', 'Type of logs to push'),
      options: ['http_requests', 'firewall_events', 'page_shield_events'],
      required: true,
    }),
    'log-fields': Flags.string({
      description: t('flags.logFields.description', 'Comma-separated list of log fields to include'),
      required: true,
    }),
    filter: Flags.string({
      description: t('flags.filter.description', 'JSON filter expression for log selection'),
    }),
    'ownership-token': Flags.string({
      description: t('flags.ownershipToken.description', 'Ownership challenge token for destination verification'),
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.logpush.jobs.create.creating', 'Creating Logpush job...'));
    }

    const logFields = this.flags['log-fields'].split(',').map((f) => f.trim());

    const body: LogpushCreateRequest = {
      name: this.flags.name,
      destinationPath: this.flags['destination-path'],
      logType: this.flags['log-type'] as LogpushCreateRequest['logType'],
      logFields,
    };

    if (this.flags.filter) {
      body.filter = this.flags.filter;
    }
    if (this.flags['ownership-token']) {
      body.ownershipChallengeToken = this.flags['ownership-token'];
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/logpush/jobs', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.logpush.jobs.create.error', 'Failed to create Logpush job: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const job = data?.data;
    if (!job) {
      this.error(t('commands.ecdn.logpush.jobs.create.noData', 'No Logpush job data returned from API'));
    }

    const output: CreateOutput = {job};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.logpush.jobs.create.success', 'Logpush job created successfully!')});
    ui.div('');
    ui.div({text: 'Job ID:', width: labelWidth}, {text: job.jobId === undefined ? '-' : String(job.jobId)});
    ui.div({text: 'Name:', width: labelWidth}, {text: job.name || '-'});
    ui.div({text: 'Log Type:', width: labelWidth}, {text: job.logType || '-'});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: job.enabled ? 'yes' : 'no'});
    ui.div({text: 'Destination:', width: labelWidth}, {text: job.destinationPath || '-'});

    if (job.logFields && job.logFields.length > 0) {
      ui.div({text: 'Log Fields:', width: labelWidth}, {text: job.logFields.join(', ')});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
