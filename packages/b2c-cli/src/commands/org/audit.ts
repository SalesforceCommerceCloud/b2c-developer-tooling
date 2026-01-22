/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OrgCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getOrg, getOrgByName, getOrgAuditLogs} from '@salesforce/b2c-tooling-sdk/operations/orgs';
import type {AuditLogRecord, AuditLogCollection} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

const COLUMNS: Record<string, ColumnDef<AuditLogRecord>> = {
  timestamp: {
    header: 'Timestamp',
    get: (r) => (r.timestamp ? formatTimestamp(r.timestamp) : '-'),
  },
  authorDisplayName: {
    header: 'Author',
    get: (r) => r.authorDisplayName || '-',
  },
  authorEmail: {
    header: 'Email',
    get: (r) => r.authorEmail || '-',
  },
  eventType: {
    header: 'Event Type',
    get: (r) => r.eventType || '-',
  },
  eventMessage: {
    header: 'Message',
    get: (r) => r.eventMessage || '-',
  },
};

const DEFAULT_COLUMNS = ['timestamp', 'authorDisplayName', 'authorEmail', 'eventType', 'eventMessage'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to get audit logs for an Account Manager organization.
 */
export default class OrgAudit extends OrgCommand<typeof OrgAudit> {
  static args = {
    org: Args.string({
      description: 'Organization ID or name',
      required: true,
    }),
  };

  static description = t('commands.org.audit.description', 'Get audit logs for an Account Manager organization');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> org-id',
    '<%= config.bin %> <%= command.id %> "My Organization"',
    '<%= config.bin %> <%= command.id %> org-id --json',
  ];

  static flags = {
    columns: Flags.string({
      description: 'Comma-separated list of columns to display',
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show extended columns',
    }),
  };

  async run(): Promise<AuditLogCollection> {
    const {org} = this.args;

    this.log(t('commands.org.audit.fetching', 'Fetching organization {{org}}...', {org}));

    // Get organization first (by ID or name)
    let organization;
    try {
      organization = await getOrg(this.accountManagerOrgsClient, org);
    } catch (error) {
      // If not found by ID, try by name
      if (error instanceof Error && error.message.includes('not found')) {
        try {
          organization = await getOrgByName(this.accountManagerOrgsClient, org);
        } catch {
          throw new Error(t('commands.org.audit.orgNotFound', 'Organization {{org}} not found', {org}));
        }
      } else {
        throw error;
      }
    }

    this.log(t('commands.org.audit.fetchingLogs', 'Fetching audit logs...'));

    const result = await getOrgAuditLogs(this.accountManagerOrgsClient, organization.id);

    if (this.jsonEnabled()) {
      return result;
    }

    if (!result.content || result.content.length === 0) {
      this.log(t('commands.org.audit.noResults', 'No audit records found'));
      return result;
    }

    // Determine columns to display
    let columnsToShow = DEFAULT_COLUMNS;
    if (this.flags.columns) {
      columnsToShow = this.flags.columns.split(',').map((c) => c.trim());
    } else if (this.flags.extended) {
      columnsToShow = Object.keys(COLUMNS);
    }

    tableRenderer.render(result.content, columnsToShow);

    return result;
  }
}
