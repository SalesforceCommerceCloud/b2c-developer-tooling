/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  deleted: boolean;
}

/**
 * Command to delete origin header modification for a zone.
 */
export default class EcdnOriginHeadersDelete extends EcdnZoneCommand<typeof EcdnOriginHeadersDelete> {
  static description = withDocs(
    t('commands.ecdn.origin-headers.delete.description', 'Delete origin header modification for a zone (MRT type)'),
    '/cli/ecdn.html#b2c-ecdn-origin-headers-delete',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone'];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.origin-headers.delete.deleting', 'Deleting origin header modification...'));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();
    const type = 'mrt'; // Only mrt type is supported

    const {error} = await client.DELETE(
      '/organizations/{organizationId}/zones/{zoneId}/origin-header-modification/{type}',
      {
        params: {
          path: {organizationId, zoneId, type},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.origin-headers.delete.error', 'Failed to delete origin header modification: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(t('commands.ecdn.origin-headers.delete.success', 'Origin header modification deleted successfully.'));

    return output;
  }
}
