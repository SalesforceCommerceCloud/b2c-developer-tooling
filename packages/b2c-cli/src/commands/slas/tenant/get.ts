/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import {SlasClientCommand, formatApiError, isSlasNotFound} from '../../../utils/slas/client.js';
import type {SlasComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

export type Tenant = SlasComponents['schemas']['Tenant'];

/**
 * Print tenant details.
 */
export function printTenant(tenant: Tenant): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 16;
  const rows: [string, unknown][] = [
    ['Tenant ID:', tenant.tenantId],
    ['Merchant Name:', tenant.merchantName],
    ['Description:', tenant.description],
    ['Contact:', tenant.contact],
    ['Email:', tenant.emailAddress],
    ['Phone:', tenant.phoneNo],
    ['Tier:', tenant.tier],
  ];
  ui.div('');
  for (const [label, value] of rows) {
    if (value !== undefined && value !== null && value !== '') {
      ui.div({text: label, width: labelWidth}, {text: String(value)});
    }
  }
  ux.stdout(ui.toString());
}

export default class SlasTenantGet extends SlasClientCommand<typeof SlasTenantGet> {
  static description = withDocs(
    t('commands.slas.tenant.get.description', 'Show the SLAS tenant registration'),
    '/cli/slas.html#b2c-slas-tenant-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
  };

  async run(): Promise<Tenant> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.GET('/tenants/{tenantId}', {
      params: {path: {tenantId}},
    });

    if (error) {
      if (isSlasNotFound(error, response)) {
        this.error(
          t(
            'commands.slas.tenant.get.notFound',
            'SLAS tenant {{tenantId}} is not registered. Register it with "b2c slas tenant set".',
            {tenantId},
          ),
        );
      }
      this.error(
        t('commands.slas.tenant.get.error', 'Failed to get SLAS tenant: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    const tenant = data as Tenant;
    if (!this.jsonEnabled()) printTenant(tenant);
    return tenant;
  }
}
