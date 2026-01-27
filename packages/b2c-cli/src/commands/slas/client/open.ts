/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../../i18n/index.js';

async function openBrowser(url: string): Promise<void> {
  try {
    const open = await import('open');
    await open.default(url);
  } catch {
    // If open fails, the URL will still be printed to console
  }
}

export default class SlasClientOpen extends BaseCommand<typeof SlasClientOpen> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to open in the admin UI',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.slas.client.open.description', 'Open the SLAS Admin UI for a client'),
    '/cli/slas.html#b2c-slas-client-open',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --short-code kv7kzm78',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    'tenant-id': Flags.string({
      description: 'SLAS tenant ID (organization ID)',
      env: 'SFCC_TENANT_ID',
      required: true,
    }),
    'short-code': Flags.string({
      description: 'SCAPI short code',
      env: 'SFCC_SHORTCODE',
    }),
  };

  async run(): Promise<{url: string}> {
    const {'tenant-id': tenantId, 'short-code': shortCodeFlag} = this.flags;
    const {clientId} = this.args;

    const shortCode = shortCodeFlag ?? this.resolvedConfig.values.shortCode;

    if (!shortCode) {
      this.error(
        t(
          'error.shortCodeRequired',
          'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
        ),
      );
    }

    const url = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1/ui/client?clientId=${encodeURIComponent(clientId)}&tenantId=${encodeURIComponent(tenantId)}`;

    this.log(t('commands.slas.client.open.opening', 'Opening SLAS Admin UI...'));
    this.log(url);

    await openBrowser(url);

    return {url};
  }
}
