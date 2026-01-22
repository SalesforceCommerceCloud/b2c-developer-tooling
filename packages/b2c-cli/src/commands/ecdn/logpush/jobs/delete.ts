/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  deleted: boolean;
  jobId: number;
}

/**
 * Command to delete a Logpush job for a zone.
 */
export default class EcdnLogpushJobsDelete extends EcdnZoneCommand<typeof EcdnLogpushJobsDelete> {
  static description = t('commands.ecdn.logpush.jobs.delete.description', 'Delete a Logpush job');

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --job-id 123456'];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'job-id': Flags.integer({
      description: t('flags.jobId.description', 'Logpush job ID to delete'),
      required: true,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const jobId = this.flags['job-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.logpush.jobs.delete.deleting', 'Deleting Logpush job {{id}}...', {id: jobId}));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE('/organizations/{organizationId}/zones/{zoneId}/logpush/jobs/{jobId}', {
      params: {
        path: {organizationId, zoneId, jobId: String(jobId)},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.logpush.jobs.delete.error', 'Failed to delete Logpush job: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, jobId};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(t('commands.ecdn.logpush.jobs.delete.success', 'Logpush job {{id}} deleted successfully.', {id: jobId}));

    return output;
  }
}
