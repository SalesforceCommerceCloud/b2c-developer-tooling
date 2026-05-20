/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

type PageShieldScriptResponse = CdnZonesComponents['schemas']['PageShieldScriptResponse'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  scripts: PageShieldScriptResponse[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<PageShieldScriptResponse>> = {
  id: {
    header: 'Script ID',
    get: (r) => r.id || '-',
  },
  url: {
    header: 'URL',
    get: (r) => r.url || '-',
  },
  host: {
    header: 'Host',
    get: (r) => r.host || '-',
  },
  status: {
    header: 'Status',
    get: (r) => r.status || '-',
  },
  malwareScore: {
    header: 'Malware',
    get: (r) => (r.malwareScore === undefined ? '-' : String(r.malwareScore)),
    extended: true,
  },
  mageCartScore: {
    header: 'MageCart',
    get: (r) => (r.mageCartScore === undefined ? '-' : String(r.mageCartScore)),
    extended: true,
  },
  lastSeenAt: {
    header: 'Last Seen',
    get: (r) => r.lastSeenAt || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'url', 'host', 'status'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Page Shield scripts detected for a zone.
 */
export default class EcdnPageShieldScriptsList extends EcdnZoneCommand<typeof EcdnPageShieldScriptsList> {
  static description = withDocs(
    t('commands.ecdn.page-shield.scripts.list.description', 'List Page Shield scripts detected for a zone'),
    '/cli/ecdn.html#b2c-ecdn-page-shield-scripts-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ListOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.scripts.list.fetching', 'Fetching Page Shield scripts...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/page-shield/scripts', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.scripts.list.error', 'Failed to fetch Page Shield scripts: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const scripts = data?.data ?? [];
    const output: ListOutput = {
      scripts,
      total: scripts.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (scripts.length === 0) {
      this.log(t('commands.ecdn.page-shield.scripts.list.noScripts', 'No Page Shield scripts found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.page-shield.scripts.list.count', 'Found {{count}} Page Shield script(s):', {
        count: scripts.length,
      }),
    );
    this.log('');

    tableRenderer.render(scripts, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return output;
  }
}
