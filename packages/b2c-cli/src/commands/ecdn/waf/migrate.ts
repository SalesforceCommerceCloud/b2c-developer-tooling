/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type WAFManagedRuleset = CdnZonesComponents['schemas']['WAFManagedRuleset'];

/**
 * Response type for the migrate command.
 */
interface MigrateOutput {
  rulesets: WAFManagedRuleset[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<WAFManagedRuleset>> = {
  rulesetId: {
    header: 'Ruleset ID',
    get: (r) => r.rulesetId || '-',
  },
  name: {
    header: 'Name',
    get: (r) => r.name || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  action: {
    header: 'Action',
    get: (r) => r.action || '-',
  },
};

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to migrate a zone from WAF v1 to WAF v2.
 */
export default class EcdnWafMigrate extends EcdnZoneCommand<typeof EcdnWafMigrate> {
  static description = withDocs(
    t(
      'commands.ecdn.waf.migrate.description',
      'Migrate a zone from WAF v1 to WAF v2 (only applicable for existing WAFv1 zones)',
    ),
    '/cli/ecdn.html#b2c-ecdn-waf-migrate',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
  };

  async run(): Promise<MigrateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.migrate.migrating', 'Migrating zone to WAF v2...'));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PUT(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-managed/migration',
      {
        params: {
          path: {organizationId, zoneId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.waf.migrate.error', 'Failed to migrate zone to WAF v2: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rulesets = data?.data ?? [];
    const output: MigrateOutput = {
      rulesets,
      total: rulesets.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    ux.stdout(t('commands.ecdn.waf.migrate.success', 'Zone successfully migrated to WAF v2!'));
    this.log('');

    if (rulesets.length === 0) {
      this.log(t('commands.ecdn.waf.migrate.noRulesets', 'No WAF rulesets created during migration.'));
      return output;
    }

    this.log(
      t('commands.ecdn.waf.migrate.count', 'Created {{count}} WAF v2 ruleset(s):', {
        count: rulesets.length,
      }),
    );
    this.log('');

    tableRenderer.render(rulesets, Object.keys(COLUMNS));

    return output;
  }
}
