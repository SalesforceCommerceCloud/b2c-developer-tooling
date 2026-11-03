/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {ERROR_CODE, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import type {SlasComponents} from '@salesforce/b2c-tooling-sdk';
import {SlasChannelCommand, formatApiError, readTextInput} from '../../../utils/slas/client.js';
import {t, withDocs} from '../../../i18n/index.js';

type LoginIdResult = SlasComponents['schemas']['LoginIdResult'];

/** Maximum number of login IDs SLAS accepts in one batch-logout request. */
export const BATCH_LOGOUT_LIMIT = 50;

export interface ShopperLogoutOutput {
  failureCount: number;
  results: LoginIdResult[];
  successCount: number;
  totalProcessed: number;
}

const COLUMNS: Record<string, ColumnDef<LoginIdResult>> = {
  loginId: {header: 'Login ID', get: (r) => r.loginId},
  status: {header: 'Status', get: (r) => r.status},
  errorMessage: {header: 'Message', get: (r) => summarizeLogoutError(r.errorMessage)},
};

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Shorten a batch-logout error message for table display. SLAS embeds the upstream
 * JSON error body in the message; show only its `message` field when present.
 */
export function summarizeLogoutError(message: string | undefined): string {
  if (!message) return '';
  const inner = /"message"\s*:\s*"([^"]*)"/.exec(message);
  return inner ? inner[1] : message.replaceAll(/\s+/g, ' ').trim();
}

/**
 * Parse login IDs from a newline-separated text file (blank lines and `#` comments ignored).
 */
export function parseLoginIdList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

export default class SlasShopperLogout extends SlasChannelCommand<typeof SlasShopperLogout> {
  static description = withDocs(
    t(
      'commands.slas.shopper.logout.description',
      'Log out shoppers from every session\n\nRevokes the refresh tokens and invalidates the access tokens of each shopper. Shoppers keep their passwords and must log in again.',
    ),
    '/cli/slas.html#b2c-slas-shopper-logout',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --site-id RefArch --login-id shopper@example.com',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --site-id RefArch --login-id a@example.com,b@example.com --force',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --site-id RefArch --file login-ids.txt --force',
  ];

  static flags = {
    ...SlasChannelCommand.baseFlags,
    'login-id': Flags.string({
      description: 'Shopper login ID to log out (comma-separated or repeatable)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    file: Flags.string({
      description: 'File with one login ID per line (use - for stdin)',
    }),
    force: Flags.boolean({char: 'f', description: 'Skip the confirmation prompt', default: false}),
  };

  async run(): Promise<ShopperLogoutOutput> {
    const loginIds = await this.collectLoginIds();
    if (loginIds.length === 0) {
      this.error(
        t('commands.slas.shopper.logout.noLoginIds', 'Provide at least one login ID with --login-id or --file.'),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    this.assertDestructiveOperationAllowed('log out SLAS shoppers');
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const channelId = this.requireSiteId();

    if (!this.flags.force && !this.jsonEnabled()) {
      const ok = await confirm(
        t(
          'commands.slas.shopper.logout.confirm',
          'Log out {{count}} shopper(s) from all sessions on site {{channelId}} (tenant {{tenantId}})?',
          {count: loginIds.length, channelId, tenantId},
        ),
      );
      if (!ok) {
        this.log(t('commands.slas.shopper.logout.cancelled', 'Cancelled.'));
        return {failureCount: 0, results: [], successCount: 0, totalProcessed: 0};
      }
    }

    const slasClient = this.getSlasClient();
    const output: ShopperLogoutOutput = {failureCount: 0, results: [], successCount: 0, totalProcessed: 0};

    for (let i = 0; i < loginIds.length; i += BATCH_LOGOUT_LIMIT) {
      const batch = loginIds.slice(i, i + BATCH_LOGOUT_LIMIT);
      // eslint-disable-next-line no-await-in-loop
      const {data, error, response} = await slasClient.POST('/tenants/{tenantId}/batch-logout', {
        params: {path: {tenantId}, query: {channelId}},
        body: {loginIds: batch},
      });

      if (error || !data) {
        this.error(
          t('commands.slas.shopper.logout.error', 'Failed to log out shoppers: {{message}}', {
            message: formatApiError(error, response),
          }),
        );
      }

      output.results.push(...data.results);
      output.totalProcessed += data.totalProcessed;
      output.successCount += data.successCount;
      output.failureCount += data.failureCount;
    }

    if (output.failureCount > 0) {
      process.exitCode = 1;
    }

    if (this.jsonEnabled()) return output;

    tableRenderer.render(output.results, ['loginId', 'status', 'errorMessage']);
    this.log(
      t(
        'commands.slas.shopper.logout.summary',
        '{{successCount}} logged out, {{failureCount}} failed ({{totalProcessed}} processed).',
        {...output},
      ),
    );
    return output;
  }

  private async collectLoginIds(): Promise<string[]> {
    const ids = [...(this.flags['login-id'] ?? [])].map((id) => id.trim()).filter(Boolean);
    const {file} = this.flags;
    if (file) {
      ids.push(...parseLoginIdList(await readTextInput(file)));
    }
    return [...new Set(ids)];
  }
}
