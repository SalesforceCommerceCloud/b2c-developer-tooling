/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {SlasClientCommand, formatApiError, isSlasNotFound} from '../../../utils/slas/client.js';
import type {SlasComponents} from '@salesforce/b2c-tooling-sdk';
import {printTenant, type Tenant} from './get.js';
import {t, withDocs} from '../../../i18n/index.js';

type TenantDto = SlasComponents['schemas']['TenantDto'];

export default class SlasTenantSet extends SlasClientCommand<typeof SlasTenantSet> {
  static description = withDocs(
    t(
      'commands.slas.tenant.set.description',
      'Register a SLAS tenant or update its merchant and contact details\n\nFields you omit keep their current values. New tenants get placeholder values for omitted fields.',
    ),
    '/cli/slas.html#b2c-slas-tenant-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --merchant-name "My Brand" --contact "Jane Doe" --email jane@example.com',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --description "Staging storefront"',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    'merchant-name': Flags.string({description: 'Merchant name'}),
    description: Flags.string({description: 'Tenant description'}),
    contact: Flags.string({description: 'Name of the designated contact'}),
    email: Flags.string({description: 'Email address of the designated contact'}),
    phone: Flags.string({description: 'Phone number of the designated contact'}),
  };

  async run(): Promise<Tenant> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const {'merchant-name': merchantName, contact, email, phone} = this.flags;
    const tenantDescription = this.flags.description as string | undefined;
    const slasClient = this.getSlasClient();

    const existing = await slasClient.GET('/tenants/{tenantId}', {params: {path: {tenantId}}});
    let current: Partial<Tenant> | undefined;
    if (existing.error) {
      if (!isSlasNotFound(existing.error, existing.response, 'TenantNotFoundException')) {
        this.error(
          t('commands.slas.tenant.set.fetchError', 'Failed to get SLAS tenant: {{message}}', {
            message: formatApiError(existing.error, existing.response),
          }),
        );
      }
    } else {
      current = existing.data as Tenant;
    }

    // The body tenantId must match the path; SLAS writes to the path tenant regardless.
    const body: Partial<TenantDto> = {
      tenantId,
      merchantName: merchantName ?? current?.merchantName ?? 'B2C CLI Tenant',
      description: tenantDescription ?? current?.description ?? 'Registered by b2c-cli',
      contact: contact ?? current?.contact ?? 'B2C CLI',
      emailAddress: email ?? current?.emailAddress ?? 'noreply@example.com',
    };
    const phoneNo = phone ?? current?.phoneNo;
    if (phoneNo) body.phoneNo = phoneNo;

    if (!this.jsonEnabled()) {
      this.log(
        current
          ? t('commands.slas.tenant.set.updating', 'Updating SLAS tenant {{tenantId}}...', {tenantId})
          : t('commands.slas.tenant.set.creating', 'Registering SLAS tenant {{tenantId}}...', {tenantId}),
      );
    }

    const {data, error, response} = await slasClient.PUT('/tenants/{tenantId}', {
      params: {path: {tenantId}},
      body: body as TenantDto,
    });

    if (error) {
      this.error(
        t('commands.slas.tenant.set.error', 'Failed to save SLAS tenant: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    const tenant = data as Tenant;
    if (!this.jsonEnabled()) printTenant(tenant);
    return tenant;
  }
}
